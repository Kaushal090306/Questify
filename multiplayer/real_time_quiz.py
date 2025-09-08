# # real_time_quiz.py

# import asyncio
# import json
# import time
# from datetime import datetime
# from typing import Dict, List, Optional, Union
# import logging
# from asgiref.sync import sync_to_async
# from rooms.models import Room, RoomParticipant, RoomQuestion


# logger = logging.getLogger(__name__)

# class User:
#     def __init__(self, user_id: str, name: str, socket_id: str, is_host: bool = False):
#         self.id = user_id
#         self.name = name
#         self.socket_id = socket_id
#         self.points = 0
#         self.joined_at = time.time()
#         self.is_host = is_host # <-- Added is_host flag

#     def to_dict(self):
#         return {
#             'id': self.id,
#             'name': self.name,
#             'points': int(self.points),
#             'joined_at': self.joined_at,
#             'is_host': self.is_host # <-- Include is_host in payload
#         }

# class Submission:
#     def __init__(self, problem_id: str, user_id: str, is_correct: bool, option_selected: int, submitted_at: float):
#         self.problem_id = problem_id
#         self.user_id = user_id
#         self.is_correct = is_correct
#         self.option_selected = option_selected
#         self.submitted_at = submitted_at

#     def to_dict(self):
#         return {
#             'problem_id': self.problem_id,
#             'user_id': self.user_id,
#             'is_correct': self.is_correct,
#             'option_selected': self.option_selected,
#             'submitted_at': self.submitted_at
#         }

# class Problem:
#     def __init__(self, problem_id: str, title: str, description: str, options: List[Dict], correct_answer: int, timer_duration: int = 20):
#         self.id = problem_id
#         self.title = title
#         self.description = description
#         self.options = options
#         self.correct_answer = correct_answer
#         self.timer_duration = timer_duration
#         self.start_time = 0
#         self.submissions: List[Submission] = []

#     def start(self):
#         self.start_time = time.time()
#         self.submissions = []

#     def add_submission(self, user_id: str, option_selected: int):
#         if any(s.user_id == user_id for s in self.submissions):
#             return False
        
#         is_correct = self.correct_answer == option_selected
#         submission = Submission(
#             problem_id=self.id,
#             user_id=user_id,
#             is_correct=is_correct,
#             option_selected=option_selected,
#             submitted_at=time.time()
#         )
#         self.submissions.append(submission)
#         return submission

#     def to_dict(self, include_answer=False):
#         data = {
#             'id': self.id,
#             'title': self.title,
#             'description': self.description,
#             'question_text': self.title,
#             'options': self.options,
#             'timer_duration': self.timer_duration,
#             'start_time': self.start_time,
#             'submissions_count': len(self.submissions)
#         }
#         if include_answer:
#             data['correct_answer'] = self.correct_answer
#             data['submissions'] = [s.to_dict() for s in self.submissions]
#         return data

# class MultiplayerQuiz:
#     def __init__(self, room_id: str):
#         self.room_id = room_id
#         self.users: Dict[str, User] = {}
#         self.problems: List[Problem] = []
#         self.current_problem_index = 0
#         self.state = "waiting"
#         self.created_at = time.time()
#         self.timer_task = None

#     def add_user(self, user_id: str, name: str, socket_id: str, is_host: bool) -> User:
#         user = User(user_id, name, socket_id, is_host)
#         self.users[user_id] = user
#         logger.info(f"User {name} ({user_id}) joined room {self.room_id} as {'host' if is_host else 'participant'}")
#         return user

#     def remove_user(self, user_id: str):
#         if user_id in self.users:
#             user = self.users.pop(user_id)
#             logger.info(f"User {user.name} ({user_id}) left room {self.room_id}")

#     def get_host_socket_id(self):
#         for user in self.users.values():
#             if user.is_host:
#                 return user.socket_id
#         return None

#     def add_problem(self, problem_data: Dict):
#         problem = Problem(
#             problem_id=str(len(self.problems)),
#             title=problem_data['title'],
#             description=problem_data['description'],
#             options=problem_data['options'],
#             correct_answer=problem_data['correct_answer'],
#             timer_duration=problem_data.get('timer_duration', 20)
#         )
#         self.problems.append(problem)

#     async def start_quiz(self, socketio):
#         if not self.problems:
#             logger.warning(f"No problems available for room {self.room_id}")
#             return False
        
