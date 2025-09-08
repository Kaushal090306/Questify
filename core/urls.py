from django.urls import path
from .views import (
    QuizGenerateView, QuizListView, QuizDetailView, QuizTakeView, QuizSubmitView,
    QuizAttemptsView, BookmarkedQuestionsView, BookmarkQuestionView, ExplainAnswerView,
    DailyPracticeView, analytics_view, export_quiz, global_leaderboard
)

urlpatterns = [
    # Quiz management
    path('generate/', QuizGenerateView.as_view(), name='quiz-generate'),
    path('list/', QuizListView.as_view(), name='quiz-list'),
    path('<uuid:pk>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('<uuid:quiz_id>/take/', QuizTakeView.as_view(), name='quiz-take'),
    path('attempt/<int:attempt_id>/submit/', QuizSubmitView.as_view(), name='quiz-submit'),
    
    # User data
    path('attempts/', QuizAttemptsView.as_view(), name='quiz-attempts'),
    path('bookmarks/', BookmarkedQuestionsView.as_view(), name='bookmarked-questions'),
    path('bookmark/<int:question_id>/', BookmarkQuestionView.as_view(), name='bookmark-question'),
    path('explain/<int:question_id>/', ExplainAnswerView.as_view(), name='explain-answer'),
    
    # Analytics and export
    path('analytics/', analytics_view, name='analytics'),
    path('<uuid:quiz_id>/export/', export_quiz, name='export-quiz'),
    path('leaderboard/', global_leaderboard, name='global-leaderboard'),
    
    # Daily practice
    path('daily-practice/', DailyPracticeView.as_view(), name='daily-practice'),
]
