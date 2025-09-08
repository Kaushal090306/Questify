import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Room, RoomParticipant, RoomQuestion, ParticipantAnswer
from django.contrib.auth.models import User
from django.utils import timezone
import asyncio

class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f'room_{self.room_code}'
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        await self.add_user_to_room()
        await self.broadcast_participant_list()

    async def disconnect(self, close_code):
        await self.remove_user_from_room()
        await self.broadcast_participant_list()

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        handler = getattr(self, f'handle_{message_type}', self.handle_unknown_message)
        await handler(data)

    async def handle_unknown_message(self, data):
        # You can log this or send an error back to the client
        pass

    async def handle_start_quiz(self, event):
        is_host = await self.is_user_host()
        if not is_host:
            return # Or send an error message

        await self.set_room_status('active')
        
        # Get the first question
        questions = await self.get_room_questions()
        if questions:
            first_question = questions[0]
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast.message',
                    'event': {
                        'type': 'quiz_started',
                        'question': {
                            'id': first_question['id'],
                            'question': first_question['question_text'],
                            'options': first_question['options'],
                            'time_limit': 30
                        },
                        'question_index': 0,
                        'total_questions': len(questions),
                        'time_limit': 30
                    }
                }
            )

    async def handle_next_question(self, event):
        is_host = await self.is_user_host()
        if not is_host:
            return

        current_question_index = event.get('current_question_index', 0)
        await self.send_question_by_index(current_question_index + 1)

    async def handle_submit_answer(self, event):
        """Handle user answer submission"""
        answer_index = event.get('answer_index')
        question_id = event.get('question_id')
        time_taken = event.get('time_taken', 0)
        
        # Save the answer and update score
        points_earned = await self.save_participant_answer(
            question_id, answer_index, time_taken
        )
        
        # Notify all participants that this user has answered
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast.message',
                'event': {
                    'type': 'participant_answered',
                    'participant_id': self.user.id,
                    'username': self.user.username,
                    'points_earned': points_earned
                }
            }
        )
        
        # Check if all participants have answered
        if await self.all_participants_answered(question_id):
            # Wait 2 seconds then move to next question
            await asyncio.sleep(2)
            current_index = await self.get_current_question_index(question_id)
            await self.send_question_by_index(current_index + 1)

    async def handle_end_quiz(self, event):
        is_host = await self.is_user_host()
        if not is_host:
            return
        
        await self.set_room_status('completed')
        # Logic to end the quiz and show results
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast.message',
                'event': {'type': 'quiz_ended'}
            }
        )

    async def send_question_by_index(self, index):
        questions = await self.get_room_questions()
        if index < len(questions):
            question = questions[index]
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast.message',
                    'event': {
                        'type': 'question_update',
                        'question': {
                            'id': question['id'],
                            'question': question['question_text'],
                            'options': question['options'],
                            'time_limit': 30  # You can make this configurable
                        },
                        'question_index': index,
                        'total_questions': len(questions),
                        'time_limit': 30
                    }
                }
            )
        else:
            # No more questions, end the quiz
            await self.set_room_status('completed')
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast.message',
                    'event': {'type': 'quiz_completed'}
                }
            )

    async def broadcast_message(self, event):
        await self.send(text_data=json.dumps(event))

    @sync_to_async
    def save_participant_answer(self, question_id, answer_index, time_taken):
        """Save participant's answer and calculate points"""
        try:
            room = Room.objects.get(room_code=self.room_code)
            participant = RoomParticipant.objects.get(room=room, user=self.user)
            question = RoomQuestion.objects.get(id=question_id, room=room)
            
            # Check if answer is correct
            is_correct = False
            points_earned = 0
            
            if question.question_type == 'multiple_choice':
                correct_answer = question.correct_answer
                if answer_index is not None and answer_index == correct_answer:
                    is_correct = True
                    # Calculate points based on time (faster = more points)
                    base_points = question.points
                    time_bonus = max(0, (question.time_limit - time_taken) / question.time_limit * 0.5)
                    points_earned = int(base_points * (1 + time_bonus))
            elif question.question_type == 'fill_blank':
                # For fill in the blank, answer_index would be the text answer
                if str(answer_index).strip().lower() == question.correct_answer.strip().lower():
                    is_correct = True
                    points_earned = question.points
            
            # Save the answer
            ParticipantAnswer.objects.update_or_create(
                participant=participant,
                question=question,
                defaults={
                    'selected_option': answer_index,
                    'is_correct': is_correct,
                    'time_taken': time_taken,
                    'points_earned': points_earned
                }
            )
            
            # Update participant's total score
            participant.score += points_earned
            participant.save()
            
            return points_earned
            
        except (Room.DoesNotExist, RoomParticipant.DoesNotExist, RoomQuestion.DoesNotExist):
            return 0
    
    @sync_to_async
    def all_participants_answered(self, question_id):
        """Check if all participants have answered the current question"""
        room = Room.objects.get(room_code=self.room_code)
        total_participants = RoomParticipant.objects.filter(room=room).count()
        answered_count = ParticipantAnswer.objects.filter(
            question_id=question_id,
            participant__room=room
        ).count()
        return answered_count >= total_participants
    
    @sync_to_async
    def get_current_question_index(self, question_id):
        """Get the index of the current question"""
        room = Room.objects.get(room_code=self.room_code)
        question = RoomQuestion.objects.get(id=question_id, room=room)
        return question.order

    @sync_to_async
    def add_user_to_room(self):
        room = Room.objects.get(room_code=self.room_code)
        RoomParticipant.objects.get_or_create(room=room, user=self.user)

    @sync_to_async
    def remove_user_from_room(self):
        try:
            room = Room.objects.get(room_code=self.room_code)
            participant = RoomParticipant.objects.get(room=room, user=self.user)
            # We can either delete the participant or mark them as inactive
            # For now, we'll just leave them in for scorekeeping purposes
        except (Room.DoesNotExist, RoomParticipant.DoesNotExist):
            pass

    @sync_to_async
    def get_participants(self):
        room = Room.objects.get(room_code=self.room_code)
        participants = RoomParticipant.objects.filter(room=room)
        return [{
            'username': p.user.username,
            'score': p.score,
            'is_host': p.is_host
        } for p in participants]

    async def broadcast_participant_list(self):
        participants = await self.get_participants()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast.message',
                'event': {
                    'type': 'participant_update',
                    'participants': participants
                }
            }
        )

    @sync_to_async
    def get_room_questions(self):
        room = Room.objects.get(room_code=self.room_code)
        questions = RoomQuestion.objects.filter(room=room).order_by('order')
        # Exclude sensitive data like correct_answers before sending
        return [{
            'id': q.id,
            'question_text': q.question_text,
            'question_type': q.question_type,
            'options': q.options,
            'points': q.points,
        } for q in questions]

    @sync_to_async
    def is_user_host(self):
        try:
            participant = RoomParticipant.objects.get(room__room_code=self.room_code, user=self.user)
            return participant.is_host
        except RoomParticipant.DoesNotExist:
            return False

    @sync_to_async
    def set_room_status(self, status):
        room = Room.objects.get(room_code=self.room_code)
        room.status = status
        if status == 'active':
            room.start_time = timezone.now()
        elif status == 'completed':
            room.end_time = timezone.now()
        room.save()

    # DEPRECATED METHODS - Replaced by handle_* methods
    async def start_quiz(self, event):
        pass
    async def send_next_question(self, event):
        pass
    async def handle_answer(self, event):
        pass
    async def end_quiz(self):
        pass
