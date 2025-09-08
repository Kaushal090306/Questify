import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import api from '../api/axiosConfig';
import { 
  TrophyIcon, 
  ChartBarIcon, 
  ShareIcon, 
  BookmarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const ResultsPage = () => {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    if (location.state?.results) {
      setResults(location.state.results);
      setLoading(false);
      checkForNewBadges();
    } else {
      // Fetch results if not passed via state
      fetchResults();
    }
  }, []);

  const fetchResults = async () => {
    try {
      // This would need to be implemented - get latest attempt results
      const response = await api.get(`/quiz/attempts/?quiz=${quizId}&limit=1`);
      if (response.data.results?.length > 0) {
        setResults(response.data.results[0]);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const checkForNewBadges = async () => {
    try {
      const response = await api.get('/users/stats/');
      const userBadges = response.data.badges || [];
      // Check if there are new badges earned (this would need more sophisticated logic)
      setBadges(userBadges.slice(-2)); // Show last 2 badges as "new"
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreMessage = (percentage) => {
    if (percentage >= 90) return 'Excellent work! 🎉';
    if (percentage >= 70) return 'Good job! 👍';
    if (percentage >= 50) return 'Not bad, keep practicing! 💪';
    return 'Keep studying and try again! 📚';
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Quiz Results',
      text: `I scored ${results.score}% on this quiz!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(
          `${shareData.text} ${shareData.url}`
        );
        alert('Results copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBookmarkQuestion = async (questionId) => {
    try {
      await api.post(`/quiz/bookmark/${questionId}/`);
      // Update UI to show bookmarked
    } catch (error) {
      console.error('Error bookmarking question:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Results Not Found
          </h1>
          <p className="text-slate-600 mb-6">
            We couldn't find the results for this quiz.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Main Results Card */}
      <Card className="text-center mb-8">
        <div className="mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrophyIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Quiz Complete!
          </h1>
          <p className="text-slate-600">
            {getScoreMessage(results.score)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(results.score)} mb-2`}>
              {results.score}%
            </div>
            <div className="text-slate-600">Final Score</div>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${results.passed ? 'text-green-600' : 'text-red-600'} mb-2`}>
              {results.passed ? 'PASSED' : 'FAILED'}
            </div>
            <div className="text-slate-600">Result</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-slate-900 mb-2">
              {results.total_questions || results.results?.length || 0}
            </div>
            <div className="text-slate-600">Questions</div>
          </div>
        </div>

        {/* Enhanced Summary Section */}
        {results.summary && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{results.summary.accuracy}</div>
                <div className="text-sm text-slate-600">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{results.summary.performance}</div>
                <div className="text-sm text-slate-600">Performance Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.correct_answers || 0}</div>
                <div className="text-sm text-slate-600">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.incorrect_answers || 0}</div>
                <div className="text-sm text-slate-600">Incorrect Answers</div>
              </div>
            </div>
            
            {/* Strength and Improvement Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">💪 Strength Areas</h4>
                {results.summary.strength_areas?.length > 0 ? (
                  <ul className="space-y-1">
                    {results.summary.strength_areas.map((area, index) => (
                      <li key={index} className="text-sm text-slate-700">
                        {area.topic}: {area.correct_answers} correct
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No specific strengths identified</p>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-orange-700 mb-2">📚 Areas for Improvement</h4>
                {results.summary.improvement_areas?.length > 0 ? (
                  <ul className="space-y-1">
                    {results.summary.improvement_areas.map((area, index) => (
                      <li key={index} className="text-sm text-slate-700">
                        {area.topic}: {area.incorrect_answers} incorrect
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">Great job across all topics!</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="primary"
            onClick={() => setShowDetailedResults(!showDetailedResults)}
            className="flex items-center space-x-2"
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>View Detailed Results</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={handleShare}
            className="flex items-center space-x-2"
          >
            <ShareIcon className="w-5 h-5" />
            <span>Share Results</span>
          </Button>
          
          <Button
            variant="accent"
            onClick={() => navigate('/generate')}
            className="flex items-center space-x-2"
          >
            <SparklesIcon className="w-5 h-5" />
            <span>Create Another Quiz</span>
          </Button>
        </div>
      </Card>

      {/* New Badges */}
      {badges.length > 0 && (
        <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              🎉 New Badges Earned!
            </h2>
            <div className="flex justify-center space-x-4">
              {badges.map((badge, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrophyIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="font-semibold text-slate-900">{badge.name}</div>
                  <div className="text-sm text-slate-600">{badge.description}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Detailed Results */}
      {showDetailedResults && (
        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Question by Question Review
          </h2>
          
          <div className="space-y-6">
            {(results.detailed_results || results.results)?.map((result, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-slate-900">
                        Question {index + 1}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        result.topic ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {result.topic || 'General'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        result.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        result.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {result.difficulty || 'medium'}
                      </span>
                    </div>
                    <p className="text-slate-700 mb-3">
                      {result.question_text}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {result.is_correct ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-6 h-6 text-red-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBookmarkQuestion(result.question_id)}
                    >
                      <BookmarkIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Multiple Choice Options Display */}
                {result.options && result.options.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-slate-600 mb-2">Options:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {result.options.map((option, optIndex) => (
                        <div key={optIndex} className={`p-2 rounded border ${
                          option === result.correct_answer 
                            ? 'bg-green-100 border-green-300 text-green-800' 
                            : option === result.user_answer && !result.is_correct
                            ? 'bg-red-100 border-red-300 text-red-800'
                            : 'bg-gray-50 border-gray-200 text-slate-700'
                        }`}>
                          {option}
                          {option === result.correct_answer && (
                            <span className="ml-2 text-green-600">✓</span>
                          )}
                          {option === result.user_answer && !result.is_correct && (
                            <span className="ml-2 text-red-600">✗</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Your Answer:</div>
                    <div className={`p-2 rounded ${
                      result.is_correct 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.user_answer || 'No answer provided'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Correct Answer:</div>
                    <div className="p-2 rounded bg-green-100 text-green-800">
                      {result.correct_answer}
                    </div>
                  </div>
                </div>
                
                {result.explanation && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>Explanation:</strong> {result.explanation}
                    </div>
                  </div>
                )}
                
                {/* Points Information */}
                <div className="mt-3 text-sm text-slate-600">
                  Points: {result.points_earned || 0}/{result.max_points || 1}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <Button
          variant="primary"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
        
        <Button
          variant="outline"
          onClick={() => navigate('/analytics')}
        >
          View Analytics
        </Button>
        
        <Button
          variant="secondary"
          onClick={() => navigate(`/quiz/${quizId}`)}
        >
          Retake Quiz
        </Button>
      </div>
    </div>
  );
};

export default ResultsPage;
