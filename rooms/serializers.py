from rest_framework import serializers
from .models import Room, RoomQuestion, RoomParticipant, ParticipantAnswer
from django.contrib.auth.models import User

class RoomQuestionSerializer(serializers.ModelSerializer):
    correct_answer = serializers.IntegerField(required=False, write_only=True)  # Accept singular for compatibility
    
    class Meta:
        model = RoomQuestion
        fields = ('id', 'question_text', 'question_type', 'options', 'correct_answers', 'correct_answer', 'explanation', 'points', 'order')
    
    def validate(self, data):
        """Handle mapping from correct_answer to correct_answers"""
        if 'correct_answer' in data and 'correct_answers' not in data:
            # Convert single answer index to list
            data['correct_answers'] = [data.pop('correct_answer')]
        elif 'correct_answer' in data:
            # Remove duplicate if both exist
            data.pop('correct_answer')
        return data


class RoomParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    name = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomParticipant
        fields = ['id', 'user', 'username', 'email', 'name', 'display_name', 'joined_at', 'score', 'is_host']
    
    def get_name(self, obj):
        """Get the best available name for the participant"""
        return obj.display_name or obj.user.username or obj.user.email

class RoomSerializer(serializers.ModelSerializer):
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    participant_count = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    questions = RoomQuestionSerializer(many=True, read_only=True)
    participants = RoomParticipantSerializer(many=True, read_only=True)
    
    class Meta:
        model = Room
        fields = [
            'id', 'room_code', 'title', 'description', 'creator', 'creator_username',
            'quiz_type', 'status', 'max_participants', 'start_time', 'end_time',
            'created_at', 'updated_at', 'participant_count', 'is_full', 'questions', 
            'participants', 'password_protected', 'timer_enabled', 'timer_type', 
            'timer_value', 'randomize_questions', 'randomize_options', 'max_attempts'
        ]
        read_only_fields = ['room_code', 'creator']

class CreateRoomSerializer(serializers.ModelSerializer):
    questions = RoomQuestionSerializer(many=True, required=False)
    name = serializers.CharField(max_length=200, required=False)  # Accept 'name' field for compatibility
    title = serializers.CharField(max_length=200, required=False)  # Make title not required since we'll map from name
    total_questions = serializers.IntegerField(required=False)
    time_limit = serializers.IntegerField(required=False, allow_null=True)
    shuffle_questions = serializers.BooleanField(required=False, default=False)
    shuffle_options = serializers.BooleanField(required=False, default=False)
    
    class Meta:
        model = Room
        fields = [
            'name', 'title', 'description', 'quiz_type', 'max_participants', 
            'timer_enabled', 'timer_type', 'timer_value', 'randomize_questions', 
            'randomize_options', 'max_attempts', 'questions', 'total_questions',
            'time_limit', 'shuffle_questions', 'shuffle_options'
        ]
    
    def validate(self, data):
        """Custom validation to ensure either name or title is provided"""
        if not data.get('name') and not data.get('title'):
            raise serializers.ValidationError("Either 'name' or 'title' field is required.")
        return data
    
    def create(self, validated_data):
        print(f"DEBUG: CreateRoomSerializer.create called with: {validated_data}")
        questions_data = validated_data.pop('questions', [])
        
        # Handle name/title field mapping - name takes precedence if both provided
        if 'name' in validated_data:
            validated_data['title'] = validated_data.pop('name')
            
        # Map new field names to model fields
        if 'time_limit' in validated_data:
            time_limit = validated_data.pop('time_limit')
            if time_limit:
                validated_data['timer_enabled'] = True
                validated_data['timer_value'] = time_limit
            else:
                validated_data['timer_enabled'] = False
            
        if 'shuffle_questions' in validated_data:
            validated_data['randomize_questions'] = validated_data.pop('shuffle_questions')
            
        if 'shuffle_options' in validated_data:
            validated_data['randomize_options'] = validated_data.pop('shuffle_options')
            
        # Remove total_questions as it's not a model field
        validated_data.pop('total_questions', None)
        
        print(f"DEBUG: Final validated_data for Room creation: {validated_data}")
        
        room = Room.objects.create(**validated_data)
        
        for i, question_data in enumerate(questions_data):
            question_data['order'] = i
            RoomQuestion.objects.create(room=room, **question_data)
        
        return room

class JoinRoomSerializer(serializers.Serializer):
    room_code = serializers.CharField(max_length=6)
    display_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    def validate_room_code(self, value):
        try:
            room = Room.objects.get(room_code=value)
            if room.status == 'completed':
                raise serializers.ValidationError("This room has already completed.")
            if room.is_full:
                raise serializers.ValidationError("This room is full.")
            return value
        except Room.DoesNotExist:
            raise serializers.ValidationError("Invalid room code.")

class ParticipantAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParticipantAnswer
        fields = ('id', 'question', 'selected_answers', 'is_correct', 'points_earned', 'answered_at')
        read_only_fields = ('is_correct', 'points_earned')
