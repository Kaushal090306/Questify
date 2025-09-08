from django.contrib import admin
from .models import Room, RoomQuestion, RoomParticipant, ParticipantAnswer

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('title', 'room_code', 'creator', 'status', 'participant_count', 'created_at')
    list_filter = ('status', 'quiz_type', 'created_at')
    search_fields = ('title', 'room_code', 'creator__username')
    readonly_fields = ('room_code', 'participant_count')

@admin.register(RoomQuestion)
class RoomQuestionAdmin(admin.ModelAdmin):
    list_display = ('room', 'question_text', 'question_type', 'order')
    list_filter = ('room__title', 'question_type')
    search_fields = ('question_text',)

@admin.register(RoomParticipant)
class RoomParticipantAdmin(admin.ModelAdmin):
    list_display = ('user', 'room', 'score', 'is_host', 'joined_at')
    list_filter = ('room__title', 'is_host')
    search_fields = ('user__username', 'room__room_code')

@admin.register(ParticipantAnswer)
class ParticipantAnswerAdmin(admin.ModelAdmin):
    list_display = ('participant', 'question', 'is_correct', 'points_earned', 'answered_at')
    list_filter = ('participant__room__title', 'is_correct')
    search_fields = ('participant__user__username', 'question__question_text')
