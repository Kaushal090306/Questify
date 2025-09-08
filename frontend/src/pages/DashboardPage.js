import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuiz } from '../contexts/QuizContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import HandTapLoader from '../components/ui/HandTapLoader';
import api from '../api/axiosConfig';
import {
  AcademicCapIcon,
  ClockIcon,
  TrophyIcon,
  ChartBarIcon,
  PlusIcon,
  FireIcon,
  SparklesIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  const { user } = useAuth();
  const { quizzes, fetchQuizzes, loading } = useQuiz();
  const [stats, setStats] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [dailyPractice, setDailyPractice] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [analyticsRes, attemptsRes] = await Promise.all([
        api.get('/quiz/analytics/'),
        api.get('/quiz/attempts/')
      ]);

      setStats(analyticsRes.data);
      setRecentAttempts(attemptsRes.data.attempts?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const quickStats = [
    {
      name: 'Total Quizzes',
      value: stats?.overview?.total_quizzes_taken || 0,
      icon: AcademicCapIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100'
    },
    {
      name: 'Average Score',
      value: `${stats?.overview?.overall_accuracy || 0}%`,
      icon: ChartBarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Pass Rate',
      value: `${stats?.overview?.pass_rate || 0}%`,
      icon: FireIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      name: 'Passed Quizzes',
      value: stats?.overview?.total_passed_quizzes || 0,
      icon: TrophyIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  ];

  if (loadingStats) {
    return (
      <HandTapLoader 
        isVisible={true} 
        /*message="Loading your dashboard..." */
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back {user?.first_name || user?.email?.split('@')[0]}!
        </h1>
        <p className="text-slate-600">
          Ready to continue your learning journey? Let's create some amazing quizzes!
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickStats.map((stat, index) => (
          <Card key={index} className="text-center">
            <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-slate-600">{stat.name}</div>
          </Card>
        ))}
      </div>

      {/* Daily Practice */}
      {dailyPractice && !dailyPractice.is_completed && (
        <Card className="mb-8 bg-gradient-to-r from-accent-50 to-primary-50 border-accent-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-accent-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Daily Practice Available
                </h3>
                <p className="text-slate-600">
                  Your personalized practice quiz is ready! Complete it to maintain your streak.
                </p>
              </div>
            </div>
            <Link to={`/quiz/${dailyPractice.quiz.id}`}>
              <Button variant="accent">
                Start Practice
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="text-center hover:shadow-lg transition-shadow duration-200">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <PlusIcon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Create New Quiz
          </h3>
          <p className="text-slate-600 mb-4">
            Upload a document and let AI generate quiz questions
          </p>
          <Link to="/generate">
            <Button variant="primary" size="sm">
              Generate Quiz
            </Button>
          </Link>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow duration-200">
          <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Join Quiz Room
          </h3>
          <p className="text-slate-600 mb-4">
            Enter a room code to join a multiplayer quiz session
          </p>
          <Link to="/join-room">
            <Button variant="secondary" size="sm">
              Join Room
            </Button>
          </Link>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow duration-200">
          <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-primary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            View Analytics
          </h3>
          <p className="text-slate-600 mb-4">
            Track your progress and performance insights
          </p>
          <Link to="/analytics">
            <Button variant="accent" size="sm">
              View Analytics
            </Button>
          </Link>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Quizzes */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Recent Quizzes
            </h3>
            {/* Removed View All link for Recent Quizzes as per requirement */}
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-slate-600">Loading recent quizzes...</div>
            </div>
          ) : quizzes.length > 0 ? (
            <div className="space-y-4">
              {quizzes.slice(0, 5).map((quiz) => (
                <div key={quiz.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <AcademicCapIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">
                        {quiz.title}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {quiz.total_questions} questions • {quiz.difficulty}
                      </p>
                    </div>
                  </div>
                  <Link to={`/quiz/${quiz.id}`}>
                    <Button variant="outline" size="sm">
                      Take Quiz
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AcademicCapIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">
                No quizzes yet. Create your first quiz to get started!
              </p>
              <Link to="/generate">
                <Button variant="primary" size="sm" className="mt-4">
                  Create Quiz
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Recent Attempts */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Recent Attempts
            </h3>
            <Link to="/recent-quizzes">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
          
          {recentAttempts.length > 0 ? (
            <div className="space-y-4">
              {recentAttempts.map((attempt) => (
                <div key={attempt.attempt_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      attempt.score >= 80 ? 'bg-green-100' : 
                      attempt.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <TrophyIcon className={`w-5 h-5 ${
                        attempt.score >= 80 ? 'text-green-600' : 
                        attempt.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">
                        {attempt.quiz_title}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {attempt.correct_answers}/{attempt.total_questions} ({Math.round(attempt.score)}%)
                        <span className="mx-2">•</span>
                        <span className="capitalize">{attempt.quiz_type?.replace('_', ' ')} • {attempt.quiz_difficulty}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-1">
                      Quiz created: {attempt.quiz_created_at ? new Date(attempt.quiz_created_at).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-sm text-slate-500">
                      Attempted: {attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">
                No quiz attempts yet. Take your first quiz to see your progress!
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Badges Section */}
      {stats?.badges && stats.badges.length > 0 && (
        <Card className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Your Badges
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stats.badges.map((badge, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrophyIcon className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-medium text-slate-900 text-sm">
                  {badge.name}
                </h4>
                <p className="text-xs text-slate-600">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
