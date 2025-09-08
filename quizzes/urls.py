from django.urls import path
from .views import QuizGenerateView, QuizTakeView, QuizAttemptsView, DailyPracticeView, QuizAnalyticsView, AttemptDetailView

urlpatterns = [
    path('generate/', QuizGenerateView.as_view()),
    path('<uuid:quiz_id>/take/', QuizTakeView.as_view()),
    path('attempts/', QuizAttemptsView.as_view()),
    path('attempts/<uuid:attempt_id>/', AttemptDetailView.as_view()),
    path('daily-practice/', DailyPracticeView.as_view()),
    path('analytics/', QuizAnalyticsView.as_view()),
]
