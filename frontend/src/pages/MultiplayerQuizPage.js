import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import socketIOService from '../services/socketService';

const MultiplayerQuizPage = () => {
  const { roomCode } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // State variables
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [initialTime, setInitialTime] = useState(30); // FIXED: Track initial timer duration
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [hosts, setHosts] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [waitingForQuiz, setWaitingForQuiz] = useState(true); // Changed back to true so users must come from lobby
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [showNextButton, setShowNextButton] = useState(false);
  const [startingQuiz, setStartingQuiz] = useState(false);

  // Connect to room and listen for quiz state when component mounts
  useEffect(() => {
    if (socketIOService.socket && roomCode && user) {
      console.log('🎯 Quiz page loaded, connecting to room...');
      
      // Connect to room first
      socketIOService.joinRoom(roomCode, user.id.toString(), user.username || user.email)
        .then(() => {
          console.log('✅ Connected to room, waiting for quiz to start...');
          // Request current quiz state
          socketIOService.socket.emit('get_quiz_state', {
            room_code: roomCode,
            user_id: user.id.toString()
          });
        })
        .catch((error) => {
          console.error('❌ Error connecting to room:', error);
        });
    }
  }, [roomCode, user]);

  // Handle answer submission
  const handleSubmit = useCallback(() => {
    if (!submitted && selectedOption !== null && !isHost) {
      setSubmitted(true);
      socketIOService.socket?.emit('submit_answer', {
        room_code: roomCode,
        user_id: user.id.toString(),
        answer: selectedOption
      });
    }
  }, [submitted, selectedOption, isHost, roomCode, user]);

  // Handle start quiz
  const handleStartQuiz = () => {
    if (socketIOService.socket && roomCode && user && isHost && !startingQuiz) {
      setStartingQuiz(true);
      console.log('Starting quiz...', { roomCode, userId: user.id });
      
      socketIOService.socket.emit('start_quiz', {
        room_code: roomCode,
        user_id: user.id.toString()
      });
    }
  };

  // FIXED: Calculate timer percentage properly
  const timerPercent = initialTime > 0 ? (timeRemaining / initialTime) * 100 : 0;

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && currentQuestion && !submitted && timerEnabled) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !submitted && timerEnabled) {
      handleSubmit();
    }
  }, [timeRemaining, currentQuestion, submitted, timerEnabled, handleSubmit]);

  // Socket.IO event handlers
  useEffect(() => {
    if (!socketIOService.socket || !user) return;

    const handleInit = (data) => {
      console.log('🎯 Init event received:', data);
      // Update both hosts and participants properly
      setHosts(data.hosts || []);
      setParticipants(data.participants || []);
      console.log('📋 Updated hosts:', data.hosts);
      console.log('👥 Updated participants:', data.participants);
      
      if (data.state) {
        if (data.state.type === 'question') {
          setCurrentQuestion(data.state.problem);
          setCurrentQuestionIndex(data.state.current_index);
          setTotalQuestions(data.state.total_problems);
          const duration = data.state.problem.timer_duration || 30;
          setTimeRemaining(duration);
          setInitialTime(duration); // FIXED: Set initial time
          setWaitingForQuiz(false);
        }
      }
      
      // Check if current user is host
      const allUsers = [...(data.hosts || []), ...(data.participants || [])];
      const currentUser = allUsers.find(u => 
        u.id === user.id.toString() || 
        u.user_id === user.id.toString() ||
        parseInt(u.id) === user.id ||
        parseInt(u.user_id) === user.id
      );
      setIsHost(currentUser?.is_host || false);
      console.log('👑 User is host:', currentUser?.is_host || false);
    };

    const handleUserJoined = (data) => {
      console.log('🚀 User joined event received:', data);
      // Always update both lists with force re-render
      setHosts(prevHosts => {
        console.log('Previous hosts:', prevHosts);
        console.log('New hosts:', data.hosts);
        return [...(data.hosts || [])];
      });
      setParticipants(prevParticipants => {
        console.log('Previous participants:', prevParticipants);
        console.log('New participants:', data.participants);
        return [...(data.participants || [])];
      });
    };

    const handleProblem = (data) => {
      console.log('❓ Problem event received:', data);
      setCurrentQuestion(data.problem);
      setCurrentQuestionIndex(data.current_index);
      setTotalQuestions(data.total_problems);
      const duration = data.problem.timer_duration || 30;
      setTimeRemaining(duration);
      setInitialTime(duration); // FIXED: Set initial time for new question
      setSelectedOption(null);
      setSubmitted(false);
      setWaitingForQuiz(false);
      setShowLeaderboard(false);
      setStartingQuiz(false);
    };

    const handleHostProblemData = (data) => {
      console.log('👑 Host problem data received:', data);
      setCurrentQuestion(data.problem);
      setCorrectAnswer(data.problem.correct_answer);
      setCurrentQuestionIndex(data.current_index);
      setTotalQuestions(data.total_problems);
    };

    const handleTimerStarted = (data) => {
      console.log('⏱️ Timer started:', data);
      const duration = data.duration || 30;
      setTimeRemaining(duration);
      setInitialTime(duration); // FIXED: Set initial time when timer starts
      setTimerEnabled(true);
      setShowNextButton(false);
    };

    const handleShowNextButton = (data) => {
      console.log('➡️ Show next button:', data);
      setShowNextButton(true);
      setTimerEnabled(false);
    };

    const handleQuizStarted = (data) => {
      console.log('🎮 Quiz started event received:', data);
      setWaitingForQuiz(false);
      setStartingQuiz(false);
    };

    const handleStartQuizSuccess = (data) => {
      console.log('✅ Start quiz success:', data);
      setStartingQuiz(false);
    };

    const handleStartQuizError = (data) => {
      console.error('❌ Start quiz error:', data);
      setStartingQuiz(false);
      alert(`Failed to start quiz: ${data.message}`);
    };

    const handleLeaderboard = (data) => {
      console.log('🏆 Leaderboard event received:', data);
      setLeaderboard(data.leaderboard);
      setShowLeaderboard(true);
      
      if (data.leaderboard) {
        const updatedParticipants = participants.map(participant => {
          const leaderboardEntry = data.leaderboard.find(entry => entry.user_id === participant.id);
          return {
            ...participant,
            points: leaderboardEntry ? leaderboardEntry.points : participant.points
          };
        });
        setParticipants(updatedParticipants);
      }
    };

    const handleQuizEnded = (data) => {
      console.log('🏁 Quiz ended:', data);
      setQuizEnded(true);
      setLeaderboard(data.final_leaderboard);
      setShowLeaderboard(true);
    };

    const handleScoreUpdate = (data) => {
      console.log('📊 Score update:', data);
      const updatedParticipants = participants.map(participant => 
        participant.id === data.user_id 
          ? { ...participant, points: data.points }
          : participant
      );
      setParticipants(updatedParticipants);
    };

    // Register event listeners
    socketIOService.socket.on('init', handleInit);
    socketIOService.socket.on('user_joined', handleUserJoined);
    socketIOService.socket.on('problem', handleProblem);
    socketIOService.socket.on('host_problem_data', handleHostProblemData);
    socketIOService.socket.on('timer_started', handleTimerStarted);
    socketIOService.socket.on('show_next_button', handleShowNextButton);
    socketIOService.socket.on('quiz_started', handleQuizStarted);
    socketIOService.socket.on('start_quiz_success', handleStartQuizSuccess);
    socketIOService.socket.on('start_quiz_error', handleStartQuizError);
    socketIOService.socket.on('leaderboard', handleLeaderboard);
    socketIOService.socket.on('quiz_ended', handleQuizEnded);
    socketIOService.socket.on('score_update', handleScoreUpdate);

    // Don't join room here since user should already be in room from lobby
    // The socket connection should already be established from RoomLobbyPage
    console.log('🔗 Quiz page loaded, using existing room connection...', { roomCode, userId: user.id });

    // Cleanup
    return () => {
      socketIOService.socket?.off('init', handleInit);
      socketIOService.socket?.off('user_joined', handleUserJoined);
      socketIOService.socket?.off('problem', handleProblem);
      socketIOService.socket?.off('host_problem_data', handleHostProblemData);
      socketIOService.socket?.off('timer_started', handleTimerStarted);
      socketIOService.socket?.off('show_next_button', handleShowNextButton);
      socketIOService.socket?.off('quiz_started', handleQuizStarted);
      socketIOService.socket?.off('start_quiz_success', handleStartQuizSuccess);
      socketIOService.socket?.off('start_quiz_error', handleStartQuizError);
      socketIOService.socket?.off('leaderboard', handleLeaderboard);
      socketIOService.socket?.off('quiz_ended', handleQuizEnded);
      socketIOService.socket?.off('score_update', handleScoreUpdate);
    };
  }, [user, roomCode, participants]);

  // Handle option selection
  const handleOptionSelect = (optionIndex) => {
    if (!submitted && !isHost) {
      setSelectedOption(optionIndex);
    }
  };

  // Handle manual next question (for hosts)
  const handleNextQuestion = () => {
    if (socketIOService.socket && roomCode && user && isHost) {
      socketIOService.socket.emit('next_question', {
        room_code: roomCode,
        user_id: user.id.toString()
      });
    }
  };

  if (waitingForQuiz || startingQuiz) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--white-smoke, #f5f5f5)',
        fontFamily: 'var(--font-family-primary, "Inter")'
      }}>
        <div style={{
          background: 'var(--white, #ffffff)',
          border: 'var(--border-width-3, 3px) solid var(--chinese-black, #141414)',
          boxShadow: 'var(--drop-shadow-brutalist, 8px 8px 0 var(--chinese-black, #141414))',
          padding: '48px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '24px'
          }}>🎯</div>
          <h1 style={{
            fontFamily: 'var(--font-family-display, "Space Grotesk")',
            fontSize: 'var(--font-size-2xl, 24px)',
            fontWeight: 'var(--font-weight-black, 900)',
            color: 'var(--chinese-black, #141414)',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            margin: '0 0 16px 0'
          }}>
            {startingQuiz ? 'Starting Quiz...' : 'Waiting for Quiz to Start'}
          </h1>
          <p style={{
            fontFamily: 'var(--font-family-secondary, "Inter")',
            fontSize: 'var(--font-size-base, 16px)',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'var(--night-rider, #2e2e2e)',
            margin: '0 0 16px 0'
          }}>
            Room Code: <strong>{roomCode}</strong>
          </p>
          <p style={{
            fontFamily: 'var(--font-family-secondary, "Inter")',
            fontSize: 'var(--font-size-sm, 14px)',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'var(--night-rider, #2e2e2e)',
            margin: '0 0 24px 0'
          }}>
            The quiz will begin when the host starts it from the lobby.
          </p>
          <button
            onClick={() => navigate(`/room/${roomCode}/lobby`)}
            style={{
              background: 'var(--primary-500, #3b82f6)',
              color: 'var(--white, #ffffff)',
              border: 'var(--border-width-2, 2px) solid var(--chinese-black, #141414)',
              padding: '12px 24px',
              fontSize: 'var(--font-size-base, 16px)',
              fontWeight: 'var(--font-weight-bold, 700)',
              borderRadius: '0',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '24px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translate(-2px, -2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translate(0, 0)'}
          >
            Go to Lobby
          </button>
          <div style={{
            width: '100%',
            height: '4px',
            background: 'var(--gainsboro, #e1e1e1)',
            border: 'var(--border-width-2, 2px) solid var(--chinese-black, #141414)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '50%',
              height: '100%',
              background: 'var(--success-500, #22c55e)',
              animation: 'loading 2s ease-in-out infinite'
            }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (quizEnded) {
    return (
      <div style={styles.container}>
        <div style={styles.endContainer}>
          <h2 style={styles.title}>Quiz Completed!</h2>
          <div style={styles.leaderboardContainer}>
            <h3 style={styles.subtitle}>Final Results</h3>
            {leaderboard.map((entry, index) => (
              <div key={entry.user_id} style={{
                ...styles.leaderboardEntry,
                backgroundColor: index < 3 ? '#f8f9fa' : '#fff',
                border: index < 3 ? '2px solid #28a745' : '1px solid #dee2e6'
              }}>
                <span style={styles.rank}>
                  {index === 0 && '🏆'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${entry.rank}`}
                </span>
                <span style={styles.name}>{entry.name}</span>
                <span style={styles.points}>{entry.points} pts</span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={styles.backButton}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (showLeaderboard) {
    return (
      <div style={styles.container}>
        <div style={styles.leaderboardDisplay}>
          <h2 style={styles.title}>Question {currentQuestionIndex} Results</h2>
          <div style={styles.leaderboardContainer}>
            {leaderboard.map((entry, index) => (
              <div key={entry.user_id} style={{
                ...styles.leaderboardEntry,
                backgroundColor: index < 3 ? '#f8f9fa' : '#fff',
                border: index < 3 ? '2px solid #28a745' : '1px solid #dee2e6'
              }}>
                <span style={styles.rank}>
                  {index === 0 && '🏆'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${entry.rank}`}
                </span>
                <span style={styles.name}>{entry.name}</span>
                <span style={styles.points}>{entry.points} pts</span>
              </div>
            ))}
          </div>
          <p style={styles.nextQuestionText}>Next question starting soon...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {isHost ? (
        // HOST VIEW
        <div style={styles.hostDashboard}>
          <div style={styles.hostHeader}>
            <h2 style={styles.title}>Host Dashboard - Question {currentQuestionIndex + 1} of {totalQuestions}</h2>
            <div style={styles.roomInfo}>
              <span style={styles.roomCode}>Room: {roomCode}</span>
              {timerEnabled ? (
                <span style={styles.timer}>⏱️ {timeRemaining}s</span>
              ) : (
                showNextButton && (
                  <button 
                    style={styles.nextButton}
                    onClick={handleNextQuestion}
                  >
                    Next Question →
                  </button>
                )
              )}
            </div>
          </div>
          
          {/* FIXED: Timer Progress Bar for Host */}
          <div style={styles.timerProgressContainer}>
            <div style={styles.timerProgressBar}>
              <div 
                style={{
                  ...styles.timerProgressFill,
                  width: `${Math.max(0, timerPercent)}%`,
                  backgroundColor: timerPercent > 30 ? '#28a745' : timerPercent > 10 ? '#ffc107' : '#dc3545'
                }}
              />
            </div>
            <div style={styles.timerText}>
              ⏱️ {timeRemaining}s remaining of {initialTime}s
            </div>
          </div>
          
          <div style={styles.hostContent}>
            <div style={styles.currentQuestion}>
              <h3 style={styles.questionTitle}>{currentQuestion?.question_text || currentQuestion?.title}</h3>
              
              <div style={styles.optionsHost}>
                {currentQuestion?.options?.map((option, index) => (
                  <div 
                    key={index}
                    style={{
                      ...styles.optionHost,
                      ...(correctAnswer === index ? styles.correctAnswer : {})
                    }}
                  >
                    <span style={styles.optionLetter}>{String.fromCharCode(65 + index)}.</span>
                    <span style={styles.optionText}>{option.title || option}</span>
                    {correctAnswer === index && (
                      <span style={styles.correctBadge}>✓ Correct</span>
                    )}
                  </div>
                ))}
              </div>
              
              <div style={styles.questionDetails}>
                <p><strong>Type:</strong> {currentQuestion?.type || 'Multiple Choice'}</p>
                <p><strong>Points:</strong> {currentQuestion?.points || 1000}</p>
                <p><strong>Timer:</strong> {initialTime}s</p>
              </div>
            </div>

            <div style={styles.participantActivity}>
              <h3 style={styles.subtitle}>Participant Activity</h3>
              <div style={styles.activityStats}>
                <p>Answered: 0 / {participants.length}</p>
                <p>Response Rate: 0%</p>
              </div>
              
              <div style={styles.participantScores}>
                {participants.filter(participant => 
                  participant.id !== user?.id && participant.user_id !== user?.id
                ).map((participant) => (
                  <div key={participant.id || participant.user_id} style={styles.participantScore}>
                    <div style={styles.participantInfo}>
                      <span style={styles.participantName}>
                        {participant.display_name || participant.name || participant.username}
                      </span>
                      <span style={styles.participantStatus}>🤔 Thinking...</span>
                    </div>
                    <div style={styles.participantPoints}>
                      {participant.points || 0} pts
                      <span style={styles.totalScore}>Total Score</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // PARTICIPANT VIEW
        <div style={styles.participantView}>
          <div style={styles.quizHeader}>
            <h2 style={styles.title}>Question {currentQuestionIndex + 1} of {totalQuestions}</h2>
            <div style={styles.timerDisplay}>⏱️ {timeRemaining}s</div>
          </div>

          {/* FIXED: Timer Progress Bar for Participants */}
          <div style={styles.timerProgressContainer}>
            <div style={styles.timerProgressBar}>
              <div 
                style={{
                  ...styles.timerProgressFill,
                  width: `${Math.max(0, timerPercent)}%`,
                  backgroundColor: timerPercent > 30 ? '#28a745' : timerPercent > 10 ? '#ffc107' : '#dc3545'
                }}
              />
            </div>
            <div style={styles.timerText}>
              ⏱️ {timeRemaining}s remaining of {initialTime}s
            </div>
          </div>

          <div style={styles.questionContainer}>
            <h3 style={styles.questionTitle}>{currentQuestion?.question_text || currentQuestion?.title}</h3>
            
            <div style={styles.options}>
              {currentQuestion?.options?.map((option, index) => (
                <button
                  key={index}
                  style={{
                    ...styles.option,
                    ...(selectedOption === index ? styles.optionSelected : {}),
                    ...(submitted ? styles.optionDisabled : {})
                  }}
                  onClick={() => handleOptionSelect(index)}
                  disabled={submitted}
                >
                  <span style={styles.optionLetter}>{String.fromCharCode(65 + index)}</span>
                  <span style={styles.optionText}>{option.title || option}</span>
                </button>
              ))}
            </div>

            {selectedOption !== null && !submitted && (
              <button style={styles.submitBtn} onClick={handleSubmit}>
                Submit Answer
              </button>
            )}

            {submitted && (
              <div style={styles.submittedMessage}>
                ✅ Answer submitted! Waiting for other participants...
              </div>
            )}
          </div>

          <div style={styles.participantInfo}>
            <h4>Room: {roomCode}</h4>
            <p>Participants: {participants.length + hosts.length}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// REDESIGNED STYLES WITH NEW LOBBY LAYOUT
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  
  // NEW LOBBY STYLES
  lobbyContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  
  lobbyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '25px 35px',
    borderRadius: '20px',
    marginBottom: '30px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)'
  },
  
  lobbyTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  
  mainTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0
  },
  
  roomCodeBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#667eea',
    padding: '12px 20px',
    borderRadius: '12px',
    color: 'white'
  },
  
  roomCodeLabel: {
    fontSize: '12px',
    opacity: 0.8,
    marginBottom: '4px'
  },
  
  roomCodeValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    letterSpacing: '2px'
  },
  
  lobbyStatus: {
    display: 'flex',
    alignItems: 'center'
  },
  
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#ffc107',
    padding: '12px 20px',
    borderRadius: '12px',
    color: '#333'
  },
  
  statusIcon: {
    fontSize: '20px'
  },
  
  statusText: {
    fontWeight: 'bold'
  },
  
  hostControlsLobby: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '25px',
    borderRadius: '20px',
    marginBottom: '30px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)'
  },
  
  hostControlsContent: {
    textAlign: 'center'
  },
  
  hostControlsTitle: {
    color: '#333',
    marginBottom: '20px',
    fontSize: '24px'
  },
  
  startQuizButtonLobby: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '18px 40px',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '10px',
    transition: 'all 0.3s ease',
    boxShadow: '0 6px 20px rgba(40, 167, 69, 0.4)',
    transform: 'translateY(0)'
  },
  
  startQuizButtonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
    opacity: 0.7,
    transform: 'none',
    boxShadow: 'none'
  },
  
  hostInstructionsLobby: {
    margin: '15px 0 0 0',
    color: '#666',
    fontStyle: 'italic',
    fontSize: '16px'
  },
  
  participantsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)'
  },
  
  participantsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    paddingBottom: '15px',
    borderBottom: '2px solid #eee'
  },
  
  participantsTitle: {
    fontSize: '28px',
    color: '#333',
    margin: 0
  },
  
  participantsCount: {
    display: 'flex',
    alignItems: 'center'
  },
  
  countBadge: {
    backgroundColor: '#667eea',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  
  participantsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    marginBottom: '30px'
  },
  
  participantsColumn: {
    backgroundColor: '#f8f9fa',
    borderRadius: '15px',
    padding: '20px',
    minHeight: '300px'
  },
  
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '2px solid #dee2e6'
  },
  
  columnIcon: {
    fontSize: '24px'
  },
  
  columnTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    flex: 1
  },
  
  columnCount: {
    backgroundColor: '#667eea',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  
  participantsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  
  participantCardHost: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: '#fff3cd',
    padding: '15px',
    borderRadius: '12px',
    border: '2px solid #ffeaa7',
    transition: 'all 0.3s ease'
  },
  
  participantCardUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: '#d1ecf1',
    padding: '15px',
    borderRadius: '12px',
    border: '2px solid #bee5eb',
    transition: 'all 0.3s ease'
  },
  
  participantAvatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px'
  },
  
  participantInfo: {
    flex: 1
  },
  
  participantName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '4px'
  },
  
  participantRole: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  
  participantStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#28a745'
  },
  
  statusLabel: {
    fontSize: '12px',
    color: '#28a745',
    fontWeight: 'bold'
  },
  
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    color: '#999',
    textAlign: 'center'
  },
  
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '10px',
    opacity: 0.5
  },
  
  emptyText: {
    fontSize: '16px',
    fontStyle: 'italic'
  },
  
  roomInstructions: {
    display: 'flex',
    justifyContent: 'space-around',
    gap: '20px',
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '15px'
  },
  
  instructionItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    textAlign: 'center',
    flex: 1
  },
  
  instructionIcon: {
    fontSize: '32px'
  },
  
  instructionText: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.4'
  },

  // EXISTING STYLES (keeping the rest as is)
  title: {
    color: '#333',
    marginBottom: '20px'
  },
  subtitle: {
    color: '#555',
    marginBottom: '15px'
  },
  
  // FIXED Timer Progress Bar Styles
  timerProgressContainer: {
    margin: '20px 0',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #dee2e6',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  timerProgressBar: {
    width: '100%',
    height: '16px',
    backgroundColor: '#e9ecef',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '12px',
    position: 'relative'
  },
  timerProgressFill: {
    height: '100%',
    transition: 'width 1s linear, background-color 0.3s ease',
    borderRadius: '8px',
    position: 'relative'
  },
  timerText: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#495057',
    fontWeight: 'bold'
  },
  hostDashboard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '20px'
  },
  hostHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #dee2e6'
  },
  roomInfo: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center'
  },
  roomCode: {
    fontWeight: 'bold',
    color: '#495057'
  },
  timer: {
    color: '#dc3545',
    fontWeight: 'bold',
    fontSize: '18px'
  },
  nextButton: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  hostContent: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px'
  },
  currentQuestion: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #dee2e6'
  },
  questionTitle: {
    color: '#333',
    marginBottom: '15px'
  },
  optionsHost: {
    marginBottom: '20px'
  },
  optionHost: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    margin: '8px 0',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '6px'
  },
  correctAnswer: {
    backgroundColor: '#d4edda',
    border: '2px solid #28a745',
    color: '#155724'
  },
  optionLetter: {
    fontWeight: 'bold',
    marginRight: '10px',
    minWidth: '25px'
  },
  optionText: {
    flex: 1
  },
  correctBadge: {
    marginLeft: '10px',
    color: '#28a745',
    fontWeight: 'bold'
  },
  questionDetails: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '6px',
    color: '#666'
  },
  participantActivity: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #dee2e6'
  },
  activityStats: {
    marginBottom: '15px',
    color: '#666'
  },
  participantScores: {
    maxHeight: '400px',
    overflowY: 'auto'
  },
  participantScore: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    margin: '8px 0',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '6px'
  },
  participantPoints: {
    textAlign: 'right'
  },
  totalScore: {
    fontSize: '12px',
    color: '#666',
    display: 'block'
  },
  participantView: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #dee2e6'
  },
  quizHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #dee2e6'
  },
  timerDisplay: {
    color: '#dc3545',
    fontWeight: 'bold',
    fontSize: '18px'
  },
  questionContainer: {
    marginBottom: '20px'
  },
  options: {
    marginTop: '20px'
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '15px',
    margin: '10px 0',
    backgroundColor: '#f8f9fa',
    border: '2px solid #dee2e6',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    textAlign: 'left'
  },
  optionSelected: {
    backgroundColor: '#d1ecf1',
    border: '2px solid #17a2b8'
  },
  optionDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  submitBtn: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '12px 30px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '20px'
  },
  submittedMessage: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '15px',
    borderRadius: '6px',
    marginTop: '20px',
    textAlign: 'center'
  },
  endContainer: {
    textAlign: 'center',
    padding: '40px 20px'
  },
  leaderboardContainer: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginTop: '20px'
  },
  leaderboardEntry: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    margin: '8px 0',
    borderRadius: '6px'
  },
  rank: {
    fontWeight: 'bold',
    minWidth: '40px'
  },
  name: {
    flex: 1,
    textAlign: 'left',
    marginLeft: '15px'
  },
  points: {
    fontWeight: 'bold',
    color: '#28a745'
  },
  backButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '12px 30px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '30px'
  },
  leaderboardDisplay: {
    textAlign: 'center',
    padding: '40px 20px'
  },
  nextQuestionText: {
    marginTop: '20px',
    color: '#666',
    fontStyle: 'italic'
  }
};