#         logger.info(f"Starting quiz for room {self.room_id}")
#         self.state = "active"
#         self.current_problem_index = 0
        
#         current_problem = self.problems[self.current_problem_index]
#         current_problem.start()

#         # Emit 'quiz_started' with the first question data
#         # This single event tells all clients to navigate and display the first question
#         await socketio.emit('quiz_started', {
#             'problem': current_problem.to_dict(include_answer=False), # Send without answer
#             'current_index': self.current_problem_index,
#             'total_problems': len(self.problems),
#             'participants': self.get_all_participants()
#         }, room=self.room_id)
        
#         # Send the correct answer ONLY to the host
#         host_socket_id = self.get_host_socket_id()
#         if host_socket_id:
#             await socketio.emit('correct_answer_info', {
#                 'problem_id': current_problem.id,
#                 'correct_answer': current_problem.correct_answer
#             }, room=host_socket_id)

#         # Start the timer for the first question
#         self.timer_task = asyncio.create_task(self._problem_timer(current_problem.timer_duration, socketio))
#         return True

#     async def _problem_timer(self, duration: int, socketio):
#         await asyncio.sleep(duration)
#         await self.show_leaderboard(socketio)

#     async def show_leaderboard(self, socketio):
#         self.state = "leaderboard"
        
#         leaderboard = self.get_leaderboard()
        
#         await socketio.emit('leaderboard', {
#             'leaderboard': leaderboard,
#             'current_problem_index': self.current_problem_index,
#             'total_problems': len(self.problems)
#         }, room=self.room_id)

#         await asyncio.sleep(5) # Show leaderboard for 5 seconds
#         await self.next_problem(socketio)

#     async def next_problem(self, socketio):
#         self.current_problem_index += 1
#         if self.current_problem_index < len(self.problems):
#             current_problem = self.problems[self.current_problem_index]
#             current_problem.start()
#             self.state = "active"

#             # Broadcast the next problem to all users
#             await socketio.emit('problem', {
#                 'problem': current_problem.to_dict(include_answer=False),
#                 'current_index': self.current_problem_index,
#                 'total_problems': len(self.problems)
#             }, room=self.room_id)
            
#             # Send correct answer only to host
#             host_socket_id = self.get_host_socket_id()
#             if host_socket_id:
#                 await socketio.emit('correct_answer_info', {
#                     'problem_id': current_problem.id,
#                     'correct_answer': current_problem.correct_answer
#                 }, room=host_socket_id)

#             if self.timer_task:
#                 self.timer_task.cancel()
#             self.timer_task = asyncio.create_task(self._problem_timer(current_problem.timer_duration, socketio))
#         else:
#             await self.end_quiz(socketio)

#     async def end_quiz(self, socketio):
#         self.state = "ended"
#         final_leaderboard = self.get_leaderboard()
        
#         await socketio.emit('quiz_ended', {
#             'final_leaderboard': final_leaderboard,
#             'total_problems': len(self.problems)
#         }, room=self.room_id)

#     async def submit_answer(self, user_id: str, option_selected: int, socketio):
#         if self.state != "active" or user_id not in self.users:
#             return False

#         current_problem = self.problems[self.current_problem_index]
#         submission = current_problem.add_submission(user_id, option_selected)
        
#         if submission:
#             user = self.users[user_id]
#             points_earned = 0
#             if submission.is_correct:
#                 time_taken = submission.submitted_at - current_problem.start_time
#                 max_points = 1000
#                 time_penalty = (500 * time_taken) / current_problem.timer_duration
#                 points_earned = max(max_points - time_penalty, 100)
#                 user.points += points_earned
            
#             # Notify everyone that this user has answered
#             await socketio.emit('user_answered', {'user_id': user_id}, room=self.room_id)

#             # Send a private confirmation back to the user who submitted
#             await socketio.emit('answer_submitted', {
#                 'is_correct': submission.is_correct,
#                 'points_earned': int(points_earned)
#             }, room=user.socket_id)

#             # Update everyone's score for this user
#             await socketio.emit('score_update', {
#                 'user_id': user_id,
#                 'points': int(user.points)
#             }, room=self.room_id)
            
#             logger.info(f"User {user_id} submitted answer {option_selected} for problem {current_problem.id}")
#             return True
#         return False
    
