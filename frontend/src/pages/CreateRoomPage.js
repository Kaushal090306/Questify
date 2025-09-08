import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import AnimatedCheckbox from '../components/ui/AnimatedCheckbox';
import api from '../api/axiosConfig';
import QRCode from 'qrcode.react';
import { 
  UsersIcon, 
  ClockIcon, 
  AcademicCapIcon,
  ShareIcon,
  QrCodeIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

const CreateRoomPage = () => {
  const { user } = useAuth();
  const { quizzes, loading: quizzesLoading } = useQuiz();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [roomSettings, setRoomSettings] = useState({
    max_players: 10,
    time_per_question: 30,
    show_correct_answers: true,
    allow_late_join: false
  });
  const [createdRoom, setCreatedRoom] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleQuizSelect = (quiz) => {
    setSelectedQuiz(quiz);
    setStep(2);
  };

  const handleCreateRoom = async () => {
    if (!selectedQuiz) return;

    setLoading(true);
    try {
      const response = await api.post('/multiplayer/rooms/', {
        quiz_id: selectedQuiz.id,
        ...roomSettings
      });
      
      setCreatedRoom(response.data);
      setStep(3);
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = () => {
    navigate(`/multiplayer/${createdRoom.room_code}`);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(createdRoom.room_code);
    alert('Room code copied to clipboard!');
  };

  const shareRoom = async () => {
    const shareData = {
      title: 'Join my quiz room!',
      text: `Join my quiz room with code: ${createdRoom.room_code}`,
      url: `${window.location.origin}/join-room?code=${createdRoom.room_code}`
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Create Quiz Room
        </h1>
        <p className="text-lg text-slate-600">
          Set up a multiplayer quiz session for your friends or students
        </p>
      </div>

      {/* Step 1: Quiz Selection */}
      {step === 1 && (
        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Step 1: Select a Quiz
          </h2>
          
          {quizzesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map(quiz => (
                <button
                  key={quiz.id}
                  onClick={() => handleQuizSelect(quiz)}
                  className="p-4 border-2 border-slate-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <AcademicCapIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {quiz.title}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {quiz.total_questions} questions • {quiz.difficulty}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Created {new Date(quiz.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AcademicCapIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">
                You need to create a quiz first before hosting a room
              </p>
              <Button onClick={() => navigate('/generate')}>
                Create Quiz
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Room Settings */}
      {step === 2 && selectedQuiz && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Step 2: Room Settings
            </h2>
            <Button
              variant="ghost"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
          </div>

          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-2">
              Selected Quiz: {selectedQuiz.title}
            </h3>
            <p className="text-sm text-slate-600">
              {selectedQuiz.total_questions} questions • {selectedQuiz.difficulty} difficulty
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Maximum Players
                </label>
                <select
                  value={roomSettings.max_players}
                  onChange={(e) => setRoomSettings(prev => ({ ...prev, max_players: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={5}>5 players</option>
                  <option value={10}>10 players</option>
                  <option value={20}>20 players</option>
                  <option value={50}>50 players</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Time per Question (seconds)
                </label>
                <select
                  value={roomSettings.time_per_question}
                  onChange={(e) => setRoomSettings(prev => ({ ...prev, time_per_question: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                  <option value={120}>2 minutes</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <AnimatedCheckbox
                  id="show_correct_answers"
                  checked={roomSettings.show_correct_answers}
                  onChange={(e) => setRoomSettings(prev => ({ ...prev, show_correct_answers: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="show_correct_answers" className="text-sm text-slate-700">
                  Show correct answers after each question
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <AnimatedCheckbox
                  id="allow_late_join"
                  checked={roomSettings.allow_late_join}
                  onChange={(e) => setRoomSettings(prev => ({ ...prev, allow_late_join: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="allow_late_join" className="text-sm text-slate-700">
                  Allow players to join after the game starts
                </label>
              </div>
            </div>

            <Button
              onClick={handleCreateRoom}
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
            >
              Create Room
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Room Created */}
      {step === 3 && createdRoom && (
        <div className="space-y-6">
          <Card className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Room Created Successfully!
            </h2>
            <p className="text-slate-600 mb-6">
              Share the room code with your participants
            </p>

            <div className="bg-slate-50 rounded-lg p-6 mb-6">
              <div className="text-sm text-slate-600 mb-2">Room Code</div>
              <div className="text-4xl font-bold text-primary-600 mb-4">
                {createdRoom.room_code}
              </div>
              <div className="flex justify-center space-x-3">
                <Button
                  variant="outline"
                  onClick={copyRoomCode}
                  className="flex items-center space-x-2"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Copy Code</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={shareRoom}
                  className="flex items-center space-x-2"
                >
                  <ShareIcon className="w-4 h-4" />
                  <span>Share</span>
                </Button>
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <QRCode
                value={`${window.location.origin}/join-room?code=${createdRoom.room_code}`}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <Button
              onClick={handleStartGame}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Go to Room
            </Button>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Room Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <UsersIcon className="w-5 h-5 text-slate-600" />
                <span className="text-slate-700">
                  Max {roomSettings.max_players} players
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <ClockIcon className="w-5 h-5 text-slate-600" />
                <span className="text-slate-700">
                  {roomSettings.time_per_question}s per question
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <AcademicCapIcon className="w-5 h-5 text-slate-600" />
                <span className="text-slate-700">
                  {roomSettings.show_correct_answers ? 'Show' : 'Hide'} correct answers
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <QrCodeIcon className="w-5 h-5 text-slate-600" />
                <span className="text-slate-700">
                  {roomSettings.allow_late_join ? 'Allow' : 'Disable'} late join
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CreateRoomPage;