export default MultiplayerQuizPage;

// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { api } from '../api/axiosConfig';
// import socketIOService from '../services/socketService';

// const MultiplayerQuizPage = () => {
//   const { roomId, roomCode } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user } = useAuth();
  
//   // Use roomCode if available, otherwise use roomId (for backward compatibility)
//   const currentRoomCode = roomCode || roomId;
  
//   // Get display name from navigation state or use user info
//   const displayName = location.state?.displayName || user?.username || user?.email || `User${user?.id}`;
  
//   // State management
//   const [room, setRoom] = useState(location.state?.room || null);
//   const [currentQuestion, setCurrentQuestion] = useState(null);
//   const [questionIndex, setQuestionIndex] = useState(0);
//   const [totalQuestions, setTotalQuestions] = useState(0);
//   const [participants, setParticipants] = useState([]);
//   const [timeRemaining, setTimeRemaining] = useState(0);
//   const [selectedAnswer, setSelectedAnswer] = useState(null);
//   const [hasAnswered, setHasAnswered] = useState(false);
//   const [gameState, setGameState] = useState('waiting'); // waiting, active, leaderboard, completed
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [leaderboard, setLeaderboard] = useState([]);
//   const [showLeaderboard, setShowLeaderboard] = useState(false);
//   const [isCurrentUserHost, setIsCurrentUserHost] = useState(false);

