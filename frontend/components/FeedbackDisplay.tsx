import React, { useState } from 'react';
import { EvaluationResult } from '../types';

interface FeedbackDisplayProps {
  evaluation: EvaluationResult;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ evaluation }) => {
  const [copied, setCopied] = useState(false);

  // Safety checks
  const spellingErrors = evaluation.spellingErrors || [];
  const missingConcepts = evaluation.keyConceptsMissed || [];

  // Determine colors based on score
  const isPassing = evaluation.score >= 70;
  
  const scoreColor = 
    evaluation.score >= 80 ? 'text-emerald-400' : 
    evaluation.score >= 50 ? 'text-amber-400' : 'text-rose-400';
  
  const scoreBg = 
    evaluation.score >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : 
    evaluation.score >= 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-rose-500/10 border-rose-500/20';

  const badgeClass = 
    evaluation.score >= 80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 
    evaluation.score >= 50 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30';

  const handleCopy = () => {
    navigator.clipboard.writeText(evaluation.improvedAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 space-y-6 animate-fade-in-up">
      
      {/* 1. Dashboard KPI Card */}
      <div className={`p-6 rounded-xl border ${scoreBg} flex items-center justify-between relative overflow-hidden`}>
        {/* Ambient Glow */}
        <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${evaluation.score >= 70 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-slate-100">Assessment Result</h3>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${badgeClass}`}>
                {isPassing ? 'Passing' : 'Review Needed'}
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-md">
            {evaluation.isCorrect 
                ? 'Excellent work. Your response demonstrates strong technical understanding.' 
                : 'Your answer needs refinement. Review the missing concepts below.'}
          </p>
        </div>

        <div className="flex flex-col items-center relative z-10 pl-6 border-l border-slate-700/50">
          <span className={`text-5xl font-black tracking-tighter ${scoreColor}`}>{evaluation.score}</span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Score</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 2. Grammar Panel */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h4 className="font-semibold text-slate-300 flex items-center text-sm">
                    <i className="fas fa-spell-check text-indigo-400 mr-2"></i> Grammar & Syntax
                </h4>
                {spellingErrors.length === 0 && <i className="fas fa-check text-emerald-500 text-xs"></i>}
            </div>
            <div className="p-4 flex-1">
                {spellingErrors.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No spelling or grammatical errors detected.</p>
                ) : (
                    <ul className="list-disc list-inside text-sm text-rose-400 space-y-2">
                        {spellingErrors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                        ))}
                    </ul>
                )}
            </div>
        </div>

        {/* 3. Concepts Panel */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h4 className="font-semibold text-slate-300 flex items-center text-sm">
                    <i className="fas fa-lightbulb text-amber-500 mr-2"></i> Key Concepts
                </h4>
            </div>
            <div className="p-4 flex-1">
                {missingConcepts.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">You covered all core technical concepts.</p>
                ) : (
                    <ul className="space-y-2">
                        {missingConcepts.map((concept, idx) => (
                            <li key={idx} className="flex items-start text-sm text-slate-400">
                                <i className="fas fa-arrow-right text-slate-600 mt-1 mr-2 text-xs"></i>
                                {concept}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
      </div>

      {/* 4. Technical Analysis */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
        <h4 className="font-semibold text-slate-300 mb-3 flex items-center text-sm uppercase tracking-wide">
             <i className="fas fa-chart-bar text-indigo-400 mr-2"></i> AI Analysis
        </h4>
        <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap border-l-2 border-slate-700 pl-4">
          {evaluation.technicalAccuracy}
        </p>
      </div>

      {/* 5. Model Solution (Code Editor Style) */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="bg-slate-950 border-b border-slate-800 p-3 px-4 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <i className="fas fa-code-branch text-emerald-400 text-sm"></i>
                <h4 className="font-semibold text-slate-300 text-sm">Optimal Solution</h4>
             </div>
             <button 
                onClick={handleCopy}
                className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors"
             >
                {copied ? (
                    <><i className="fas fa-check text-emerald-400"></i> Copied</>
                ) : (
                    <><i className="far fa-copy"></i> Copy Code</>
                )}
             </button>
        </div>
        <div className="p-5 bg-slate-950">
            <div className="text-sm text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                {evaluation.improvedAnswer}
            </div>
        </div>
      </div>

    </div>
  );
};

export default FeedbackDisplay;