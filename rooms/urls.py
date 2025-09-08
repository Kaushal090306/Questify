from django.urls import path
from .views import (
    CreateRoomView,
    join_room,
    get_room_details,
    start_room,
    submit_answer,
    get_user_rooms,
    get_room_leaderboard,
    get_room_results,
    remove_participant,
    make_spectator,
)
from .quiz_generation import generate_room_quiz

urlpatterns = [
    path('create/', CreateRoomView.as_view(), name='create-room'),
    path('generate-quiz/', generate_room_quiz, name='generate-room-quiz'),
    path('join/', join_room, name='join-room'),
    path('my-rooms/', get_user_rooms, name='get-user-rooms'),
    path('<str:room_code>/', get_room_details, name='get-room-details'),
    path('<str:room_code>/start/', start_room, name='start-room'),
    path('<str:room_code>/submit/', submit_answer, name='submit-answer'),
    path('<str:room_code>/leaderboard/', get_room_leaderboard, name='get-room-leaderboard'),
    path('<str:room_code>/results/', get_room_results, name='get-room-results'),
    path('<str:room_code>/remove-participant/', remove_participant, name='remove-participant'),
    path('<str:room_code>/make-spectator/', make_spectator, name='make-spectator'),
]
