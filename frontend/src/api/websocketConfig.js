import { io } from 'socket.io-client';

class WebSocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(roomCode, token) {
    if (this.socket) {
      this.disconnect();
    }

    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
    
    this.socket = io(wsUrl, {
      auth: {
        token: token
      },
      query: {
        room: roomCode
      }
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new WebSocketManager();