//   // Socket.io connection and event handling
//   useEffect(() => {
//     const connectToQuiz = async () => {
//       try {
//         // Validate user data before connecting
//         if (!user || !user.id) {
//           console.log('User not available yet, waiting...');
//           return;
//         }

//         console.log('Connecting to quiz with:', { currentRoomCode, userId: user.id, displayName });

//         if (!currentRoomCode) {
//           console.error('Room code is missing!');
//           setError('Room code is missing from URL');
//           return;
//         }

//         socketIOService.connect();
        
//         // Join the room
//         await socketIOService.joinRoom(
//           currentRoomCode, 
//           user.id.toString(), 
//           displayName
//         );
//         setIsConnected(true);

//         // Listen for quiz events
//         socketIOService.on('init', (data) => {
//           console.log('Received init event:', data);
//           setGameState(data.state.type);
//           if (data.state.problem) {
//             setCurrentQuestion(data.state.problem);
//             setQuestionIndex(data.state.current_index || 0);
//             setTotalQuestions(data.state.total_problems || 0);
//             const timeLeft = Math.ceil((data.state.problem.start_time + data.state.problem.timer_duration - Date.now()) / 1000);
//             setTimeRemaining(Math.max(0, timeLeft));
//           }
//           if (data.state.leaderboard) {
//             setLeaderboard(data.state.leaderboard);
//           }
//           setParticipants(data.users);
          
