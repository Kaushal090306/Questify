# Django views for real-time multiplayer quiz functionality
# Integrates Socket.io with existing Django REST framework

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rooms.models import Room, RoomQuestion
from .real_time_quiz import QuizManager
import logging

logger = logging.getLogger(__name__)

class InitializeQuizView(APIView):
    """Initialize a room for real-time multiplayer quiz"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, room_id):
        try:
            # Get room from database
            room = get_object_or_404(Room, id=room_id, host=request.user)
            
            # Get quiz manager instance
            quiz_manager = QuizManager.get_instance()
            
            # Create or get existing quiz
            quiz = quiz_manager.get_quiz(room.code)
            if not quiz:
                quiz = quiz_manager.create_quiz(room.code)
            
            # Load questions from database into quiz
            room_questions = RoomQuestion.objects.filter(room=room).order_by('order')
            
            for room_question in room_questions:
                question_data = {
                    'title': room_question.question.title,
                    'description': room_question.question.question_text,
                    'options': [
                        {'id': i, 'title': option}
                        for i, option in enumerate(room_question.question.options)
                    ],
                    'correct_answer': room_question.question.correct_answers[0] if room_question.question.correct_answers else 0,
                    'timer_duration': room_question.timer_value if room_question.timer_enabled else 30
                }
                quiz.add_problem(question_data)
            
            return Response({
                'success': True,
                'room_code': room.code,
                'questions_loaded': len(quiz.problems),
                'socketio_endpoint': '/socket.io/',
                'message': 'Quiz initialized successfully'
            })
            
        except Exception as e:
            logger.error(f"Error initializing quiz: {e}")
            return Response(
                {'error': 'Failed to initialize quiz'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class QuizStateView(APIView):
    """Get current state of a quiz room"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, room_code):
        try:
            quiz_manager = QuizManager.get_instance()
            quiz = quiz_manager.get_quiz(room_code)
            
            if not quiz:
                return Response({
                    'exists': False,
                    'message': 'Quiz not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            state = quiz.get_current_state()
            return Response({
                'exists': True,
                'state': state,
                'users_count': len(quiz.users),
                'room_code': room_code
            })
            
        except Exception as e:
            logger.error(f"Error getting quiz state: {e}")
            return Response(
                {'error': 'Failed to get quiz state'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StartQuizView(APIView):
    """Start a real-time quiz (admin only)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, room_code):
        try:
            # Verify user is the host
            room = get_object_or_404(Room, code=room_code, host=request.user)
            
            quiz_manager = QuizManager.get_instance()
            quiz = quiz_manager.get_quiz(room_code)
            
            if not quiz:
                return Response(
                    {'error': 'Quiz not found. Please initialize first.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if not quiz.problems:
                return Response(
                    {'error': 'No questions available. Please add questions first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            success = quiz.start_quiz()
            
            if success:
                return Response({
                    'success': True,
                    'message': 'Quiz started successfully',
                    'total_questions': len(quiz.problems)
                })
            else:
                return Response(
                    {'error': 'Failed to start quiz'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Error starting quiz: {e}")
            return Response(
                {'error': 'Failed to start quiz'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class QuizLeaderboardView(APIView):
    """Get current leaderboard for a quiz"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, room_code):
        try:
            quiz_manager = QuizManager.get_instance()
            quiz = quiz_manager.get_quiz(room_code)
            
            if not quiz:
                return Response(
                    {'error': 'Quiz not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            leaderboard = quiz.get_leaderboard()
            
            return Response({
                'leaderboard': leaderboard,
                'total_users': len(quiz.users),
                'current_question': quiz.current_problem_index + 1 if quiz.problems else 0,
                'total_questions': len(quiz.problems),
                'quiz_state': quiz.state
            })
            
        except Exception as e:
            logger.error(f"Error getting leaderboard: {e}")
            return Response(
                {'error': 'Failed to get leaderboard'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class QuizParticipantsView(APIView):
    """Get current participants in a quiz"""
    
    def get(self, request, room_code):
        try:
            quiz_manager = QuizManager.get_instance()
            quiz = quiz_manager.get_quiz(room_code)
            
            if not quiz:
                return Response(
                    {'participants': [], 'count': 0},
                    status=status.HTTP_200_OK
                )
            
            participants = [user.to_dict() for user in quiz.users.values()]
            
            return Response({
                'participants': participants,
                'count': len(participants),
                'quiz_state': quiz.state
            })
            
        except Exception as e:
            logger.error(f"Error getting participants: {e}")
            return Response(
                {'error': 'Failed to get participants'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class QuizStatsView(APIView):
    """Get detailed quiz statistics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, room_code):
        try:
            # Verify user is the host
            room = get_object_or_404(Room, code=room_code, host=request.user)
            
            quiz_manager = QuizManager.get_instance()
            quiz = quiz_manager.get_quiz(room_code)
            
            if not quiz:
                return Response(
                    {'error': 'Quiz not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Calculate detailed statistics
            stats = {
                'room_code': room_code,
                'total_participants': len(quiz.users),
                'total_questions': len(quiz.problems),
                'current_question': quiz.current_problem_index + 1 if quiz.problems else 0,
                'quiz_state': quiz.state,
                'leaderboard': quiz.get_leaderboard(),
                'questions_stats': []
            }
            
            # Add per-question statistics
            for i, problem in enumerate(quiz.problems):
                if i <= quiz.current_problem_index or quiz.state == "ended":
                    question_stats = {
                        'question_number': i + 1,
                        'title': problem.title,
                        'total_submissions': len(problem.submissions),
                        'correct_submissions': sum(1 for s in problem.submissions if s.is_correct),
                        'accuracy': (sum(1 for s in problem.submissions if s.is_correct) / len(problem.submissions) * 100) if problem.submissions else 0,
                        'average_time': sum((s.submitted_at - problem.start_time) for s in problem.submissions) / len(problem.submissions) if problem.submissions else 0
                    }
                    stats['questions_stats'].append(question_stats)
            
            return Response(stats)
            
        except Exception as e:
            logger.error(f"Error getting quiz stats: {e}")
            return Response(
                {'error': 'Failed to get quiz statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
