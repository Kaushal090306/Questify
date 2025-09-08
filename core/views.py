from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Avg
from django.utils import timezone
from django.http import HttpResponse
from django.core.cache import cache
import json

from .models import Quiz, Question, QuizAttempt, BookmarkedQuestion, DailyPracticeQuiz
from .serializers import (
    QuizSerializer, QuizListSerializer, QuestionSerializer, 
    QuizAttemptSerializer, BookmarkedQuestionSerializer, DailyPracticeQuizSerializer
)
from .utils import (
    parse_document, generate_quiz_from_text, generate_explanation,
    export_quiz_to_pdf, export_quiz_to_csv, award_badges, calculate_topic_performance
)

class QuizGenerateView(APIView):
    """Generate a new quiz from uploaded document"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            # Get form data
            file = request.FILES.get('file')
            num_questions = int(request.data.get('num_questions', 5))
            difficulty = request.data.get('difficulty', 'medium')
            quiz_type = request.data.get('quiz_type', 'multiple_choice')
            time_limit = request.data.get('time_limit')
            title = request.data.get('title', '')
            
            if not file:
                return Response(
                    {'error': 'No file provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate parameters
            if num_questions < 1 or num_questions > 20:
                return Response(
                    {'error': 'Number of questions must be between 1 and 20'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Parse document
            text = parse_document(file)
            
            if len(text.strip()) < 100:
                return Response(
                    {'error': 'Document content is too short to generate meaningful questions'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate quiz using OpenAI
            quiz_data = generate_quiz_from_text(text, num_questions, difficulty, quiz_type)
            
            # Create quiz in database
            quiz = Quiz.objects.create(
                user=request.user,
                title=title or file.name,
                description=f"Generated from {file.name}",
                difficulty=difficulty,
                quiz_type=quiz_type,
                time_limit=int(time_limit) if time_limit else None,
                questions_per_attempt=num_questions,
                total_questions=len(quiz_data['quiz']),
                source_document=file.name
            )
            
            # Create questions
            for i, question_data in enumerate(quiz_data['quiz']):
                Question.objects.create(
                    quiz=quiz,
                    question_text=question_data['question_text'],
                    question_type=question_data['question_type'],
                    options=question_data['options'],
                    correct_answer=question_data['correct_answer'],
                    explanation=question_data.get('explanation', ''),
                    difficulty=question_data.get('difficulty', difficulty),
                    topic=question_data.get('topic', 'General'),
                    order=i
                )
            
            return Response(
                {'quiz_id': quiz.id, 'message': 'Quiz generated successfully'},
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class QuizListView(generics.ListAPIView):
    """List user's quizzes"""
    serializer_class = QuizListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Quiz.objects.filter(user=self.request.user)

class QuizDetailView(generics.RetrieveAPIView):
    """Get quiz details with questions"""
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Quiz.objects.filter(user=self.request.user)

