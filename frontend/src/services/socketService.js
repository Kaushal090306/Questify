// src/services/socketService.js

// Real-time Socket.io service for multiplayer quiz functionality
// Based on quiz-app-next implementation

import { io } from 'socket.io-client';

class SocketIOService {
  constructor() {
    this.socket = null;
    this.connectPromise = null;
    this.isConnected = false;
    this.eventListeners = new Map();
    this.currentRoom = null;
    this.currentUserId = null;
  }

  // Get Socket.io connection
  async connect(serverUrl) { // Made async to be consistent with Promise return
    // If already connected, resolve immediately
    if (this.socket && this.isConnected) {
      console.log('Socket already connected, resolving immediately.');
      return Promise.resolve(this.socket);
    }

    // If a connection attempt is already in progress, return that promise
    if (this.connectPromise) {
      console.log('Socket connection already in progress, returning existing promise.');
      return this.connectPromise;
    }

  // Use environment variable for production, fallback to localhost for dev
  const url = serverUrl || process.env.REACT_APP_SOCKETIO_URL || 'https://questify-backend.onrender.com';
    
    // Store the connection promise before initiating connection
    this.connectPromise = new Promise((resolve, reject) => {
      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 5000,
        autoConnect: true,
      });

      // Setup handlers before waiting for connection
      this.setupConnectionHandlers();

      // Wait for connection to be established
      this.socket.on('connect', () => {
        console.log('Socket.io connected:', this.socket?.id);
        this.isConnected = true;
        this.connectPromise = null; // Clear promise on successful connection
        resolve(this.socket);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.io connection error:', error);
        this.isConnected = false;
        this.connectPromise = null; // Clear promise on error
        reject(error);
      });

      // Set a timeout for connection (this is a fallback, socket.io client has its own timeout)
      const connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.error('Socket connection timeout after 10 seconds.');
          this.socket.disconnect(); // Explicitly disconnect if timed out
          this.connectPromise = null;
          reject(new Error('Socket connection timeout'));
        }
      }, 10000); // 10 second timeout

      // Clear the timeout if connected successfully
      this.socket.on('connect', () => clearTimeout(connectionTimeout));
    });

    return this.connectPromise;
  }

  setupConnectionHandlers() {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.io disconnected:', reason);
      this.isConnected = false;
      // You might want to clear specific event listeners or handle reconnect here
    });

    this.socket.on('error', (error) => {
      console.error('Socket.io error details:', {
        message: error.message || error.error || 'Unknown error',
        type: error.type || 'Unknown type',
        description: error.description || 'No description',
        context: error.context || 'No context',
        data: error.data || 'No data',
        fullError: error
      });
      // Additional error handling can go here, like showing a toast
    });

    // Global handler for quiz_started event to ensure navigation always works
    this.socket.on('quiz_started', (data) => {
      console.log('🌍 GLOBAL quiz_started event received:', data);
      console.log('🌍 Current URL:', window.location.href);
      
      // Extract room code from current URL or data
      const currentUrl = window.location.href;
      const roomCodeFromUrl = currentUrl.match(/\/room\/([^/]+)(?:\/|$)/)?.[1];
      const roomCodeFromData = data.room_code;
      
      if (roomCodeFromUrl && roomCodeFromData && roomCodeFromUrl === roomCodeFromData) {
        console.log('🌍 Room codes match, checking if navigation is needed');
        
        // Only navigate if we're currently in the PARTICIPANT lobby (not host lobby)
        if (currentUrl.includes('/lobby/participant')) {
          console.log('🌍 Currently in participant lobby, navigating to quiz page...');
          // Use window.location for more reliable navigation
          const quizUrl = `/room/${roomCodeFromData}/quiz`;
          window.history.pushState(null, '', quizUrl);
          
          // Trigger a popstate event to make React Router notice the change
          window.dispatchEvent(new PopStateEvent('popstate'));
          console.log('🌍 Global navigation to quiz page completed');
        } else if (currentUrl.includes('/lobby/host')) {
          console.log('🌍 Currently in host lobby, host should handle navigation via component');
        } else if (currentUrl.includes('/lobby')) {
          console.log('🌍 Currently in general lobby, navigating to quiz page...');
          // Fallback for general lobby URL
          const quizUrl = `/room/${roomCodeFromData}/quiz`;
          window.history.pushState(null, '', quizUrl);
          window.dispatchEvent(new PopStateEvent('popstate'));
          console.log('🌍 Global navigation to quiz page completed (fallback)');
        } else {
          console.log('🌍 Already in quiz page or other page, no navigation needed');
        }
      } else {
        console.log('🌍 Room codes do not match or missing:', { roomCodeFromUrl, roomCodeFromData });
      }
    });

    console.log('🌍 Global quiz_started handler registered on socket:', this.socket.id);
  }

  // Join a room with auto-reconnect
  async joinRoom(roomCode, userId, displayName) {
    // Check if we're already in this room
    if (this.currentRoom === roomCode && this.currentUserId === userId) {
      console.log('Already joined this room, skipping join request');
      return Promise.resolve({ success: true, message: 'Already in room' });
    }

    // Ensure we're connected before trying to join.
    if (!this.socket || !this.socket.connected) {
      console.log('Socket not connected when attempting to join room, trying to connect...');
      try {
        await this.connect(); // This will wait for actual connection
      } catch (err) {
        throw new Error(`Failed to connect socket before joining room: ${err.message}`);
      }
    }

    // Store current room info to prevent duplicate joins
    this.currentRoom = roomCode;
    this.currentUserId = userId;

    // Use promise-based approach without ACK callbacks (since they're not working)
    return new Promise((resolve, reject) => {
      // Set up one-time listeners for response
      const successHandler = (response) => {
        console.log('Joined room successfully (via join_room_success event):', response);
        this.socket.off('join_room_success', successHandler);
        this.socket.off('join_room_error', errorHandler);
        resolve(response);
      };
      
      const errorHandler = (error) => {
        console.error('Failed to join room (via join_room_error event):', error);
        this.socket.off('join_room_success', successHandler);
        this.socket.off('join_room_error', errorHandler);
        // Reset room info on error
        this.currentRoom = null;
        this.currentUserId = null;
        reject(new Error(error.message || 'Failed to join room'));
      };
      
      // Listen for response events
      this.socket.once('join_room_success', successHandler);
      this.socket.once('join_room_error', errorHandler);
      
      // Emit join room event (without callback)
      console.log('DEBUG: Emitting join_room event (no callback approach)');
      console.log('DEBUG: Socket state:', this.socket.connected);
      console.log('DEBUG: Socket ID:', this.socket.id);
      console.log('DEBUG: Event data:', { room_code: roomCode, user_id: userId, name: displayName });
      
      this.socket.emit('join_room', { room_code: roomCode, user_id: userId, name: displayName });
      
      // Add timeout to prevent hanging
      setTimeout(() => {
        this.socket.off('join_room_success', successHandler);
        this.socket.off('join_room_error', errorHandler);
        // Reset room info on timeout
        this.currentRoom = null;
        this.currentUserId = null;
        reject(new Error('Join room request timed out'));
      }, 10000); // 10 second timeout
    });
  }
  
  // Leave a room
  async leaveRoom(roomCode, userId) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected when attempting to leave room');
      // Clear room info even if not connected
      this.currentRoom = null;
      this.currentUserId = null;
      return Promise.resolve(); // Don't throw error for disconnect scenarios
    }

    return new Promise((resolve, reject) => {
      try {
        // Emit leave room event (no callback needed for leave operations)
        console.log('DEBUG: Emitting leave_room event');
        console.log('DEBUG: Event data:', { room_code: roomCode, user_id: userId });
        
        this.socket.emit('leave_room', { room_code: roomCode, user_id: userId });
        
        // Clear room info after leaving
        this.currentRoom = null;
        this.currentUserId = null;
        
        // Resolve immediately since leave room doesn't need acknowledgment
        resolve();
      } catch (error) {
        console.error('Error leaving room:', error);
        // Clear room info even on error
        this.currentRoom = null;
        this.currentUserId = null;
        resolve(); // Still resolve to prevent cleanup errors
      }
    });
  }
  
  // Submit an answer
  async submitAnswer(roomCode, userId, answer) { // Added async keyword
    if (!this.socket || !this.socket.connected) {
      return Promise.reject(new Error('Socket not connected for submitAnswer'));
    }

    return new Promise((resolve, reject) => {
      // Emit submit answer event with ACK callback (assuming server sends an ACK)
      this.socket.emit('submit_answer', {
        room_code: roomCode,
        user_id: userId,
        answer: answer
      }, (response) => { // Added ACK callback
        if (response && response.success) {
          resolve(response); // Resolve with the full response
        } else {
          reject(new Error(response?.message || 'Failed to submit answer'));
        }
      });
    });
  }

  // Start quiz (admin only)
  async startQuiz(roomCode, userId) { // Added async keyword
    if (!this.socket || !this.socket.connected) {
      return Promise.reject(new Error('Socket not connected for startQuiz'));
    }

    return new Promise((resolve, reject) => {
      // Set up one-time listeners for response
      const successHandler = (response) => {
        console.log('Quiz started successfully (via start_quiz_success event):', response);
        this.socket.off('start_quiz_success', successHandler);
        this.socket.off('start_quiz_error', errorHandler);
        resolve(response);
      };
      
      const errorHandler = (error) => {
        console.error('Failed to start quiz (via start_quiz_error event):', error);
        this.socket.off('start_quiz_success', successHandler);
        this.socket.off('start_quiz_error', errorHandler);
        reject(new Error(error.message || 'Failed to start quiz'));
      };
      
      // Listen for response events
      this.socket.once('start_quiz_success', successHandler);
      this.socket.once('start_quiz_error', errorHandler);
      
      // Emit start quiz event (without callback)
      console.log('DEBUG: Emitting start_quiz event (no callback approach)');
      console.log('DEBUG: Event data:', { room_code: roomCode, user_id: userId });
      
      this.socket.emit('start_quiz', { room_code: roomCode, user_id: userId });
      
      // Add timeout to prevent hanging
      setTimeout(() => {
        this.socket.off('start_quiz_success', successHandler);
        this.socket.off('start_quiz_error', errorHandler);
        reject(new Error('Start quiz request timed out'));
      }, 10000); // 10 second timeout
    });
  }

  // Get room state
  async getRoomState(roomCode) { // Added async keyword
    if (!this.socket || !this.socket.connected) {
      return Promise.reject(new Error('Socket not connected for getRoomState'));
    }

    return new Promise((resolve, reject) => {
      // Emit get room state event with ACK callback (assuming server sends an ACK)
      this.socket.emit('get_room_state', {
        room_code: roomCode
      }, (response) => { // Added ACK callback
        if (response && response.success) { // Assuming server sends {success: true, state: ...}
          resolve(response.state); // Resolve with just the state data
        } else {
          reject(new Error(response?.message || 'Failed to get room state'));
        }
      });
    });
  }

  // Listen for events
  on(event, callback) {
    if (!this.socket) return;

    this.socket.on(event, callback);

    // Store callback for cleanup
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      
      // Remove from stored callbacks
      const callbacks = this.eventListeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    } else {
      // Remove all listeners for this event if no specific callback is provided
      const callbacks = this.eventListeners.get(event);
      if (callbacks) {
        callbacks.forEach(cb => this.socket?.off(event, cb));
      }
      this.eventListeners.delete(event);
    }
  }

  // Emit custom event (for events that don't need a specific ACK handler)
  emit(event, data) { // Simplified signature, removed room, skipSid as client emit doesn't use them
    if (!this.socket || !this.socket.connected) {
      console.warn(`Attempted to emit ${event} while socket is not connected.`);
      return;
    }
    this.socket.emit(event, data);
  }

  // Manually advance to next question (admin only)
  async nextQuestion(roomCode, userId) { // Added async keyword
    if (!this.socket || !this.socket.connected) {
      return Promise.reject(new Error('Socket not connected for nextQuestion'));
    }
    // Assuming next_question doesn't require an ACK or returns nothing important
    // If it *should* send an ACK, change this to a Promise similar to joinRoom
    this.socket.emit('next_question', {
      room_code: roomCode,
      user_id: userId
    });
    return Promise.resolve(); // Resolve immediately as no ACK is expected for now
  }

  // Check connection status
  isSocketConnected() {
    return this.isConnected && this.socket?.connected === true;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      // Remove all custom event listeners stored
      this.eventListeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket?.off(event, callback);
        });
      });
      this.eventListeners.clear();

      // Disconnect the socket.io client
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectPromise = null; // Clear connection promise
      console.log('Socket.io client manually disconnected.');
    }
  }

  // Get socket instance (for advanced usage, though generally discouraged to expose raw socket)
  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const socketIOService = new SocketIOService();

export default socketIOService;