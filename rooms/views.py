from django.shortcuts import render
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from .models import Room, RoomQuestion, RoomParticipant, ParticipantAnswer
from .serializers import (
    RoomSerializer, CreateRoomSerializer, JoinRoomSerializer, 
    RoomQuestionSerializer, ParticipantAnswerSerializer
)
from quizzes.utils import generate_quiz_with_gemini
import random

class CreateRoomView(generics.CreateAPIView):
    serializer_class = CreateRoomSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        print(f"DEBUG: Room creation request data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"DEBUG: Serializer errors: {serializer.errors}")
        serializer.is_valid(raise_exception=True)
        room = serializer.save(creator=request.user)
        
        # Add creator as a participant with host privileges
        participant, created = RoomParticipant.objects.get_or_create(
            room=room,
            user=request.user,
            defaults={
                'joined_at': timezone.now(),
                'is_host': True
            }
        )
        
        # Return room data with room_code
        return Response({
            'room_code': room.room_code,
            'id': room.id,
            'title': room.title,
            'description': room.description,
            'status': room.status,
            'message': 'Room created successfully'
        }, status=status.HTTP_201_CREATED)
    
    def generate_ai_questions(self, room):
        try:
            # Use the existing quiz generation logic
            quiz_data = generate_quiz_with_gemini(
                text=room.topic + " " + (room.document_text or ""),
                num_questions=room.total_questions,
                difficulty=room.difficulty,
                quiz_type='mixed'
            )
            
            if quiz_data and 'quiz' in quiz_data:
                for i, question_data in enumerate(quiz_data['quiz']):
                    RoomQuestion.objects.create(
                        room=room,
                        question_text=question_data['question_text'],
                        question_type=question_data['question_type'],
                        options=question_data.get('options', []),
                        correct_answer=question_data['correct_answer'],
                        explanation=question_data.get('explanation', ''),
                        points=1,
                        order=i
                    )
        except Exception as e:
            # If AI generation fails, create a placeholder question
            RoomQuestion.objects.create(
                room=room,
                question_text="AI generation failed. Please add questions manually.",
                question_type="multiple_choice",
                options=["Option 1", "Option 2", "Option 3", "Option 4"],
                correct_answer="Option 1",
                explanation="Please edit this question.",
                points=1,
                order=0
            )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_room(request):
    serializer = JoinRoomSerializer(data=request.data)
    if serializer.is_valid():
        room_code = serializer.validated_data['room_code']
        display_name = serializer.validated_data.get('display_name', '')
        try:
            room = Room.objects.get(room_code=room_code)
            
            # Check if user is already in the room
            participant, created = RoomParticipant.objects.get_or_create(
                room=room,
                user=request.user,
                defaults={
                    'joined_at': timezone.now(),
                    'display_name': display_name
                }
            )
            
            # If participant already exists but display_name is different, update it
            if not created and participant.display_name != display_name:
                participant.display_name = display_name
                participant.save()
            
            if created:
                message = "Successfully joined the room!"
            else:
                message = "You are already in this room!"
            
            return Response({
                'success': True,
                'message': message,
                'room': RoomSerializer(room).data
            })
            
        except Room.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid room code'
            }, status=status.HTTP_404_NOT_FOUND)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_room_details(request, room_code):
    try:
        room = Room.objects.get(room_code=room_code)
        
        # Check if user is a participant
        try:
            participant = RoomParticipant.objects.get(room=room, user=request.user)
            is_participant = True
        except RoomParticipant.DoesNotExist:
            is_participant = False
        
        # Get questions (randomize if setting is enabled)
        questions = room.questions.all()
        if room.randomize_questions and is_participant:
            questions = list(questions)
            random.shuffle(questions)
        
        # Randomize options if setting is enabled
        questions_data = []
        for question in questions:
            question_data = RoomQuestionSerializer(question).data
            if room.randomize_options and question.question_type == 'multiple_choice':
                options = question_data['options'].copy()
                # correct_answer = question_data['correct_answer']
                random.shuffle(options)
                question_data['options'] = options
                # Update correct answer position if needed
                # if correct_answer in options:
                #     question_data['correct_answer_index'] = options.index(correct_answer)
            questions_data.append(question_data)
        
        room_data = RoomSerializer(room).data
        room_data['questions'] = questions_data
        room_data['is_participant'] = is_participant
        room_data['is_creator'] = room.creator == request.user
        
        return Response(room_data)
        
    except Room.DoesNotExist:
        return Response({
            'error': 'Room not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_room(request, room_code):
    """
    This view now only serves as a trigger for the host to start the quiz.
    The actual state change and quiz logic is handled by the WebSocket consumer.
    """
    try:
        room = Room.objects.get(room_code=room_code, creator=request.user)
        
        if room.status != 'waiting':
            return Response({
                'error': 'Room is not in a waiting state.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # The view's job is done. The consumer will handle the rest.
        return Response({
            'success': True,
            'message': 'Start quiz signal sent.'
        })
        
    except Room.DoesNotExist:
        return Response({
            'error': 'Room not found or you are not the creator.'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_answer(request, room_code):
    try:
        room = Room.objects.get(room_code=room_code)
        participant = RoomParticipant.objects.get(room=room, user=request.user)
        
        question_id = request.data.get('question_id')
        answer = request.data.get('answer')
        time_taken = request.data.get('time_taken', 0)
        
        question = RoomQuestion.objects.get(id=question_id, room=room)
        
        # Check if already answered
        if ParticipantAnswer.objects.filter(participant=participant, question=question).exists():
            return Response({
                'error': 'Question already answered'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate if answer is correct
        is_correct = False
        points_earned = 0
        
        # Simplified correctness check
        submitted_answers = set(ans.strip().lower() for ans in answer)
        correct_answers = set(ans.strip().lower() for ans in question.correct_answers)
        
        if submitted_answers == correct_answers:
            is_correct = True
            points_earned = question.points
        
        # Save answer
        participant_answer = ParticipantAnswer.objects.create(
            participant=participant,
            question=question,
            selected_answers=answer,
            is_correct=is_correct,
            points_earned=points_earned,
        )
        
        # Update participant score
        participant.score += points_earned
        participant.save()
        
        return Response({
            'success': True,
            'is_correct': is_correct,
            'points_earned': points_earned,
            # 'correct_answer': question.correct_answer if room.show_correct_answers else None,
            # 'explanation': question.explanation if room.show_correct_answers else None
        })
        
    except (Room.DoesNotExist, RoomParticipant.DoesNotExist, RoomQuestion.DoesNotExist):
        return Response({
            'error': 'Invalid room, participant, or question'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_rooms(request):
    # Get rooms created by user
    created_rooms = Room.objects.filter(creator=request.user).order_by('-created_at')
    
    # Get rooms user has joined
    joined_rooms = Room.objects.filter(
        participants__user=request.user
    ).exclude(creator=request.user).order_by('-created_at')
    
    return Response({
        'created_rooms': RoomSerializer(created_rooms, many=True).data,
        'joined_rooms': RoomSerializer(joined_rooms, many=True).data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_room_results(request, room_code):
    """Get detailed results for a completed room"""
    try:
        room = Room.objects.get(room_code=room_code)
        
        # Check if user is a participant
        participant = RoomParticipant.objects.filter(room=room, user=request.user).first()
        if not participant:
            return Response({
                'error': 'You are not a participant in this room'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get all participants with their results
        participants_data = []
        all_participants = RoomParticipant.objects.filter(room=room).order_by('-score')
        
        for rank, participant in enumerate(all_participants, 1):
            # Get participant's answers
            answers = ParticipantAnswer.objects.filter(participant=participant)
            correct_answers = answers.filter(is_correct=True).count()
            total_questions = RoomQuestion.objects.filter(room=room).count()
            
            participants_data.append({
                'user_id': participant.user.id,
                'username': participant.user.username,
                'score': participant.score,
                'rank': rank,
                'is_host': participant.is_host,
                'correct_answers': correct_answers,
                'total_questions': total_questions,
                'answers': ParticipantAnswerSerializer(answers, many=True).data
            })
        
        # Calculate statistics
        total_questions = RoomQuestion.objects.filter(room=room).count()
        average_score = sum(p['score'] for p in participants_data) / len(participants_data) if participants_data else 0
        
        return Response({
            'room': RoomSerializer(room).data,
            'participants': participants_data,
            'total_questions': total_questions,
            'average_score': average_score,
            'total_participants': len(participants_data)
        })
        
    except Room.DoesNotExist:
        return Response({
            'error': 'Room not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_room_leaderboard(request, room_code):
    try:
        room = Room.objects.get(room_code=room_code)
        participants = room.participants.all().order_by('-score')
        
        leaderboard = []
        for i, participant in enumerate(participants):
            leaderboard.append({
                'rank': i + 1,
                'username': participant.user.username,
                'score': participant.score,
                'is_host': participant.is_host
            })
        
        return Response(leaderboard)
        
    except Room.DoesNotExist:
        return Response({
            'error': 'Room not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_participant(request, room_code):
    try:
        room = Room.objects.get(room_code=room_code)
        
        # Check if user is the host
        if room.creator != request.user:
            return Response({
                'error': 'Only the host can remove participants'
            }, status=status.HTTP_403_FORBIDDEN)
        
        participant_id = request.data.get('participant_id')
        if not participant_id:
            return Response({
                'error': 'Participant ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        participant = room.participants.filter(id=participant_id).first()
        if not participant:
            return Response({
                'error': 'Participant not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Don't allow removing the host
        if participant.is_host:
            return Response({
                'error': 'Cannot remove the host'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        participant.delete()
        
        return Response({
            'message': 'Participant removed successfully'
        })
        
    except Room.DoesNotExist:
        return Response({
            'error': 'Room not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def make_spectator(request, room_code):
    try:
        room = Room.objects.get(room_code=room_code)
        
        # Check if user is the host
        if room.creator != request.user:
            return Response({
                'error': 'Only the host can make participants spectators'
            }, status=status.HTTP_403_FORBIDDEN)
        
        participant_id = request.data.get('participant_id')
        if not participant_id:
            return Response({
                'error': 'Participant ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        participant = room.participants.filter(id=participant_id).first()
        if not participant:
            return Response({
                'error': 'Participant not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Don't allow making the host a spectator
        if participant.is_host:
            return Response({
                'error': 'Cannot make the host a spectator'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'message': 'Feature coming soon - spectator mode will be implemented'
        })
        
    except Room.DoesNotExist:
        return Response({
            'error': 'Room not found'
        }, status=status.HTTP_404_NOT_FOUND)
