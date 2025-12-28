import { Question, Attempt } from '../types';

// Ensure this matches your backend port (5001)
const API_URL = 'http://localhost:5001/api';

/**
 * Generates a new question by calling the Python Backend.
 * The backend handles the AI Schema validation and Randomness.
 */
export const generateNewQuestion = async (topic: string): Promise<Question> => {
  try {
    // We add 't' (timestamp) to prevent browser caching
    const response = await fetch(`${API_URL}/generate?t=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({ topic }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Backend error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Safety check: Ensure the backend actually returned the text field
    if (!data.text && !data.question) {
      throw new Error("Received empty question from backend");
    }

    return data;
  } catch (error) {
    console.error("Error fetching question:", error);
    throw error;
  }
};

/**
 * Sends the user's answer to the backend for evaluation.
 * Returns a detailed score, feedback, and corrections.
 */
export const evaluateSubmission = async (question: Question, answer: string): Promise<Attempt> => {
  try {
    const response = await fetch(`${API_URL}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        question: question, 
        user_answer: answer 
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error evaluating:", error);
    throw error;
  }
};

/**
 * Fetches past interview history from MongoDB via the Backend.
 */
export const fetchHistory = async (): Promise<Attempt[]> => {
  try {
    const response = await fetch(`${API_URL}/check`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch history");
    }

    const data = await response.json();
    return data.history || []; // Backend returns { history: [...] }
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
};