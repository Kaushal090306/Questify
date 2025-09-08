import { api } from './axiosConfig';

export const createRoom = async (roomDetails) => {
    try {
        console.log('Sending room creation request:', roomDetails);
        const response = await api.post('/rooms/create/', roomDetails);
        console.log('Room creation API response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Room creation API error:', error);
        if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
            throw error.response.data;
        } else {
            throw { error: 'Network error. Please check your connection.' };
        }
    }
};

export const joinRoom = async (roomCode, displayName = '', password = '') => {
    try {
        const response = await api.post('/rooms/join/', { 
            room_code: roomCode, 
            display_name: displayName,
            password 
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getRoomDetails = async (roomCode) => {
    try {
        const response = await api.get(`/rooms/${roomCode}/`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const startRoom = async (roomCode) => {
    try {
        const response = await api.post(`/rooms/${roomCode}/start/`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const submitAnswer = async (roomCode, questionId, answer) => {
    try {
        const response = await api.post(`/rooms/${roomCode}/submit/`, {
            question_id: questionId,
            answer: answer,
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getRoomLeaderboard = async (roomCode) => {
    try {
        const response = await api.get(`/api/rooms/${roomCode}/leaderboard/`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getUserRooms = async () => {
    try {
        const response = await api.get('/rooms/my-rooms/');
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};
