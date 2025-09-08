import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

const AttemptDetailPage = () => {
  const { attemptId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/quiz/attempts/${attemptId}/`);
        setData(res.data);
      } catch (e) {
        // noop
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16"><Spinner size="lg" /></div>
    );
  }

  if (!data) {
    return <div className="max-w-4xl mx-auto p-6">No data</div>;
  }

  const { attempt, questions, documents } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{attempt.quiz_title}</h1>
        <Link to="/recent-quizzes"><Button variant="outline">Back</Button></Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 text-center"><div className="text-2xl font-bold">{attempt.score.toFixed ? attempt.score.toFixed(1) : attempt.score}%</div><div className="text-sm text-slate-600">Score</div></Card>
        <Card className="p-4 text-center"><div className="text-2xl font-bold">{attempt.total_questions}</div><div className="text-sm text-slate-600">Questions</div></Card>
        <Card className="p-4 text-center"><div className="text-2xl font-bold">{attempt.quiz_type}</div><div className="text-sm text-slate-600">Type</div></Card>
        <Card className="p-4 text-center"><div className="text-2xl font-bold">{attempt.difficulty}</div><div className="text-sm text-slate-600">Difficulty</div></Card>
      </div>

      {documents && documents.length > 0 && (
        <Card className="p-4 mb-6">
          <div className="font-semibold mb-2">Source Documents</div>
          <ul className="list-disc pl-5">
            {documents.map((doc, idx) => (
              <li key={idx}><a href={doc} target="_blank" rel="noreferrer" className="text-blue-600 underline">Document {idx + 1}</a></li>
            ))}
          </ul>
        </Card>
      )}

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <Card key={q.question_id} className="p-4">
            <div className="font-semibold mb-2">{idx + 1}. {q.question_text}</div>
            {q.question_type === 'multiple_choice' && (
              <ul className="list-disc pl-6 text-sm">
                {q.options.map((o) => (
                  <li key={o} className={q.user_answer === o ? 'font-semibold' : ''}>{o}</li>
                ))}
              </ul>
            )}
            {q.question_type === 'true_false' && (
              <div className="text-sm">Options: True / False</div>
            )}
            {(q.question_type === 'fill_in_blank' || q.question_type === 'descriptive') && (
              <div className="text-sm text-slate-700">Your answer: {q.user_answer || '-'}</div>
            )}
            <div className="mt-2 text-sm">Correct answer: <span className="font-medium">{q.correct_answer}</span></div>
            <div className={`mt-1 text-sm ${q.is_correct ? 'text-green-600' : 'text-red-600'}`}>{q.is_correct ? 'Correct' : 'Incorrect'}</div>
            {q.explanation && <div className="mt-2 text-sm text-slate-600">Explanation: {q.explanation}</div>}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AttemptDetailPage;


