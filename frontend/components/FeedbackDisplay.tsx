import React from 'react';
import { EvaluationResult } from '../types';

interface FeedbackDisplayProps {
  evaluation: EvaluationResult;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ evaluation }) => {
  const scoreColor = 
    evaluation.score >= 80 ? 'text-green-600' : 
    evaluation.score >= 50 ? 'text-yellow-600' : 'text-red-600';
  
  const scoreBg = 
    evaluation.score >= 80 ? 'bg-green-50 border-green-200' : 
    evaluation.score >= 50 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

  return (
    <div className="mt-8 space-y-6 animate-fade-in-up">
      {/* Score Header */}
      <div className={`p-6 rounded-xl border ${scoreBg} flex items-center justify-between`}>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Assessment Result</h3>
          <p className="text-sm text-slate-600 mt-1">
            {evaluation.isCorrect ? 'Great job! Your answer is technically sound.' : 'There is room for improvement.'}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <span className={`text-4xl font-black ${scoreColor}`}>{evaluation.score}</span>
          <span className="text-xs text-gray-500 uppercase font-bold">Score</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spelling & Grammar */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-slate-700 mb-3 flex items-center">
                <i className="fas fa-spell-check text-blue-500 mr-2"></i> Spelling & Grammar
            </h4>
            {evaluation.spellingErrors.length === 0 ? (
                <p className="text-sm text-gray-600 flex items-center">
                    <i className="fas fa-check-circle text-green-500 mr-2"></i> No errors found.
                </p>
            ) : (
                <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {evaluation.spellingErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                    ))}
                </ul>
            )}
        </div>

        {/* Missing Concepts */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-slate-700 mb-3 flex items-center">
                <i className="fas fa-lightbulb text-yellow-500 mr-2"></i> Missing Concepts
            </h4>
            {evaluation.keyConceptsMissed.length === 0 ? (
                <p className="text-sm text-gray-600 flex items-center">
                    <i className="fas fa-check-circle text-green-500 mr-2"></i> You covered all key points.
                </p>
            ) : (
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {evaluation.keyConceptsMissed.map((concept, idx) => (
                        <li key={idx}>{concept}</li>
                    ))}
                </ul>
            )}
        </div>
      </div>

      {/* Technical Feedback */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h4 className="font-semibold text-slate-700 mb-2">Technical Analysis</h4>
        <p className="text-sm text-gray-600 leading-relaxed">{evaluation.technicalAccuracy}</p>
      </div>

      {/* Improved Answer */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-2">Model Answer</h4>
        <p className="text-sm text-slate-700 font-mono leading-relaxed bg-white p-4 rounded border border-slate-200">
          {evaluation.improvedAnswer}
        </p>
      </div>
    </div>
  );
};

export default FeedbackDisplay;
