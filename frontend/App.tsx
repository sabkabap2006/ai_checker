import React, { useState, useEffect, useCallback } from 'react';
import { Question, Attempt, Status, EvaluationResult } from './types';
import * as GeminiService from './services/geminiService';
import { mockBackend } from './services/storageService';
import QuestionCard from './components/QuestionCard';
import FeedbackDisplay from './components/FeedbackDisplay';
import FeedbackForm from './components/FeedbackForm';
import HistorySidebar from './components/HistorySidebar';

const App: React.FC = () => {
  // State Management
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResult | null>(null);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [history, setHistory] = useState<Attempt[]>([]);
  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [topic, setTopic] = useState('React JS');
  
  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await mockBackend.getHistory();
    setHistory(data);
  };

  const handleGenerateQuestion = useCallback(async () => {
    setStatus(Status.LOADING);
    setCurrentEvaluation(null);
    setCurrentAttemptId(null);
    setUserAnswer('');
    
    try {
        // Step 1: Check Backend for existing relevant question
        // Pass the current topic to check
        const existing = await mockBackend.checkExistingQuestion(topic);
        
        if (existing) {
            console.log("Loaded existing question from DB");
            setCurrentQuestion(existing);
        } else {
            // Step 2: Generate New via Backend if not found
            console.log("Generating new question via Backend");
            const newQuestion = await GeminiService.generateNewQuestion(topic);
            setCurrentQuestion(newQuestion);
        }
        setStatus(Status.SUCCESS);
    } catch (error) {
        console.error(error);
        setStatus(Status.ERROR);
    }
  }, [topic]);

  const handleSubmit = async () => {
    if (!currentQuestion || !userAnswer.trim()) return;

    setStatus(Status.LOADING);
    try {
        // Step 3: Evaluate Answer (Backend now returns full attempt)
        const attemptResult = await GeminiService.evaluateSubmission(currentQuestion, userAnswer);
        
        setCurrentEvaluation(attemptResult.evaluation);
        setCurrentAttemptId(attemptResult.id);

        // Step 4: Refresh History
        await loadHistory();
        setStatus(Status.SUCCESS);
    } catch (error) {
        console.error(error);
        setStatus(Status.ERROR);
    }
  };

  const handleHistorySelect = (attempt: Attempt) => {
    setCurrentQuestion(attempt.question);
    setUserAnswer(attempt.userAnswer);
    setCurrentEvaluation(attempt.evaluation);
    setCurrentAttemptId(attempt.id);
    setStatus(Status.SUCCESS);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTryAgain = () => {
    setCurrentEvaluation(null);
    setCurrentAttemptId(null);
    // Keep the current question and user answer to allow editing
    setStatus(Status.SUCCESS);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar - Desktop: Left, Mobile: Hidden/Bottom */}
      <div className="w-full md:w-80 p-4 border-r border-gray-200 bg-white md:h-screen sticky top-0 md:overflow-hidden flex flex-col">
        <div className="mb-6 flex-shrink-0">
            <h1 className="text-xl font-bold text-slate-800 flex items-center">
                <i className="fas fa-brain text-accent mr-2"></i> TechCheck AI
            </h1>
            <p className="text-xs text-gray-500 mt-1">Powered by Gemini & Python</p>
        </div>
        
        {/* Topic Selector */}
        <div className="mb-6 flex-shrink-0">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Topic</label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="flex-1 bg-slate-100 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                    placeholder="e.g. Python, SQL"
                />
            </div>
        </div>

        <button 
            onClick={handleGenerateQuestion}
            disabled={status === Status.LOADING}
            className="w-full bg-accent hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg shadow transition-all flex items-center justify-center gap-2 flex-shrink-0"
        >
            {status === Status.LOADING && !currentQuestion ? (
                <i className="fas fa-spinner fa-spin"></i>
            ) : (
                <i className="fas fa-plus-circle"></i>
            )}
            Generate New Question
        </button>

        <div className="mt-6 flex-1 overflow-hidden relative">
            <div className="absolute inset-0 overflow-y-auto">
                <HistorySidebar history={history} onSelectAttempt={handleHistorySelect} />
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        {/* Error Banner */}
        {status === Status.ERROR && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> Ensure the backend is running on port 5001.</span>
            </div>
        )}

        {/* Start State */}
        {!currentQuestion && status !== Status.LOADING && (
            <div className="text-center py-20 animate-fade-in-up">
                <div className="text-6xl text-slate-200 mb-4">
                    <i className="fas fa-code"></i>
                </div>
                <h2 className="text-2xl font-bold text-slate-700 mb-2">Ready to test your knowledge?</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                    Select a topic on the sidebar and click "Generate New Question" to begin your technical assessment.
                </p>
            </div>
        )}

        {/* Active Question Area */}
        {currentQuestion && (
            <div className="space-y-6 animate-fade-in">
                <QuestionCard 
                    question={currentQuestion} 
                    isGenerating={status === Status.LOADING && !currentQuestion.text} 
                />

                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase flex items-center">
                             <i className="fas fa-pen mr-2"></i> Your Answer
                        </span>
                        {userAnswer.length > 0 && (
                             <span className="text-xs text-gray-400">{userAnswer.length} chars</span>
                        )}
                    </div>
                    <textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your comprehensive answer here..."
                        className="w-full h-48 p-4 text-slate-700 focus:outline-none resize-none bg-white"
                        disabled={status === Status.LOADING || !!currentEvaluation} 
                    ></textarea>
                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                         <div className="text-xs text-gray-400">
                            {!!currentEvaluation ? "View mode: Read only" : "Markdown supported"}
                         </div>
                        <div className="flex gap-3">
                             {!!currentEvaluation && (
                                <button
                                    onClick={handleTryAgain}
                                    className="px-4 py-2 rounded-lg font-semibold text-slate-600 hover:text-slate-800 transition-all"
                                >
                                    Refine / Try Again
                                </button>
                            )}
                            {(!currentEvaluation || status === Status.LOADING) && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={status === Status.LOADING || !userAnswer.trim()}
                                    className={`px-6 py-2 rounded-lg font-semibold text-white transition-all shadow-md flex items-center
                                        ${status === Status.LOADING || !userAnswer.trim() 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    {status === Status.LOADING ? (
                                        <><i className="fas fa-spinner fa-spin mr-2"></i> Evaluating...</>
                                    ) : (
                                        'Submit Answer'
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Feedback Area */}
                {currentEvaluation && (
                    <div className="animate-fade-in-up">
                        <FeedbackDisplay evaluation={currentEvaluation} />
                        {currentAttemptId && <FeedbackForm attemptId={currentAttemptId} />}
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};

export default App;