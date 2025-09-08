// Example usage of BrutalistCheckbox component

import React, { useState } from 'react';
import { BrutalistCheckbox } from '../ui';

// Example 1: Simple Form with Checkboxes
const ExampleForm = () => {
  const [formData, setFormData] = useState({
    newsletter: false,
    terms: false,
    marketing: true
  });

  const handleChange = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0_#000000]">
      <h2 className="font-['Space_Grotesk'] font-black text-2xl uppercase tracking-[2px] mb-6">
        SETTINGS
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <BrutalistCheckbox
            checked={formData.newsletter}
            onChange={() => handleChange('newsletter')}
          />
          <label className="font-['Space_Grotesk'] font-bold uppercase tracking-[1px]">
            Subscribe to Newsletter
          </label>
        </div>

        <div className="flex items-center space-x-4">
          <BrutalistCheckbox
            checked={formData.terms}
            onChange={() => handleChange('terms')}
          />
          <label className="font-['Space_Grotesk'] font-bold uppercase tracking-[1px]">
            Accept Terms & Conditions
          </label>
        </div>

        <div className="flex items-center space-x-4">
          <BrutalistCheckbox
            checked={formData.marketing}
            onChange={() => handleChange('marketing')}
          />
          <label className="font-['Space_Grotesk'] font-bold uppercase tracking-[1px]">
            Marketing Communications
          </label>
        </div>
      </div>
    </div>
  );
};

// Example 2: Todo List with Checkboxes
const TodoList = () => {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Create brutalist UI', completed: true },
    { id: 2, text: 'Add hover effects', completed: true },
    { id: 3, text: 'Implement checkboxes', completed: false },
    { id: 4, text: 'Test responsiveness', completed: false }
  ]);

  const toggleTodo = (id) => {
    setTodos(prev => 
      prev.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  return (
    <div className="bg-black text-white p-8 border-4 border-white shadow-[8px_8px_0_#ffffff]">
      <h2 className="font-['Space_Grotesk'] font-black text-2xl uppercase tracking-[2px] mb-6">
        TODO LIST
      </h2>
      
      <div className="space-y-3">
        {todos.map(todo => (
          <div key={todo.id} className="flex items-center space-x-4">
            <BrutalistCheckbox
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span className={`font-['Inter'] ${todo.completed ? 'line-through opacity-60' : ''}`}>
              {todo.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Example 3: Quiz Question with Multiple Choice
const QuizQuestion = () => {
  const [selectedAnswers, setSelectedAnswers] = useState([]);

  const options = [
    'JavaScript',
    'Python', 
    'React',
    'Node.js'
  ];

  const toggleAnswer = (option) => {
    setSelectedAnswers(prev => 
      prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  return (
    <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0_#000000]">
      <h2 className="font-['Space_Grotesk'] font-black text-xl uppercase tracking-[2px] mb-4">
        Which technologies do you use?
      </h2>
      <p className="font-['Inter'] text-gray-600 mb-6">Select all that apply:</p>
      
      <div className="space-y-3">
        {options.map(option => (
          <div key={option} className="flex items-center space-x-4">
            <BrutalistCheckbox
              checked={selectedAnswers.includes(option)}
              onChange={() => toggleAnswer(option)}
            />
            <label className="font-['Inter'] font-medium cursor-pointer">
              {option}
            </label>
          </div>
        ))}
      </div>

      {selectedAnswers.length > 0 && (
        <div className="mt-6 p-4 bg-black text-white">
          <div className="font-['JetBrains_Mono'] text-sm">
            Selected: {selectedAnswers.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
};

export { ExampleForm, TodoList, QuizQuestion };
