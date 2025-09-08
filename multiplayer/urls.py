# URL patterns for real-time multiplayer quiz functionality

from django.urls import path
from . import views

app_name = 'multiplayer'

urlpatterns = [
    # Initialize quiz for real-time play
    path('initialize/<int:room_id>/', views.InitializeQuizView.as_view(), name='initialize_quiz'),
    
    # Get current quiz state
    path('state/<str:room_code>/', views.QuizStateView.as_view(), name='quiz_state'),
    
    # Start quiz (admin only)
    path('start/<str:room_code>/', views.StartQuizView.as_view(), name='start_quiz'),
    
    # Get leaderboard
    path('leaderboard/<str:room_code>/', views.QuizLeaderboardView.as_view(), name='quiz_leaderboard'),
    
    # Get participants
    path('participants/<str:room_code>/', views.QuizParticipantsView.as_view(), name='quiz_participants'),
    
    # Get detailed statistics (admin only)
    path('stats/<str:room_code>/', views.QuizStatsView.as_view(), name='quiz_stats'),
]