#     def get_leaderboard(self) -> List[Dict]:
#         sorted_users = sorted(self.users.values(), key=lambda x: x.points, reverse=True)
#         return [
#             {**user.to_dict(), 'rank': idx + 1}
#             for idx, user in enumerate(sorted_users)
#         ]

#     def get_all_participants(self) -> List[Dict]:
#         return [user.to_dict() for user in self.users.values()]
        
# def get_current_state(self) -> Dict:
#         if self.state == "waiting":
#             return {
#                 'type': 'waiting',
#                 'users_count': len(self.users),
#                 'problems_count': len(self.problems)
#             }
#         elif self.state == "question":
#             current_problem = self.problems[self.current_problem_index]
#             return {
#                 'type': 'question',
#                 'problem': current_problem.to_dict(),
#                 'current_index': self.current_problem_index,
#                 'total_problems': len(self.problems)
#             }
#         elif self.state == "leaderboard":
#             return {
#                 'type': 'leaderboard',
#                 'leaderboard': self.get_leaderboard(),
#                 'current_problem': self.current_problem_index,
#                 'total_problems': len(self.problems)
#             }
#         elif self.state == "ended":
#             return {
#                 'type': 'ended',
#                 'final_leaderboard': self.get_leaderboard(),
#                 'total_problems': len(self.problems)
#             }
# class QuizManager:
#     _instance = None
    
#     def __init__(self):
#         self.active_quizzes: Dict[str, MultiplayerQuiz] = {}

#     @classmethod
#     def get_instance(cls):
#         if cls._instance is None:
#             cls._instance = cls()
#         return cls._instance
    
#     @sync_to_async
#     def _get_room_and_questions(self, room_code):
#         try:
#             room = Room.objects.get(room_code=room_code)
#             questions = list(RoomQuestion.objects.filter(room=room).order_by('order'))
#             return room, questions
#         except Room.DoesNotExist:
#             return None, []
            
#     @sync_to_async
#     def _get_participant_is_host(self, room, user_id):
#         try:
#             # Note: Ensure user_id from frontend matches the PK type of your User model
#             participant = RoomParticipant.objects.get(room=room, user_id=int(user_id))
#             return participant.is_host
#         except (RoomParticipant.DoesNotExist, ValueError):
#             return False

#     async def create_quiz(self, room_id: str) -> MultiplayerQuiz:
#         if room_id in self.active_quizzes:
#             return self.active_quizzes[room_id]
        
#         quiz = MultiplayerQuiz(room_id)
#         room, room_questions = await self._get_room_and_questions(room_id)
        
#         if room and room_questions:
#             for q in room_questions:
#                 problem_data = {
#                     'title': q.question_text,
#                     'description': '',
#                     'options': [{'id': i, 'title': opt} for i, opt in enumerate(q.options)],
#                     'correct_answer': q.correct_answers[0] if q.correct_answers else 0,
#                     'timer_duration': room.timer_value if room.timer_enabled else 30
#                 }
#                 quiz.add_problem(problem_data)
#             logger.info(f"Loaded {len(room_questions)} questions for room {room_id}")
        
#         self.active_quizzes[room_id] = quiz
#         logger.info(f"Created new quiz for room {room_id}")
#         return quiz

#     def get_quiz(self, room_id: str) -> Optional[MultiplayerQuiz]:
#         return self.active_quizzes.get(room_id)
#     # ... rest of the class remains the same




# Real-time Multiplayer Quiz Implementation using Socket.io
# Based on quiz-app-next analysis

# Real-time Multiplayer Quiz Implementation using Socket.io
# Based on quiz-app-next analysis

import asyncio
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Union
import logging
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)

class User:
    def __init__(self, user_id: str, name: str, socket_id: str, is_host: bool = False):
        self.id = user_id
        self.name = name
        self.socket_id = socket_id
        self.points = 0
        self.joined_at = time.time()
        self.is_host = is_host

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'points': int(self.points),
            'joined_at': self.joined_at,
            'is_host': self.is_host
        }

class Submission:
    def __init__(self, problem_id: str, user_id: str, is_correct: bool, option_selected: int, submitted_at: float):
        self.problem_id = problem_id
        self.user_id = user_id
        self.is_correct = is_correct
        self.option_selected = option_selected
        self.submitted_at = submitted_at

    def to_dict(self):
        return {
            'problem_id': self.problem_id,
            'user_id': self.user_id,
            'is_correct': self.is_correct,
            'option_selected': self.option_selected,
            'submitted_at': self.submitted_at
        }