class QuizTakeView(APIView):
    """Start taking a quiz"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, quiz_id):
        try:
            quiz = get_object_or_404(Quiz, id=quiz_id, user=request.user)
            
            # Create quiz attempt
            attempt = QuizAttempt.objects.create(
                user=request.user,
                quiz=quiz,
                total_questions=quiz.questions.count(),
                started_at=timezone.now(),
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            # Get questions (randomize if enabled)
            questions = quiz.questions.all()
            if quiz.randomize_questions:
                questions = questions.order_by('?')
            
            # Limit questions if specified
            if quiz.questions_per_attempt:
                questions = questions[:quiz.questions_per_attempt]
                attempt.total_questions = len(questions)
                attempt.save()
            
            # Serialize questions (without correct answers)
            question_data = []
            for question in questions:
                question_data.append({
                    'id': question.id,
                    'question_text': question.question_text,
                    'question_type': question.question_type,
                    'options': question.options,
                    'order': question.order
                })
            
            return Response({
                'attempt_id': attempt.id,
                'quiz': {
                    'id': quiz.id,
                    'title': quiz.title,
                    'time_limit': quiz.time_limit,
                    'total_questions': attempt.total_questions
                },
                'questions': question_data
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class QuizSubmitView(APIView):
    """Submit quiz answers"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, attempt_id):
        try:
            attempt = get_object_or_404(
                QuizAttempt, 
                id=attempt_id, 
                user=request.user,
                is_completed=False
            )
            
            user_answers = request.data.get('answers', {})
            
            # Calculate score and detailed results
            score = 0
            question_results = []
            
            for question in attempt.quiz.questions.all():
                user_answer = user_answers.get(str(question.id), '')
                is_correct = user_answer == question.correct_answer
                
                if is_correct:
                    score += 1
                
                question_results.append({
                    'question_id': question.id,
                    'question_text': question.question_text,
                    'user_answer': user_answer,
                    'correct_answer': question.correct_answer,
                    'is_correct': is_correct,
                    'options': question.options,
                    'explanation': question.explanation,
                    'topic': question.topic,
                    'difficulty': question.difficulty
                })
            
            # Update attempt
            attempt.score = score
            attempt.user_answers = user_answers
            attempt.question_results = question_results
            attempt.completed_at = timezone.now()
            attempt.is_completed = True
            
            # Calculate time taken
            if attempt.started_at:
                time_taken = (attempt.completed_at - attempt.started_at).total_seconds()
                attempt.time_taken = int(time_taken)
            
            attempt.calculate_percentage()
            attempt.save()
            
            # Update quiz statistics
            attempt.quiz.update_statistics()
            
            # Award badges and update user profile
            award_badges(request.user, attempt)
            
            # Update user profile
            profile = request.user.profile
            profile.total_points += score
            profile.last_activity = timezone.now()
            profile.update_streak()
            profile.save()
            
            return Response({
                'attempt_id': attempt.id,
                'score': score,
                'total_questions': attempt.total_questions,
                'percentage': attempt.percentage,
                'time_taken': attempt.time_taken,
                'question_results': question_results
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class QuizAttemptsView(generics.ListAPIView):
    """List user's quiz attempts"""
    serializer_class = QuizAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return QuizAttempt.objects.filter(
            user=self.request.user,
            is_completed=True
        ).order_by('-created_at')

class BookmarkedQuestionsView(generics.ListCreateAPIView):
    """List and create bookmarked questions"""
    serializer_class = BookmarkedQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return BookmarkedQuestion.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BookmarkQuestionView(APIView):
    """Toggle bookmark status of a question"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, question_id):
        try:
            question = get_object_or_404(Question, id=question_id)
            notes = request.data.get('notes', '')
            
            bookmark, created = BookmarkedQuestion.objects.get_or_create(
                user=request.user,
                question=question,
                defaults={'notes': notes}
            )
            
            if not created:
                # Toggle bookmark
                bookmark.delete()
                return Response({'bookmarked': False})
            
            return Response({'bookmarked': True})
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ExplainAnswerView(APIView):
    """Get AI explanation for a question"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, question_id):
        try:
            question = get_object_or_404(Question, id=question_id)
            
            # Check if explanation already exists
            if question.explanation:
                return Response({'explanation': question.explanation})
            
            # Generate explanation using AI
            context_text = f"Quiz: {question.quiz.title}\n"
            context_text += f"All questions from this quiz provide context for this question."
            
            explanation = generate_explanation(
                question.question_text,
                question.correct_answer,
                context_text
            )
            
            # Save explanation to question
            question.explanation = explanation
            question.save()
            
            return Response({'explanation': explanation})
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class DailyPracticeView(generics.ListAPIView):
    """Get daily practice quizzes"""
    serializer_class = DailyPracticeQuizSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return DailyPracticeQuiz.objects.filter(
            user=self.request.user
        ).order_by('-date_assigned')[:7]  # Last 7 days

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def analytics_view(request):
    """Get user analytics data"""
    user = request.user
    
    # Get cached data or calculate
    cache_key = f"user_analytics_{user.id}"
    analytics = cache.get(cache_key)
    
    if not analytics:
        attempts = QuizAttempt.objects.filter(user=user, is_completed=True)
        
        # Basic stats
        total_quizzes = attempts.count()
        total_points = user.profile.total_points
        avg_score = attempts.aggregate(avg=Avg('percentage'))['avg'] or 0
        
        # Score trend (last 10 attempts)
        recent_attempts = attempts.order_by('-created_at')[:10]
        score_trend = [
            {
                'date': attempt.completed_at.strftime('%Y-%m-%d'),
                'score': attempt.percentage
            }
            for attempt in reversed(recent_attempts)
        ]
        
        # Topic performance
        topic_performance = calculate_topic_performance(user)
        
        # Time-based stats
        time_stats = {
            'total_time_spent': sum(
                attempt.time_taken for attempt in attempts 
                if attempt.time_taken
            ),
            'average_time_per_quiz': 0
        }
        
        if total_quizzes > 0:
            time_stats['average_time_per_quiz'] = (
                time_stats['total_time_spent'] / total_quizzes
            )
        
        analytics = {
            'total_quizzes': total_quizzes,
            'total_points': total_points,
            'average_score': round(avg_score, 2),
            'score_trend': score_trend,
            'topic_performance': topic_performance,
            'time_stats': time_stats,
            'current_streak': user.profile.current_streak,
            'best_streak': user.profile.best_streak
        }
        
        # Cache for 1 hour
        cache.set(cache_key, analytics, 3600)
    
    return Response(analytics)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_quiz(request, quiz_id):
    """Export quiz to PDF or CSV"""
    try:
        quiz = get_object_or_404(Quiz, id=quiz_id, user=request.user)
        export_format = request.GET.get('format', 'pdf')
        
        if export_format == 'pdf':
            buffer = export_quiz_to_pdf(quiz)
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{quiz.title}.pdf"'
            return response
        
        elif export_format == 'csv':
            csv_data = export_quiz_to_csv(quiz)
            response = HttpResponse(csv_data, content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{quiz.title}.csv"'
            return response
        
        else:
            return Response(
                {'error': 'Invalid export format. Use "pdf" or "csv"'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def global_leaderboard(request):
    """Get global leaderboard"""
    try:
        # Get top users by total points
        top_users = User.objects.filter(
            profile__isnull=False
        ).order_by('-profile__total_points')[:10]
        
        leaderboard = []
        for i, user in enumerate(top_users, 1):
            leaderboard.append({
                'rank': i,
                'name': user.get_full_name() or user.email.split('@')[0],
                'points': user.profile.total_points,
                'streak': user.profile.current_streak,
                'total_quizzes': user.quiz_attempts.filter(is_completed=True).count()
            })
        
        return Response({
            'leaderboard': leaderboard,
            'user_rank': None  # Would need to calculate user's rank
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
