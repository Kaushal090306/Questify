from rest_framework import serializers
from .models import Quiz, Question, QuizAttempt, BookmarkedQuestion, DailyPracticeQuiz

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'options', 'correct_answer', 
                 'explanation', 'difficulty', 'topic', 'order']
        read_only_fields = ['id']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    total_questions = serializers.ReadOnlyField()
    
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'difficulty', 'quiz_type', 
                 'time_limit', 'questions_per_attempt', 'randomize_questions',
                 'show_correct_answers', 'total_questions', 'total_attempts',
                 'average_score', 'created_at', 'updated_at', 'questions']
        read_only_fields = ['id', 'user', 'total_attempts', 'average_score', 
                           'created_at', 'updated_at']

class QuizListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for quiz lists"""
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'difficulty', 'quiz_type',
                 'total_questions', 'total_attempts', 'average_score', 'created_at']

class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = ['id', 'quiz', 'quiz_title', 'user_email', 'score', 'total_questions',
                 'percentage', 'time_taken', 'started_at', 'completed_at',
                 'user_answers', 'question_results', 'is_completed', 'created_at']
        read_only_fields = ['id', 'user', 'quiz_title', 'user_email', 'score', 
                           'total_questions', 'percentage', 'completed_at', 
                           'question_results', 'created_at']

class BookmarkedQuestionSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)
    quiz_title = serializers.CharField(source='question.quiz.title', read_only=True)
    
    class Meta:
        model = BookmarkedQuestion
        fields = ['id', 'question', 'quiz_title', 'notes', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class DailyPracticeQuizSerializer(serializers.ModelSerializer):
    quiz = QuizSerializer(read_only=True)
    
    class Meta:
        model = DailyPracticeQuiz
        fields = ['id', 'quiz', 'date_assigned', 'is_completed', 'completed_at']
        read_only_fields = ['id', 'user', 'date_assigned']