class Problem:
    def __init__(self, problem_id: str, title: str, description: str, options: List[Dict], correct_answer: int, timer_duration: int = 20):
        self.id = problem_id
        self.title = title
        self.description = description
        self.options = options  # [{"id": 0, "title": "Option A"}, ...]
        self.correct_answer = correct_answer
        self.timer_duration = timer_duration
        self.start_time = 0
        self.submissions: List[Submission] = []

    def start(self):
        self.start_time = time.time()
        self.submissions = []

    def add_submission(self, user_id: str, option_selected: int):
        # Check if user already submitted
        for submission in self.submissions:
            if submission.user_id == user_id:
                return False
        
        is_correct = self.correct_answer == option_selected
        submission = Submission(
            problem_id=self.id,
            user_id=user_id,
            is_correct=is_correct,
            option_selected=option_selected,
            submitted_at=time.time()
        )
        self.submissions.append(submission)
        return submission

    def to_dict(self, include_answer=False):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'question_text': self.title,  # Add question_text field that frontend expects
            'options': self.options,
            'timer_duration': self.timer_duration,
            'start_time': self.start_time,
            'submissions_count': len(self.submissions)
        }
        if include_answer:
            data['correct_answer'] = self.correct_answer
            data['submissions'] = [s.to_dict() for s in self.submissions]
        return data

