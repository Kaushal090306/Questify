import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import HandTapLoader from '../components/ui/HandTapLoader';
import AnimatedCheckbox from '../components/ui/AnimatedCheckbox';
import BrutalistDocumentUpload from '../components/ui/BrutalistDocumentUpload';
import { DocumentArrowUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import api from '../api/axiosConfig'; // Add this import
import { toast } from 'react-toastify'; // Add this import

const GeneratePage = () => {
  const [formData, setFormData] = useState({
    title: '',
    num_questions: 5,
    difficulty: 'medium',
    quiz_type: 'multiple_choice',
    time_limit: '',
    enable_timer: false
  });
  const [files, setFiles] = useState([]);
  // keep single 'file' for backward compatibility
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user changes input
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear time_limit when timer is disabled
    if (name === 'enable_timer' && !checked) {
      setFormData(prev => ({
        ...prev,
        time_limit: ''
      }));
      if (errors.time_limit) {
        setErrors(prev => ({
          ...prev,
          time_limit: ''
        }));
      }
    }
  };

  const handleFileChange = (selected) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    const selectedFiles = Array.from(selected).filter(Boolean);
    const validFiles = [];
    for (const f of selectedFiles) {
      if (f.size > maxSize) {
        setErrors(prev => ({ ...prev, file: `File ${f.name} exceeds 10MB` }));
        continue;
      }
      if (!allowedTypes.includes(f.type)) {
        setErrors(prev => ({ ...prev, file: `Unsupported file type: ${f.name}` }));
        continue;
      }
      validFiles.push(f);
    }
    if (validFiles.length === 0) return;

    setFiles(validFiles);
    setErrors(prev => ({ ...prev, file: '' }));

    if (!formData.title && validFiles.length === 1) {
      const filename = validFiles[0].name.replace(/\.[^/.]+$/, '');
      setFormData(prev => ({ ...prev, title: filename }));
    }
  };

  const handleFileRemove = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (files.length === 1) {
      // Reset file error if removing the last file
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const handleFileView = (file, index) => {
    // Create a URL for the file and open it in a new tab
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
    // Clean up the URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!files.length) newErrors.file = 'Please select at least one file to upload';

    if (!formData.title.trim()) {
      newErrors.title = 'Quiz title is required';
    }

    if (formData.num_questions < 1 || formData.num_questions > 20) {
      newErrors.num_questions = 'Number of questions must be between 1 and 20';
    }

    // Timer validation
    if (formData.enable_timer) {
      if (!formData.time_limit || formData.time_limit === '') {
        newErrors.time_limit = 'Time limit is required when timer is enabled';
      } else if (formData.time_limit < 5 || formData.time_limit > 3600) {
        newErrors.time_limit = 'Time limit must be between 5 seconds and 60 minutes';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) return;

  setIsGenerating(true);
  setUploadProgress(0);
  setErrors({}); // Clear previous errors

  try {
    const formDataToSend = new FormData();
    if (files.length > 0) {
      files.forEach((f) => formDataToSend.append('files', f));
      if (files.length === 1) {
        formDataToSend.append('file', files[0]); // backend compatibility
      }
    }
    formDataToSend.append('title', formData.title);
    formDataToSend.append('num_questions', formData.num_questions);
    formDataToSend.append('difficulty', formData.difficulty);
    formDataToSend.append('quiz_type', formData.quiz_type);
    
    // Only send time_limit if timer is enabled
    if (formData.enable_timer && formData.time_limit) {
      formDataToSend.append('time_limit', formData.time_limit);
    }
    
    // Simulate progress for AI generation
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 500);
    
    console.log('Sending quiz generation request...');
    const response = await api.post('quiz/generate/', formDataToSend, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60 second timeout
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(Math.min(percentCompleted, 90));
      }
    });
    
    clearInterval(progressInterval);
    setUploadProgress(100);
    
    console.log('Quiz generated successfully:', response.data);
    console.log('Response status:', response.status);
    console.log('Quiz ID:', response.data.quiz_id);
    console.log('Questions count:', response.data.questions?.length);
    
    // Validate response data
    if (!response.data?.quiz_id || !Array.isArray(response.data?.questions)) {
      console.error('Invalid response data:', response.data);
      throw new Error('Invalid response from server');
    }
    
    if (response.data.quiz_id) {
      console.log('Navigating to quiz page:', `/quiz/${response.data.quiz_id}`);
      
      // Show success message
      toast.success('Quiz generated successfully!');
      
      navigate(`/quiz/${response.data.quiz_id}`);
    } else {
      console.error('No quiz_id in response:', response.data);
      setErrors({ general: 'Invalid response from server - no quiz ID received' });
    }
    
  } catch (error) {
    console.error('Quiz generation error:', error);
    
    if (error.response?.status === 401) {
      setErrors({ general: 'Please login to generate quizzes' });
      navigate('/login');
    } else if (error.response?.status === 400) {
      setErrors({ general: error.response.data.error || 'Invalid request' });
    } else if (error.response?.status === 500) {
      // Check if it's a specific error from our backend
      const errorMessage = error.response?.data?.error || '';
      if (errorMessage.includes('Content blocked')) {
        setErrors({ general: 'Content was flagged by safety filters. Please try with different material.' });
      } else if (errorMessage.includes('AI service temporarily unavailable')) {
        setErrors({ general: 'AI service temporarily unavailable. Please try again in a few minutes.' });
      } else if (errorMessage.includes('AI service returned empty response')) {
        setErrors({ general: 'AI service returned empty response. Please try again.' });
      } else {
        setErrors({ general: 'Failed to generate quiz. Please try again or contact support if the issue persists.' });
      }
    } else if (error.message === 'Invalid response from server') {
      setErrors({ general: 'Server returned invalid data. Please try again.' });
    } else {
      setErrors({ general: 'Failed to generate quiz. Please try again.' });
    }
  } finally {
    setIsGenerating(false);
  }
};


  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-brutalist text-4xl font-black text-black mb-4" style={{
          fontFamily: 'var(--font-family-display, "Space Grotesk")',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          Generate AI Quiz
        </h1>
        <p className="text-lg text-night-rider font-medium" style={{
          fontFamily: 'var(--font-family-secondary, "Inter")',
          color: 'var(--night-rider, #2e2e2e)'
        }}>
          Upload your document (PDF, DOCX, or PPTX) and let our AI create engaging quiz questions
        </p>
      </div>

      {/* Show general errors */}
      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{errors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* File Upload Section */}
        <div className="h-fit">
          <BrutalistDocumentUpload
            files={files}
            onFilesChange={handleFileChange}
            onFileRemove={handleFileRemove}
            onFileView={handleFileView}
            dragActive={dragActive}
            onDrag={handleDrag}
            onDrop={handleDrop}
            fileInputRef={fileInputRef}
            error={errors.file}
            maxFiles={5}
            maxSizePerFile={10}
          />
        </div>

        {/* Quiz Settings Section */}
        <Card className="h-fit">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Quiz Settings
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Quiz Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              placeholder="Enter quiz title"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Number of Questions
                </label>
                <input
                  type="number"
                  name="num_questions"
                  value={formData.num_questions}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  className="input"
                  required
                />
                {errors.num_questions && (
                  <p className="text-red-600 text-sm mt-1">{errors.num_questions}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Question Type
              </label>
              <select
                name="quiz_type"
                value={formData.quiz_type}
                onChange={handleChange}
                className="input"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="fill_in_blank">Fill in the Blank</option>
                <option value="descriptive">Descriptive</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            {/* Timer Configuration */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-3">
                <AnimatedCheckbox
                  name="enable_timer"
                  checked={formData.enable_timer}
                  onChange={handleChange}
                  className="w-8 h-8"
                />
                <span>Enable Timer</span>
              </label>
              
              {formData.enable_timer && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Time per Question (seconds)
                  </label>
                  <input
                    type="number"
                    name="time_limit"
                    value={formData.time_limit}
                    onChange={handleChange}
                    min="5"
                    max="3600"
                    placeholder="Enter time in seconds"
                    className="input"
                    required
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    This time will apply to ALL questions in the quiz
                  </p>
                  {errors.time_limit && (
                    <p className="text-red-600 text-sm mt-1">{errors.time_limit}</p>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={files.length === 0 || isGenerating}
            >
              <div className="flex items-center space-x-2">
                <SparklesIcon className="w-5 h-5" />
                <span>{isGenerating ? 'Generating Quiz...' : 'Generate Quiz'}</span>
              </div>
            </Button>
          </form>
        </Card>
      </div>

      {/* Hand Tap Loader - Full Screen */}
      <HandTapLoader 
        isVisible={isGenerating} 
        /*message="Generating your quiz from the document..." */
      />
      </div>
    </div>
  );
};

export default GeneratePage;
