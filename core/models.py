from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()

class Quiz(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    QUIZ_TYPE_CHOICES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('mixed', 'Mixed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    quiz_type = models.CharField(max_length=20, choices=QUIZ_TYPE_CHOICES, default='multiple_choice')
    
    # Quiz settings
    time_limit = models.IntegerField(null=True, blank=True)  # in seconds
    questions_per_attempt = models.IntegerField(default=5)
    randomize_questions = models.BooleanField(default=True)
    show_correct_answers = models.BooleanField(default=True)
    
    # Metadata
    total_questions = models.IntegerField(default=0)
    total_attempts = models.IntegerField(default=0)
    average_score = models.FloatField(default=0.0)
    
    # AI Generation metadata
    source_document = models.CharField(max_length=255, blank=True)
    generation_prompt = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    def update_statistics(self):
        """Update quiz statistics based on attempts"""
        attempts = self.quiz_attempts.all()
        if attempts.exists():
            self.total_attempts = attempts.count()
            total_score = sum(attempt.score for attempt in attempts)
            total_questions = sum(attempt.total_questions for attempt in attempts)
            self.average_score = (total_score / total_questions * 100) if total_questions > 0 else 0
            self.save()

class Question(models.Model):
    QUESTION_TYPE_CHOICES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
    ]
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='multiple_choice')
    
    # Options stored as JSON for multiple choice
    options = models.JSONField(default=list)
    correct_answer = models.CharField(max_length=255)
    
    # Additional metadata
    explanation = models.TextField(blank=True)
    difficulty = models.CharField(max_length=20, choices=Quiz.DIFFICULTY_CHOICES, default='medium')
    topic = models.CharField(max_length=100, blank=True)
    
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}..."

class QuizAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='quiz_attempts')
    
    # Results
    score = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    percentage = models.FloatField(default=0.0)
    
    # Timing
    time_taken = models.IntegerField(null=True, blank=True)  # in seconds
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Detailed answers
    user_answers = models.JSONField(default=dict)  # {question_id: answer, ...}
    question_results = models.JSONField(default=list)  # Detailed results per question
    
    # Metadata
    is_completed = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.quiz.title} - {self.score}/{self.total_questions}"
    
    def calculate_percentage(self):
        if self.total_questions > 0:
            self.percentage = (self.score / self.total_questions) * 100
        return self.percentage

class BookmarkedQuestion(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarked_questions')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='bookmarked_by')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'question']
    
    def __str__(self):
        return f"{self.user.email} bookmarked: {self.question.question_text[:50]}..."

class DailyPracticeQuiz(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_practice_quizzes')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    date_assigned = models.DateField(default=timezone.now)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['user', 'date_assigned']
        ordering = ['-date_assigned']
    
    def __str__(self):
        return f"{self.user.email} - Daily Practice - {self.date_assigned}"