class MultiplayerQuiz:
    def __init__(self, room_id: str):
        self.room_id = room_id
        self.users: Dict[str, User] = {}
        self.problems: List[Problem] = []
        self.current_problem_index = 0
        self.state = "waiting"  # waiting, question, leaderboard, ended
        self.created_at = time.time()
        self.timer_task = None

    def add_user(self, user_id: str, name: str, socket_id: str, is_host: bool = False) -> User:
        user = User(user_id, name, socket_id, is_host)
        self.users[user_id] = user
        logger.info(f"User {name} ({user_id}) joined room {self.room_id} as {'host' if is_host else 'participant'}")
        return user

    def remove_user(self, user_id: str):
        if user_id in self.users:
            user = self.users.pop(user_id)
            logger.info(f"User {user.name} ({user_id}) left room {self.room_id}")

    def get_host_users(self) -> List[User]:
        """Get all host users"""
        return [user for user in self.users.values() if user.is_host]

    def get_participant_users(self) -> List[User]:
        """Get all participant users (non-hosts)"""
        return [user for user in self.users.values() if not user.is_host]

    def get_host_socket_ids(self) -> List[str]:
        """Get socket IDs of all hosts"""
        return [user.socket_id for user in self.users.values() if user.is_host]

    def add_problem(self, problem_data: Dict):
        problem = Problem(
            problem_id=str(len(self.problems)),
            title=problem_data['title'],
            description=problem_data['description'],
            options=problem_data['options'],
            correct_answer=problem_data['correct_answer'],
            timer_duration=problem_data.get('timer_duration', 20)
        )
        self.problems.append(problem)
        logger.info(f"Added problem {problem.id} to room {self.room_id}")

    async def start_quiz(self):
        if not self.problems:
            logger.warning(f"No problems available for room {self.room_id}")
            return False
        
        logger.info(f"Starting quiz for room {self.room_id} with {len(self.problems)} questions")
        self.state = "question"
        self.current_problem_index = 0
        # Await the async method directly
        await self.start_current_problem()
        return True

    async def start_current_problem(self):
        if self.current_problem_index >= len(self.problems):
            await self.end_quiz()
            return

        current_problem = self.problems[self.current_problem_index]
        current_problem.start()
        self.state = "question"

        from .socketio_manager import SocketIOManager
        socketio = SocketIOManager.get_instance()
        
        # Send problem WITHOUT correct answer to ALL users first
        await socketio.emit('problem', {
            'problem': current_problem.to_dict(include_answer=False),
            'current_index': self.current_problem_index,
            'total_problems': len(self.problems)
        }, room=self.room_id)
        
        # Send problem WITH correct answer ONLY to hosts
        host_socket_ids = self.get_host_socket_ids()
        for host_socket_id in host_socket_ids:
            await socketio.emit('host_problem_data', {
                'problem': current_problem.to_dict(include_answer=True),
                'current_index': self.current_problem_index,
                'total_problems': len(self.problems)
            }, room=host_socket_id)

        # Handle timer or manual progression
        await self._handle_question_timing()

    async def _handle_question_timing(self):
        """Handle timer or manual progression based on room settings"""
        from rooms.models import Room
        
        @sync_to_async
        def get_room_timer_settings():
            try:
                room = Room.objects.get(room_code=self.room_id)
                return room.timer_enabled, room.timer_value if room.timer_enabled else 30
            except Room.DoesNotExist:
                return True, 30  # Default values
        
        timer_enabled, timer_value = await get_room_timer_settings()
        current_problem = self.problems[self.current_problem_index]
        current_problem.timer_duration = timer_value
        
        from .socketio_manager import SocketIOManager
        socketio = SocketIOManager.get_instance()
        
        if timer_enabled:
            # Send timer info to all users
            await socketio.emit('timer_started', {
                'duration': timer_value,
                'question_index': self.current_problem_index
            }, room=self.room_id)
            
            # Set timer for automatic progression
            if self.timer_task:
                self.timer_task.cancel()
            self.timer_task = asyncio.create_task(self._problem_timer(timer_value))
        else:
            # Send "Next Question" button to hosts only
            host_socket_ids = self.get_host_socket_ids()
            for host_socket_id in host_socket_ids:
                await socketio.emit('show_next_button', {
                    'question_index': self.current_problem_index
                }, room=host_socket_id)

    async def force_next_question(self):
        """Force progression to next question (called when host clicks Next)"""
        if self.timer_task:
            self.timer_task.cancel()
        await self.show_leaderboard()

    async def _problem_timer(self, duration: int):
        await asyncio.sleep(duration)
        await self.show_leaderboard()

    async def show_leaderboard(self):
        self.state = "leaderboard"
        
        leaderboard = self.get_leaderboard()
        
        from .socketio_manager import SocketIOManager
        socketio = SocketIOManager.get_instance()
        
        await socketio.emit('leaderboard', {
            'leaderboard': leaderboard,
            'current_problem': self.current_problem_index,
            'total_problems': len(self.problems)
        }, room=self.room_id)

        # Auto advance to next question after 5 seconds
        await asyncio.sleep(5)
        await self.next_problem()

    async def next_problem(self):
        self.current_problem_index += 1
        if self.current_problem_index < len(self.problems):
            await self.start_current_problem()
        else:
            await self.end_quiz()

    async def end_quiz(self):
        self.state = "ended"
        final_leaderboard = self.get_leaderboard()
        
        from .socketio_manager import SocketIOManager
        socketio = SocketIOManager.get_instance()
        
        await socketio.emit('quiz_ended', {
            'final_leaderboard': final_leaderboard,
            'total_problems': len(self.problems)
        }, room=self.room_id)

    async def submit_answer(self, user_id: str, option_selected: int) -> bool:
        if self.state != "question":
            return False

        if user_id not in self.users:
            return False

        current_problem = self.problems[self.current_problem_index]
        submission = current_problem.add_submission(user_id, option_selected)
        
        if submission:
            # Calculate points immediately for correct answers
            if submission.is_correct and user_id in self.users:
                user = self.users[user_id]
                
                # Calculate points based on speed
                time_taken = submission.submitted_at - current_problem.start_time
                max_points = 1000
                time_penalty = (500 * time_taken) / current_problem.timer_duration
                points_earned = max(max_points - time_penalty, 100)  # Minimum 100 points
                
                user.points += points_earned
                
                # Broadcast score update
                from .socketio_manager import SocketIOManager
                socketio = SocketIOManager.get_instance()
                await socketio.emit('score_update', {
                    'user_id': user_id,
                    'points': int(user.points),
                    'points_earned': int(points_earned)
                }, room=self.room_id)
            
            logger.info(f"User {user_id} submitted answer {option_selected} for problem {current_problem.id}")
            return True
        return False

    def get_leaderboard(self) -> List[Dict]:
        # Only include participants in leaderboard, not hosts
        participant_users = self.get_participant_users()
        sorted_users = sorted(participant_users, key=lambda x: x.points, reverse=True)
        return [
            {
                'user_id': user.id,
                'name': user.name,
                'points': int(user.points),
                'rank': idx + 1
            }
            for idx, user in enumerate(sorted_users[:20])  # Top 20
        ]

    def get_hosts_list(self) -> List[Dict]:
        """Get list of hosts for display"""
        return [user.to_dict() for user in self.get_host_users()]

    def get_participants_list(self) -> List[Dict]:
        """Get list of participants for display"""
        return [user.to_dict() for user in self.get_participant_users()]

    def get_current_state(self) -> Dict:
        if self.state == "waiting":
            return {
                'type': 'waiting',
                'users_count': len(self.users),
                'problems_count': len(self.problems),
                'hosts': self.get_hosts_list(),
                'participants': self.get_participants_list()
            }
        elif self.state == "question":
            current_problem = self.problems[self.current_problem_index]
            return {
                'type': 'question',
                'problem': current_problem.to_dict(),
                'current_index': self.current_problem_index,
                'total_problems': len(self.problems),
                'hosts': self.get_hosts_list(),
                'participants': self.get_participants_list()
            }
        elif self.state == "leaderboard":
            return {
                'type': 'leaderboard',
                'leaderboard': self.get_leaderboard(),
                'current_problem': self.current_problem_index,
                'total_problems': len(self.problems),
                'hosts': self.get_hosts_list(),
                'participants': self.get_participants_list()
            }
        elif self.state == "ended":
            return {
                'type': 'ended',
                'final_leaderboard': self.get_leaderboard(),
                'total_problems': len(self.problems),
                'hosts': self.get_hosts_list(),
                'participants': self.get_participants_list()
            }

