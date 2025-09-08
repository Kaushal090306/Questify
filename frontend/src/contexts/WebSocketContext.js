import React, { createContext, useState, useContext, useEffect } from 'react';
import WebSocketManager from '../api/websocketConfig';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState({
    status: 'waiting', // waiting, in_progress, finished
    currentQuestion: null,
    questionIndex: 0,
    leaderboard: [],
    timeRemaining: 0
  });

  const connectToRoom = (roomCode) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Please login first');
        return;
      }

      const socket = WebSocketManager.connect(roomCode, token);
      
      socket.on('connect', () => {
        setIsConnected(true);
        setCurrentRoom(roomCode);
        toast.success('Connected to room');
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        setCurrentRoom(null);
        toast.info('Disconnected from room');
      });

      socket.on('room_joined', (data) => {
        setRoomData(data.room);
        setPlayers(data.players);
        toast.success(`Joined room: ${roomCode}`);
      });

      socket.on('player_joined', (data) => {
        setPlayers(prev => [...prev, data.player]);
        toast.info(`${data.player.name} joined the room`);
      });

      socket.on('player_left', (data) => {
        setPlayers(prev => prev.filter(p => p.id !== data.player_id));
        toast.info(`${data.player_name} left the room`);
      });

      socket.on('game_started', (data) => {
        setGameState(prev => ({
          ...prev,
          status: 'in_progress',
          currentQuestion: data.question,
          questionIndex: data.question_index,
          timeRemaining: data.time_limit
        }));
        toast.success('Game started!');
      });

      socket.on('new_question', (data) => {
        setGameState(prev => ({
          ...prev,
          currentQuestion: data.question,
          questionIndex: data.question_index,
          timeRemaining: data.time_limit
        }));
      });

      socket.on('question_results', (data) => {
        setGameState(prev => ({
          ...prev,
          leaderboard: data.leaderboard
        }));
      });

      socket.on('game_finished', (data) => {
        setGameState(prev => ({
          ...prev,
          status: 'finished',
          leaderboard: data.final_leaderboard
        }));
        toast.success('Game finished!');
      });

      socket.on('timer_update', (data) => {
        setGameState(prev => ({
          ...prev,
          timeRemaining: data.time_remaining
        }));
      });

      socket.on('error', (data) => {
        toast.error(data.message);
      });

      return socket;
    } catch (error) {
      toast.error('Failed to connect to room');
      console.error('WebSocket connection error:', error);
    }
  };

  const leaveRoom = () => {
    WebSocketManager.disconnect();
    setIsConnected(false);
    setCurrentRoom(null);
    setRoomData(null);
    setPlayers([]);
    setGameState({
      status: 'waiting',
      currentQuestion: null,
      questionIndex: 0,
      leaderboard: [],
      timeRemaining: 0
    });
  };

  const submitAnswer = (questionId, answer) => {
    WebSocketManager.emit('submit_answer', {
      question_id: questionId,
      answer: answer
    });
  };

  const startGame = () => {
    WebSocketManager.emit('start_game');
  };

  const value = {
    isConnected,
    currentRoom,
    roomData,
    players,
    gameState,
    connectToRoom,
    leaveRoom,
    submitAnswer,
    startGame
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
