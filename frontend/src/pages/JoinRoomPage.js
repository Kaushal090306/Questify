import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { joinRoom } from '../api/rooms';
import { 
  UserGroupIcon, 
  ClockIcon, 
  AcademicCapIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';

const JoinRoomPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [roomCode, setRoomCode] = useState(searchParams.get('code') || '');
  const [displayName, setDisplayName] = useState(user?.username || user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [room, setRoom] = useState(null);
  const [step, setStep] = useState(1); // 1: Enter Code, 2: Room Preview

  useEffect(() => {
    if (user && !displayName) {
      setDisplayName(user.username || user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (searchParams.get('code')) {
      handleJoinRoom();
    }
  }, []);

  const handleJoinRoom = async () => {
    if (!roomCode || roomCode.length !== 6) {
      setError('Please enter a valid 6-character room code');
      return;
    }

    if (!displayName.trim()) {
      setError('Please enter your display name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await joinRoom(roomCode.toUpperCase(), displayName.trim());
      
      if (data.success) {
        setRoom(data.room);
        setStep(2);
      } else {
        setError(data.message || 'Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setError(error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterRoom = () => {
    navigate(`/room/${roomCode}/lobby/participant`, { 
      state: { 
        isCreator: false, 
        room: room,
        displayName: displayName || user?.username || user?.email || `User${user?.id}`
      } 
    });
  };

  const renderJoinForm = () => (
    <div className="max-w-md mx-auto">
      <div className="bg-white border-4 border-black p-8" style={{
        boxShadow: '8px 8px 0 var(--chinese-black, #141414)'
      }}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-black border-3 border-black flex items-center justify-center" style={{
            boxShadow: '4px 4px 0 var(--chinese-black, #141414)'
          }}>
            <UserGroupIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-black mb-3" style={{
            fontFamily: 'var(--font-family-display, "Space Grotesk")',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>Join Quiz Room</h1>
          <p className="text-lg font-medium" style={{
            fontFamily: 'var(--font-family-secondary, "Inter")',
            color: 'var(--night-rider, #2e2e2e)'
          }}>Enter the 6-digit room code to join</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-black mb-3" style={{
              fontFamily: 'var(--font-family-display, "Space Grotesk")',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Your Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border-3 border-black bg-white text-black font-medium focus:outline-none focus:ring-0"
              style={{
                fontFamily: 'var(--font-family-primary, "JetBrains Mono")',
                boxShadow: '4px 4px 0 var(--chinese-black, #141414)'
              }}
              placeholder="Enter your name..."
              maxLength={100}
            />
            <p className="text-sm font-medium mt-2" style={{
              fontFamily: 'var(--font-family-secondary, "Inter")',
              color: 'var(--night-rider, #2e2e2e)'
            }}>
              This is how other participants will see you
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-3" style={{
              fontFamily: 'var(--font-family-display, "Space Grotesk")',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (value.length <= 6) {
                  setRoomCode(value);
                  setError('');
                }
              }}
              className="w-full px-4 py-3 text-center text-2xl font-black border-3 border-black bg-white text-black focus:outline-none focus:ring-0"
              style={{
                fontFamily: 'var(--font-family-primary, "JetBrains Mono")',
                letterSpacing: '4px',
                boxShadow: '4px 4px 0 var(--chinese-black, #141414)'
              }}
              placeholder="ABC123"
              maxLength={6}
            />
            <p className="text-sm font-medium mt-2" style={{
              fontFamily: 'var(--font-family-secondary, "Inter")',
              color: 'var(--night-rider, #2e2e2e)'
            }}>
              Ask the host for the room code
            </p>
          </div>

          {error && (
            <div className="flex items-center space-x-3 p-4 bg-white border-3 border-red-600" style={{
              boxShadow: '4px 4px 0 #dc2626'
            }}>
              <ExclamationCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
              <span className="text-sm font-bold text-red-700" style={{
                fontFamily: 'var(--font-family-secondary, "Inter")'
              }}>{error}</span>
            </div>
          )}

          <Button
            onClick={handleJoinRoom}
            disabled={roomCode.length !== 6 || !displayName.trim() || loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t-4 border-black">
          <div className="text-center">
            <p className="text-base font-bold text-black mb-6" style={{
              fontFamily: 'var(--font-family-primary, "Space Grotesk")'
            }}>
              OR SCAN QR CODE FROM THE HOST
            </p>
            <QrCodeIcon className="w-12 h-12 text-black mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderRoomPreview = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border-4 border-black p-8" style={{
        boxShadow: '8px 8px 0 var(--chinese-black, #141414)'
      }}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-black border-4 border-black flex items-center justify-center" style={{
            boxShadow: '4px 4px 0 var(--philippine-silver, #e1e1e1)'
          }}>
            <CheckCircleIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-4" style={{
            fontFamily: 'var(--font-family-primary, "Space Grotesk")'
          }}>
            ROOM FOUND!
          </h1>
          <p className="text-lg text-black" style={{
            fontFamily: 'var(--font-family-secondary, "Inter")'
          }}>
            You're about to join this quiz room
          </p>
        </div>

        <div className="space-y-8">
          {/* Room Details */}
          <div className="bg-white border-4 border-black p-6" style={{
            boxShadow: '4px 4px 0 var(--chinese-black, #141414)'
          }}>
            <h2 className="text-2xl font-bold text-black mb-6" style={{
              fontFamily: 'var(--font-family-primary, "Space Grotesk")'
            }}>
              {room.title}
            </h2>
            {room.description && (
              <p className="text-black mb-6 text-lg" style={{
                fontFamily: 'var(--font-family-secondary, "Inter")'
              }}>
                {room.description}
              </p>
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-4">
                <AcademicCapIcon className="w-6 h-6 text-black flex-shrink-0" />
                <span className="text-black font-bold" style={{
                  fontFamily: 'var(--font-family-secondary, "Inter")'
                }}>
                  {room.total_questions} QUESTIONS
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <ClockIcon className="w-6 h-6 text-black flex-shrink-0" />
                <span className="text-black font-bold" style={{
                  fontFamily: 'var(--font-family-secondary, "Inter")'
                }}>
                  {room.time_limit}S PER QUESTION
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <UserGroupIcon className="w-6 h-6 text-black flex-shrink-0" />
                <span className="text-black font-bold" style={{
                  fontFamily: 'var(--font-family-secondary, "Inter")'
                }}>
                  {room.participant_count}/{room.max_participants} PARTICIPANTS
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`w-4 h-4 border-2 border-black ${
                  room.status === 'waiting' ? 'bg-yellow-400' :
                  room.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className="text-black font-bold uppercase" style={{
                  fontFamily: 'var(--font-family-secondary, "Inter")'
                }}>
                  {room.status}
                </span>
              </div>
            </div>
          </div>

          {/* Creator Info */}
          <div className="bg-white border-4 border-black p-6" style={{
            boxShadow: '4px 4px 0 var(--chinese-black, #141414)'
          }}>
            <h3 className="font-bold text-black mb-4 text-xl" style={{
              fontFamily: 'var(--font-family-primary, "Space Grotesk")'
            }}>
              ROOM HOST
            </h3>
            <p className="text-black font-bold text-lg" style={{
              fontFamily: 'var(--font-family-tertiary, "JetBrains Mono")'
            }}>
              {room.creator_username}
            </p>
          </div>

          {/* Quiz Settings */}
          <div className="space-y-6">
            <h3 className="font-bold text-black text-xl" style={{
              fontFamily: 'var(--font-family-primary, "Space Grotesk")'
            }}>
              QUIZ SETTINGS
            </h3>
            <div className="bg-white border-4 border-black p-6" style={{
              boxShadow: '4px 4px 0 var(--chinese-black, #141414)'
            }}>
              <div className="grid md:grid-cols-2 gap-4 text-base">
                <div className="flex justify-between items-center border-b-2 border-black pb-2">
                  <span className="text-black font-bold" style={{
                    fontFamily: 'var(--font-family-secondary, "Inter")'
                  }}>
                    QUESTION RANDOMIZATION:
                  </span>
                  <span className="font-bold text-black" style={{
                    fontFamily: 'var(--font-family-tertiary, "JetBrains Mono")'
                  }}>
                    {room.randomize_questions ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b-2 border-black pb-2">
                  <span className="text-black font-bold" style={{
                    fontFamily: 'var(--font-family-secondary, "Inter")'
                  }}>
                    OPTION RANDOMIZATION:
                  </span>
                  <span className="font-bold text-black" style={{
                    fontFamily: 'var(--font-family-tertiary, "JetBrains Mono")'
                  }}>
                    {room.randomize_options ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b-2 border-black pb-2">
                  <span className="text-black font-bold" style={{
                    fontFamily: 'var(--font-family-secondary, "Inter")'
                  }}>
                    SHOW ANSWERS:
                  </span>
                  <span className="font-bold text-black" style={{
                    fontFamily: 'var(--font-family-tertiary, "JetBrains Mono")'
                  }}>
                    {room.show_correct_answers ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b-2 border-black pb-2">
                  <span className="text-black font-bold" style={{
                    fontFamily: 'var(--font-family-secondary, "Inter")'
                  }}>
                    ALLOW RETAKES:
                  </span>
                  <span className="font-bold text-black" style={{
                    fontFamily: 'var(--font-family-tertiary, "JetBrains Mono")'
                  }}>
                    {room.allow_retakes ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {room.status === 'waiting' && (
            <div className="bg-white border-4 border-yellow-400 p-6" style={{
              boxShadow: '4px 4px 0 #facc15'
            }}>
              <div className="flex items-center space-x-4">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
                <span className="text-black font-bold text-lg" style={{
                  fontFamily: 'var(--font-family-secondary, "Inter")'
                }}>
                  WAITING FOR HOST TO START THE QUIZ
                </span>
              </div>
            </div>
          )}

          {room.status === 'active' && (
            <div className="bg-white border-4 border-green-400 p-6" style={{
              boxShadow: '4px 4px 0 #4ade80'
            }}>
              <div className="flex items-center space-x-4">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                <span className="text-black font-bold text-lg" style={{
                  fontFamily: 'var(--font-family-secondary, "Inter")'
                }}>
                  QUIZ IS CURRENTLY ACTIVE - YOU CAN STILL JOIN!
                </span>
              </div>
            </div>
          )}

          {room.status === 'completed' && (
            <div className="bg-white border-4 border-red-400 p-6" style={{
              boxShadow: '4px 4px 0 #f87171'
            }}>
              <div className="flex items-center space-x-4">
                <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
                <span className="text-black font-bold text-lg" style={{
                  fontFamily: 'var(--font-family-secondary, "Inter")'
                }}>
                  THIS QUIZ HAS ALREADY BEEN COMPLETED
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Display Name Input */}
        <div className="bg-white border-4 border-black p-6" style={{
          boxShadow: '4px 4px 0 var(--chinese-black, #141414)'
        }}>
          <h3 className="text-xl font-bold text-black mb-6" style={{
            fontFamily: 'var(--font-family-primary, "Space Grotesk")'
          }}>
            YOUR DISPLAY NAME
          </h3>
          <div className="space-y-4">
            <label htmlFor="displayName" className="block text-base font-bold text-black" style={{
              fontFamily: 'var(--font-family-secondary, "Inter")'
            }}>
              HOW SHOULD OTHERS SEE YOU IN THIS QUIZ?
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ENTER YOUR DISPLAY NAME"
              className="w-full px-4 py-4 border-4 border-black bg-white text-black focus:bg-black focus:text-white transition-all placeholder-gray-600 font-bold"
              style={{
                fontFamily: 'var(--font-family-tertiary, "JetBrains Mono")',
                letterSpacing: '1px',
                boxShadow: '4px 4px 0 var(--chinese-black, #141414)'
              }}
            />
            <p className="text-sm text-black font-bold mt-2" style={{
              fontFamily: 'var(--font-family-tertiary, "JetBrains Mono")'
            }}>
              → This name will be visible to other participants and on the leaderboard
            </p>
          </div>
        </div>

        <div className="flex space-x-6 mt-8">
          <Button
            variant="outline"
            onClick={() => setStep(1)}
            className="flex-1"
          >
            ← BACK
          </Button>
          <Button
            onClick={handleEnterRoom}
            disabled={room.status === 'completed'}
            className="flex-1"
            size="lg"
          >
            ENTER ROOM →
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Brutalist Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-black mb-4" style={{
            fontFamily: 'var(--font-family-display, "Space Grotesk")',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            Join Room
          </h1>
          <p className="text-lg font-medium" style={{
            fontFamily: 'var(--font-family-secondary, "Inter")',
            color: 'var(--night-rider, #2e2e2e)'
          }}>
            Enter the room code to join a quiz
          </p>
        </div>
        
        {step === 1 && renderJoinForm()}
        {step === 2 && renderRoomPreview()}
      </div>
    </div>
  );
};

export default JoinRoomPage;