class QuizManager:
    _instance = None
    
    def __init__(self):
        self.active_quizzes: Dict[str, MultiplayerQuiz] = {}

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def create_quiz(self, room_id: str) -> MultiplayerQuiz:
        if room_id in self.active_quizzes:
            return self.active_quizzes[room_id]
        
        quiz = MultiplayerQuiz(room_id)
        
        # Load questions from database using sync_to_async
        try:
            from rooms.models import Room, RoomQuestion
            
            @sync_to_async
            def get_room_and_questions(room_code):
                try:
                    room = Room.objects.get(room_code=room_code)
                    room_questions = list(RoomQuestion.objects.filter(room=room).order_by('order'))
                    return room, room_questions
                except Room.DoesNotExist:
                    logger.error(f"Room with code {room_code} not found")
                    return None, []
                except Exception as e:
                    logger.error(f"Error fetching room questions: {e}")
                    return None, []
            
            room, room_questions = await get_room_and_questions(room_id)
            
            if room and room_questions:
                for room_question in room_questions:
                    # Convert RoomQuestion to Problem format
                    # correct_answers contains indices, not the actual option text
                    correct_answer_index = room_question.correct_answers[0] if room_question.correct_answers else 0
                    problem_data = {
                        'title': room_question.question_text,
                        'description': room_question.question_text,
                        'options': [{'id': i, 'title': option} for i, option in enumerate(room_question.options)],
                        'correct_answer': correct_answer_index,  # Use the index directly
                        'timer_duration': room.timer_value if room.timer_enabled else 30
                    }
                    quiz.add_problem(problem_data)
                logger.info(f"Successfully loaded {len(room_questions)} questions for room {room_id}")
                logger.info(f"Quiz now has {len(quiz.problems)} problems total")
            else:
                logger.warning(f"No questions found for room {room_id}")
            
        except Exception as e:
            logger.error(f"Error loading questions for room {room_id}: {e}")
        
        self.active_quizzes[room_id] = quiz
        logger.info(f"Created new quiz for room {room_id}")
        return quiz

    def get_quiz(self, room_id: str) -> Optional[MultiplayerQuiz]:
        return self.active_quizzes.get(room_id)

    def remove_quiz(self, room_id: str):
        if room_id in self.active_quizzes:
            quiz = self.active_quizzes.pop(room_id)
            if quiz.timer_task:
                quiz.timer_task.cancel()
            logger.info(f"Removed quiz for room {room_id}")

    def cleanup_inactive_quizzes(self):
        """Remove quizzes that have been inactive for too long"""
        current_time = time.time()
        inactive_rooms = []
        
        for room_id, quiz in self.active_quizzes.items():
            # Remove quizzes older than 2 hours with no users
            if (current_time - quiz.created_at > 7200 and len(quiz.users) == 0) or quiz.state == "ended":
                inactive_rooms.append(room_id)
        
        for room_id in inactive_rooms:
            self.remove_quiz(room_id)