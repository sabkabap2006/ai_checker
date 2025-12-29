import React from 'react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  isGenerating: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, isGenerating }) => {
  if (isGenerating) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse border border-gray-200">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
      <div className="flex justify-between items-start mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(question.difficulty)}`}>
          {question.difficulty}
        </span>
        {/* <span className="text-xs text-gray-500 font-mono">ID: {question.id.slice(0, 8)}</span> */}
      </div>
      <h2 className="text-sm font-bold text-accent uppercase tracking-wide mb-2">{question.topic}</h2>
      <h1 className="text-2xl font-bold text-slate-800 leading-relaxed">
       {question.text || (question as any).question || "Waiting for question..."}
      </h1>
    </div>
  );
};

export default QuestionCard;
