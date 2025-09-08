import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Get Django ASGI application early
django_asgi_app = get_asgi_application()

# Import Socket.io manager after Django ASGI app is created
from multiplayer.socketio_manager import SocketIOManager
import socketio

# Create Socket.io server
socketio_manager = SocketIOManager.get_instance()

# Create combined ASGI application using socketio.ASGIApp
application = socketio.ASGIApp(socketio_manager.sio, other_asgi_app=django_asgi_app)