//           // Check if current user is host
//           const currentUserData = data.users.find(u => u.id === user.id.toString());
//           if (currentUserData) {
//             setIsCurrentUserHost(currentUserData.is_host || false);
//             console.log('User host status:', currentUserData.is_host);
//           }
//         });

//         socketIOService.on('quiz_started', (data) => {
//           console.log('Received quiz_started event:', data);
//           setGameState('active');
//         });

//         socketIOService.on('problem', (data) => {
//           console.log('Received problem event:', data);
//           setCurrentQuestion(data.problem);
//           setQuestionIndex(data.current_index);
//           setTotalQuestions(data.total_problems);
//           setTimeRemaining(Math.ceil(data.problem.timer_duration));
//           setHasAnswered(false);
//           setSelectedAnswer(null);
//           setGameState('active');
//         });

//         socketIOService.on('leaderboard', (data) => {
//           console.log('Leaderboard received:', data);
//           setLeaderboard(data.leaderboard);
//           setGameState('leaderboard');
//           setShowLeaderboard(true);
//           // Auto-hide leaderboard after 5 seconds for participants, but keep it visible for host
//           const currentIsHost = isCurrentUserHost || (room && user && room.creator === user.id);
//           if (!currentIsHost) {
//             setTimeout(() => {
//               setShowLeaderboard(false);
//             }, 5000);
//           }
//         });

