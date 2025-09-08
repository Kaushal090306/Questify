import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import api from '../api/axiosConfig';
import { 
  TrophyIcon, 
  FireIcon, 
  ChartBarIcon,
  UsersIcon,
  CalendarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [leaderboards, setLeaderboards] = useState({
    global: [],
    weekly: [],
    monthly: []
  });
  const [userRank, setUserRank] = useState(null);
  const [activeTab, setActiveTab] = useState('global');
  const [timeRange, setTimeRange] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboards();
  }, [activeTab, timeRange]);

  const loadLeaderboards = async () => {
    try {
      setLoading(true);
      const response = await api.get('/quiz/leaderboard/', {
        params: {
          type: activeTab,
          time_range: timeRange
        }
      });
      
      setLeaderboards(prev => ({
        ...prev,
        [activeTab]: response.data.leaderboard
      }));
      setUserRank(response.data.user_rank);
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'text-yellow-600 bg-yellow-50';
      case 2:
        return 'text-gray-600 bg-gray-50';
      case 3:
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const tabs = [
    { id: 'global', name: 'Global', icon: GlobeAltIcon, description: 'Top performers worldwide' },
    { id: 'weekly', name: 'Weekly', icon: CalendarIcon, description: 'This week\'s champions' },
    { id: 'monthly', name: 'Monthly', icon: ChartBarIcon, description: 'Monthly top scorers' }
  ];

  const currentLeaderboard = leaderboards[activeTab] || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Leaderboards
        </h1>
        <p className="text-lg text-slate-600">
          See how you stack up against other learners
        </p>
      </div>

      {/* User Rank Card */}
      {userRank && (
        <Card className="mb-8 bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <TrophyIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Your Rank: #{userRank.rank}
                </h3>
                <p className="text-slate-600">
                  {userRank.points} points • {userRank.quizzes_completed} quizzes completed
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">
                {userRank.percentage}%
              </div>
              <div className="text-sm text-slate-600">Avg Score</div>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Time Range Filter */}
      <div className="flex items-center space-x-4 mb-8">
        <span className="text-sm font-medium text-slate-700">Time Range:</span>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Time</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Leaderboard */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {tabs.find(t => t.id === activeTab)?.name} Leaderboard
          </h2>
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <UsersIcon className="w-4 h-4" />
            <span>{currentLeaderboard.length} participants</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : currentLeaderboard.length > 0 ? (
          <div className="space-y-3">
            {currentLeaderboard.map((entry, index) => (
              <div
                key={entry.id || index}
                className={`leaderboard-item ${
                  entry.is_current_user ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${getRankColor(entry.rank)}`}>
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-slate-900">
                        {entry.name}
                      </h3>
                      {entry.is_current_user && (
                        <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      {entry.total_quizzes} quizzes • {entry.streak} day streak
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-900">
                          {entry.points}
                        </div>
                        <div className="text-xs text-slate-500">Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary-600">
                          {entry.average_score}%
                        </div>
                        <div className="text-xs text-slate-500">Avg Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrophyIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No data available for this time range</p>
          </div>
        )}
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <TrophyIcon className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {currentLeaderboard[0]?.points || 0}
          </div>
          <div className="text-sm text-slate-600">Top Score</div>
        </Card>

        <Card className="text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FireIcon className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {Math.max(...currentLeaderboard.map(e => e.streak || 0), 0)}
          </div>
          <div className="text-sm text-slate-600">Longest Streak</div>
        </Card>

        <Card className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {Math.round(currentLeaderboard.reduce((sum, e) => sum + (e.average_score || 0), 0) / currentLeaderboard.length) || 0}%
          </div>
          <div className="text-sm text-slate-600">Average Score</div>
        </Card>
      </div>
    </div>
  );
};

export default LeaderboardPage;
