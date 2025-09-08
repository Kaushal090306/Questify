import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Button from '../components/ui/Button';
import { toast } from 'react-toastify';

const GenerateQuiz = () => {
  const [file, setFile] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Debug effect to monitor quiz state changes
  useEffect(() => {
    console.log('Quiz state changed:', quiz);
    if (quiz) {
      console.log('Quiz has questions:', quiz.questions);
      console.log('Quiz questions length:', quiz.questions?.length);
      console.log('Quiz structure:', {
        quiz_id: quiz.quiz_id,
        title: quiz.title,
        questions: quiz.questions,
        fallback_used: quiz.fallback_used,
        message: quiz.message
      });
    }
  }, [quiz]);

  // Debug effect to monitor error state changes
  useEffect(() => {
    console.log('Error state changed:', error);
  }, [error]);

  const submitFile = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a document file.');
      return;
    }
  
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('num_questions', 5);
    formData.append('difficulty', 'medium');
    formData.append('quiz_type', 'multiple_choice');
  
    try {
      const resp = await api.post('/quiz/generate/', formData, {
        timeout: 60000,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
  
      // Validate minimal shape
      if (!resp.data?.quiz_id || !Array.isArray(resp.data?.questions)) {
        throw new Error('Invalid response from server');
      }
  
      setQuiz({
        quiz_id: resp.data.quiz_id,
        title: resp.data.title,
        questions: resp.data.questions
      });
      setAnswers({});
      setError('');
      
      toast.success('Quiz generated successfully!');
  
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error generating quiz.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  

  const handleAnswerChange = (qid, val) => {
    setAnswers(prev => ({ ...prev, [qid]: val }));
  };

  const submitAnswers = async () => {
    if (!quiz) return;
    
    // Check if user has answered any questions
    const answeredQuestions = Object.keys(answers).filter(key => answers[key] && answers[key].trim() !== '');
    if (answeredQuestions.length === 0) {
      alert('Please answer at least one question before submitting.');
      return;
    }
    
    setLoading(true);
    
    try {
      const resp = await api.post(`/quiz/${quiz.quiz_id}/take/`, {
        answers: answers
      });
      alert(`Score: ${resp.data.score.toFixed(2)}%. Passed: ${resp.data.passed ? 'Yes' : 'No'}`);
      
      // Clear the quiz and answers after successful submission
      setQuiz(null);
      setAnswers({});
    } catch (err) {
      alert(err.response?.data?.error || 'Error submitting answers.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Generate AI Quiz
        </h1>
        <p className="text-lg text-slate-600">
          Upload your document and let our AI create engaging quiz questions
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={submitFile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Upload Document
            </label>
            <input
              type="file"
              accept=".pdf,.docx,.pptx"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-sm text-slate-500 mt-1">
              Supports PDF, DOCX, and PPTX files up to 10MB
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Generating Quiz...' : 'Generate Quiz'}
          </Button>
          
          {/* Debug button */}
          <Button 
            type="button" 
            onClick={() => {
              const testQuiz = {
                quiz_id: 'test-123',
                title: 'Test Quiz',
                questions: [
                  {
                    question_id: '1',
                    question_text: 'Test question 1?',
                    question_type: 'multiple_choice',
                    options: ['A', 'B', 'C', 'D'],
                    topic: 'Test',
                    difficulty: 'medium'
                  }
                ]
              };
              console.log('Setting test quiz:', testQuiz);
              setQuiz(testQuiz);
              setError('');
            }}
            className="w-full mt-2 bg-gray-500 hover:bg-gray-600"
          >
            Test Quiz Display
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Debug info */}
      {quiz && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            Debug: Quiz state exists, questions: {quiz.questions ? 'Yes' : 'No'}, 
            questions length: {quiz.questions?.length || 0}
          </p>
          <pre className="text-xs mt-2 overflow-auto">
            {JSON.stringify(quiz, null, 2)}
          </pre>
        </div>
      )}

      {quiz && quiz.questions && quiz.questions.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          {console.log('Rendering quiz with data:', quiz)}
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{quiz.title}</h2>
          
          <div className="mb-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Answered: {Object.keys(answers).filter(key => answers[key] && answers[key].trim() !== '').length} / {quiz.questions.length} questions
            </p>
          </div>
          <div className="space-y-6">
            {quiz.questions.map((q, idx) => (
              <div key={q.question_id} className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  {idx + 1}. {q.question_text}
                </h3>
                <div className="space-y-2">
                  {q.options.map(opt => (
                    <label key={opt} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={`q_${q.question_id}`}
                        value={opt}
                        checked={answers[q.question_id] === opt}
                        onChange={() => handleAnswerChange(q.question_id, opt)}
                        className="w-4 h-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                      />
                      <span className="text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button 
              onClick={submitAnswers}
              disabled={Object.keys(answers).filter(key => answers[key] && answers[key].trim() !== '').length === 0 || loading}
              className="w-full"
            >
              {loading ? 'Submitting...' : 'Submit Answers'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GenerateQuiz;
