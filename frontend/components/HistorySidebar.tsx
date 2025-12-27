import React from 'react';
import { Attempt } from '../types';

interface HistorySidebarProps {
  history: Attempt[];
  onSelectAttempt: (attempt: Attempt) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onSelectAttempt }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-bold text-slate-800 flex items-center">
          <i className="fas fa-history text-accent mr-2"></i> Recent Activity
        </h3>
        <p className="text-xs text-gray-500 mt-1">Stored in Backend (simulated)</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {history.length === 0 ? (
            <div className="text-center py-8 px-4 text-gray-400 text-sm">
                No history yet. Try generating a question!
            </div>
        ) : (
            history.map((attempt) => (
            <div 
                key={attempt.timestamp}
                onClick={() => onSelectAttempt(attempt)}
                className="group p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
            >
                <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-semibold text-slate-600 truncate w-2/3">
                    {attempt.question.topic}
                </span>
                <span className={`text-xs font-bold ${attempt.evaluation.score >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                    {attempt.evaluation.score}%
                </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                {attempt.question.text}
                </p>
                <div className="text-[10px] text-gray-400 flex items-center">
                <i className="far fa-clock mr-1"></i>
                {new Date(attempt.timestamp).toLocaleDateString()}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default HistorySidebar;
