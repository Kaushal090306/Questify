import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axiosConfig';
import { createRoom } from '../api/rooms';
import ManualQuestionBuilder from '../components/quiz/ManualQuestionBuilder';
import AnimatedCheckbox from '../components/ui/AnimatedCheckbox';
import HandTapLoader from '../components/ui/HandTapLoader';
import BrutalistDocumentUpload from '../components/ui/BrutalistDocumentUpload';

const CreateRoom = () => {
    const [currentStep, setCurrentStep] = useState(1); // 1: Room Details, 2: Quiz Creation Method, 3: Quiz Builder
    const [aiGenerationStep, setAiGenerationStep] = useState('settings'); // 'settings', 'generated', 'editing'
    const [roomDetails, setRoomDetails] = useState({
        title: '',
        description: '',
        features: {
            enableTimer: false,
            shuffleQuestions: false,
            shuffleOptions: false,
            attemptsAllowed: 1,
            globalTimer: false,
            timerDuration: 30 // per question default
        }
    });
    
    const [quizMethod, setQuizMethod] = useState(''); // 'ai' or 'manual'
    const [aiQuizSettings, setAiQuizSettings] = useState({
        document: null,
        numberOfQuestions: 10,
        questionTypes: ['multiple_choice'],
        difficulty: 'medium'
    });
    
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Handle room details form changes
    const handleRoomDetailsChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('features.')) {
            const featureName = name.split('.')[1];
            setRoomDetails(prev => ({
                ...prev,
                features: {
                    ...prev.features,
                    [featureName]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setRoomDetails(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    // Handle file upload for documents
    const handleFileUpload = (files) => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/msword',
            'application/vnd.ms-powerpoint',
            'text/plain'
        ];

        const selectedFiles = Array.from(files).filter(Boolean);
        const validFiles = [];
        
        for (const file of selectedFiles) {
            if (file.size > maxSize) {
                setError(`File ${file.name} exceeds 10MB`);
                continue;
            }
            if (!allowedTypes.includes(file.type)) {
                setError(`Unsupported file type: ${file.name}`);
                continue;
            }
            validFiles.push(file);
        }
        
        if (validFiles.length === 0) return;

        setUploadedFiles(validFiles);
        setError('');
        
        // Set the first file as the document for AI generation
        if (validFiles.length > 0) {
            setAiQuizSettings(prev => ({
                ...prev,
                document: validFiles[0]
            }));
        }
    };

    const handleFileRemove = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
        if (uploadedFiles.length === 1) {
            setAiQuizSettings(prev => ({
                ...prev,
                document: null
            }));
        } else if (index === 0 && uploadedFiles.length > 1) {
            // If removing the first file, set the next file as the document
            setAiQuizSettings(prev => ({
                ...prev,
                document: uploadedFiles[1]
            }));
        }
    };

    const handleFileView = (file, index) => {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
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
            handleFileUpload(e.dataTransfer.files);
        }
    };

    // Handle AI quiz settings changes (non-file inputs)
    const handleAiSettingsChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'questionTypes') {
            const currentTypes = aiQuizSettings.questionTypes;
            if (checked) {
                setAiQuizSettings(prev => ({
                    ...prev,
                    questionTypes: [...currentTypes, value]
                }));
            } else {
                setAiQuizSettings(prev => ({
                    ...prev,
                    questionTypes: currentTypes.filter(type => type !== value)
                }));
            }
        } else {
            setAiQuizSettings(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    // Step 1: Room Details Form
    const renderRoomDetailsForm = () => (
        <div className="bg-white border-4 border-black p-8" style={{
            boxShadow: '8px 8px 0 var(--chinese-black, #141414)'
        }}>
            <h2 className="text-3xl font-black text-black mb-8" style={{
                fontFamily: 'var(--font-family-display, "Space Grotesk")',
                textTransform: 'uppercase',
                letterSpacing: '1px'
            }}>Room Details & Settings</h2>
            
            {/* Basic Details */}
            <div className="space-y-6 mb-8">
                <div>
                    <label className="block text-sm font-bold text-black mb-3" style={{
                        fontFamily: 'var(--font-family-display, "Space Grotesk")',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Room Title *
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={roomDetails.title}
                        onChange={handleRoomDetailsChange}
                        className="w-full px-4 py-3 border-3 border-black bg-white text-black font-medium focus:outline-none focus:ring-0"
                        style={{
                            fontFamily: 'var(--font-family-primary, "JetBrains Mono")',
                            boxShadow: '4px 4px 0 var(--chinese-black, #141414)'
                        }}
                        placeholder="Enter room title"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-black mb-3" style={{
                        fontFamily: 'var(--font-family-display, "Space Grotesk")',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Description (Optional)
                    </label>
                    <textarea
                        name="description"
                        value={roomDetails.description}
                        onChange={handleRoomDetailsChange}
                        rows={3}
                        className="w-full px-4 py-3 border-3 border-black bg-white text-black font-medium focus:outline-none focus:ring-0"
                        style={{
                            fontFamily: 'var(--font-family-primary, "JetBrains Mono")',
                            boxShadow: '4px 4px 0 var(--chinese-black, #141414)'
                        }}
                        placeholder="Describe your quiz room"
                    />
                </div>
            </div>

            {/* Features & Settings */}
            <div className="border-t-4 border-black pt-8">
                <h3 className="text-2xl font-black text-black mb-6" style={{
                    fontFamily: 'var(--font-family-display, "Space Grotesk")',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>Quiz Features</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Timer Settings */}
                    <div className="space-y-4">
                        <label className="flex items-center">
                            <AnimatedCheckbox
                                name="features.enableTimer"
                                checked={roomDetails.features.enableTimer}
                                onChange={handleRoomDetailsChange}
                                className="mr-3"
                            />
                            <span className="text-sm font-bold text-black" style={{
                                fontFamily: 'var(--font-family-display, "Space Grotesk")',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>Enable Timer</span>
                        </label>
                        
                        {roomDetails.features.enableTimer && (
                            <div className="ml-6 space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="features.globalTimer"
                                        value={false}
                                        checked={!roomDetails.features.globalTimer}
                                        onChange={(e) => handleRoomDetailsChange({
                                            target: { name: 'features.globalTimer', value: false, type: 'radio' }
                                        })}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-600">Per Question Timer</span>
                                </label>
                                
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="features.globalTimer"
                                        value={true}
                                        checked={roomDetails.features.globalTimer}
                                        onChange={(e) => handleRoomDetailsChange({
                                            target: { name: 'features.globalTimer', value: true, type: 'radio' }
                                        })}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-600">Global Timer</span>
                                </label>
                                
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        Default Timer Duration (seconds)
                                    </label>
                                    <input
                                        type="number"
                                        name="features.timerDuration"
                                        value={roomDetails.features.timerDuration}
                                        onChange={handleRoomDetailsChange}
                                        min="5"
                                        max="300"
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Randomization */}
                    <div className="space-y-2">
                        <label className="flex items-center">
                            <AnimatedCheckbox
                                name="features.shuffleQuestions"
                                checked={roomDetails.features.shuffleQuestions}
                                onChange={handleRoomDetailsChange}
                                className="mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">Shuffle Questions</span>
                        </label>
                        
                        <label className="flex items-center">
                            <AnimatedCheckbox
                                name="features.shuffleOptions"
                                checked={roomDetails.features.shuffleOptions}
                                onChange={handleRoomDetailsChange}
                                className="mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">Shuffle Options</span>
                        </label>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Attempts Allowed
                            </label>
                            <input
                                type="number"
                                name="features.attemptsAllowed"
                                value={roomDetails.features.attemptsAllowed}
                                onChange={handleRoomDetailsChange}
                                min="1"
                                max="10"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {/* Next Button */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={() => {
                        if (!roomDetails.title.trim()) {
                            setError('Room title is required');
                            return;
                        }
                        setError('');
                        setCurrentStep(2);
                    }}
                    className="px-8 py-4 bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_#e1e1e1] hover:shadow-[6px_6px_0px_0px_#e1e1e1] transform hover:-translate-x-1 hover:-translate-y-1 transition-all font-bold"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                    NEXT: CHOOSE QUIZ METHOD →
                </button>
            </div>
        </div>
    );

    // Step 2: Quiz Creation Method Selection
    const renderQuizMethodSelection = () => (
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] p-8">
            <h2 className="text-3xl font-bold text-black mb-8" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                CHOOSE QUIZ CREATION METHOD
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* AI Generated Quiz */}
                <div 
                    className={`border-4 p-8 cursor-pointer transition-all transform hover:-translate-y-1 ${
                        quizMethod === 'ai' 
                            ? 'border-black bg-black text-white shadow-[6px_6px_0px_0px_#e1e1e1]' 
                            : 'border-black bg-white text-black shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000]'
                    }`}
                    onClick={() => setQuizMethod('ai')}
                >
                    <div className="text-center">
                        <div className="text-6xl mb-6">🤖</div>
                        <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            AI GENERATED QUIZ
                        </h3>
                        <p className="text-base mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Upload documents and let AI generate questions automatically
                        </p>
                        <ul className="text-sm text-left space-y-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            <li>→ Upload PDF, DOCX, TXT, PPTX files</li>
                            <li>→ Choose question types and difficulty</li>
                            <li>→ Edit generated questions</li>
                            <li>→ Add/remove questions as needed</li>
                        </ul>
                    </div>
                </div>

                {/* Manual Quiz Creation */}
                <div 
                    className={`border-4 p-8 cursor-pointer transition-all transform hover:-translate-y-1 ${
                        quizMethod === 'manual' 
                            ? 'border-black bg-black text-white shadow-[6px_6px_0px_0px_#e1e1e1]' 
                            : 'border-black bg-white text-black shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000]'
                    }`}
                    onClick={() => setQuizMethod('manual')}
                >
                    <div className="text-center">
                        <div className="text-6xl mb-6">✍️</div>
                        <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            MANUAL QUIZ CREATION
                        </h3>
                        <p className="text-base mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Create questions manually with full control
                        </p>
                        <ul className="text-sm text-left space-y-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            <li>→ Add questions one by one</li>
                            <li>→ Set custom timers per question</li>
                            <li>→ Multiple choice, fill blanks, true/false</li>
                            <li>→ Complete control over content</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
                <button
                    onClick={() => setCurrentStep(1)}
                    className="px-8 py-4 bg-white text-black border-4 border-black shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] transform hover:-translate-x-1 hover:-translate-y-1 transition-all font-bold"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                    ← BACK
                </button>
                
                <button
                    onClick={() => {
                        if (!quizMethod) {
                            setError('Please select a quiz creation method');
                            return;
                        }
                        setError('');
                        setCurrentStep(3);
                    }}
                    disabled={!quizMethod}
                    className={`px-8 py-4 border-4 transition-all font-bold transform ${
                        quizMethod 
                            ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_#e1e1e1] hover:shadow-[6px_6px_0px_0px_#e1e1e1] hover:-translate-x-1 hover:-translate-y-1'
                            : 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                    }`}
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                    NEXT: CREATE QUIZ →
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mt-6 bg-white border-4 border-red-600 shadow-[4px_4px_0px_0px_#dc2626] p-6">
                    <p className="text-red-600 font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        ⚠ ERROR: {error}
                    </p>
                </div>
            )}
        </div>
    );

    // Step 3: Quiz Builder (AI or Manual)
    const renderQuizBuilder = () => {
        if (quizMethod === 'ai') {
            return renderAiQuizBuilder();
        } else {
            return renderManualQuizBuilder();
        }
    };

    // AI Quiz Builder
    const renderAiQuizBuilder = () => {
        // Step 1: AI Settings and Document Upload
        if (aiGenerationStep === 'settings') {
            return (
                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] p-8">
                    <h2 className="text-3xl font-bold text-black mb-8" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        AI QUIZ GENERATION
                    </h2>
                    
                    {/* Document Upload */}
                    <div className="mb-8">
                        <BrutalistDocumentUpload
                            files={uploadedFiles}
                            onFilesChange={handleFileUpload}
                            onFileRemove={handleFileRemove}
                            onFileView={handleFileView}
                            dragActive={dragActive}
                            onDrag={handleDrag}
                            onDrop={handleDrop}
                            fileInputRef={fileInputRef}
                            error={error}
                            maxFiles={1}
                            maxSizePerFile={10}
                        />
                    </div>

                    {/* Quiz Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Number of Questions */}
                        <div>
                            <label className="block text-lg font-bold text-black mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                NUMBER OF QUESTIONS
                            </label>
                            <input
                                type="number"
                                name="numberOfQuestions"
                                value={aiQuizSettings.numberOfQuestions}
                                onChange={handleAiSettingsChange}
                                min="1"
                                max="50"
                                className="w-full px-4 py-4 border-4 border-black bg-white text-black focus:bg-black focus:text-white transition-all font-mono"
                                style={{ fontFamily: 'JetBrains Mono, monospace' }}
                            />
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="block text-lg font-bold text-black mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                DIFFICULTY LEVEL
                            </label>
                            <select
                                name="difficulty"
                                value={aiQuizSettings.difficulty}
                                onChange={handleAiSettingsChange}
                                className="w-full px-4 py-4 border-4 border-black bg-white text-black focus:bg-black focus:text-white transition-all font-mono"
                                style={{ fontFamily: 'JetBrains Mono, monospace' }}
                            >
                                <option value="easy">EASY</option>
                                <option value="medium">MEDIUM</option>
                                <option value="hard">HARD</option>
                            </select>
                        </div>
                    </div>

                    {/* Question Types */}
                    <div className="mb-8">
                        <label className="block text-lg font-bold text-black mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            QUESTION TYPES
                        </label>
                        <div className="space-y-4">
                            <label className="flex items-center space-x-4">
                                <AnimatedCheckbox
                                    name="questionTypes"
                                    value="multiple_choice"
                                    checked={aiQuizSettings.questionTypes.includes('multiple_choice')}
                                    onChange={handleAiSettingsChange}
                                    className=""
                                />
                                <span className="text-base font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                    MULTIPLE CHOICE
                                </span>
                            </label>
                            
                            <label className="flex items-center space-x-4">
                                <AnimatedCheckbox
                                    name="questionTypes"
                                    value="fill_blank"
                                    checked={aiQuizSettings.questionTypes.includes('fill_blank')}
                                    onChange={handleAiSettingsChange}
                                    className=""
                                />
                                <span className="text-base font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                    FILL IN THE BLANKS
                                </span>
                            </label>
                            
                            <label className="flex items-center space-x-4">
                                <AnimatedCheckbox
                                    name="questionTypes"
                                    value="true_false"
                                    checked={aiQuizSettings.questionTypes.includes('true_false')}
                                    onChange={handleAiSettingsChange}
                                    className=""
                                />
                                <span className="text-base font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                                    TRUE/FALSE
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between">
                        <button
                            onClick={() => setCurrentStep(2)}
                            className="px-8 py-4 bg-white text-black border-4 border-black shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] transform hover:-translate-x-1 hover:-translate-y-1 transition-all font-bold"
                            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                        >
                            ← BACK
                        </button>
                        
                        <button
                            onClick={generateAiQuiz}
                            disabled={loading || !aiQuizSettings.document}
                            className={`px-8 py-4 border-4 transition-all font-bold transform ${
                                loading || !aiQuizSettings.document
                                    ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                                    : 'bg-black text-white border-black shadow-[4px_4px_0px_0px_#e1e1e1] hover:shadow-[6px_6px_0px_0px_#e1e1e1] hover:-translate-x-1 hover:-translate-y-1'
                            }`}
                            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                        >
                            {loading ? 'GENERATING...' : 'GENERATE QUIZ →'}
                        </button>
                    </div>
                </div>
            );
        }

        // Step 2: Review and Edit Generated Questions
        if (aiGenerationStep === 'generated') {
            return (
                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] p-8">
                    <h2 className="text-3xl font-bold text-black mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        REVIEW GENERATED QUIZ
                    </h2>
                    <p className="text-black mb-8 text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Your quiz has been generated! Review the questions below and make any edits needed.
                    </p>
                    
                    <ManualQuestionBuilder 
                        questions={questions}
                        setQuestions={setQuestions}
                        roomFeatures={roomDetails.features}
                    />

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() => {
                                setAiGenerationStep('settings');
                                setQuestions([]);
                            }}
                            className="px-8 py-4 bg-white text-black border-4 border-black shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] transform hover:-translate-x-1 hover:-translate-y-1 transition-all font-bold"
                            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                        >
                            REGENERATE QUIZ
                        </button>
                        
                        <button
                            onClick={createRoomWithQuestions}
                            disabled={questions.length === 0 || loading}
                            className={`px-8 py-4 border-4 transition-all font-bold transform ${
                                questions.length === 0 || loading
                                    ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                                    : 'bg-black text-white border-black shadow-[4px_4px_0px_0px_#e1e1e1] hover:shadow-[6px_6px_0px_0px_#e1e1e1] hover:-translate-x-1 hover:-translate-y-1'
                            }`}
                            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                        >
                            {loading ? 'CREATING ROOM...' : `CREATE ROOM (${questions.length} QUESTIONS) →`}
                        </button>
                    </div>
                </div>
            );
        }
    };

    // Manual Quiz Builder
    const renderManualQuizBuilder = () => (
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] p-8">
            <h2 className="text-3xl font-bold text-black mb-8" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                MANUAL QUIZ CREATION
            </h2>
            
            <ManualQuestionBuilder 
                questions={questions}
                setQuestions={setQuestions}
                roomFeatures={roomDetails.features}
            />

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
                <button
                    onClick={() => setCurrentStep(2)}
                    className="px-8 py-4 bg-white text-black border-4 border-black shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] transform hover:-translate-x-1 hover:-translate-y-1 transition-all font-bold"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                    ← BACK
                </button>
                
                <button
                    onClick={createRoomWithQuestions}
                    disabled={questions.length === 0 || loading}
                    className={`px-8 py-4 border-4 transition-all font-bold transform ${
                        questions.length === 0 || loading
                            ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                            : 'bg-black text-white border-black shadow-[4px_4px_0px_0px_#e1e1e1] hover:shadow-[6px_6px_0px_0px_#e1e1e1] hover:-translate-x-1 hover:-translate-y-1'
                    }`}
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                    {loading ? 'CREATING ROOM...' : `CREATE ROOM (${questions.length} QUESTIONS) →`}
                </button>
            </div>
        </div>
    );

    // Generate AI Quiz
    const generateAiQuiz = async () => {
        if (!aiQuizSettings.document) {
            setError('Please upload a document');
            return;
        }

        if (aiQuizSettings.questionTypes.length === 0) {
            setError('Please select at least one question type');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', aiQuizSettings.document);
            formData.append('num_questions', aiQuizSettings.numberOfQuestions);
            formData.append('difficulty', aiQuizSettings.difficulty);
            
            // Send all selected question types
            aiQuizSettings.questionTypes.forEach(type => {
                formData.append('question_types', type);
            });

            const response = await api.post('/rooms/generate-quiz/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.quiz) {
                setQuestions(response.data.quiz);
                setAiGenerationStep('generated'); // Move to review step
            } else {
                setError('Failed to generate quiz. Please try again.');
            }
        } catch (error) {
            console.error('Error generating quiz:', error);
            setError('Failed to generate quiz. Please check your document and try again.');
        } finally {
            setLoading(false);
        }
    };

    // Create Room with Questions
    const createRoomWithQuestions = async () => {
        setLoading(true);
        setError('');

        try {
            const roomData = {
                name: roomDetails.title,
                description: roomDetails.description,
                quiz_type: quizMethod === 'ai' ? 'ai_generated' : 'manual',
                total_questions: questions.length,
                time_limit: roomDetails.features.enableTimer ? roomDetails.features.timerDuration : null,
                shuffle_questions: roomDetails.features.shuffleQuestions,
                shuffle_options: roomDetails.features.shuffleOptions,
                max_attempts: roomDetails.features.attemptsAllowed,
                questions: questions
            };

            console.log('Creating room with data:', roomData);
            const response = await createRoom(roomData);
            console.log('Room creation response:', response);
            
            if (response.room_code) {
                console.log('Navigating to lobby:', `/room/${response.room_code}/lobby`);
                navigate(`/room/${response.room_code}/lobby/host`);
            } else {
                console.error('No room_code in response:', response);
                setError('Room created but no room code received. Please check your rooms list.');
            }
        } catch (error) {
            console.error('Error creating room:', error);
            setError(`Failed to create room: ${error.message || 'Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Brutalist Page Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-black mb-4" style={{
                        fontFamily: 'var(--font-family-display, "Space Grotesk")',
                        textTransform: 'uppercase',
                        letterSpacing: '2px'
                    }}>
                        Create Room
                    </h1>
                    <p className="text-lg font-medium" style={{
                        fontFamily: 'var(--font-family-secondary, "Inter")',
                        color: 'var(--night-rider, #2e2e2e)'
                    }}>
                        Set up your multiplayer quiz room
                    </p>
                </div>

                {/* Brutalist Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-center">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`w-12 h-12 border-3 border-black flex items-center justify-center text-lg font-black ${
                                    currentStep >= step 
                                        ? 'bg-black text-white' 
                                        : 'bg-white text-black'
                                }`} style={{
                                    fontFamily: 'var(--font-family-display, "Space Grotesk")',
                                    boxShadow: currentStep >= step ? '4px 4px 0 var(--chinese-black, #141414)' : '4px 4px 0 var(--gainsboro, #e1e1e1)'
                                }}>
                                    {step}
                                </div>
                                {step < 3 && (
                                    <div className={`w-20 h-2 mx-4 border-2 border-black ${
                                        currentStep > step ? 'bg-black' : 'bg-white'
                                    }`} style={{
                                        boxShadow: '2px 2px 0 var(--chinese-black, #141414)'
                                    }}></div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center mt-4">
                        <div className="text-sm font-bold text-black text-center" style={{
                            fontFamily: 'var(--font-family-display, "Space Grotesk")',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            {currentStep === 1 && 'Room Details & Settings'}
                            {currentStep === 2 && 'Choose Quiz Method'}
                            {currentStep === 3 && 'Create Quiz'}
                        </div>
                    </div>
                </div>

                {/* Step Content */}
                {currentStep === 1 && renderRoomDetailsForm()}
                {currentStep === 2 && renderQuizMethodSelection()}
                {currentStep === 3 && renderQuizBuilder()}
            </div>
            
            {/* HandTapLoader for AI Quiz Generation */}
            <HandTapLoader isVisible={loading} />
        </div>
    );
};

export default CreateRoom;
