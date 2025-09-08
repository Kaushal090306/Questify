import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/axiosConfig';

const RoomResultsPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [results, setResults] = useState(null);
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [userResults, setUserResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [roomId]);

  const fetchResults = async () => {
    try {
      // Fetch room details
      const roomResponse = await api.get(`/api/rooms/${roomId}/`);
      setRoom(roomResponse.data);

      // Fetch quiz results
      const resultsResponse = await api.get(`/api/rooms/${roomId}/results/`);
      setResults(resultsResponse.data);
      setParticipants(resultsResponse.data.participants || []);
      
      // Find current user's results
      const currentUserResults = resultsResponse.data.participants?.find(
        p => p.user_id === user.id
      );
      setUserResults(currentUserResults);

    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  };

  const calculateAccuracy = (correct, total) => {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  const getRankSuffix = (rank) => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  const getMedalColor = (rank) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-500';
    return 'text-gray-600';
  };

  const getMedalIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Results</h1>
          <p className="text-gray-600">{room?.name}</p>
        </div>

        {/* User's Personal Results */}
        {userResults && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">{userResults.rank}</div>
                  <div className="text-sm text-gray-600">Rank</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{userResults.score}</div>
                  <div className="text-sm text-gray-600">Points</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {calculateAccuracy(userResults.correct_answers, userResults.total_questions)}%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {userResults.correct_answers}/{userResults.total_questions}
                  </div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
              </div>
              
              {userResults.rank <= 3 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-lg font-semibold text-yellow-800">
                    🎉 Congratulations! You finished {userResults.rank}
                    {getRankSuffix(userResults.rank)} place!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto">
          <div className="bg-indigo-600 text-white p-6">
            <h2 className="text-2xl font-bold text-center">Leaderboard</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {participants.map((participant, index) => (
                <div
                  key={participant.user_id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    participant.user_id === user.id
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className={`text-2xl font-bold w-12 text-center ${getMedalColor(index + 1)}`}>
                      {getMedalIcon(index + 1)}
                    </div>
                    
                    {/* User Info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-800">
                          {participant.username}
                        </h3>
                        {participant.user_id === user.id && (
                          <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                        {participant.is_host && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            Host
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {participant.correct_answers}/{participant.total_questions} correct
                        ({calculateAccuracy(participant.correct_answers, participant.total_questions)}% accuracy)
                      </div>
                    </div>
                  </div>
                  
                  {/* Score */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {participant.score}
                    </div>
                    <div className="text-sm text-gray-600">points</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quiz Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {results?.total_questions || 0}
            </div>
            <div className="text-gray-600">Total Questions</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {participants.length}
            </div>
            <div className="text-gray-600">Participants</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {results?.average_score ? Math.round(results.average_score) : 0}
            </div>
            <div className="text-gray-600">Average Score</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            Back to Dashboard
          </button>
          
          <button
            onClick={() => navigate('/create-room')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Create New Quiz
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            Refresh Results
          </button>
        </div>

        {/* Share Results */}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">Share your results:</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                const text = `I just completed "${room?.name}" quiz and scored ${userResults?.score} points! 🎉`;
                navigator.clipboard.writeText(text);
                alert('Results copied to clipboard!');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Copy Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomResultsPage;
