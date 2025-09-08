import React, { useState } from 'react';

const ManualQuestionBuilder = ({ questions, setQuestions, roomFeatures }) => {
    const [currentQuestion, setCurrentQuestion] = useState({
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: 0,
        explanation: '',
        points: 1,
        time_limit: roomFeatures.enableTimer ? roomFeatures.timerDuration : null
    });
    
    const [editingIndex, setEditingIndex] = useState(-1);

    const questionTypes = [
        { value: 'multiple_choice', label: 'Multiple Choice' },
        { value: 'fill_blank', label: 'Fill in the Blanks' },
        { value: 'true_false', label: 'True/False' }
    ];

    const handleQuestionChange = (field, value) => {
        setCurrentQuestion(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...currentQuestion.options];
        newOptions[index] = value;
        setCurrentQuestion(prev => ({
            ...prev,
            options: newOptions
        }));
    };

    const addOption = () => {
        setCurrentQuestion(prev => ({
            ...prev,
            options: [...prev.options, '']
        }));
    };

    const removeOption = (index) => {
        if (currentQuestion.options.length > 2) {
            const newOptions = currentQuestion.options.filter((_, i) => i !== index);
            setCurrentQuestion(prev => ({
                ...prev,
                options: newOptions,
                correct_answer: prev.correct_answer >= newOptions.length ? 0 : prev.correct_answer
            }));
        }
    };

    const saveQuestion = () => {
        if (!currentQuestion.question_text.trim()) {
            alert('Please enter a question');
            return;
        }

        if (currentQuestion.question_type === 'multiple_choice' && 
            currentQuestion.options.some(opt => !opt.trim())) {
            alert('Please fill in all options');
            return;
        }

        const questionData = { ...currentQuestion };
        
        if (questionData.question_type === 'true_false') {
            questionData.options = ['True', 'False'];
        }

        if (editingIndex >= 0) {
            const updatedQuestions = [...questions];
            updatedQuestions[editingIndex] = questionData;
            setQuestions(updatedQuestions);
            setEditingIndex(-1);
        } else {
            setQuestions([...questions, questionData]);
        }

        // Reset form
        setCurrentQuestion({
            question_text: '',
            question_type: 'multiple_choice',
            options: ['', '', '', ''],
            correct_answer: 0,
            explanation: '',
            points: 1,
            time_limit: roomFeatures.enableTimer ? roomFeatures.timerDuration : null
        });
    };

    const editQuestion = (index) => {
        setCurrentQuestion(questions[index]);
        setEditingIndex(index);
    };

    const deleteQuestion = (index) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const cancelEdit = () => {
        setCurrentQuestion({
            question_text: '',
            question_type: 'multiple_choice',
            options: ['', '', '', ''],
            correct_answer: 0,
            explanation: '',
            points: 1,
            time_limit: roomFeatures.enableTimer ? roomFeatures.timerDuration : null
        });
        setEditingIndex(-1);
    };

    return (
        <div className="space-y-6">
            {/* Question Form */}
            <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {editingIndex >= 0 ? 'Edit Question' : 'Add New Question'}
                </h3>

                {/* Question Text */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Text *
                    </label>
                    <textarea
                        value={currentQuestion.question_text}
                        onChange={(e) => handleQuestionChange('question_text', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter your question..."
                    />
                </div>

                {/* Question Type */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Type
                    </label>
                    <select
                        value={currentQuestion.question_type}
                        onChange={(e) => handleQuestionChange('question_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {questionTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Options (for multiple choice and true/false) */}
                {(currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'true_false') && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Answer Options
                        </label>
                        
                        {currentQuestion.question_type === 'true_false' ? (
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="correct_answer"
                                        checked={currentQuestion.correct_answer === 0}
                                        onChange={() => handleQuestionChange('correct_answer', 0)}
                                        className="mr-2"
                                    />
                                    <span>True</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="correct_answer"
                                        checked={currentQuestion.correct_answer === 1}
                                        onChange={() => handleQuestionChange('correct_answer', 1)}
                                        className="mr-2"
                                    />
                                    <span>False</span>
                                </label>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {currentQuestion.options.map((option, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="correct_answer"
                                            checked={currentQuestion.correct_answer === index}
                                            onChange={() => handleQuestionChange('correct_answer', index)}
                                            className="mt-1"
                                        />
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder={`Option ${index + 1}`}
                                        />
                                        {currentQuestion.options.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOption(index)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                
                                {currentQuestion.options.length < 6 && (
                                    <button
                                        type="button"
                                        onClick={addOption}
                                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                                    >
                                        + Add Option
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Fill in the blank - Correct Answer */}
                {currentQuestion.question_type === 'fill_blank' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Correct Answer *
                        </label>
                        <input
                            type="text"
                            value={currentQuestion.correct_answer}
                            onChange={(e) => handleQuestionChange('correct_answer', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter the correct answer"
                        />
                    </div>
                )}

                {/* Additional Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Points */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Points
                        </label>
                        <input
                            type="number"
                            value={currentQuestion.points}
                            onChange={(e) => handleQuestionChange('points', parseInt(e.target.value))}
                            min="1"
                            max="10"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Timer (if enabled) */}
                    {roomFeatures.enableTimer && !roomFeatures.globalTimer && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time Limit (seconds)
                            </label>
                            <input
                                type="number"
                                value={currentQuestion.time_limit || roomFeatures.timerDuration}
                                onChange={(e) => handleQuestionChange('time_limit', parseInt(e.target.value))}
                                min="5"
                                max="300"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    )}
                </div>

                {/* Explanation */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Explanation (Optional)
                    </label>
                    <textarea
                        value={currentQuestion.explanation}
                        onChange={(e) => handleQuestionChange('explanation', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Explain the correct answer..."
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                    <button
                        type="button"
                        onClick={saveQuestion}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        {editingIndex >= 0 ? 'Update Question' : 'Add Question'}
                    </button>
                    
                    {editingIndex >= 0 && (
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Questions List */}
            {questions.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Quiz Questions ({questions.length})
                    </h3>
                    <div className="space-y-4">
                        {questions.map((question, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-gray-700">Question {index + 1}</span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => editQuestion(index)}
                                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteQuestion(index)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                
                                <p className="text-gray-800 mb-2">{question.question_text}</p>
                                
                                <div className="text-sm text-gray-600">
                                    <p>Type: {questionTypes.find(t => t.value === question.question_type)?.label}</p>
                                    {question.options && question.options.length > 0 && (
                                        <p>Options: {question.options.join(', ')}</p>
                                    )}
                                    <p>Points: {question.points}</p>
                                    {question.time_limit && (
                                        <p>Time Limit: {question.time_limit}s</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManualQuestionBuilder;
