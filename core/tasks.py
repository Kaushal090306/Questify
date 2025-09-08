from celery import shared_task
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import Quiz, DailyPracticeQuiz
from .utils import generate_quiz_from_text
import random

User = get_user_model()

@shared_task
def generate_daily_practice_quizzes():
    """Generate daily practice quizzes for active users"""
    today = timezone.now().date()
    
    # Get users who have daily practice enabled and were active in last 7 days
    week_ago = timezone.now() - timedelta(days=7)
    active_users = User.objects.filter(
        profile__daily_practice_enabled=True,
        profile__last_activity__gte=week_ago
    ).exclude(
        daily_practice_quizzes__date_assigned=today
    )
    
    for user in active_users:
        try:
            # Get user's quiz history to create personalized practice
            user_attempts = user.quiz_attempts.filter(is_completed=True)
            
            if user_attempts.exists():
                # Find topics where user scored below 80%
                weak_topics = []
                for attempt in user_attempts:
                    for result in attempt.question_results:
                        if result.get('is_correct', False) == False:
                            topic = result.get('topic', 'General')
                            weak_topics.append(topic)
                
                # Create a small practice quiz focusing on weak areas
                if weak_topics:
                    # This is a simplified version - in practice, you'd need
                    # to store source material or use a question bank
                    create_daily_practice_quiz.delay(user.id, weak_topics[:3])
        
        except Exception as e:
            print(f"Error generating daily practice for user {user.id}: {e}")
            continue

@shared_task
def create_daily_practice_quiz(user_id, topics):
    """Create a daily practice quiz for a specific user"""
    try:
        user = User.objects.get(id=user_id)
        
        # Create a practice quiz with 3-5 questions
        # In a real implementation, you'd have a question bank or stored content
        practice_quiz = Quiz.objects.create(
            user=user,
            title=f"Daily Practice - {timezone.now().strftime('%B %d, %Y')}",
            description="Your personalized daily practice quiz",
            difficulty='medium',
            questions_per_attempt=3,
            time_limit=300  # 5 minutes
        )
        
        # Create daily practice record
        DailyPracticeQuiz.objects.create(
            user=user,
            quiz=practice_quiz,
            date_assigned=timezone.now().date()
        )
        
        # Update user's profile
        profile = user.profile
        profile.last_activity = timezone.now()
        profile.save()
        
        return f"Daily practice quiz created for {user.email}"
        
    except Exception as e:
        return f"Error creating daily practice quiz: {e}"

@shared_task
def update_user_streaks():
    """Update user streaks based on daily activity"""
    users_with_profiles = User.objects.filter(profile__isnull=False)
    
    for user in users_with_profiles:
        try:
            user.profile.update_streak()
        except Exception as e:
            print(f"Error updating streak for user {user.id}: {e}")
            continue

@shared_task
def cleanup_old_data():
    """Clean up old data to maintain database performance"""
    # Delete old quiz attempts (older than 1 year)
    from .models import QuizAttempt
    one_year_ago = timezone.now() - timedelta(days=365)
    
    old_attempts = QuizAttempt.objects.filter(
        created_at__lt=one_year_ago,
        is_completed=False  # Only delete incomplete attempts
    )
    
    count = old_attempts.count()
    old_attempts.delete()
    
    return f"Cleaned up {count} old quiz attempts"

@shared_task
def generate_quiz_analytics():
    """Generate analytics data for admin dashboard"""
    from django.db.models import Count, Avg
    from .models import Quiz, QuizAttempt
    
    # Calculate various metrics
    total_quizzes = Quiz.objects.count()
    total_attempts = QuizAttempt.objects.filter(is_completed=True).count()
    avg_score = QuizAttempt.objects.filter(is_completed=True).aggregate(
        avg_score=Avg('percentage')
    )['avg_score'] or 0
    
    # Popular topics
    popular_topics = {}
    for attempt in QuizAttempt.objects.filter(is_completed=True):
        for result in attempt.question_results:
            topic = result.get('topic', 'General')
            popular_topics[topic] = popular_topics.get(topic, 0) + 1
    
    analytics_data = {
        'total_quizzes': total_quizzes,
        'total_attempts': total_attempts,
        'average_score': round(avg_score, 2),
        'popular_topics': popular_topics,
        'generated_at': timezone.now().isoformat()
    }
    
    # Store in cache or database for admin dashboard
    from django.core.cache import cache
    cache.set('quiz_analytics', analytics_data, timeout=3600)  # 1 hour
    
    return analytics_data
