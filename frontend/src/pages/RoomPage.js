import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { 
  ClockIcon, 
  UserGroupIcon, 
  PlayIcon,
  ShareIcon,
  TrophyIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const RoomPage = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [room, setRoom] = useState(location.state?.room || null);
  const [isCreator, setIsCreator] = useState(location.state?.isCreator || false);
  const [loading, setLoading] = useState(!room);
  const [participants, setParticipants] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (!room) {
      fetchRoomDetails();
    }
    
    // Set up polling for room updates
    const interval = setInterval(fetchRoomDetails, 2000);
    return () => clearInterval(interval);
  }, [roomCode]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameStarted && timeLeft === 0) {
      handleTimeUp();
    }
  }, [gameStarted, timeLeft]);

  const fetchRoomDetails = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomCode}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoom(data);
        setParticipants(data.participants || []);
        setIsCreator(data.is_creator);
        
        if (data.status === 'active' && !gameStarted) {
          setGameStarted(true);
          setTimeLeft(data.time_limit);
        }
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomCode}/start/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        setGameStarted(true);
        setTimeLeft(room.time_limit);
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer) return;

    try {
      const response = await fetch(`/api/rooms/${roomCode}/submit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          question_id: room.questions[currentQuestion].id,
          answer: selectedAnswer,
          time_taken: room.time_limit - timeLeft
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShowResults(data);
        setTimeout(() => {
          if (currentQuestion + 1 < room.questions.length) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedAnswer('');
            setShowResults(false);
            setTimeLeft(room.time_limit);
          } else {
            completeGame();
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleTimeUp = () => {
    if (!showResults) {
      submitAnswer();
    }
  };

  const completeGame = async () => {
    setGameCompleted(true);
    
    try {
      const response = await fetch(`/api/rooms/${roomCode}/leaderboard/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const shareRoom = async () => {
    const shareData = {
      title: 'Join my quiz room!',
      text: `Join my quiz room with code: ${roomCode}`,
      url: `${window.location.origin}/join-room?code=${roomCode}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Room link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing room:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Room not found</h1>
          <Button onClick={() => navigate('/join-room')}>
            Join Another Room
          </Button>
        </div>
      </div>
    );
  }

  // Waiting Lobby
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{room.title}</h1>
              <p className="text-lg text-gray-600">Room Code: <span className="font-mono font-bold">{roomCode}</span></p>
              {room.description && (
                <p className="text-gray-600 mt-2">{room.description}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quiz Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-medium">{room.total_questions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time per question:</span>
                    <span className="font-medium">{room.time_limit}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quiz type:</span>
                    <span className="font-medium capitalize">{room.quiz_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Randomized questions:</span>
                    <span className="font-medium">{room.randomize_questions ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Show answers:</span>
                    <span className="font-medium">{room.show_correct_answers ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Participants ({participants.length}/{room.max_participants})
                </h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {participants.map((participant, index) => (
                    <div key={participant.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {participant.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {participant.username}
                        {participant.user === room.creator && (
                          <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            Host
                          </span>
                        )}
                        {participant.user === user.id && (
                          <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              {isCreator ? (
                <Button onClick={startGame} size="lg" className="flex items-center space-x-2">
                  <PlayIcon className="w-5 h-5" />
                  <span>Start Quiz</span>
                </Button>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Waiting for host to start the quiz...</p>
                  <div className="animate-pulse">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <ClockIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              )}
              
              <Button variant="outline" onClick={shareRoom} className="flex items-center space-x-2">
                <ShareIcon className="w-5 h-5" />
                <span>Share Room</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game Completed
  if (gameCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrophyIcon className="w-8 h-8 text-yellow-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Completed!</h1>
              <p className="text-lg text-gray-600">Here are the final results</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Leaderboard</h2>
              <div className="space-y-3">
                {leaderboard.map((participant, index) => (
                  <div key={participant.username} className="flex items-center space-x-4 p-4 bg-white rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {participant.username}
                        {participant.username === user.username && (
                          <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{participant.score} points</div>
                      {participant.completion_time && (
                        <div className="text-sm text-gray-500">
                          Completed at {new Date(participant.completion_time).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <Button onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/create-room')}>
                Create New Room
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Quiz
  const question = room.questions[currentQuestion];
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Progress and Timer */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {room.questions.length}
            </div>
            <div className={`text-xl font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-blue-600'}`}>
              {timeLeft}s
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / room.questions.length) * 100}%` }}
            />
          </div>

          {!showResults ? (
            <>
              {/* Question */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {question.question_text}
                </h2>

                {/* Answer Options */}
                <div className="space-y-3">
                  {question.question_type === 'multiple_choice' && (
                    question.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedAnswer(option)}
                        className={`w-full p-4 text-left border rounded-lg transition-all ${
                          selectedAnswer === option
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedAnswer === option
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`} />
                          <span>{option}</span>
                        </div>
                      </button>
                    ))
                  )}

                  {question.question_type === 'true_false' && (
                    ['true', 'false'].map((option) => (
                      <button
                        key={option}
                        onClick={() => setSelectedAnswer(option)}
                        className={`w-full p-4 text-left border rounded-lg transition-all ${
                          selectedAnswer === option
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedAnswer === option
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`} />
                          <span className="capitalize">{option}</span>
                        </div>
                      </button>
                    ))
                  )}

                  {(question.question_type === 'fill_in_blank' || question.question_type === 'descriptive') && (
                    <textarea
                      value={selectedAnswer}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={question.question_type === 'descriptive' ? 4 : 2}
                      placeholder="Enter your answer..."
                    />
                  )}
                </div>
              </div>

              <Button
                onClick={submitAnswer}
                disabled={!selectedAnswer}
                className="w-full"
                size="lg"
              >
                Submit Answer
              </Button>
            </>
          ) : (
            /* Results */
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                showResults.is_correct ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <div className={`text-2xl ${
                  showResults.is_correct ? 'text-green-600' : 'text-red-600'
                }`}>
                  {showResults.is_correct ? '✓' : '✗'}
                </div>
              </div>
              
              <h3 className={`text-xl font-bold mb-2 ${
                showResults.is_correct ? 'text-green-600' : 'text-red-600'
              }`}>
                {showResults.is_correct ? 'Correct!' : 'Incorrect'}
              </h3>
              
              <p className="text-gray-600 mb-4">
                You earned {showResults.points_earned} point{showResults.points_earned !== 1 ? 's' : ''}
              </p>

              {room.show_correct_answers && (
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <div className="font-medium text-gray-900 mb-2">Correct Answer:</div>
                  <div className="text-gray-700">{showResults.correct_answer}</div>
                  {showResults.explanation && (
                    <>
                      <div className="font-medium text-gray-900 mb-2 mt-4">Explanation:</div>
                      <div className="text-gray-700">{showResults.explanation}</div>
                    </>
                  )}
                </div>
              )}

              <div className="mt-6">
                <p className="text-sm text-gray-500">
                  Moving to next question in {Math.ceil((3000 - (Date.now() % 3000)) / 1000)} seconds...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
