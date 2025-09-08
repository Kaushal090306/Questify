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
        ('fill_in_blank', 'Fill in the Blank'),
        ('descriptive', 'Descriptive'),
        ('mixed', 'Mixed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    quiz_type = models.CharField(max_length=20, choices=QUIZ_TYPE_CHOICES, default='multiple_choice')
    
    # Quiz settings
    time_limit = models.IntegerField(null=True, blank=True)  # seconds
    questions_per_attempt = models.PositiveIntegerField(default=5)
    randomize_questions = models.BooleanField(default=True)
    show_correct_answers = models.BooleanField(default=True)
    
    # Metadata
    total_questions = models.PositiveIntegerField(default=0)
    total_attempts = models.PositiveIntegerField(default=0)
    average_score = models.FloatField(default=0.0)
    
    # AI generation
    source_document = models.CharField(max_length=255, blank=True)
    generation_prompt = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    def update_statistics(self):
        """Recalculate and update total_attempts and average_score"""
        attempts = self.quiz_attempts.filter(is_completed=True)
        self.total_attempts = attempts.count()
        if self.total_attempts:
            self.average_score = sum(a.percentage for a in attempts) / self.total_attempts
        else:
            self.average_score = 0.0
        self.save()

class Question(models.Model):
    QUESTION_TYPE_CHOICES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('fill_in_blank', 'Fill in the Blank'),
        ('descriptive', 'Descriptive'),
    ]
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='multiple_choice')
    
    # Options stored as JSON list of strings; empty for non-multiple choice
    options = models.JSONField(default=list, blank=True)
    correct_answer = models.TextField()  # Can be longer for descriptive answers
    
    explanation = models.TextField(blank=True)
    difficulty = models.CharField(max_length=20, choices=Quiz.DIFFICULTY_CHOICES, default='medium')
    topic = models.CharField(max_length=100, blank=True)
    
    # For fill-in-the-blank questions
    blank_position = models.PositiveIntegerField(null=True, blank=True)  # Position of blank in question
    
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['quiz', 'order']),
        ]
    
    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}..."

class QuizAttempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='quiz_attempts')
    
    # Quiz result data
    score = models.PositiveIntegerField(default=0)  # Count of correct answers
    total_questions = models.PositiveIntegerField(default=0)
    percentage = models.FloatField(default=0.0)
    
    # Timing
    time_taken = models.PositiveIntegerField(null=True, blank=True)  # seconds
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Detailed answer tracking: {question_id (str): user_answer (str), ...}
    user_answers = models.JSONField(default=dict, blank=True)
    question_results = models.JSONField(default=list, blank=True)  # List of dicts with correctness per question
    
    # Enhanced question-by-question tracking
    detailed_results = models.JSONField(default=list, blank=True)  # Detailed results for each question
    passed = models.BooleanField(default=False)  # Whether the attempt passed (e.g., >= 70%)
    pass_threshold = models.FloatField(default=70.0)  # Minimum percentage to pass
    
    # Metadata
    is_completed = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'quiz', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.quiz.title} - {self.score}/{self.total_questions}"
    
    def calculate_percentage(self):
        if self.total_questions > 0:
            self.percentage = (self.score / self.total_questions) * 100
        else:
            self.percentage = 0.0
        return self.percentage
    
    def check_if_passed(self):
        """Check if the attempt passed based on the threshold"""
        self.passed = self.percentage >= self.pass_threshold
        return self.passed
    
    def generate_detailed_results(self):
        """Generate detailed results for each question"""
        if not self.question_results:
            return []
        
        detailed = []
        for result in self.question_results:
            question_id = result.get('question_id')
            question = self.quiz.questions.filter(id=question_id).first()
            
            if question:
                detailed_result = {
                    'question_id': str(question_id),
                    'question_text': question.question_text,
                    'question_type': question.question_type,
                    'user_answer': self.user_answers.get(str(question_id), ''),
                    'correct_answer': question.correct_answer,
                    'options': question.options if question.question_type == 'multiple_choice' else [],
                    'explanation': question.explanation,
                    'topic': question.topic,
                    'difficulty': question.difficulty,
                    'is_correct': result.get('is_correct', False),
                    'points_earned': 1 if result.get('is_correct', False) else 0,
                    'max_points': 1
                }
                detailed.append(detailed_result)
        
        self.detailed_results = detailed
        return detailed

    def save(self, *args, **kwargs):
        # Only auto-update percentage if it's not already set
        if self.percentage == 0.0 and self.total_questions > 0:
            self.calculate_percentage()
        
        # Check if passed
        self.check_if_passed()
        
        # Generate detailed results if not already present
        if not self.detailed_results and self.question_results:
            self.generate_detailed_results()
            
        super().save(*args, **kwargs)