//         socketIOService.on('quiz_ended', (data) => {
//           setLeaderboard(data.final_leaderboard);
//           setGameState('completed');
//         });

//         socketIOService.on('user_joined', (data) => {
//           console.log('User joined:', data);
//           if (data.all_users) {
//             setParticipants(data.all_users);
//           } else {
//             setParticipants(prev => {
//               const exists = prev.find(p => p.id === data.user.id);
//               if (!exists) {
//                 return [...prev, data.user];
//               }
//               return prev;
//             });
//           }
//         });

//         socketIOService.on('user_left', (data) => {
//           setParticipants(prev => prev.filter(p => p.id !== data.user_id));
//         });

//         socketIOService.on('answer_submitted', (data) => {
//           console.log('Answer submitted:', data);
//         });

//         socketIOService.on('user_answered', (data) => {
//           setParticipants(prev => prev.map(p => 
//             p.id === data.user_id ? { ...p, hasAnswered: true } : p
//           ));
//         });

//         socketIOService.on('score_update', (data) => {
//           setParticipants(prev => prev.map(p => 
//             p.id === data.user_id ? { ...p, points: data.points } : p
//           ));
//         });

//       } catch (error) {
//         console.error('Socket connection error:', error);
//         setError('Failed to connect to quiz room');
//       }
//     };

