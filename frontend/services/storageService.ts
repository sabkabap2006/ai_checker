// src/services/storageService.ts
import { Attempt } from '../types';

const API_URL = 'http://localhost:5001';

export const mockBackend = {
  // Fetch history from MongoDB
  getHistory: async (): Promise<Attempt[]> => {
    try {
      const response = await fetch(`${API_URL}/check`);
      if (!response.ok) return [];
      
      const result = await response.json();
      
      // Map backend history to frontend format if necessary
      return result.history.map((item: any) => ({
        id: item.id,
        userAnswer: item.user_answer,
        evaluation: item.evaluation,
        question: {
          id: item.question_id,
          text: item.question_text,
          topic: 'Review', // Default or fetched if stored
          difficulty: 'Medium'
        }
      }));
    } catch (error) {
      console.error("Could not fetch history:", error);
      return [];
    }
  },

  // Check if we have a cached question (Optional: currently just returns null to force generation)
  checkExistingQuestion: async (topic: string) => {
    // You can implement local caching here later if you want to save API credits
    return null; 
  }
};