import React, { useState } from 'react';
import { UserFeedback } from '../types';
// DELETED: import { mockBackend } from '../services/storageService';

interface FeedbackFormProps {
  attemptId: string;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ attemptId }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    
    const feedback: UserFeedback = {
      id: crypto.randomUUID(),
      attemptId,
      rating,
      comment,
      timestamp: Date.now()
    };

    try {
      // CHANGED: Send to Python Backend instead of mockBackend
      const response = await fetch('http://localhost:5001/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error("Failed to submit feedback", error);
      alert("Error submitting feedback. Ensure backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mt-6 text-center animate-fade-in-up">
        <div className="text-green-500 text-3xl mb-2">
          <i className="fas fa-check-circle"></i>
        </div>
        <h3 className="text-lg font-bold text-slate-800">Thank You!</h3>
        <p className="text-slate-600">Your feedback helps improve our training data.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center">
        <i className="fas fa-star text-yellow-400 mr-2"></i> Rate this Evaluation
      </h3>
      
      {/* Star Rating */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="text-2xl focus:outline-none transition-transform hover:scale-110"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          >
            <i className={`fas fa-star ${star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'}`}></i>
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Any additional comments? (Optional)"
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-accent text-sm min-h-[80px]"
      />

      <button
        type="submit"
        disabled={rating === 0 || isSubmitting}
        className={`mt-4 w-full py-2 rounded-lg font-semibold text-white transition-colors
          ${rating === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900'}`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  );
};

export default FeedbackForm;