//     if (user && user.id) {
//       connectToQuiz();
//     }

//     return () => {
//       if (socketIOService.socket) {
//         socketIOService.off('init');
//         socketIOService.off('quiz_started');
//         socketIOService.off('problem');
//         socketIOService.off('leaderboard');
//         socketIOService.off('quiz_ended');
//         socketIOService.off('user_joined');
//         socketIOService.off('user_left');
//         socketIOService.off('answer_submitted');
//         socketIOService.off('user_answered');
//         socketIOService.off('score_update');
//       }
//     };
//   }, [currentRoomCode, user, isConnected]);

//   // Timer countdown
//   useEffect(() => {
//     if (timeRemaining > 0 && gameState === 'active') {
//       const timer = setTimeout(() => {
//         setTimeRemaining(timeRemaining - 1);
//       }, 1000);
//       return () => clearTimeout(timer);
//     } else if (timeRemaining === 0 && gameState === 'active' && currentQuestion && !hasAnswered) {
//       // Auto-submit when time runs out
//       handleSubmitAnswer(null);
//     }
//   }, [timeRemaining, gameState, currentQuestion, hasAnswered]);

//   // Fetch initial room data (only if not already available from navigation state)
//   useEffect(() => {
//     const fetchRoomData = async () => {
//       // Skip fetch if room data is already available from navigation state
//       if (room) {
//         console.log('Room data already available from navigation state:', room);
//         setLoading(false);
//         return;
//       }

//       // Add validation for currentRoomCode
//       if (!currentRoomCode || typeof currentRoomCode !== 'string' || currentRoomCode.trim() === '') {
//         console.error('Invalid room code:', currentRoomCode);
//         setError('Invalid room code provided.');
//         setLoading(false);
//         return;
//       }

//       console.log('Fetching room data for room code:', currentRoomCode);
      
//       try {
//         const response = await api.get(`/rooms/${currentRoomCode}/`);
//         console.log('Room data fetched successfully:', response.data);
//         setRoom(response.data);
//         setLoading(false);
//       } catch (error) {
//         console.error('Error fetching room data:', error);
//         console.error('Error details:', {
//           status: error.response?.status,
//           statusText: error.response?.statusText,
//           data: error.response?.data,
//           url: error.config?.url
//         });
//         setError(`Failed to load room data: ${error.response?.status || 'Network error'}`);
//         setLoading(false);
//       }
//     };

//     if (currentRoomCode) {
//       fetchRoomData();
//     } else {
//       console.warn('No room code available, skipping fetch');
//       setLoading(false);
//     }
//   }, [currentRoomCode, room]);

//   // Handle next question (host only)
//   const handleNextQuestion = async () => {
//     if (!room || !user) return;
    
//     try {
//       await socketIOService.nextQuestion(currentRoomCode, user.id.toString());
//     } catch (err) {
//       console.error('Failed to advance to next question:', err);
//     }
//   };

//   // Check if current user is host (prioritize socket data, fallback to room data)
//   const isHost = isCurrentUserHost || (room && user && room.creator === user.id);

//   // Handle answer selection
//   const handleAnswerSelect = (answerIndex) => {
//     if (!hasAnswered && gameState === 'active') {
//       setSelectedAnswer(answerIndex);
//     }
//   };

//   // Handle answer submission
//   const handleSubmitAnswer = async (answerIndex = selectedAnswer) => {
//     if (hasAnswered) return;
    
//     try {
//       await socketIOService.submitAnswer(currentRoomCode, user.id.toString(), answerIndex);
//       setHasAnswered(true);
//     } catch (err) {
//       console.error('Failed to submit answer:', err);
//     }
//   };

//   // Handle quiz start (host only)
//   const handleStartQuiz = async () => {
//     if (!isHost) return;
    
//     try {
//       console.log('Starting quiz for room:', currentRoomCode);
//       await socketIOService.startQuiz(currentRoomCode, user.id.toString());
//       console.log('Quiz start request sent successfully');
//     } catch (err) {
//       console.error('Failed to start quiz:', err);
//       alert('Failed to start quiz. Please try again.');
//     }
//   };

//   // Format time display
//   const formatTime = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading quiz...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//             {error}
//           </div>
//           <button
//             onClick={() => navigate('/dashboard')}
//             className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
//           >
//             Back to Dashboard
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Waiting state
//   if (gameState === 'waiting') {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-pulse text-6xl mb-4">⏳</div>
//           <h2 className="text-2xl font-bold text-gray-800 mb-2">Waiting for Quiz to Start</h2>
//           <p className="text-gray-600 mb-4">
//             {isHost ? 'Click "Start Quiz" when ready!' : 'The host will start the quiz shortly...'}
//           </p>
//           <div className="bg-white rounded-lg shadow-md p-4 inline-block mb-4">
//             <p className="text-sm text-gray-500 mb-2">Connection Status:</p>
//             <div className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-yellow-600'}`}>
//               {isConnected ? '🟢 Connected' : '🟡 Connecting...'}
//             </div>
//           </div>
          
