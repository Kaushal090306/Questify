# Socket.io Manager for Django
# Replaces Django Channels with Socket.io for better real-time performance

import socketio
import asyncio
import time
from typing import Dict, Optional
import logging
from django.conf import settings
from asgiref.sync import sync_to_async 
from rooms.models import Room, RoomParticipant 
from django.contrib.auth.models import User
logger = logging.getLogger(__name__)

class SocketIOManager:
    _instance = None
    
    def __init__(self):
        # Create Socket.io server with CORS support
        self.sio = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins="*",
            logger=True,
            engineio_logger=True
        )
        
        # Store user sessions
        self.user_sessions: Dict[str, Dict] = {}
        
        # Setup event handlers
        self._setup_handlers()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _setup_handlers(self):
        """Setup Socket.io event handlers"""
        
        @self.sio.event
        async def connect(sid, environ, auth):
            logger.info(f"Client {sid} connected")
            self.user_sessions[sid] = {
                'user_id': None,
                'room_id': None,
                'connected_at': asyncio.get_event_loop().time()
            }

        @self.sio.event
        async def disconnect(sid):
            logger.info(f"Client {sid} disconnected")
            
            # Handle user leaving room
            if sid in self.user_sessions:
                session = self.user_sessions[sid]
                if session['room_id'] and session['user_id']:
                    await self._handle_user_leave(session['room_id'], session['user_id'])
                
                del self.user_sessions[sid]

        @self.sio.event
        async def join_room(sid, data):
            """Handle user joining a room"""
            try:
                print(f"DEBUG: JOIN_ROOM HANDLER EXECUTED. SID: {sid}")
                print(f"DEBUG: Data: {data}")
                
                room_code = data['room_code']
                user_id = str(data['user_id']) # Ensure user_id is string for consistency
                name = data['name']
                
                # Helper function to get room and update participant display name
                @sync_to_async
                def get_room_and_participant_status(room_code, user_id, display_name):
                    try:
                        room = Room.objects.get(room_code=room_code)
                        # Ensure participant exists and update display name if necessary
                        participant, created = RoomParticipant.objects.get_or_create(
                            room=room, user_id=user_id,
                            defaults={
                                'display_name': display_name,
                                'score': 0,
                                'joined_at': time.time() # This will be current time in DB
                            }
                        )
                        if display_name and participant.display_name != display_name:
                            participant.display_name = display_name
                            participant.save()
                        
                        return room, room.creator.id == int(user_id) # Return room object and if current user is host
                    except Room.DoesNotExist:
                        return None, False
                
                room_obj, is_host_for_current_user = await get_room_and_participant_status(room_code, user_id, name)
                
                if not room_obj:
                    logger.warning(f"Room {room_code} not found for user {user_id}")
                    await self.sio.emit('join_room_error', {
                        'success': False, 
                        'message': 'Room not found'
                    }, room=sid)
                    return
                
                # Update session
                self.user_sessions[sid]['user_id'] = user_id
                self.user_sessions[sid]['room_id'] = room_code  # Store room_code as room_id for consistency
                
                # Join Socket.io room
                await self.sio.enter_room(sid, room_code)
                
                # Add user to quiz
                from .real_time_quiz import QuizManager
                quiz_manager = QuizManager.get_instance()
                quiz = quiz_manager.get_quiz(room_code)
                
                if not quiz:
                    quiz = await quiz_manager.create_quiz(room_code)  # Now await the async method
                
                user = quiz.add_user(user_id, name, sid, is_host_for_current_user)
                
                # Get all participants from database to ensure sync - UPDATED
                @sync_to_async
                def get_room_participants_from_db(room_code):
                    try:
                        room = Room.objects.get(room_code=room_code)
                        participants = RoomParticipant.objects.filter(room=room).select_related('user')
                        
                        participant_list = []
                        host_list = []
                        
                        for p in participants:
                            user_data = {
                                'id': str(p.user.id),
                                'user_id': str(p.user.id),
                                'name': p.display_name or p.user.username or p.user.email,
                                'display_name': p.display_name or p.user.username or p.user.email,
                                'points': p.score,
                                'joined_at': p.joined_at.timestamp() if hasattr(p.joined_at, 'timestamp') else time.time(),
                                'is_host': room.creator_id == p.user.id
                            }
                            
                            if room.creator_id == p.user.id:
                                host_list.append(user_data)
                            else:
                                participant_list.append(user_data)
                        
                        return {
                            'hosts': host_list,
                            'participants': participant_list,
                            'all_users': host_list + participant_list
                        }
                    except Room.DoesNotExist:
                        return {'hosts': [], 'participants': [], 'all_users': []}
                
                # Get separated participant lists
                room_data = await get_room_participants_from_db(room_code)
                
                # Send initial state to user with separated lists - UPDATED
                current_state = quiz.get_current_state()
                await self.sio.emit('init', {
                    'user_id': user_id,
                    'state': current_state,
                    'hosts': room_data['hosts'],
                    'participants': room_data['participants'],
                    'all_users': room_data['all_users'],
                    'quiz_users': [u.to_dict() for u in quiz.users.values()]  # Socket.io users
                }, room=sid)
                
                # Notify room about new participant with updated participant list - UPDATED
                await self.sio.emit('user_joined', {
                    'user': {
                        'id': user_id, # Use string user_id
                        'name': name,
                        'points': 0,
                        'joined_at': time.time(),
                        'is_host': is_host_for_current_user # Use the determined host status
                    },
                    'users_count': len(room_data['all_users']),
                    'hosts': room_data['hosts'],
                    'participants': room_data['participants'],
                    'all_users': room_data['all_users']  # Send complete participant list
                }, room=room_code, skip_sid=sid)
                
                logger.info(f"User {name} ({user_id}) joined room {room_code}")
                
                # Send success response via event instead of callback
                await self.sio.emit('join_room_success', {
                    'success': True, 
                    'message': 'Joined room successfully'
                }, room=sid)
                
            except Exception as e:
                logger.error(f"Error in join_room: {e}")
                print(f"DEBUG: Exception in join_room: {e}")
                # Send error response via event instead of callback
                await self.sio.emit('join_room_error', {
                    'success': False, 
                    'message': f'Failed to join room: {str(e)}'
                }, room=sid)

        @self.sio.event
        async def leave_room(sid, data):
            """Handle user leaving a room"""
            try:
                room_code = data['room_code']  # Changed from room_id to room_code
                user_id = data['user_id']
                
                await self._handle_user_leave(room_code, user_id)
                await self.sio.leave_room(sid, room_code)
                
                # Update session
                if sid in self.user_sessions:
                    self.user_sessions[sid]['room_id'] = None
                    self.user_sessions[sid]['user_id'] = None
                
            except Exception as e:
                logger.error(f"Error in leave_room: {e}")

        @self.sio.event
        async def submit_answer(sid, data):
            """Handle answer submission"""
            try:
                room_code = data['room_code']  # Changed from room_id to room_code
                user_id = data['user_id']
                answer = data['answer']
                
                from .real_time_quiz import QuizManager
                quiz_manager = QuizManager.get_instance()
                quiz = quiz_manager.get_quiz(room_code)
                
                if quiz:
                    success = await quiz.submit_answer(user_id, answer)
                    
                    await self.sio.emit('answer_submitted', {
                        'success': success,
                        'user_id': user_id
                    }, room=sid)
                    
                    # Notify room about submission (without revealing answer)
                    await self.sio.emit('user_answered', {
                        'user_id': user_id,
                        'submissions_count': len(quiz.problems[quiz.current_problem_index].submissions) if quiz.problems else 0
                    }, room=room_code, skip_sid=sid)
                
            except Exception as e:
                logger.error(f"Error in submit_answer: {e}")
                await self.sio.emit('error', {'message': 'Failed to submit answer'}, room=sid)

        @self.sio.event
        async def start_quiz(sid, data):
            """Handle quiz start (admin only) - UPDATED FOR BETTER SYNCHRONIZATION"""
            print(f"[SOCKETIO] start_quiz called by sid={sid} with data: {data}")
            try:
                room_code = data['room_code']
                admin_user_id = str(data['user_id']) # Ensure user_id is string
                print(f"[SOCKETIO] Processing start_quiz for room_code={room_code}, admin_user_id={admin_user_id}")
                
                @sync_to_async
                def check_admin_permissions(room_code, user_id):
                    try:
                        room = Room.objects.get(room_code=room_code)
                        # Check if user is creator
                        if str(room.creator.id) == user_id: # Compare string with string
                            print(f"[SOCKETIO] User {user_id} is creator of room {room_code}")
                            return True, room
                        # Check if user is host participant
                        participant = RoomParticipant.objects.filter(
                            room=room, 
                            user_id=user_id, 
                            is_host=True
                        ).first()
                        if participant:
                            print(f"[SOCKETIO] User {user_id} is host participant in room {room_code}")
                            return True, room
                        print(f"[SOCKETIO] User {user_id} is NOT admin for room {room_code}")
                        return False, room
                    except Room.DoesNotExist:
                        print(f"[SOCKETIO] Room {room_code} does not exist")
                        return False, None
                
                is_admin, room_obj = await check_admin_permissions(room_code, admin_user_id)
                print(f"[SOCKETIO] is_admin check result: {is_admin}")
                
                if not is_admin:
                    print(f"[SOCKETIO] User {admin_user_id} is not admin, sending error")
                    await self.sio.emit('start_quiz_error', {
                        'success': False,
                        'message': 'Only room creator can start the quiz'
                    }, room=sid)
                    return
                
                print(f"[SOCKETIO] Getting quiz manager and quiz for room {room_code}")
                from .real_time_quiz import QuizManager
                quiz_manager = QuizManager.get_instance()
                quiz = quiz_manager.get_quiz(room_code)
                print(f"[SOCKETIO] Quiz found: {quiz is not None}")
                
                if not quiz:
                    quiz = await quiz_manager.create_quiz(room_code)
                
                if quiz and quiz.problems:
                    print(f"[SOCKETIO] Starting quiz for room {room_code}")
                    success = await quiz.start_quiz()
                    print(f"[SOCKETIO] Quiz start result: {success}")
                    
                    if success:
                        print(f"[SOCKETIO] Emitting quiz_started to room {room_code}")
                        # Emit quiz_started to ALL users in the room - IMPROVED
                        await self.sio.emit('quiz_started', {
                            'room_code': room_code,
                            'message': 'Quiz has started!',
                            'total_questions': len(quiz.problems),
                            'started_by': admin_user_id
                        }, room=room_code)
                        
                        # Send success response to the quiz starter
                        await self.sio.emit('start_quiz_success', {
                            'success': True,
                            'message': 'Quiz started successfully'
                        }, room=sid)
                        
                        logger.info(f"Quiz started in room {room_code} by user {admin_user_id}")
                        print(f"[SOCKETIO] Quiz started successfully for room {room_code}")
                    else:
                        print(f"[SOCKETIO] Quiz start failed - unknown error")
                        await self.sio.emit('start_quiz_error', {
                            'success': False,
                            'message': 'Failed to start quiz'
                        }, room=sid)
                else:
                    print(f"[SOCKETIO] Quiz not found or no questions available for room {room_code}")
                    await self.sio.emit('start_quiz_error', {
                        'success': False,
                        'message': 'No questions available for this quiz'
                    }, room=sid)
                
            except Exception as e:
                print(f"[SOCKETIO] EXCEPTION in start_quiz: {str(e)}")
                import traceback
                print(f"[SOCKETIO] Traceback: {traceback.format_exc()}")
                logger.error(f"Error in start_quiz: {e}")
                await self.sio.emit('start_quiz_error', {
                    'success': False,
                    'message': f'Failed to start quiz: {str(e)}'
                }, room=sid)

        @self.sio.event
        async def next_question(sid, data):
            """Handle manual next question (admin only) - UPDATED"""
            try:
                room_code = data['room_code']
                user_id = data['user_id']
                
                logger.info(f"[SOCKETIO] next_question called by {sid} for room {room_code}")
                
                # Verify user is host
                @sync_to_async
                def check_host_permissions(room_code, user_id):
                    try:
                        room = Room.objects.get(room_code=room_code)
                        return str(room.creator.id) == str(user_id)
                    except Room.DoesNotExist:
                        return False
                
                is_host = await check_host_permissions(room_code, user_id)
                if not is_host:
                    logger.warning(f"Non-host user {user_id} tried to advance question")
                    return
                
                from .real_time_quiz import QuizManager
                quiz_manager = QuizManager.get_instance()
                quiz = quiz_manager.get_quiz(room_code)
                
                if quiz:
                    await quiz.force_next_question()
                    logger.info(f"[SOCKETIO] Question advanced manually for room {room_code}")
                
            except Exception as e:
                logger.error(f"Error in next_question: {e}")

        @self.sio.event
        async def get_room_state(sid, data):
            """Get current room state"""
            try:
                room_code = data['room_code']  # Changed from room_id to room_code
                
                from .real_time_quiz import QuizManager
                quiz_manager = QuizManager.get_instance()
                quiz = quiz_manager.get_quiz(room_code)
                
                if quiz:
                    state = quiz.get_current_state()
                    await self.sio.emit('room_state', state, room=sid)
                
            except Exception as e:
                logger.error(f"Error in get_room_state: {e}")

    async def _handle_user_leave(self, room_id: str, user_id: str):
        """Handle user leaving room"""
        try:
            from .real_time_quiz import QuizManager
            quiz_manager = QuizManager.get_instance()
            quiz = quiz_manager.get_quiz(room_id)
            
            if quiz:
                quiz.remove_user(user_id)
                
                # Notify room about user leaving
                await self.sio.emit('user_left', {
                    'user_id': user_id,
                    'users_count': len(quiz.users)
                }, room=room_id)
                
                # Clean up empty rooms
                if len(quiz.users) == 0:
                    quiz_manager.remove_quiz(room_id)
                    
        except Exception as e:
            logger.error(f"Error in _handle_user_leave: {e}")

    async def emit(self, event: str, data: Dict, room: Optional[str] = None, skip_sid: Optional[str] = None):
        """Emit event to room or specific client"""
        try:
            if room:
                await self.sio.emit(event, data, room=room, skip_sid=skip_sid)
            else:
                await self.sio.emit(event, data)
        except Exception as e:
            logger.error(f"Error emitting {event}: {e}")

    def get_asgi_app(self, django_asgi_app=None):
        """Get ASGI application for Socket.io"""
        if django_asgi_app:
            return socketio.ASGIApp(self.sio, other_asgi_app=django_asgi_app)
        return socketio.ASGIApp(self.sio)

# Global instance
socketio_manager = SocketIOManager.get_instance()