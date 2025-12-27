import { Question, EvaluationResult, Attempt } from "../types";

// Point to the Flask backend
const API_URL = 'http://localhost:5001/api';

export const generateNewQuestion = async (topic: string = "Software Engineering"): Promise<Question> => {
  try {
    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching question from backend:", error);
    throw error;
  }
};

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

    // Backend now returns the full attempt object including evaluation and ID
    return await response.json();
  } catch (error) {
    console.error("Error evaluating via backend:", error);
    throw error;
  }
};