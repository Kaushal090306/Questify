import React, { createContext, useState, useContext, useCallback } from 'react';
import api from '../api/axiosConfig';
import { toast } from 'react-toastify';

const QuizContext = createContext();

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

export const QuizProvider = ({ children }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quizProgress, setQuizProgress] = useState({
    currentQuestion: 0,
    answers: {},
    timeRemaining: null,
    startTime: null
  });

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/quiz/list/');
      setQuizzes(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateQuiz = async (formData) => {
    try {
      setLoading(true);
      const response = await api.post('/quiz/generate/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Quiz generated successfully!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to generate quiz';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quizId) => {
    try {
      setLoading(true);
      const response = await api.get(`/quiz/${quizId}/take/`);
      setCurrentAttempt({
        ...response.data,
        questions: response.data.questions
      });
      setCurrentQuiz(response.data);
      setQuizProgress({
        currentQuestion: 0,
        answers: {},
        timeRemaining: response.data.time_limit,
        startTime: new Date()
      });
      return response.data;
    } catch (error) {
      toast.error('Failed to start quiz');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = (questionId, answer) => {
    setQuizProgress(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer
      }
    }));
  };

  const nextQuestion = () => {
    setQuizProgress(prev => ({
      ...prev,
      currentQuestion: prev.currentQuestion + 1
    }));
  };

  const previousQuestion = () => {
    setQuizProgress(prev => ({
      ...prev,
      currentQuestion: Math.max(0, prev.currentQuestion - 1)
    }));
  };

  const submitQuiz = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/quiz/${currentQuiz.quiz_id}/take/`, {
        answers: quizProgress.answers
      });
      
      toast.success(`Quiz completed! Score: ${response.data.score.toFixed(2)}%`);
      
      // Reset quiz state
      setCurrentQuiz(null);
      setCurrentAttempt(null);
      setQuizProgress({
        currentQuestion: 0,
        answers: {},
        timeRemaining: null,
        startTime: null
      });
      
      return response.data;
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit quiz');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const bookmarkQuestion = async (questionId, notes = '') => {
    try {
      await api.post(`/quiz/bookmark/${questionId}/`, { notes });
      toast.success('Question bookmarked!');
    } catch (error) {
      toast.error('Failed to bookmark question');
    }
  };

  const getExplanation = async (questionId) => {
    try {
      const response = await api.post(`/quiz/explain/${questionId}/`);
      return response.data.explanation;
    } catch (error) {
      toast.error('Failed to get explanation');
      throw error;
    }
  };

  const value = {
    quizzes,
    currentQuiz,
    currentAttempt,
    loading,
    quizProgress,
    fetchQuizzes,
    generateQuiz,
    startQuiz,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    bookmarkQuestion,
    getExplanation,
    setQuizProgress
  };

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
};
