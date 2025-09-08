import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import {
  TrophyIcon,
  ClockIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const RecentQuizzesPage = () => {
  const [attempts, setAttempts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/quiz/attempts/');
        setAttempts(res.data.attempts || []);
        setSummary(res.data.summary || null);
      } catch (e) {
        // noop
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">All Recent Quizzes</h1>
        <Button onClick={() => navigate('/analytics')} variant="outline">View Analytics</Button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="text-center p-4">
            <div className="text-2xl font-bold">{summary.total_attempts}</div>
            <div className="text-sm text-slate-600">Total Attempts</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold">{summary.average_score}%</div>
            <div className="text-sm text-slate-600">Average Score</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold">{summary.total_passed}</div>
            <div className="text-sm text-slate-600">Passed</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold">{summary.total_failed}</div>
            <div className="text-sm text-slate-600">Failed</div>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : attempts.length === 0 ? (
        <Card className="p-8 text-center">
          <AcademicCapIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No quiz attempts yet</h3>
          <p className="text-slate-600 mb-4">Create your first quiz to see your attempts here.</p>
          <Link to="/generate">
            <Button>Create Quiz</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => (
            <Card key={attempt.attempt_id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Score Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    attempt.score >= 80 ? 'bg-green-100' : 
                    attempt.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <TrophyIcon className={`w-6 h-6 ${
                      attempt.score >= 80 ? 'text-green-600' : 
                      attempt.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                  
                  {/* Quiz Details */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {attempt.quiz_title}
                    </h3>
                    
                    {/* Quiz Metadata */}
                    <div className="flex items-center space-x-4 text-sm text-slate-600 mb-2">
                      <span className="flex items-center space-x-1">
                        <AcademicCapIcon className="w-4 h-4" />
                        <span className="capitalize">{attempt.quiz_type.replace('_', ' ')}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <ChartBarIcon className="w-4 h-4" />
                        <span className="capitalize">{attempt.quiz_difficulty}</span>
                      </span>
                      <span>{attempt.total_questions} questions</span>
                    </div>
                    
                    {/* Score and Performance */}
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`font-medium ${
                        attempt.score >= 80 ? 'text-green-600' : 
                        attempt.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        Score: {attempt.correct_answers}/{attempt.total_questions} ({Math.round(attempt.score)}%)
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {attempt.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Dates and Actions */}
                <div className="text-right space-y-2">
                  {/* Quiz Creation Date */}
                  <div className="flex items-center justify-end space-x-1 text-sm text-slate-500">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>Quiz created: {attempt.quiz_created_at ? new Date(attempt.quiz_created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  
                  {/* Attempt Date */}
                  <div className="flex items-center justify-end space-x-1 text-sm text-slate-500">
                    <ClockIcon className="w-4 h-4" />
                    <span>Attempted: {attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex justify-end">
                    <Link to={`/attempts/${attempt.attempt_id}`}>
                      <Button variant="primary" size="sm">View Details</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentQuizzesPage;


