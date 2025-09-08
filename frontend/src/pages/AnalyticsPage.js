import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import api from '../api/axiosConfig';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  ArrowTrendingUpIcon,    
  ClockIcon, 
  AcademicCapIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowDownTrayIcon      
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); 
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/quiz/analytics/');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format) => {
    try {
      const response = await api.get('/quiz/export/', {
        params: { format, time_range: timeRange },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz-analytics-${timeRange}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            No Analytics Data
          </h1>
          <p className="text-slate-600 mb-6">
            Complete some quizzes to see your analytics data.
          </p>
          <Button onClick={() => navigate('/generate')}>
            Create Your First Quiz
          </Button>
        </Card>
      </div>
    );
  }

  // Chart configurations
  const scoresTrendData = {
    labels: ['Recent Performance', 'Overall Performance'],
    datasets: [
      {
        label: 'Accuracy %',
        data: [
          analytics.recent_performance?.accuracy || 0,
          analytics.overview?.overall_accuracy || 0
        ],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  // Replace topic performance with Pass vs Fail chart
  const passVsFailData = {
    labels: ['Passed', 'Failed'],
    datasets: [
      {
        label: 'Quizzes',
        data: [
          analytics.overview?.total_passed_quizzes || 0,
          analytics.overview?.total_failed_quizzes || 0,
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
      },
    ],
  };

  const difficultyBreakdownData = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [
      {
        data: [
          analytics.performance_by_difficulty?.easy?.quizzes_taken || 0,
          analytics.performance_by_difficulty?.medium?.quizzes_taken || 0,
          analytics.performance_by_difficulty?.hard?.quizzes_taken || 0,
        ],
        backgroundColor: [
          '#10b981',
          '#f59e0b',
          '#ef4444',
        ],
      },
    ],
  };

  const quizTypePerformanceData = {
    labels: ['Multiple Choice', 'True/False', 'Fill in Blank', 'Descriptive'],
    datasets: [
      {
        label: 'Accuracy %',
        data: [
          analytics.performance_by_type?.multiple_choice || 0,
          analytics.performance_by_type?.true_false || 0,
          analytics.performance_by_type?.fill_in_blank || 0,
          analytics.performance_by_type?.descriptive || 0,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-600">Track your learning progress and performance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <Button
            variant="outline"
            onClick={() => exportData('csv')}
            className="flex items-center space-x-2"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <AcademicCapIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {analytics.overview?.total_quizzes_taken || 0}
          </div>
          <div className="text-sm text-slate-600">Total Quizzes</div>
        </Card>

        <Card className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {analytics.overview?.overall_accuracy || 0}%
          </div>
          <div className="text-sm text-slate-600">Average Score</div>
        </Card>

        <Card className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ClockIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {Math.round((analytics.time_analytics?.average_time_per_question || 0) / 60)}m
          </div>
          <div className="text-sm text-slate-600">Avg Time per Question</div>
        </Card>

        <Card className="text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {analytics.streaks?.current_streak || 0}
          </div>
          <div className="text-sm text-slate-600">Current Streak</div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Score Trend */}
        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Score Trend Over Time
          </h2>
          <div className="h-64">
            <Line data={scoresTrendData} options={chartOptions} />
          </div>
        </Card>

        {/* Pass vs Fail */}
        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Pass vs Fail
          </h2>
          <div className="h-64">
            <Bar data={passVsFailData} options={chartOptions} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quiz Difficulty Breakdown */}
        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Quiz Difficulty Breakdown
          </h2>
          <div className="h-64">
            <Doughnut data={difficultyBreakdownData} />
          </div>
        </Card>

        {/* Quiz Type Performance */}
        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Performance by Quiz Type
          </h2>
          <div className="h-64">
            <Bar data={quizTypePerformanceData} options={chartOptions} />
          </div>
        </Card>

        {/* Study Patterns */}
        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Performance Trends
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Performance Trend</span>
              <span className={`font-semibold ${
                analytics.trend === 'improving' ? 'text-green-600' :
                analytics.trend === 'declining' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {analytics.trend === 'improving' ? '📈 Improving' :
                 analytics.trend === 'declining' ? '📉 Declining' :
                 '➡️ Stable'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Recent Accuracy</span>
              <span className="font-semibold text-slate-900">
                {analytics.recent_performance?.accuracy || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Overall Accuracy</span>
              <span className="font-semibold text-slate-900">
                {analytics.overview?.overall_accuracy || 0}%
              </span>
            </div>
          </div>
        </Card>

        {/* Achievements */}
        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Recent Achievements
          </h2>
          <div className="space-y-3">
            {analytics.recent_achievements?.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm">🏆</span>
                </div>
                <div>
                  <div className="font-medium text-slate-900">
                    {achievement.name}
                  </div>
                  <div className="text-sm text-slate-600">
                    {achievement.description}
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center text-slate-500 py-4">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2" />
                <p>No recent achievements</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Card className="mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          Detailed Statistics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">
              {analytics.overview?.total_questions_answered || 0}
            </div>
            <div className="text-sm text-slate-600">Questions Answered</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">
              {analytics.overview?.total_correct_answers || 0}
            </div>
            <div className="text-sm text-slate-600">Correct Answers</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">
              {Math.round((analytics.time_analytics?.average_time_per_question || 0) / 60)}m
            </div>
            <div className="text-sm text-slate-600">Avg Time per Question</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">
              {analytics.streaks?.longest_streak || 0}
            </div>
            <div className="text-sm text-slate-600">Longest Streak</div>
          </div>
        </div>
        
        {/* Additional Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analytics.overview?.pass_rate || 0}%
            </div>
            <div className="text-sm text-slate-600">Pass Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {analytics.overview?.total_quizzes_taken || 0}
            </div>
            <div className="text-sm text-slate-600">Total Quizzes</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {analytics.overview?.total_passed_quizzes || 0}
            </div>
            <div className="text-sm text-slate-600">Quizzes Passed</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
