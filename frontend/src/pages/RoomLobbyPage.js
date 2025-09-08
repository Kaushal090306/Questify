import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getRoomDetails, startRoom } from '../api/rooms';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/axiosConfig';
import socketIOService from '../services/socketService';

const RoomLobbyPage = () => {
    console.log('🚀 RoomLobbyPage: Component mounting/rendering');
    
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading } = useAuth();
    const [room, setRoom] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [error, setError] = useState('');
    const [isHost, setIsHost] = useState(false);
    const [loading, setLoading] = useState(true);
    const [startingQuiz, setStartingQuiz] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const connectingRef = useRef(false);
    
    // Detect if this is a host or participant based on URL
    const isHostByURL = location.pathname.includes('/lobby/host');
    const isParticipantByURL = location.pathname.includes('/lobby/participant');
    
    console.log('🎭 URL-based role detection:', { 
        isHostByURL, 
        isParticipantByURL, 
        pathname: location.pathname 
    });
    
    // Get display name from navigation state or use user info
    const displayName = location.state?.displayName || user?.username || user?.email || `User${user?.id}`;

    useEffect(() => {
        const fetchRoomDetails = async () => {
            try {
                setLoading(true);
                
                console.log('Auth loading:', authLoading, 'User:', user);
                
                // Wait for auth to complete loading
                if (authLoading) {
                    console.log('Auth still loading, waiting...');
                    setLoading(false);
                    return;
                }
                
                // Validate user is available after auth loading is complete
                if (!user || !user.id) {
                    console.log('User not available after auth loading completed. User object:', user);
                    setError('Unable to load user information. Please try logging in again.');
                    setLoading(false);
                    return;
                }
                
                console.log('Fetching room details for:', roomCode, 'User:', user.email);
                const data = await getRoomDetails(roomCode);
                console.log('Room details received:', data);
                setRoom(data);
                setParticipants(data.participants || []);
                console.log('Participants set:', data.participants);
                console.log('Participants data structure:', JSON.stringify(data.participants, null, 2));
                const hostStatus = data.creator === user.id;
                console.log('Host status check:', {
                    'room.creator': data.creator,
                    'user.id': user.id,
                    'isHost': hostStatus,
                    'participants': data.participants?.length || 0
                });
                setIsHost(hostStatus);
                console.log('Room details loaded successfully');
            } catch (err) {
                console.error('Error fetching room details:', err);
                setError(err.message || 'Failed to fetch room details.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchRoomDetails();
    }, [roomCode, user?.id, user, authLoading, navigate]);

    useEffect(() => {
        let mounted = true;
        let connectionAttempted = false;
        let connectionAborted = false;

        // Connect to Socket.io server
        const connectToRoom = async () => {
            try {
                // Prevent multiple connections
                if (connectionAttempted || connectingRef.current || isConnected) {
                    console.log('Connection already attempted or in progress');
                    return;
                }

                // Check if component is still mounted
                if (!mounted || connectionAborted) {
                    console.log('🔒 Component unmounted before connection attempt, aborting');
                    return;
                }

                // Validate user data before connecting
                if (!user || !user.id || !roomCode) {
                    console.log('Missing required data for connection:', { user: !!user, userId: !!user?.id, roomCode });
                    return;
                }

                connectionAttempted = true;
                connectingRef.current = true;
                
                console.log('🔐 LOCKING CONNECTION - Starting WebSocket connection');
                console.log('🔐 Connection data:', { roomCode, userId: user.id, displayName });
                
                // Double-check component is still mounted before proceeding
                if (!mounted || connectionAborted) {
                    console.log('🔒 Component unmounted during connection setup, aborting');
                    connectingRef.current = false;
                    return;
                }
                
                console.log('Starting Socket.io connection for:', {
                    roomCode,
                    userId: user.id,
                    displayName
                });

                // Wrap in promise race to handle unmount during connection
                const connectionResult = await Promise.race([
                    socketIOService.connect(),
                    new Promise((_, reject) => {
                        const checkInterval = setInterval(() => {
                            if (!mounted || connectionAborted) {
                                clearInterval(checkInterval);
                                reject(new Error('Component unmounted during socket connection'));
                            }
                        }, 100);
                    })
                ]);
                
                // Check if component is still mounted after connection
                if (!mounted || connectionAborted) {
                    console.log('🔒 Component unmounted during connection, aborting join room');
                    connectingRef.current = false;
                    return;
                }
                
                console.log('Socket.io connected, joining room...');
                
                // Join the room with similar unmount protection
                const joinResult = await Promise.race([
                    socketIOService.joinRoom(
                        roomCode, 
                        user.id.toString(), 
                        displayName || user.username || user.email
                    ),
                    new Promise((_, reject) => {
                        const checkInterval = setInterval(() => {
                            if (!mounted || connectionAborted) {
                                clearInterval(checkInterval);
                                reject(new Error('Component unmounted during room join'));
                            }
                        }, 100);
                    })
                ]);

                if (!mounted || connectionAborted) {
                    console.log('Component unmounted after joining room');
                    return;
                }

                setIsConnected(true);
                connectingRef.current = false;
                console.log('🔓 UNLOCKING CONNECTION - Successfully connected and joined room');
                console.log('🔓 Connection established for room:', roomCode);

                // Setup event listeners only once
                const handleUserJoined = (data) => {
                    console.log('User joined event:', data);
                    console.log('User joined data structure:', JSON.stringify(data, null, 2));
                    if (data.all_users) {
                        console.log('Setting participants from all_users:', data.all_users);
                        console.log('All users data structure:', JSON.stringify(data.all_users, null, 2));
                        setParticipants(prev => {
                            // Only update if the data is actually different
                            if (JSON.stringify(prev) !== JSON.stringify(data.all_users)) {
                                return data.all_users;
                            }
                            return prev;
                        });
                    } else if (data.user) {
                        console.log('Adding single user to participants:', data.user);
                        console.log('Single user data structure:', JSON.stringify(data.user, null, 2));
                        setParticipants(prev => {
                            const exists = prev.some(p => p.id === data.user.id);
                            if (!exists) {
                                return [...prev, data.user];
                            }
                            return prev;
                        });
                    }
                };

                const handleUserLeft = (data) => {
                    console.log('User left event:', data);
                    setParticipants(prev => prev.filter(p => p.id !== data.user_id));
                };

                const handleQuizStarted = (data) => {
                    console.log('🎯🎯🎯 QUIZ STARTED EVENT RECEIVED IN HANDLER!', data);
                    console.log('🎯 Current room code:', roomCode);
                    console.log('🎯 Display name:', displayName);
                    console.log('🎯 About to navigate to:', `/room/${roomCode}/quiz`);
                    console.log('🎯 Current URL:', window.location.href);
                    
                    // Navigate immediately without delay
                    console.log('🎯 Executing navigation NOW...');
                    try {
                        navigate(`/room/${roomCode}/quiz`, { 
                            state: { displayName },
                            replace: true // Replace current history entry to prevent back navigation
                        });
                        console.log('🎯 Navigation executed successfully');
                        setStartingQuiz(false); // Reset starting state after successful navigation
                    } catch (error) {
                        console.error('🎯 Navigation failed:', error);
                        setStartingQuiz(false); // Reset starting state on error
                    }
                };

                const handleStartQuizSuccess = (data) => {
                    console.log('✅ START QUIZ SUCCESS EVENT RECEIVED!', data);
                    console.log('✅ Quiz started successfully, navigating immediately...');
                    
                    // Navigate immediately when we receive start_quiz_success
                    // Don't wait for quiz_started since it might not be reaching us
                    try {
                        navigate(`/room/${roomCode}/quiz`, { 
                            state: { displayName },
                            replace: true
                        });
                        console.log('✅ Navigation executed successfully');
                        setStartingQuiz(false); // Reset starting state after successful navigation
                    } catch (error) {
                        console.error('✅ Navigation failed:', error);
                        setStartingQuiz(false); // Reset starting state on error
                    }
                };

                const handleInit = (data) => {
                    console.log('Init event with participants:', data.users);
                    if (data.users) {
                        console.log('Setting participants from init event:', data.users);
                        setParticipants(prev => {
                            // Only update if the data is actually different
                            if (JSON.stringify(prev) !== JSON.stringify(data.users)) {
                                return data.users;
                            }
                            return prev;
                        });
                    }
                };

                // Remove any existing listeners first
                console.log('🔧 Removing existing WebSocket event listeners...');
                socketIOService.off('user_joined');
                socketIOService.off('user_left');
                socketIOService.off('quiz_started');
                socketIOService.off('init');

                // Add new listeners
                console.log('🔧 Adding new WebSocket event listeners...');
                socketIOService.on('user_joined', handleUserJoined);
                socketIOService.on('user_left', handleUserLeft);
                socketIOService.on('quiz_started', handleQuizStarted);
                socketIOService.on('start_quiz_success', handleStartQuizSuccess); // Backup navigation
                socketIOService.on('start_quiz_error', (data) => {
                    console.log('❌ START QUIZ ERROR EVENT RECEIVED!', data);
                    setStartingQuiz(false);
                    setError(data.message || 'Failed to start quiz');
                });
                socketIOService.on('init', handleInit);
                
                // Add catch-all listener for debugging
                socketIOService.socket.onAny((eventName, ...args) => {
                    console.log(`🔍 RECEIVED EVENT: ${eventName}`, args);
                    console.log(`🔍 Current page: RoomLobbyPage for room ${roomCode}`);
                    
                    // Log specific events we care about
                    if (['quiz_started', 'start_quiz_success', 'start_quiz_error'].includes(eventName)) {
                        console.log(`🎯🎯🎯 CRITICAL EVENT RECEIVED: ${eventName}`, args);
                        console.log(`🎯 Should trigger navigation to quiz page`);
                    }
                });
                
                console.log('🔧 Event listeners setup complete. Listening for:', [
                    'user_joined', 'user_left', 'quiz_started', 'start_quiz_success', 'start_quiz_error', 'init'
                ]);

            } catch (err) {
                console.error('🔓 UNLOCKING CONNECTION - Failed to connect to room:', err);
                
                // Only set error if component is still mounted
                if (mounted && !connectionAborted) {
                    setError('Failed to connect to room. Please try again.');
                }
                
                connectingRef.current = false;
                connectionAttempted = false;
                
                // Reset connection abort if it was due to unmount
                if (err.message?.includes('Component unmounted')) {
                    console.log('Connection aborted due to component unmount - this is expected');
                }
            }
        };

        // Only attempt connection if we have all required data
        if (roomCode && user && user.id && !connectionAttempted && !connectingRef.current && !isConnected) {
            connectToRoom();
        }

        // Cleanup function
        return () => {
            console.log('🔥 RoomLobbyPage: Component unmounting - cleaning up');
            mounted = false;
            connectionAborted = true;
            if (isConnected && user && user.id) {
                console.log('Cleaning up Socket.io connection...');
                try {
                    socketIOService.leaveRoom(roomCode, user.id.toString());
                    socketIOService.off('user_joined');
                    socketIOService.off('user_left');
                    socketIOService.off('quiz_started');
                    socketIOService.off('start_quiz_success');
                    socketIOService.off('start_quiz_error');
                    socketIOService.off('init');
                    socketIOService.socket.offAny(); // Remove catch-all listener
                } catch (err) {
                    console.error('🔓 Error during cleanup:', err);
                }
                console.log('🔓 COMPONENT UNMOUNTING - Cleaning up connection');
                setIsConnected(false);
                connectingRef.current = false;
            }
        };
    }, [roomCode, user?.id, displayName, navigate, isConnected]); // Added missing dependency

    // Separate effect for preventing navigation during connection
    useEffect(() => {
        // Prevent any navigation while connecting
        if (connectingRef.current) {
            console.log('🔒 Connection in progress, preventing navigation changes');
        }
    }, [connectingRef.current]);

    // Helper function to get participant display name
    const getParticipantName = (participant) => {
        console.log('Getting name for participant:', participant);
        
        // Try different name fields in order of preference
        // Handle both API response format and WebSocket format
        const name = participant.name || 
                    participant.display_name || 
                    participant.username || 
                    participant.email ||
                    (participant.user && participant.user.username) ||
                    (participant.user && participant.user.email) ||
                    'Unknown User';
        
        console.log('Resolved participant name:', name);
        return name;
    };

    // Helper function to get participant initial
    const getParticipantInitial = (participant) => {
        const name = getParticipantName(participant);
        return name && name !== 'Unknown User' ? name.charAt(0).toUpperCase() : 'U';
    };

    const handleStartQuiz = async () => {
        // Only allow hosts to start quiz
        if (!isHost && !isHostByURL) {
            console.log('❌ Only hosts can start the quiz');
            setError('Only hosts can start the quiz');
            return;
        }

        // Prevent multiple calls
        if (startingQuiz) {
            console.log('⚠️ Quiz start already in progress, ignoring additional calls');
            return;
        }

        try {
            console.log('🚀 Starting quiz for room:', roomCode, 'User ID:', user.id);
            console.log('🚀 Socket connected?', socketIOService.socket?.connected);
            console.log('🚀 Socket ID:', socketIOService.socket?.id);
            console.log('🚀 Host by URL:', isHostByURL, 'Host by data:', isHost);
            setStartingQuiz(true);
            
            // Start quiz via Socket.io and wait for the response
            console.log('🚀 Sending startQuiz WebSocket event...');
            const response = await socketIOService.startQuiz(roomCode, user.id.toString());
            console.log('🚀 Quiz start response received:', response);
            
            // If we get here, the quiz started successfully - navigate immediately
            if (response && response.success) {
                console.log('🎯 Quiz started successfully, navigating to quiz page...');
                const quizUrl = `/room/${roomCode}/quiz`;
                console.log('🎯 Current URL:', window.location.href);
                console.log('🎯 Target URL:', quizUrl);
                console.log('🎯 Room code:', roomCode);
                
                try {
                    console.log('🎯 Executing navigate to:', quizUrl);
                    navigate(quizUrl, { 
                        state: { displayName },
                        replace: true
                    });
                    console.log('🎯 Navigation executed successfully');
                    
                    // Additional check after navigation
                    setTimeout(() => {
                        console.log('🎯 URL after navigation:', window.location.href);
                    }, 100);
                } catch (navError) {
                    console.error('🎯 Navigation failed:', navError);
                    setError('Failed to navigate to quiz page');
                }
            } else {
                console.log('⚠️ Quiz start response indicates failure:', response);
                setError('Quiz start failed - invalid response');
            }
            
            setStartingQuiz(false); // Reset starting state
        } catch (err) {
            console.error('❌ Failed to start quiz:', err);
            setError(err.message || 'Failed to start the quiz.');
            setStartingQuiz(false); // Reset on error
        }
    };

    const handleRemoveParticipant = async (participantId) => {
        if (!isHost) return;
        
        try {
            await api.post(`/api/rooms/${roomCode}/remove-participant/`, {
                participant_id: participantId
            });
            // WebSocket will update participants list
        } catch (err) {
            setError('Failed to remove participant');
        }
    };

    const handleMakeSpectator = async (participantId) => {
        if (!isHost) return;
        
        try {
            await api.post(`/api/rooms/${roomCode}/make-spectator/`, {
                participant_id: participantId
            });
            // WebSocket will update participants list
        } catch (err) {
            setError('Failed to make participant spectator');
        }
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
        // You could add a toast notification here
    };

    const connectionStatus = isConnected ? 'Connected' : 'Connecting...';

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-black bg-white mx-auto mb-6" style={{
                        animation: 'spin 1s linear infinite',
                        boxShadow: '4px 4px 0 #000000'
                    }}></div>
                    <p className="text-xl font-bold text-black" style={{
                        fontFamily: 'Space Grotesk, sans-serif'
                    }}>
                        {authLoading ? 'LOADING USER...' : 'LOADING ROOM...'}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="bg-white border-4 border-red-600 p-6 mb-6" style={{
                        boxShadow: '6px 6px 0 #dc2626'
                    }}>
                        <p className="text-red-600 font-bold text-lg" style={{
                            fontFamily: 'Space Grotesk, sans-serif'
                        }}>
                            ⚠ ERROR: {error}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-8 py-4 bg-black text-white border-4 border-black font-bold transform hover:-translate-x-1 hover:-translate-y-1 transition-all"
                        style={{
                            fontFamily: 'Space Grotesk, sans-serif',
                            boxShadow: '4px 4px 0 #e1e1e1'
                        }}
                    >
                        ← BACK TO DASHBOARD
                    </button>
                </div>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl font-bold text-black mb-6" style={{
                        fontFamily: 'Space Grotesk, sans-serif'
                    }}>
                        ROOM NOT FOUND
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-8 py-4 bg-black text-white border-4 border-black font-bold transform hover:-translate-x-1 hover:-translate-y-1 transition-all"
                        style={{
                            fontFamily: 'Space Grotesk, sans-serif',
                            boxShadow: '4px 4px 0 #e1e1e1'
                        }}
                    >
                        ← BACK TO DASHBOARD
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{
            background: 'var(--white-smoke, #f5f5f5)',
            fontFamily: 'var(--font-family-primary, "Inter")'
        }}>
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Brutalist Room Header */}
                <div className="mb-8" style={{
                    background: 'var(--white, #ffffff)',
                    border: 'var(--border-width-3, 3px) solid var(--chinese-black, #141414)',
                    boxShadow: 'var(--drop-shadow-brutalist, 8px 8px 0 var(--chinese-black, #141414))'
                }}>
                    {/* Room Title Section */}
                    <div className="p-6" style={{
                        borderBottom: 'var(--border-width-3, 3px) solid var(--chinese-black, #141414)'
                    }}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16" style={{
                                    background: 'var(--chinese-black, #141414)',
                                    border: 'var(--border-width-3, 3px) solid var(--chinese-black, #141414)',
                                    boxShadow: 'var(--drop-shadow-brutalist-sm, 4px 4px 0 var(--gainsboro, #e1e1e1))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span style={{
                                        fontSize: '2rem',
                                        color: 'var(--white, #ffffff)'
                                    }}>🎯</span>
                                </div>
                                <div>
                                    <h1 style={{
                                        fontFamily: 'var(--font-family-display, "Space Grotesk")',
                                        fontSize: 'var(--font-size-3xl, 30px)',
                                        fontWeight: 'var(--font-weight-black, 900)',
                                        color: 'var(--chinese-black, #141414)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '2px',
                                        lineHeight: '1.2',
                                        margin: 0,
                                        marginBottom: '8px'
                                    }}>
                                        QUESTIFY ROOM
                                    </h1>
                                    <p style={{
                                        fontFamily: 'var(--font-family-secondary, "Inter")',
                                        fontSize: 'var(--font-size-lg, 18px)',
                                        fontWeight: 'var(--font-weight-medium, 500)',
                                        color: 'var(--night-rider, #2e2e2e)',
                                        margin: 0
                                    }}>
                                        {room.title}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Room Code Section */}
                            <div className="text-right">
                                <div className="mb-2">
                                    <span style={{
                                        fontFamily: 'var(--font-family-mono, "JetBrains Mono")',
                                        fontSize: 'var(--font-size-sm, 14px)',
                                        fontWeight: 'var(--font-weight-bold, 700)',
                                        color: 'var(--night-rider, #2e2e2e)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }}>
                                        Room Code:
                                    </span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span style={{
                                        fontFamily: 'var(--font-family-mono, "JetBrains Mono")',
                                        fontSize: 'var(--font-size-2xl, 24px)',
                                        fontWeight: 'var(--font-weight-black, 900)',
                                        color: 'var(--chinese-black, #141414)',
                                        letterSpacing: '3px',
                                        padding: '8px 16px',
                                        background: 'var(--primary-50, #f0f9ff)',
                                        border: 'var(--border-width-2, 2px) solid var(--chinese-black, #141414)',
                                        boxShadow: 'var(--drop-shadow-brutalist-sm, 4px 4px 0 var(--gainsboro, #e1e1e1))'
                                    }}>
                                        {roomCode}
                                    </span>
                                    <button
                                        onClick={copyRoomCode}
                                        style={{
                                            fontFamily: 'var(--font-family-display, "Space Grotesk")',
                                            fontSize: 'var(--font-size-sm, 14px)',
                                            fontWeight: 'var(--font-weight-bold, 700)',
                                            color: 'var(--white, #ffffff)',
                                            background: 'var(--warning-400, #facc15)',
                                            border: 'var(--border-width-3, 3px) solid var(--chinese-black, #141414)',
                                            boxShadow: 'var(--drop-shadow-brutalist-sm, 4px 4px 0 var(--chinese-black, #141414))',
                                            padding: '8px 16px',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            letterSpacing: '1px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'translate(-2px, -2px)';
                                            e.target.style.boxShadow = 'var(--drop-shadow-brutalist-lg, 6px 6px 0 var(--chinese-black, #141414))';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'translate(0, 0)';
                                            e.target.style.boxShadow = 'var(--drop-shadow-brutalist-sm, 4px 4px 0 var(--chinese-black, #141414))';
                                        }}
                                        title="Copy room code"
                                    >
                                        Waiting to start...
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Host Controls */}
                {(isHost || isHostByURL) && (
                    <div className="mb-8" style={{
                        background: 'var(--white, #ffffff)',
                        border: 'var(--border-width-3, 3px) solid var(--chinese-black, #141414)',
                        boxShadow: 'var(--drop-shadow-brutalist, 8px 8px 0 var(--chinese-black, #141414))'
                    }}>
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12" style={{
                                        background: 'var(--chinese-black, #141414)',
                                        border: 'var(--border-width-2, 2px) solid var(--chinese-black, #141414)',
                                        boxShadow: 'var(--drop-shadow-brutalist-sm, 4px 4px 0 var(--gainsboro, #e1e1e1))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <span style={{
                                            fontSize: '1.5rem',
                                            color: 'var(--white, #ffffff)'
                                        }}>👑</span>
                                    </div>
                                    <div>
                                        <h2 style={{
                                            fontFamily: 'var(--font-family-display, "Space Grotesk")',
                                            fontSize: 'var(--font-size-xl, 20px)',
                                            fontWeight: 'var(--font-weight-black, 900)',
                                            color: 'var(--chinese-black, #141414)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            margin: 0,
                                            marginBottom: '4px'
                                        }}>
                                            HOST CONTROLS
                                        </h2>
                                        <p style={{
                                            fontFamily: 'var(--font-family-secondary, "Inter")',
                                            fontSize: 'var(--font-size-sm, 14px)',
                                            fontWeight: 'var(--font-weight-medium, 500)',
                                            color: 'var(--night-rider, #2e2e2e)',
                                            margin: 0
                                        }}>
                                            Make sure all participants have joined before starting the quiz
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleStartQuiz}
                                    disabled={startingQuiz}
                                    style={{
                                        fontFamily: 'var(--font-family-display, "Space Grotesk")',
                                        fontSize: 'var(--font-size-lg, 18px)',
                                        fontWeight: 'var(--font-weight-bold, 700)',
                                        color: startingQuiz ? 'var(--night-rider, #2e2e2e)' : 'var(--white, #ffffff)',
                                        background: startingQuiz ? 'var(--gainsboro, #e1e1e1)' : 'var(--success-500, #22c55e)',
                                        border: 'var(--border-width-3, 3px) solid var(--chinese-black, #141414)',
                                        boxShadow: startingQuiz ? 'none' : 'var(--drop-shadow-brutalist, 8px 8px 0 var(--chinese-black, #141414))',
                                        padding: '12px 24px',
                                        textTransform: 'uppercase',
                                        cursor: startingQuiz ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        letterSpacing: '1px'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!startingQuiz) {
                                            e.target.style.transform = 'translate(-3px, -3px)';
                                            e.target.style.boxShadow = 'var(--drop-shadow-brutalist-lg, 12px 12px 0 var(--chinese-black, #141414))';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!startingQuiz) {
                                            e.target.style.transform = 'translate(0, 0)';
                                            e.target.style.boxShadow = 'var(--drop-shadow-brutalist, 8px 8px 0 var(--chinese-black, #141414))';
                                        }
                                    }}
                                >
                                    {startingQuiz ? 'STARTING...' : '🚀 Start Quiz'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Room Participants */}
                <div style={{
                    background: 'var(--white, #ffffff)',
                    border: 'var(--border-width-3, 3px) solid var(--chinese-black, #141414)',
                    boxShadow: 'var(--drop-shadow-brutalist, 8px 8px 0 var(--chinese-black, #141414))'
                }}>
                    <div style={{
                        padding: '24px',
                        borderBottom: 'var(--border-width-3, 3px) solid var(--chinese-black, #141414)'
                    }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12" style={{
                                    background: 'var(--chinese-black, #141414)',
                                    border: 'var(--border-width-2, 2px) solid var(--chinese-black, #141414)',
                                    boxShadow: 'var(--drop-shadow-brutalist-sm, 4px 4px 0 var(--gainsboro, #e1e1e1))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span style={{
                                        fontSize: '1.5rem',
                                        color: 'var(--white, #ffffff)'
                                    }}>👥</span>
                                </div>
                                <h2 style={{
                                    fontFamily: 'var(--font-family-display, "Space Grotesk")',
                                    fontSize: 'var(--font-size-xl, 20px)',
                                    fontWeight: 'var(--font-weight-black, 900)',
                                    color: 'var(--chinese-black, #141414)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    margin: 0
                                }}>
                                    ROOM PARTICIPANTS
                                </h2>
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-family-mono, "JetBrains Mono")',
                                fontSize: 'var(--font-size-sm, 14px)',
                                fontWeight: 'var(--font-weight-bold, 700)',
                                color: 'var(--white, #ffffff)',
                                background: 'var(--primary-500, #3b82f6)',
                                border: 'var(--border-width-2, 2px) solid var(--chinese-black, #141414)',
                                boxShadow: 'var(--drop-shadow-brutalist-sm, 4px 4px 0 var(--chinese-black, #141414))',
                                padding: '6px 12px',
                                borderRadius: '50px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                {participants.length} Total
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        {participants.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 mx-auto mb-4" style={{
                                    background: 'var(--gainsboro, #e1e1e1)',
                                    border: 'var(--border-width-3, 3px) solid var(--chinese-black, #141414)',
                                    boxShadow: 'var(--drop-shadow-brutalist-sm, 4px 4px 0 var(--night-rider, #2e2e2e))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span style={{ fontSize: '2rem' }}>📱</span>
                                </div>
                                <h3 style={{
                                    fontFamily: 'var(--font-family-display, "Space Grotesk")',
                                    fontSize: 'var(--font-size-lg, 18px)',
                                    fontWeight: 'var(--font-weight-bold, 700)',
                                    color: 'var(--chinese-black, #141414)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    margin: 0,
                                    marginBottom: '8px'
                                }}>
                                    NO PARTICIPANTS YET
                                </h3>
                                <p style={{
                                    fontFamily: 'var(--font-family-secondary, "Inter")',
                                    fontSize: 'var(--font-size-sm, 14px)',
                                    fontWeight: 'var(--font-weight-medium, 500)',
                                    color: 'var(--night-rider, #2e2e2e)',
                                    margin: 0
                                }}>
                                    Share the room code with friends to join
                                </p>
                                {/* Debug Info */}
                                {process.env.NODE_ENV === 'development' && (
                                    <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
                                        Debug: Connected: {isConnected.toString()}, Participants: {JSON.stringify(participants)}
                                    </div>
                                )}
                                <div className="mt-6 flex justify-center space-x-8">
                                    <div className="text-center">
                                        <div className="w-16 h-16 mx-auto mb-2" style={{
                                            background: 'var(--gainsboro, #e1e1e1)',
                                            border: 'var(--border-width-2, 2px) solid var(--chinese-black, #141414)',
                                            boxShadow: 'var(--drop-shadow-brutalist-sm, 4px 4px 0 var(--night-rider, #2e2e2e))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <span style={{ fontSize: '1.5rem' }}>📋</span>
                                        </div>
                                        <span style={{
                                            fontFamily: 'var(--font-family-secondary, "Inter")',
                                            fontSize: 'var(--font-size-xs, 12px)',
                                            fontWeight: 'var(--font-weight-medium, 500)',
                                            color: 'var(--night-rider, #2e2e2e)'
                                        }}>
                                            Share the room code with friends to join
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-16 h-16 mx-auto mb-2" style={{
                                            background: 'var(--gainsboro, #e1e1e1)',
                                            border: 'var(--border-width-2, 2px) solid var(--chinese-black, #141414)',
                                            boxShadow: 'var(--drop-shadow-brutalist-sm, 4px 4px 0 var(--night-rider, #2e2e2e))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <span style={{ fontSize: '1.5rem' }}>🚀</span>
                                        </div>
                                        <span style={{
                                            fontFamily: 'var(--font-family-secondary, "Inter")',
                                            fontSize: 'var(--font-size-xs, 12px)',
                                            fontWeight: 'var(--font-weight-medium, 500)',
                                            color: 'var(--night-rider, #2e2e2e)'
                                        }}>
                                            Host can start the quiz when ready
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-16 h-16 mx-auto mb-2" style={{
                                            background: 'var(--gainsboro, #e1e1e1)',
                                            border: 'var(--border-width-2, 2px) solid var(--chinese-black, #141414)',
                                            boxShadow: 'var(--drop-shadow-brutalist-sm, 4px 4px 0 var(--night-rider, #2e2e2e))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <span style={{ fontSize: '1.5rem' }}>🏆</span>
                                        </div>
                                        <span style={{
                                            fontFamily: 'var(--font-family-secondary, "Inter")',
                                            fontSize: 'var(--font-size-xs, 12px)',
                                            fontWeight: 'var(--font-weight-medium, 500)',
                                            color: 'var(--night-rider, #2e2e2e)'
                                        }}>
                                            Compete in real-time for the top score
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Hosts Section */}
                                <div>
                                    <div className="flex items-center space-x-2 mb-3">
                                        <div className="w-8 h-8" style={{
                                            background: 'var(--warning-400, #facc15)',
                                            border: 'var(--border-width-2, 2px) solid var(--chinese-black, #141414)',
                                            boxShadow: 'var(--drop-shadow-brutalist-sm, 2px 2px 0 var(--chinese-black, #141414))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <span style={{ fontSize: '1rem' }}>👑</span>
                                        </div>
                                        <span style={{
                                            fontFamily: 'var(--font-family-display, "Space Grotesk")',
                                            fontSize: 'var(--font-size-sm, 14px)',
                                            fontWeight: 'var(--font-weight-bold, 700)',
                                            color: 'var(--chinese-black, #141414)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px'
                                        }}>
                                            Hosts
                                        </span>
                                        <div style={{
                                            fontFamily: 'var(--font-family-mono, "JetBrains Mono")',
                                            fontSize: 'var(--font-size-xs, 11px)',
                                            fontWeight: 'var(--font-weight-bold, 700)',
                                            color: 'var(--white, #ffffff)',
                                            background: 'var(--warning-500, #f59e0b)',
                                            border: 'var(--border-width-1, 1px) solid var(--chinese-black, #141414)',
                                            padding: '2px 8px',
                                            borderRadius: '50px',
                                            textTransform: 'uppercase'
                                        }}>
                                            (1)
                                        </div>
                                    </div>
                                    {participants.filter(p => p.is_host).map((participant) => (
                                        <div key={participant.id} className="mb-3" style={{
                                            background: 'var(--warning-50, #fffbeb)',
                                            border: 'var(--border-width-2, 2px) solid var(--chinese-black, #141414)',
                                            boxShadow: 'var(--drop-shadow-brutalist-sm, 4px 4px 0 var(--chinese-black, #141414))',
                                            padding: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div className="flex items-center space-x-3">
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    background: 'var(--warning-400, #facc15)',
                                                    border: 'var(--border-width-2, 2px) solid var(--chinese-black, #141414)',
                                                    boxShadow: 'var(--drop-shadow-brutalist-sm, 2px 2px 0 var(--chinese-black, #141414))',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontFamily: 'var(--font-family-display, "Space Grotesk")',
                                                    fontSize: 'var(--font-size-lg, 18px)',
                                                    fontWeight: 'var(--font-weight-black, 900)',
                                                    color: 'var(--chinese-black, #141414)'
                                                }}>
                                                    {getParticipantInitial(participant)}
                                                </div>
                                                <div>
                                                    <div style={{
                                                        fontFamily: 'var(--font-family-display, "Space Grotesk")',
                                                        fontSize: 'var(--font-size-base, 16px)',
                                                        fontWeight: 'var(--font-weight-bold, 700)',
                                                        color: 'var(--chinese-black, #141414)',
                                                        margin: 0,
                                                        marginBottom: '2px'
                                                    }}>
                                                        {getParticipantName(participant)}
                                                    </div>
                                                    <div style={{
                                                        fontFamily: 'var(--font-family-mono, "JetBrains Mono")',
                                                        fontSize: 'var(--font-size-xs, 11px)',
                                                        fontWeight: 'var(--font-weight-bold, 700)',
                                                        color: 'var(--night-rider, #2e2e2e)',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px',
                                                        margin: 0
                                                    }}>
                                                        ROOM HOST
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{
                                                fontFamily: 'var(--font-family-mono, "JetBrains Mono")',
                                                fontSize: 'var(--font-size-xs, 11px)',
                                                fontWeight: 'var(--font-weight-bold, 700)',
                                                color: 'var(--success-600, #16a34a)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                Online
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Participants Section */}
                                {participants.filter(p => !p.is_host).length > 0 && (
                                    <div>
                                        <div className="flex items-center space-x-2 mb-3">
                                            <div className="w-8 h-8" style={{
                                                background: 'var(--primary-400, #60a5fa)',
                                                border: 'var(--border-width-2, 2px) solid var(--chinese-black, #141414)',
                                                boxShadow: 'var(--drop-shadow-brutalist-sm, 2px 2px 0 var(--chinese-black, #141414))',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <span style={{ fontSize: '1rem' }}>👤</span>
                                            </div>
                                            <span style={{
                                                fontFamily: 'var(--font-family-display, "Space Grotesk")',
                                                fontSize: 'var(--font-size-sm, 14px)',
                                                fontWeight: 'var(--font-weight-bold, 700)',
                                                color: 'var(--chinese-black, #141414)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px'
                                            }}>
                                                Participants
                                            </span>
                                            <div style={{
                                                fontFamily: 'var(--font-family-mono, "JetBrains Mono")',
                                                fontSize: 'var(--font-size-xs, 11px)',
                                                fontWeight: 'var(--font-weight-bold, 700)',
                                                color: 'var(--white, #ffffff)',
                                                background: 'var(--primary-500, #3b82f6)',
                                                border: 'var(--border-width-1, 1px) solid var(--chinese-black, #141414)',
                                                padding: '2px 8px',
                                                borderRadius: '50px',
                                                textTransform: 'uppercase'
                                            }}>
                                                ({participants.filter(p => !p.is_host).length})
                                            </div>
                                        </div>
                                        {participants.filter(p => !p.is_host).map((participant) => (
                                            <div key={participant.id} className="mb-3" style={{
                                                background: 'var(--primary-50, #eff6ff)',
                                                border: 'var(--border-width-2, 2px) solid var(--chinese-black, #141414)',
                                                boxShadow: 'var(--drop-shadow-brutalist-sm, 4px 4px 0 var(--chinese-black, #141414))',
                                                padding: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}>
                                                <div className="flex items-center space-x-3">
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        background: 'var(--primary-400, #60a5fa)',
                                                        border: 'var(--border-width-2, 2px) solid var(--chinese-black, #141414)',
                                                        boxShadow: 'var(--drop-shadow-brutalist-sm, 2px 2px 0 var(--chinese-black, #141414))',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontFamily: 'var(--font-family-display, "Space Grotesk")',
                                                        fontSize: 'var(--font-size-lg, 18px)',
                                                        fontWeight: 'var(--font-weight-black, 900)',
                                                        color: 'var(--chinese-black, #141414)'
                                                    }}>
                                                        {getParticipantInitial(participant)}
                                                    </div>
                                                    <div>
                                                        <div style={{
                                                            fontFamily: 'var(--font-family-display, "Space Grotesk")',
                                                            fontSize: 'var(--font-size-base, 16px)',
                                                            fontWeight: 'var(--font-weight-bold, 700)',
                                                            color: 'var(--chinese-black, #141414)',
                                                            margin: 0,
                                                            marginBottom: '2px'
                                                        }}>
                                                            {getParticipantName(participant)}
                                                        </div>
                                                        <div style={{
                                                            fontFamily: 'var(--font-family-mono, "JetBrains Mono")',
                                                            fontSize: 'var(--font-size-xs, 11px)',
                                                            fontWeight: 'var(--font-weight-bold, 700)',
                                                            color: 'var(--night-rider, #2e2e2e)',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px',
                                                            margin: 0
                                                        }}>
                                                            PLAYER
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    fontFamily: 'var(--font-family-mono, "JetBrains Mono")',
                                                    fontSize: 'var(--font-size-xs, 11px)',
                                                    fontWeight: 'var(--font-weight-bold, 700)',
                                                    color: 'var(--success-600, #16a34a)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    Online
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Debug info for troubleshooting */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-500 mt-2 text-center">
                        Debug: isHost={isHost.toString()}, user.id={user?.id}, room.creator={room?.creator}, loading={loading.toString()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomLobbyPage;