//           {/* Show participants count */}
//           {participants && participants.length > 0 && (
//             <div className="bg-white rounded-lg shadow-md p-4 mb-4 inline-block">
//               <p className="text-sm text-gray-500 mb-2">Participants ({participants.length}):</p>
//               <div className="text-sm">
//                 {participants.map((participant, index) => (
//                   <div key={participant.id} className="flex items-center justify-center mb-1">
//                     <span className="font-medium">{participant.name}</span>
//                     {participant.is_host && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Host</span>}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
          
//           {/* Navigation and action buttons */}
//           <div className="mt-4">
//             {isHost && (
//               <button
//                 onClick={handleStartQuiz}
//                 className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 mr-2 font-semibold"
//               >
//                 🚀 Start Quiz
//               </button>
//             )}
//             <button
//               onClick={() => navigate('/dashboard')}
//               className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
//             >
//               Back to Dashboard
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Active question state
//   if (gameState === 'active' && currentQuestion) {
//     // Host View - Analytics Dashboard
//     if (isHost) {
//       return (
//         <div className="min-h-screen bg-gray-50 py-8">
//           <div className="max-w-7xl mx-auto px-4">
//             {/* Header */}
//             <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//               <div className="flex justify-between items-center">
//                 <div>
//                   <h1 className="text-2xl font-bold text-gray-800">
//                     Host Dashboard - Question {questionIndex + 1} of {totalQuestions}
//                   </h1>
//                   <p className="text-gray-600">{room?.title}</p>
//                 </div>
//                 <div className="text-right">
//                   <div className={`text-3xl font-bold ${timeRemaining <= 10 ? 'text-red-600' : 'text-indigo-600'}`}>
//                     {formatTime(timeRemaining)}
//                   </div>
//                   <p className="text-sm text-gray-500">Time Remaining</p>
//                 </div>
//               </div>
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Question Panel */}
//               <div className="bg-white rounded-lg shadow-md p-6">
//                 <h2 className="text-xl font-bold text-gray-800 mb-4">Current Question</h2>
//                 <div className="bg-gray-50 rounded-lg p-4 mb-4">
//                   <p className="text-lg font-medium text-gray-800 mb-4">{currentQuestion.question_text}</p>
                  
//                   <div className="space-y-2">
//                     {currentQuestion.options.map((option, index) => (
//                       <div
//                         key={index}
//                         className={`p-3 rounded-lg border ${
//                           currentQuestion.correct_answer === index
//                             ? 'bg-green-100 border-green-300 text-green-800 ring-2 ring-green-500'
//                             : 'bg-white border-gray-200'
//                         }`}
//                       >
//                         <div className="flex items-center justify-between">
//                           <span className="font-medium">
//                             {String.fromCharCode(65 + index)}. {option.title || option}
//                           </span>
//                           {currentQuestion.correct_answer === index && (
//                             <span className="flex items-center text-green-600">
//                               <span className="text-sm font-bold mr-1">✓ CORRECT</span>
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
                
//                 <div className="text-sm text-gray-600">
//                   <p><strong>Type:</strong> {currentQuestion.type}</p>
//                   <p><strong>Points:</strong> {currentQuestion.points}</p>
//                   <p><strong>Timer:</strong> {Math.ceil(currentQuestion.timer_duration / 1000)}s</p>
//                 </div>
//               </div>

//               {/* Participants Analytics */}
//               <div className="bg-white rounded-lg shadow-md p-6">
//                 <h2 className="text-xl font-bold text-gray-800 mb-4">Participant Activity</h2>
//                 <div className="space-y-3">
//                   {participants
//                     .filter(participant => participant.id !== user?.id && participant.user_id !== user?.id)
//                     .map((participant) => (
//                     <div
//                       key={participant.id}
//                       className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
//                     >
//                       <div className="flex items-center">
//                         <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
//                           <span className="text-indigo-600 font-bold">
//                             {participant.display_name ? participant.display_name.charAt(0).toUpperCase() : 
//                              participant.name ? participant.name.charAt(0).toUpperCase() : 'U'}
//                           </span>
//                         </div>
//                         <div className="ml-3">
//                           <p className="font-medium text-gray-800">
//                             {participant.display_name || participant.name || 'Unknown Participant'}
//                           </p>
//                           <p className="text-sm text-gray-500">
//                             {participant.hasAnswered ? '✅ Answered' : '⏱️ Thinking...'}
//                           </p>
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <span className="text-lg font-bold text-indigo-600">{participant.points || 0} pts</span>
//                         <p className="text-xs text-gray-500">Total Score</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
                
//                 {/* Answer Statistics */}
//                 <div className="mt-6 pt-4 border-t border-gray-200">
//                   <h3 className="font-bold text-gray-800 mb-2">Answer Distribution</h3>
//                   <div className="text-sm text-gray-600">
//                     <p>Answered: {participants.filter(p => p.hasAnswered).length} / {participants.length}</p>
//                     <p>Response Rate: {participants.length > 0 ? Math.round((participants.filter(p => p.hasAnswered).length / participants.length) * 100) : 0}%</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Host Controls */}
//             <div className="bg-white rounded-lg shadow-md p-6 mt-6">
//               <div className="flex justify-between items-center">
//                 <div>
//                   <h3 className="text-lg font-bold text-gray-800">Host Controls</h3>
//                   <p className="text-gray-600">Manage the quiz flow</p>
//                 </div>
//                 <div className="space-x-4">
//                   {timeRemaining === 0 && (
//                     <button
//                       onClick={handleNextQuestion}
//                       className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
//                     >
//                       Next Question →
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Leaderboard Display for Host */}
//             {showLeaderboard && leaderboard && leaderboard.length > 0 && (
//               <div className="bg-white rounded-lg shadow-md p-6 mt-6">
//                 <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Question Leaderboard</h3>
//                 <div className="space-y-3">
//                   {leaderboard.map((player, index) => (
//                     <div
//                       key={player.id}
//                       className={`flex items-center justify-between p-4 rounded-lg ${
//                         index === 0 ? 'bg-yellow-50 border-2 border-yellow-200' :
//                         index === 1 ? 'bg-gray-50 border-2 border-gray-200' :
//                         index === 2 ? 'bg-orange-50 border-2 border-orange-200' :
//                         'bg-white border border-gray-200'
//                       }`}
//                     >
//                       <div className="flex items-center">
//                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
//                           index === 0 ? 'bg-yellow-500' :
//                           index === 1 ? 'bg-gray-500' :
//                           index === 2 ? 'bg-orange-500' :
//                           'bg-indigo-500'
//                         }`}>
//                           {index + 1}
//                         </div>
//                         <div>
//                           <p className="font-semibold text-gray-800">
//                             {player.display_name || player.name || 'Unknown Player'}
//                           </p>
//                           <p className="text-sm text-gray-500">
//                             Current Score: {player.total_score || 0} pts
//                           </p>
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <span className={`text-lg font-bold ${
//                           index === 0 ? 'text-yellow-600' :
//                           index === 1 ? 'text-gray-600' :
//                           index === 2 ? 'text-orange-600' :
//                           'text-indigo-600'
//                         }`}>
//                           +{player.question_score || 0}
//                         </span>
//                         <p className="text-xs text-gray-500">This Question</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       );
//     }

