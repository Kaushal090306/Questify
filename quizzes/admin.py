from django.contrib import admin
from .models import Quiz, Question, QuizAttempt

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'difficulty', 'quiz_type', 'total_questions', 'created_at')
    list_filter = ('difficulty', 'quiz_type', 'created_at')
    search_fields = ('title', 'user__email')
    readonly_fields = ('id', 'created_at', 'updated_at')

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text', 'quiz', 'question_type', 'difficulty', 'order')
    list_filter = ('question_type', 'difficulty')
    search_fields = ('question_text', 'quiz__title')

@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz', 'score', 'total_questions', 'percentage', 'completed_at')
    list_filter = ('is_completed', 'created_at')
    search_fields = ('user__email', 'quiz__title')
    readonly_fields = ('created_at',)