class UserQuizAnalytics(models.Model):
    """Comprehensive analytics for user quiz performance"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='quiz_analytics')
    
    # Overall statistics
    total_quizzes_taken = models.PositiveIntegerField(default=0)
    total_questions_answered = models.PositiveIntegerField(default=0)
    total_correct_answers = models.PositiveIntegerField(default=0)
    overall_accuracy = models.FloatField(default=0.0)  # Percentage
    
    # Performance by difficulty
    easy_quizzes_taken = models.PositiveIntegerField(default=0)
    easy_accuracy = models.FloatField(default=0.0)
    medium_quizzes_taken = models.PositiveIntegerField(default=0)
    medium_accuracy = models.FloatField(default=0.0)
    hard_quizzes_taken = models.PositiveIntegerField(default=0)
    hard_accuracy = models.FloatField(default=0.0)
    
    # Performance by quiz type
    multiple_choice_accuracy = models.FloatField(default=0.0)
    true_false_accuracy = models.FloatField(default=0.0)
    fill_in_blank_accuracy = models.FloatField(default=0.0)
    descriptive_accuracy = models.FloatField(default=0.0)
    
    # Streaks and achievements
    current_streak = models.PositiveIntegerField(default=0)  # Consecutive correct answers
    longest_streak = models.PositiveIntegerField(default=0)
    total_passed_quizzes = models.PositiveIntegerField(default=0)
    total_failed_quizzes = models.PositiveIntegerField(default=0)
    
    # Time-based analytics
    average_time_per_question = models.FloatField(default=0.0)  # seconds
    fastest_quiz_completion = models.PositiveIntegerField(null=True, blank=True)  # seconds
    slowest_quiz_completion = models.PositiveIntegerField(null=True, blank=True)  # seconds
    
    # Topic performance
    topic_performance = models.JSONField(default=dict, blank=True)  # {topic: {accuracy, count}}
    
    # Recent performance (last 30 days)
    recent_accuracy = models.FloatField(default=0.0)
    recent_quizzes_count = models.PositiveIntegerField(default=0)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "User Quiz Analytics"
    
    def __str__(self):
        return f"Analytics for {self.user.email}"
    
    def update_analytics(self):
        """Update all analytics based on current quiz attempts"""
        attempts = self.user.quiz_attempts.filter(is_completed=True)
        
        # Basic counts
        self.total_quizzes_taken = attempts.count()
        self.total_questions_answered = sum(a.total_questions for a in attempts)
        self.total_correct_answers = sum(a.score for a in attempts)
        
        if self.total_questions_answered > 0:
            self.overall_accuracy = (self.total_correct_answers / self.total_questions_answered) * 100
        
        # Difficulty-based analytics
        self._update_difficulty_analytics(attempts)
        
        # Quiz type analytics
        self._update_quiz_type_analytics(attempts)
        
        # Streak calculations
        self._update_streaks(attempts)
        
        # Time analytics
        self._update_time_analytics(attempts)
        
        # Topic performance
        self._update_topic_analytics(attempts)
        
        # Recent performance (last 30 days)
        self._update_recent_performance(attempts)
        
        self.save()
    
    def _update_difficulty_analytics(self, attempts):
        """Update analytics by difficulty level"""
        for difficulty in ['easy', 'medium', 'hard']:
            diff_attempts = attempts.filter(quiz__difficulty=difficulty)
            count = diff_attempts.count()
            
            if count > 0:
                total_questions = sum(a.total_questions for a in diff_attempts)
                total_correct = sum(a.score for a in diff_attempts)
                accuracy = (total_correct / total_questions) * 100 if total_questions > 0 else 0
                
                if difficulty == 'easy':
                    self.easy_quizzes_taken = count
                    self.easy_accuracy = accuracy
                elif difficulty == 'medium':
                    self.medium_quizzes_taken = count
                    self.medium_accuracy = accuracy
                elif difficulty == 'hard':
                    self.hard_quizzes_taken = count
                    self.hard_accuracy = accuracy
    
    def _update_quiz_type_analytics(self, attempts):
        """Update analytics by quiz type"""
        for quiz_type in ['multiple_choice', 'true_false', 'fill_in_blank', 'descriptive']:
            type_attempts = attempts.filter(quiz__quiz_type=quiz_type)
            count = type_attempts.count()
            
            if count > 0:
                total_questions = sum(a.total_questions for a in type_attempts)
                total_correct = sum(a.score for a in type_attempts)
                accuracy = (total_correct / total_questions) * 100 if total_questions > 0 else 0
                
                if quiz_type == 'multiple_choice':
                    self.multiple_choice_accuracy = accuracy
                elif quiz_type == 'true_false':
                    self.true_false_accuracy = accuracy
                elif quiz_type == 'fill_in_blank':
                    self.fill_in_blank_accuracy = accuracy
                elif quiz_type == 'descriptive':
                    self.descriptive_accuracy = accuracy
    
    def _update_streaks(self, attempts):
        """Update streak calculations"""
        # This is a simplified version - you might want more sophisticated streak logic
        self.total_passed_quizzes = attempts.filter(passed=True).count()
        self.total_failed_quizzes = attempts.filter(passed=False).count()
    
    def _update_time_analytics(self, attempts):
        """Update time-based analytics"""
        timed_attempts = attempts.exclude(time_taken__isnull=True)
        if timed_attempts.exists():
            self.average_time_per_question = sum(a.time_taken for a in timed_attempts) / timed_attempts.count()
            self.fastest_quiz_completion = min(a.time_taken for a in timed_attempts)
            self.slowest_quiz_completion = max(a.time_taken for a in timed_attempts)
    
    def _update_topic_analytics(self, attempts):
        """Update topic-based performance"""
        topic_stats = {}
        for attempt in attempts:
            if attempt.detailed_results:
                for result in attempt.detailed_results:
                    topic = result.get('topic', 'General')
                    if topic not in topic_stats:
                        topic_stats[topic] = {'correct': 0, 'total': 0}
                    
                    topic_stats[topic]['total'] += 1
                    if result.get('is_correct', False):
                        topic_stats[topic]['correct'] += 1
        
        # Calculate accuracy for each topic
        for topic, stats in topic_stats.items():
            if stats['total'] > 0:
                stats['accuracy'] = (stats['correct'] / stats['total']) * 100
        
        self.topic_performance = topic_stats
    
    def _update_recent_performance(self, attempts):
        """Update recent performance (last 30 days)"""
        from django.utils import timezone
        from datetime import timedelta
        
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_attempts = attempts.filter(completed_at__gte=thirty_days_ago)
        
        self.recent_quizzes_count = recent_attempts.count()
        if self.recent_quizzes_count > 0:
            total_questions = sum(a.total_questions for a in recent_attempts)
            total_correct = sum(a.score for a in recent_attempts)
            self.recent_accuracy = (total_correct / total_questions) * 100 if total_questions > 0 else 0