//     // Participant View - Question Only
//     return (
//       <div className="min-h-screen bg-gray-50 py-8">
//         <div className="max-w-4xl mx-auto px-4">
//           {/* Header */}
//           <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//             <div className="flex justify-between items-center">
//               <div>
//                 <h1 className="text-2xl font-bold text-gray-800">
//                   Question {questionIndex + 1} of {totalQuestions}
//                 </h1>
//                 <p className="text-gray-600">{room?.title}</p>
//               </div>
//               <div className="text-right">
//                 <div className={`text-3xl font-bold ${timeRemaining <= 10 ? 'text-red-600' : 'text-indigo-600'}`}>
//                   {formatTime(timeRemaining)}
//                 </div>
//                 <p className="text-sm text-gray-500">Time Remaining</p>
//               </div>
//             </div>
//           </div>

//           {/* Question */}
//           <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//             <h2 className="text-xl font-bold text-gray-800 mb-6">{currentQuestion.question_text}</h2>
            
//             <div className="space-y-3">
//               {currentQuestion.options.map((option, index) => (
//                 <button
//                   key={index}
//                   onClick={() => handleAnswerSelect(index)}
//                   disabled={hasAnswered}
//                   className={`w-full p-4 text-left rounded-lg border transition-all ${
//                     selectedAnswer === index
//                       ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
//                       : hasAnswered
//                         ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
//                         : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
//                   }`}
//                 >
//                   <div className="flex items-center">
//                     <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3 ${
//                       selectedAnswer === index
//                         ? 'border-indigo-500 bg-indigo-500 text-white'
//                         : 'border-gray-300'
//                     }`}>
//                       {String.fromCharCode(65 + index)}
//                     </div>
//                     <span className="font-medium">{option.title || option}</span>
//                   </div>
//                 </button>
//               ))}
//             </div>

//             {/* Submit Button */}
//             {selectedAnswer !== null && !hasAnswered && (
//               <div className="mt-6 text-center">
//                 <button
//                   onClick={() => handleSubmitAnswer()}
//                   className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
//                 >
//                   Submit Answer
//                 </button>
//               </div>
//             )}

//             {hasAnswered && (
//               <div className="mt-6 text-center">
//                 <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-2 rounded-lg inline-block">
//                   ✅ Answer submitted! Waiting for other participants...
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Progress */}
//           <div className="bg-white rounded-lg shadow-md p-4">
//             <div className="flex justify-between items-center mb-2">
//               <span className="text-sm font-medium text-gray-600">Progress</span>
//               <span className="text-sm text-gray-500">{questionIndex + 1} / {totalQuestions}</span>
//             </div>
//             <div className="w-full bg-gray-200 rounded-full h-2">
//               <div
//                 className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
//                 style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
//               ></div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Leaderboard state
//   if (gameState === 'leaderboard') {
//     return (
//       <div className="min-h-screen bg-gray-50 py-8">
//         <div className="max-w-4xl mx-auto px-4">
//           <div className="bg-white rounded-lg shadow-md p-6">
//             <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Leaderboard</h2>
            
//             <div className="space-y-3">
//               {leaderboard.map((player, index) => (
//                 <div
//                   key={player.user_id}
//                   className={`flex items-center justify-between p-4 rounded-lg ${
//                     index < 3 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
//                   }`}
//                 >
//                   <div className="flex items-center">
//                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
//                       index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-gray-600'
//                     }`}>
//                       {player.rank}
//                     </div>
//                     <span className="ml-3 font-medium">{player.name}</span>
//                   </div>
//                   <span className="text-lg font-bold text-indigo-600">{player.points} pts</span>
//                 </div>
//               ))}
//             </div>

//             <div className="text-center mt-6">
//               <p className="text-gray-500">Next question starting soon...</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Completed state
//   if (gameState === 'completed') {
//     return (
//       <div className="min-h-screen bg-gray-50 py-8">
//         <div className="max-w-4xl mx-auto px-4">
//           <div className="bg-white rounded-lg shadow-md p-6 text-center">
//             <div className="text-6xl mb-4">🎉</div>
//             <h2 className="text-3xl font-bold text-gray-800 mb-6">Quiz Complete!</h2>
            
//             <div className="bg-gray-50 rounded-lg p-6 mb-6">
//               <h3 className="text-xl font-bold text-gray-800 mb-4">Final Results</h3>
//               <div className="space-y-3">
//                 {leaderboard.map((player, index) => (
//                   <div
//                     key={player.user_id}
//                     className={`flex items-center justify-between p-4 rounded-lg ${
//                       index < 3 ? 'bg-yellow-50 border border-yellow-200' : 'bg-white'
//                     }`}
//                   >
//                     <div className="flex items-center">
//                       <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
//                         index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-gray-600'
//                       }`}>
//                         {player.rank}
//                       </div>
//                       <span className="ml-3 font-medium text-lg">{player.name}</span>
//                     </div>
//                     <span className="text-xl font-bold text-indigo-600">{player.points} pts</span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <button
//               onClick={() => navigate('/dashboard')}
//               className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
//             >
//               Back to Dashboard
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return null;
// };

// export default MultiplayerQuizPage;
