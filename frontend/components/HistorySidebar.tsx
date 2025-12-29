import React, { useEffect, useState } from 'react';
import { Attempt } from '../types';

interface HistorySidebarProps {
  onSelectAttempt: (attempt: Attempt) => void;
  refreshTrigger?: number; 
  onClose: () => void; // Added to close dropdown when item is clicked
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ onSelectAttempt, refreshTrigger = 0, onClose }) => {
  const [history, setHistory] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5001/api/attempts'); 
      if (!response.ok) throw new Error('Failed to fetch history');
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setHistory(data);
      } else if (data.history && Array.isArray(data.history)) {
        setHistory(data.history);
      } else {
        setHistory([]); 
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load history');
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  const handleItemClick = (attempt: Attempt) => {
    onSelectAttempt(attempt);
    onClose(); // Close the dropdown
  };

  return (
    // Changed container to fit a dropdown style (w-full, max-height)
    <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[500px] w-80">
      <div className="p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
        <h3 className="font-bold text-slate-200 flex items-center text-sm">
          <i className="fas fa-history text-indigo-500 mr-2"></i> Activity Log
        </h3>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Recent Assessments</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {isLoading && (
            <div className="flex justify-center p-8">
                <i className="fas fa-circle-notch fa-spin text-indigo-500 text-xl"></i>
            </div>
        )}

        {!isLoading && error && (
            <div className="text-center py-6 px-4 text-red-400 text-xs">
                {error}
                <button onClick={fetchHistory} className="block w-full mt-2 text-indigo-400 hover:text-indigo-300 underline">Retry</button>
            </div>
        )}

        {!isLoading && !error && history.length === 0 && (
            <div className="text-center py-10 px-6 text-slate-600 text-sm">
                <i className="fas fa-inbox text-2xl mb-2 opacity-50"></i>
                <p>No history yet.</p>
            </div>
        )}

        {!isLoading && history.map((attempt) => (
            <div 
                key={attempt.id || Math.random()}
                onClick={() => handleItemClick(attempt)}
                className="group p-3 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-700"
            >
                <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-semibold text-slate-300 truncate w-2/3 group-hover:text-indigo-400 transition-colors">
                    {attempt.question.topic}
                </span>
                <span className={`text-xs font-bold ${attempt.evaluation.score >= 70 ? 'text-green-400' : 'text-orange-400'}`}>
                    {attempt.evaluation.score}%
                </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 mb-1">
                    {attempt.question.text}
                </p>
                <div className="text-[10px] text-slate-600 flex items-center">
                    {new Date(attempt.timestamp).toLocaleDateString()}
                    <span className="mx-1">•</span>
                    {new Date(attempt.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default HistorySidebar;