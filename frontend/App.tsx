import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Question, Attempt, Status, EvaluationResult } from './types';
import * as GeminiService from './services/geminiService';
import QuestionCard from './components/QuestionCard';
import FeedbackDisplay from './components/FeedbackDisplay';
import FeedbackForm from './components/FeedbackForm';
import HistorySidebar from './components/HistorySidebar';

const App: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResult | null>(null);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);
  const [status, setStatus] = useState<Status>(Status.IDLE);
  
  // Default topic set to React JS (will be used for the auto-load)
  const [topic, setTopic] = useState('React JS');
  
  // UI States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsHistoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerateQuestion = useCallback(async () => {
    setStatus(Status.LOADING);
    setCurrentEvaluation(null);
    setCurrentAttemptId(null);
    setUserAnswer('');
    try {
        const newQuestion = await GeminiService.generateNewQuestion(topic);
        setCurrentQuestion(newQuestion);
        setStatus(Status.SUCCESS);
    } catch (error) {
        console.error(error);
        setStatus(Status.ERROR);
    }
  }, [topic]);

  // --- NEW: AUTO-GENERATE ON LOAD ---
  useEffect(() => {
    // This runs exactly once when the page loads/reloads
    handleGenerateQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handlePreSubmit = () => {
    if (!currentQuestion || !userAnswer.trim()) return;
    setIsSubmitModalOpen(true);
  };

  const executeSubmit = async () => {
    setIsSubmitModalOpen(false);
    setStatus(Status.LOADING);
    
    try {
        const attemptResult = await GeminiService.evaluateSubmission(currentQuestion!, userAnswer);
        setCurrentEvaluation(attemptResult.evaluation);
        setCurrentAttemptId(attemptResult.id);
        setRefreshHistoryTrigger(prev => prev + 1);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTryAgain = () => {
    setCurrentEvaluation(null);
    setCurrentAttemptId(null);
    setStatus(Status.SUCCESS);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-300 relative">
      
      {/* --- CONFIRMATION MODAL --- */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in px-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm transform transition-all scale-100 animate-fade-in-up">
                <div className="text-center mb-6">
                    <div className="bg-indigo-500/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                        <i className="fas fa-paper-plane text-2xl text-indigo-400 pl-1"></i>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Ready to Submit?</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Our AI is ready to analyze your code. You won't be able to edit your answer after submitting.
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsSubmitModalOpen(false)}
                        className="flex-1 px-4 py-3 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
                    >
                        Keep Writing
                    </button>
                    <button 
                        onClick={executeSubmit}
                        className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                    >
                        <span>Yes, Submit</span>
                        <i className="fas fa-arrow-right text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 w-64">
             <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/30">
                <i className="fas fa-code text-white"></i>
             </div>
             <div>
                <h1 className="text-lg font-bold text-slate-100 leading-tight">DevEvaluator</h1>
                <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">AI Assessment</p>
             </div>
        </div>

        {/* Center: Toolbar */}
        <div className="flex-1 flex justify-center items-center gap-4 max-w-2xl">
            <div className="relative w-64">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-600"
                    placeholder="Topic (e.g. Python)..."
                />
            </div>
            <button 
                onClick={handleGenerateQuestion}
                disabled={status === Status.LOADING}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-1.5 px-4 rounded-md shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
                {status === Status.LOADING && !currentQuestion ? (
                    <><i className="fas fa-circle-notch fa-spin"></i> Generating...</>
                ) : (
                    <><i className="fas fa-plus"></i> New Question</>
                )}
            </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 w-64 justify-end relative" ref={dropdownRef}>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
                <span className={`h-1.5 w-1.5 rounded-full ${status === Status.LOADING ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                <span className="text-xs font-medium text-slate-400">
                    {status === Status.LOADING ? 'Busy' : 'System Ready'}
                </span>
            </div>

            <div className="relative">
                <button 
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className={`p-2 rounded-full transition-all relative ${isHistoryOpen ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    <i className="fas fa-history text-lg"></i>
                </button>
                {isHistoryOpen && (
                    <div className="absolute right-0 top-full mt-3 animate-fade-in-up origin-top-right shadow-2xl z-50">
                        <HistorySidebar 
                            onSelectAttempt={handleHistorySelect}
                            refreshTrigger={refreshHistoryTrigger}
                            onClose={() => setIsHistoryOpen(false)}
                        />
                    </div>
                )}
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 text-xs font-bold text-slate-300 cursor-default select-none">
                AI
            </div>
        </div>
      </header>


      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full overflow-y-auto">
            
            {status === Status.ERROR && (
                <div className="bg-red-900/20 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center justify-center">
                    <i className="fas fa-exclamation-triangle mr-3"></i>
                    <span>Connection Error: Ensure backend is active on port 5001.</span>
                </div>
            )}

            {/* This empty state will only flash briefly before auto-load kicks in */}
            {!currentQuestion && status !== Status.LOADING && (
                <div className="text-center py-24 opacity-60 animate-pulse">
                    <div className="bg-slate-900 inline-block p-6 rounded-full mb-6 border border-slate-800 shadow-xl">
                        <i className="fas fa-terminal text-5xl text-indigo-500"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-200">Initializing Environment...</h2>
                </div>
            )}

            {currentQuestion && (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
                        <QuestionCard 
                            question={currentQuestion} 
                            isGenerating={status === Status.LOADING && !currentQuestion.text} 
                        />
                    </div>

                    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
                        <div className="bg-slate-900 border-b border-slate-800 p-3 px-4 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <i className="fas fa-code"></i> 
                                <span>Answer Editor</span>
                            </div>
                            <span className="text-xs text-slate-600 font-mono">Markdown Supported</span>
                        </div>
                        
                        <textarea
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="// Write your solution here..."
                            className="w-full h-64 p-5 bg-slate-950 text-slate-300 focus:outline-none resize-y font-mono text-sm leading-relaxed"
                            disabled={status === Status.LOADING || !!currentEvaluation} 
                        ></textarea>

                        <div className="bg-slate-900 border-t border-slate-800 p-4 flex justify-end gap-3">
                             {!!currentEvaluation ? (
                                <button
                                    onClick={handleTryAgain}
                                    className="px-5 py-2 rounded-md font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700"
                                >
                                    Try Again
                                </button>
                            ) : (
                                <button
                                    onClick={handlePreSubmit}
                                    disabled={status === Status.LOADING || !userAnswer.trim()}
                                    className={`px-6 py-2 rounded-md font-medium text-white shadow-lg transition-all flex items-center
                                        ${status === Status.LOADING || !userAnswer.trim() 
                                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                                            : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/25'}`}
                                >
                                    {status === Status.LOADING ? 'Compiling...' : 'Submit Answer'}
                                </button>
                            )}
                        </div>
                    </div>

                    {currentEvaluation && (
                        <div className="space-y-8 pb-10">
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