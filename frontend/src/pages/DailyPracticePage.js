import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import api from '../api/axiosConfig';
import { 
  FireIcon, 
  CalendarIcon, 
  TrophyIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const DailyPracticePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [todaysPractice, setTodaysPractice] = useState(null);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streakData, setStreakData] = useState(null);

  useEffect(() => {
    loadDailyPracticeData();
  }, []);

  const loadDailyPracticeData = async () => {
    try {
      const [practiceRes, statsRes] = await Promise.all([
        api.get('/quiz/daily-practice/'),
        api.get('/users/stats/')
      ]);

      const practices = practiceRes.data.results || [];
      const today = new Date().toISOString().split('T')[0];
      
      setTodaysPractice(practices.find(p => p.date_assigned === today));
      setPracticeHistory(practices.slice(0, 7)); // Last 7 days
      setStats(statsRes.data);
      setStreakData({
        current: statsRes.data.current_streak,
        best: statsRes.data.best_streak
      });
    } catch (error) {
      console.error('Error loading daily practice data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTodaysPractice = async () => {
    try {
      setLoading(true);
      await api.post('/quiz/daily-practice/generate/');
      await loadDailyPracticeData();
    } catch (error) {
      console.error('Error generating daily practice:', error);
    } finally {
      setLoading(false);
    }
  };

  const startPractice = (practiceId) => {
    navigate(`/quiz/${practiceId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDaysOfWeek = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date);
    }
    
    return days;
  };

  const isPracticeCompleted = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return practiceHistory.some(p => 
      p.date_assigned === dateStr && p.is_completed
    );
  };

  const getStreakColor = (streak) => {
    if (streak >= 30) return 'text-purple-600';
    if (streak >= 14) return 'text-orange-600';
    if (streak >= 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Daily Practice
        </h1>
        <p className="text-lg text-slate-600">
          Keep your learning streak alive with personalized daily quizzes
        </p>
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FireIcon className="w-8 h-8 text-white" />
          </div>
          <div className={`text-3xl font-bold mb-2 ${getStreakColor(streakData?.current || 0)}`}>
            {streakData?.current || 0}
          </div>
          <div className="text-slate-600">Current Streak</div>
        </Card>

        <Card className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrophyIcon className="w-8 h-8 text-white" />
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-2">
            {streakData?.best || 0}
          </div>
          <div className="text-slate-600">Best Streak</div>
        </Card>

        <Card className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-8 h-8 text-white" />
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-2">
            {practiceHistory.filter(p => p.is_completed).length}
          </div>
          <div className="text-slate-600">Completed This Week</div>
        </Card>
      </div>

      {/* Today's Practice */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Today's Practice
          </h2>
          <div className="flex items-center space-x-2 text-slate-600">
            <CalendarIcon className="w-5 h-5" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {todaysPractice ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {todaysPractice.quiz.title}
                </h3>
                <p className="text-slate-600">
                  {todaysPractice.quiz.total_questions} questions • {todaysPractice.quiz.difficulty}
                </p>
                {todaysPractice.is_completed && (
                  <div className="flex items-center space-x-2 mt-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 text-sm">
                      Completed at {new Date(todaysPractice.completed_at).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              {todaysPractice.is_completed ? (
                <Button
                  variant="outline"
                  onClick={() => startPractice(todaysPractice.quiz.id)}
                >
                  Review Quiz
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => startPractice(todaysPractice.quiz.id)}
                  className="flex items-center space-x-2"
                >
                  <span>Start Practice</span>
                  <FireIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Practice Available
            </h3>
            <p className="text-slate-600 mb-4">
              Your daily practice quiz hasn't been generated yet.
            </p>
            <Button
              onClick={generateTodaysPractice}
              variant="primary"
              className="flex items-center space-x-2"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Generate Today's Practice</span>
            </Button>
          </div>
        )}
      </Card>

      {/* Weekly Calendar */}
      <Card className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          This Week's Progress
        </h2>
        
        <div className="grid grid-cols-7 gap-4">
          {getDaysOfWeek().map((date, index) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const isCompleted = isPracticeCompleted(date);
            const isPast = date < new Date() && !isToday;
            
            return (
              <div
                key={index}
                className={`text-center p-4 rounded-lg border-2 ${
                  isToday && isCompleted
                    ? 'border-green-500 bg-green-50'
                    : isToday
                    ? 'border-primary-500 bg-primary-50'
                    : isCompleted
                    ? 'border-green-200 bg-green-50'
                    : isPast
                    ? 'border-red-200 bg-red-50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="text-sm font-medium text-slate-600 mb-2">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-lg font-bold text-slate-900 mb-2">
                  {date.getDate()}
                </div>
                <div className="flex justify-center">
                  {isCompleted ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  ) : isPast ? (
                    <XCircleIcon className="w-6 h-6 text-red-400" />
                  ) : isToday ? (
                    <ClockIcon className="w-6 h-6 text-primary-600" />
                  ) : (
                    <div className="w-6 h-6 border-2 border-slate-300 rounded-full" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Practice History */}
      <Card>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Recent Practice Sessions
        </h2>
        
        {practiceHistory.length > 0 ? (
          <div className="space-y-4">
            {practiceHistory.map((practice, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    practice.is_completed ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    {practice.is_completed ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    ) : (
                      <ClockIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {formatDate(practice.date_assigned)}
                    </div>
                    <div className="text-sm text-slate-600">
                      {practice.quiz.title}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-slate-600">
                      {practice.quiz.total_questions} questions
                    </div>
                    {practice.is_completed && (
                      <div className="text-sm text-green-600">
                        Completed
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startPractice(practice.quiz.id)}
                  >
                    {practice.is_completed ? 'Review' : 'Start'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <SparklesIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">
              No practice sessions yet. Start your first daily practice!
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DailyPracticePage;
