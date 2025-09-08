import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import HandTapLoader from '../components/ui/HandTapLoader';
import Modal from '../components/ui/Modal';
import {
  ClockIcon,
  BookmarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import ErrorBoundary from '../components/ui/ErrorBoundary';

// Fill in the Blank Question Component
const FillInBlankQuestion = ({ question, selectedAnswer, onAnswerSelect }) => {
  const [answer, setAnswer] = useState(selectedAnswer || '');

  useEffect(() => {
    setAnswer(selectedAnswer || '');
  }, [selectedAnswer, question?.question_id]);

  const handleInputChange = (e) => {
    setAnswer(e.target.value);
    onAnswerSelect(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="text-lg leading-relaxed">
        {String(question.question_text || '').includes('___') ? (
          question.question_text.split('___').map((part, idx, arr) => (
            <span key={idx}>
              {part}
              {idx < arr.length - 1 && (
                <input
                  type="text"
                  value={answer}
                  onChange={handleInputChange}
                  className="inline-block mx-2 px-3 py-1 border-b-2 border-primary-500 bg-transparent text-primary-700 font-semibold focus:outline-none focus:border-primary-700"
                  placeholder="Fill in blank"
                  style={{ minWidth: '160px' }}
                />
              )}
            </span>
          ))
        ) : (
          <>
            <div className="mb-3">{question.question_text}</div>
            <input
              type="text"
              value={answer}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Type your answer"
            />
          </>
        )}
      </div>
    </div>
  );
};

// Descriptive Question Component
const DescriptiveQuestion = ({ question, selectedAnswer, onAnswerSelect }) => {
  const [answer, setAnswer] = useState(selectedAnswer || '');

  useEffect(() => {
    setAnswer(selectedAnswer || '');
  }, [selectedAnswer, question?.question_id]);

  const handleTextareaChange = (e) => {
    setAnswer(e.target.value);
    onAnswerSelect(e.target.value);
  };

  return (
    <div className="space-y-4">
      <textarea
        value={answer}
        onChange={handleTextareaChange}
        className="w-full p-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder="Write your detailed answer here..."
        rows={6}
        style={{ minHeight: '120px' }}
      />
      <div className="text-sm text-slate-500">
        Write a detailed response (2-3 sentences recommended)
      </div>
    </div>
  );
};

const MIN_TIMER = 5; // minimum 5 seconds

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const {
    currentQuiz,
    currentAttempt,
    quizProgress,
    startQuiz,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    bookmarkQuestion,
    getExplanation,
    loading,
  } = useQuiz();

  const [questionTimer, setQuestionTimer] = useState(null);
  const timerRef = useRef();
  const isAdvancingRef = useRef(false); // Flag to prevent double-advance
  const [showExitModal, setShowExitModal] = useState(false);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState(new Set());
  const [explanations, setExplanations] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // Get time per question from quiz settings - ONLY show timer if user selected one
  const userSelectedTime = currentQuiz?.time_limit;
  const hasTimerEnabled = userSelectedTime && userSelectedTime > 0;
  const timePerQuestion = hasTimerEnabled ? Math.max(userSelectedTime, MIN_TIMER) : null;
  
  console.log('Timer settings - userSelectedTime:', userSelectedTime, 'hasTimerEnabled:', hasTimerEnabled, 'timePerQuestion:', timePerQuestion);

  useEffect(() => {
    if (!currentQuiz) {
      loadQuiz();
    }
    // eslint-disable-next-line
  }, [quizId]);

  useEffect(() => {
    // Detect tab switches
    const handleVisibilityChange = () => {
      if (document.hidden && currentAttempt) {
        setTabSwitchCount((prev) => prev + 1);
        if (tabSwitchCount >= 2) {
          alert('Warning: Multiple tab switches detected. This may be flagged as suspicious activity.');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAttempt, tabSwitchCount]);

// Timer for each question - WITH AUTO-ADVANCE
useEffect(() => {
  // RULE 1 & 2: No timer should be shown by default - only if user selected time
  if (!hasTimerEnabled || !currentAttempt || !currentAttempt.questions || !currentQuiz) {
    console.log('Timer effect skipped - no timer enabled or missing data:', { /* ... */ });
    return;
  }

  // FIX 3: REMOVE THIS BLOCK. It causes the timer to not start on the next question.
  // The cleanup function and the new lock in handleTimerEnd are sufficient.
  /*
  if (isAdvancingRef.current) {
    console.log('Timer effect skipped - currently advancing');
    return;
  }
  */

  // When this effect runs, it means we are on a new question, so it's safe to reset the flag.
  isAdvancingRef.current = false;

  console.log('Timer effect triggered for question:', quizProgress.currentQuestion, 'with timer:', timePerQuestion, 'seconds');

  // RULE 4: For each question, countdown starts fresh from selected value
  setQuestionTimer(timePerQuestion);

  // Clear any existing timer
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  // RULE 5: Countdown decreases every second until it reaches 0
  timerRef.current = setInterval(() => {
    setQuestionTimer(prev => {
      if (prev <= 1) {
        console.log('Timer expired for question:', quizProgress.currentQuestion, '- AUTO-ADVANCING');
        clearInterval(timerRef.current);
        timerRef.current = null;

        // RULE 6 & 7: Auto-advance to next question when timer reaches 0
        handleTimerEnd();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [quizProgress.currentQuestion, hasTimerEnabled, timePerQuestion]);

// SAFE NAVIGATION: Shared function that moves exactly one question forward
const safeAdvanceQuestion = () => {
  console.log('Safe advance from question:', quizProgress.currentQuestion);

  // Set advancing flag to prevent timer interference
  isAdvancingRef.current = true;

  if (quizProgress.currentQuestion < currentAttempt.questions.length - 1) {
    // Move to next question
    nextQuestion();
    setShowExplanation(false);

    // FIX 2: REMOVE THE UNRELIABLE TIMEOUT
    // The flag will be reset by the next effect cycle naturally
    // setTimeout(() => {
    //   isAdvancingRef.current = false;
    // }, 100);
  } else {
    // End of quiz - submit
    handleSubmitQuiz();
  }
};

  // RULE 7: Dedicated function for timer auto-advance
  // RULE 7: Dedicated function for timer auto-advance
 const handleTimerEnd = () => {
   // FIX 1: Prevent double-firing if an advance is already in progress
   if (isAdvancingRef.current) {
     console.log('Timer ended, but advance already in progress. Skipping.');
     return;
   }
   console.log('Timer ended - auto advancing from question:', quizProgress.currentQuestion);
   safeAdvanceQuestion();
 };

  // Set selected answer when quiz data is loaded
  useEffect(() => {
    if (currentAttempt && currentAttempt.questions && quizProgress.currentQuestion !== undefined) {
      const currentQ = getCurrentQuestion();
      if (currentQ) {
        setSelectedAnswer(quizProgress.answers[currentQ.question_id] || '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAttempt, quizProgress.currentQuestion]); // Removed quizProgress.answers from dependencies

  const loadQuiz = async () => {
    try {
      const data = await startQuiz(quizId);
      // Don't set timer here - let useEffect handle it when all data is ready
      console.log('Quiz data loaded:', data);
    } catch {
      navigate('/dashboard');
    }
  };

  const getCurrentQuestion = () => {
    if (!currentAttempt?.questions) return null;
    return currentAttempt.questions[quizProgress.currentQuestion];
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    const currentQuestion = getCurrentQuestion();
    if (currentQuestion) {
      submitAnswer(currentQuestion.question_id, answer);
    }
  };

  // RULE 9 & 10: Manual Next button - uses same safe advance function
  const handleNext = () => {
    console.log('Manual next clicked from question:', quizProgress.currentQuestion);
    
    // Clear timer if running to prevent conflicts
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    safeAdvanceQuestion();
  };

  const handlePrevious = () => {
    if (quizProgress.currentQuestion > 0) {
      previousQuestion();
      const prevQ = currentAttempt.questions[quizProgress.currentQuestion - 1];
      setSelectedAnswer(quizProgress.answers[prevQ?.question_id] || '');
      setShowExplanation(false);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      const results = await submitQuiz();
      navigate(`/results/${quizId}`, { state: { results } });
    } catch (error) {
      console.error('Submit failed:', error);
      // handle error if needed
    }
  };

  const handleBookmark = async () => {
    const currentQuestion = getCurrentQuestion();
    if (currentQuestion) {
      try {
        await bookmarkQuestion(currentQuestion.question_id);
        setBookmarkedQuestions((prev) => new Set([...prev, currentQuestion.question_id]));
      } catch {
        // handle error if needed
      }
    }
  };

  const handleGetExplanation = async () => {
    const currentQuestion = getCurrentQuestion();
    if (currentQuestion && !explanations[currentQuestion.question_id]) {
      try {
        const explanation = await getExplanation(currentQuestion.question_id);
        setExplanations((prev) => ({
          ...prev,
          [currentQuestion.question_id]: explanation,
        }));
      } catch {
        // handle error if needed
      }
    }
    setShowExplanation(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (!hasTimerEnabled || questionTimer === null) return 'timer normal';
    if (questionTimer <= 30) return 'timer danger';
    if (questionTimer <= 60) return 'timer warning';
    return 'timer normal';
  };

  // Progress bar behavior: starts at 100% and decreases to 0%
  const timerPercent = hasTimerEnabled && questionTimer !== null && timePerQuestion > 0
    ? (questionTimer / timePerQuestion) * 100
    : 0;

  if (loading || !currentQuiz || !currentAttempt) {
    return (
      <HandTapLoader 
        isVisible={true} 
        message="Loading your quiz..." 
      />
    );
  }

  const currentQuestion = getCurrentQuestion();
  const progress =
    ((quizProgress.currentQuestion + 1) / currentAttempt.questions.length) *
    100;
  const isLastQuestion =
    quizProgress.currentQuestion === currentAttempt.questions.length - 1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {currentQuiz.title}
          </h1>
          <p className="text-slate-600">
            Question {quizProgress.currentQuestion + 1} of{' '}
            {currentAttempt.questions.length}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {hasTimerEnabled && questionTimer !== null && (
            <div className={getTimerColor()}>
              <ClockIcon className="w-4 h-4 mr-1" />
              {formatTime(questionTimer)}
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => setShowExitModal(true)}
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            Exit Quiz
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar mb-8">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question Card */}
      <Card className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {currentQuestion?.question_type === 'fill_in_blank'
                ? (String(currentQuestion?.question_text || '').replace(/___/g, '___'))
                : currentQuestion?.question_text}
            </h2>

            {currentQuestion?.question_type === 'multiple_choice' && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    className={`quiz-option w-full text-left ${
                      selectedAnswer === option ? 'selected' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedAnswer === option
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-slate-300'
                        }`}
                      >
                        {selectedAnswer === option && (
                          <CheckCircleIcon className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-base">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {currentQuestion?.question_type === 'true_false' && (
              <div className="space-y-3">
                {['True', 'False'].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    className={`quiz-option w-full text-left ${
                      selectedAnswer === option ? 'selected' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedAnswer === option
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-slate-300'
                        }`}
                      >
                        {selectedAnswer === option && (
                          <CheckCircleIcon className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-base">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {currentQuestion?.question_type === 'fill_in_blank' && (
              <FillInBlankQuestion
                question={currentQuestion}
                selectedAnswer={selectedAnswer}
                onAnswerSelect={handleAnswerSelect}
              />
            )}

            {currentQuestion?.question_type === 'descriptive' && (
              <DescriptiveQuestion
                question={currentQuestion}
                selectedAnswer={selectedAnswer}
                onAnswerSelect={handleAnswerSelect}
              />
            )}

            {/* Fallback for unknown/mismatched types to ensure inputs are available */}
            {!['multiple_choice', 'true_false', 'fill_in_blank', 'descriptive'].includes(currentQuestion?.question_type) && (
              <DescriptiveQuestion
                question={currentQuestion}
                selectedAnswer={selectedAnswer}
                onAnswerSelect={handleAnswerSelect}
              />
            )}
          </div>

          <div className="flex flex-col space-y-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              className="flex items-center space-x-1"
            >
              {bookmarkedQuestions.has(currentQuestion?.question_id) ? (
                <BookmarkSolidIcon className="w-4 h-4 text-yellow-500" />
              ) : (
                <BookmarkIcon className="w-4 h-4" />
              )}
              <span>Bookmark</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleGetExplanation}
              className="flex items-center space-x-1"
            >
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span>Explain</span>
            </Button>
          </div>
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Explanation:</h3>
            <p className="text-blue-800">
              {explanations[currentQuestion?.question_id] || 'Loading explanation...'}
            </p>
          </div>
        )}
      </Card>

      {/* Timer Loader Bar - RULE 1 & 2: Only show if user selected a timer */}
      {hasTimerEnabled && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#eee',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              width: `${timerPercent}%`,
              height: '100%',
              background: timerPercent < 20 ? '#ef4444' : '#3b82f6',
              transition: 'width 1s linear'
            }} />
          </div>
          <div style={{ fontSize: '0.9em', color: '#555', marginTop: 4 }}>
            {questionTimer !== null && questionTimer > 0
              ? `Time left: ${questionTimer}s`
              : quizProgress.currentQuestion === currentAttempt.questions.length - 1
                ? 'Time up! Please submit your quiz.'
                : 'Time up! Click Next to continue.'}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={quizProgress.currentQuestion === 0}
        >
          Previous
        </Button>
        <div className="flex space-x-3">
          {!isLastQuestion ? (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!selectedAnswer}
            >
              Next Question
            </Button>
          ) : (
            <Button
              variant="accent"
              onClick={handleSubmitQuiz}
              disabled={Object.keys(quizProgress.answers).length === 0}
            >
              Submit Quiz
            </Button>
          )}
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit Quiz"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowExitModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => navigate('/dashboard')}>
              Exit Quiz
            </Button>
          </>
        }
      >
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">
            Are you sure you want to exit? Your progress will be lost.
          </p>
          <p className="text-sm text-slate-500">
            You have answered {Object.keys(quizProgress.answers).length} out of{' '}
            {currentAttempt.questions.length} questions.
          </p>
        </div>
      </Modal>
    </div>
  );
};

const WrappedQuizPage = (props) => (
  <ErrorBoundary>
    <QuizPage {...props} />
  </ErrorBoundary>
);

export default WrappedQuizPage;
