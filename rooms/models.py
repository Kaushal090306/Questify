from django.db import models
from django.conf import settings
import random
import string
from django.utils import timezone

# =============================================================================
# ROOM MODELS
# =============================================================================

class Room(models.Model):
    """
    Represents a real-time quiz room.
    """
    ROOM_STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]
    
    QUIZ_TYPE_CHOICES = [
        ('ai_generated', 'AI Generated'),
        ('manual', 'Manual'),
    ]
    
    TIMER_TYPE_CHOICES = [
        ('per_question', 'Per Question'),
        ('global', 'Global'),
    ]

    room_code = models.CharField(max_length=6, unique=True, db_index=True, help_text="Unique 6-digit code for joining the room")
    title = models.CharField(max_length=200, help_text="Title of the quiz room")
    description = models.TextField(blank=True, help_text="Optional description for the room")
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_rooms')
    quiz_type = models.CharField(max_length=20, choices=QUIZ_TYPE_CHOICES, default='manual')
    
    # --- Room Settings ---
    timer_enabled = models.BooleanField(default=False, help_text="Is the timer enabled for this quiz?")
    timer_type = models.CharField(max_length=20, choices=TIMER_TYPE_CHOICES, default='per_question', help_text="Timer type: per question or global")
    timer_value = models.IntegerField(default=30, help_text="Time in seconds (per question or global)")
    randomize_questions = models.BooleanField(default=True, help_text="Shuffle question order for each participant")
    randomize_options = models.BooleanField(default=True, help_text="Shuffle answer options for each question")
    max_attempts = models.IntegerField(default=1, help_text="Number of attempts allowed (1 for single attempt)")
    password_protected = models.BooleanField(default=False, help_text="Is the room password protected?")
    password = models.CharField(max_length=128, blank=True, null=True, help_text="Password for the room")
    
    # --- Room Status ---
    status = models.CharField(max_length=20, choices=ROOM_STATUS_CHOICES, default='waiting')
    max_participants = models.IntegerField(default=50)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.room_code:
            self.room_code = self.generate_room_code()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_room_code():
        """Generates a unique 6-digit room code."""
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not Room.objects.filter(room_code=code).exists():
                return code
    
    @property
    def participant_count(self):
        return self.participants.count()
    
    @property
    def is_full(self):
        return self.participant_count >= self.max_participants
    
    def __str__(self):
        return f"{self.title} ({self.room_code})"

# =============================================================================
# QUESTION MODELS
# =============================================================================

class RoomQuestion(models.Model):
    """
    Represents a single question within a quiz room.
    """
    QUESTION_TYPE_CHOICES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('fill_in_blank', 'Fill in the Blank'),
    ]
    
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES)
    options = models.JSONField(default=list, blank=True, help_text="List of options for multiple choice or true/false")
    correct_answers = models.JSONField(default=list, help_text="List of correct answers")
    explanation = models.TextField(blank=True)
    points = models.IntegerField(default=1)
    order = models.IntegerField(default=0, help_text="Order of the question in the quiz")
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.room.title} - Q{self.order + 1}"

# =============================================================================
# PARTICIPANT & ANSWER MODELS
# =============================================================================

class RoomParticipant(models.Model):
    """
    Represents a user who has joined a quiz room.
    """
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    display_name = models.CharField(max_length=100, blank=True, help_text="Display name for this participant in the room")
    joined_at = models.DateTimeField(auto_now_add=True)
    score = models.IntegerField(default=0)
    is_host = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['room', 'user']
    
    def __str__(self):
        return f"{self.display_name or self.user.username} in {self.room.room_code}"

class ParticipantAnswer(models.Model):
    """
    Represents an answer submitted by a participant for a specific question.
    """
    participant = models.ForeignKey(RoomParticipant, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(RoomQuestion, on_delete=models.CASCADE)
    selected_answers = models.JSONField(default=list)
    is_correct = models.BooleanField(default=False)
    points_earned = models.IntegerField(default=0)
    answered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['participant', 'question']
    
    def __str__(self):
        return f"{self.participant.user.username} - {self.question.question_text[:50]}"
