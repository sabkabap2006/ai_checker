import { Question, Attempt, EvaluationResult } from '../types';

// Ensure this matches your Python Backend URL and Port
const API_URL = 'http://localhost:5001/api';

// --- 1. GENERATE NEW QUESTION ---
export const generateNewQuestion = async (topic: string): Promise<Question> => {
  try {
    const response = await fetch(`${API_URL}/generate?t=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Backend error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.text && !data.question) {
      throw new Error("Received empty question from backend");
    }

    return data;
  } catch (error) {
    console.error("Error fetching question:", error);
    throw error;
  }
};

// --- 2. EVALUATE SUBMISSION ---
export const evaluateSubmission = async (question: Question, answer: string): Promise<Attempt> => {
  try {
    // Step 1: Get AI Evaluation
    const evalResponse = await fetch(`${API_URL}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        question: question, 
        user_answer: answer 
      }),
    });

    if (!evalResponse.ok) {
      throw new Error(`Evaluation failed: ${evalResponse.statusText}`);
    }

    const evaluationData: EvaluationResult = await evalResponse.json();

    // Step 2: Construct the Full Attempt Object
    const newAttempt: Attempt = {
        id: crypto.randomUUID(),
        timestamp: Date.now(), 
        question: question,
        userAnswer: answer,
        evaluation: evaluationData
    };

    // Step 3: Save to MongoDB
    const saveResponse = await fetch(`${API_URL}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAttempt)
    });

    if (!saveResponse.ok) {
        console.warn("Warning: Failed to save attempt to history database.");
    }

    return newAttempt;

  } catch (error) {
    console.error("Error in evaluateSubmission:", error);
    throw error;
  }
};

// --- 3. FETCH HISTORY ---
export const fetchHistory = async (): Promise<Attempt[]> => {
  try {
    const response = await fetch(`${API_URL}/attempts`);
    if (!response.ok) throw new Error("Failed to fetch history");
    const data = await response.json();
    return data; 
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
};

// --- 4. GET LATEST QUESTION (New Feature) ---
/**
 * Fetches the most recently generated question from the backend.
 * Used to restore the session when the page reloads.
 */
export const getLatestQuestion = async (): Promise<Question | null> => {
  try {
    const response = await fetch(`${API_URL}/questions/latest`);
    
    // If 200 OK, parse json. If backend returns null, data will be null.
    if (response.ok) {
      const data = await response.json();
      return data; 
    }
    
    // If backend returns 404 or other errors, return null
    return null;
  } catch (error) {
    console.error("Error fetching latest question:", error);
    // Return null so the app knows to fall back to generating a new one
    return null;
  }
};