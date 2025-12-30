import os
import json
import random
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_response(data=None, num=1):
    """
    Interact with Google Gemini using Structured Output (JSON Schemas).
    Handles both 'Generation' (Questions) and 'Evaluation' (Grading).
    """
    if data is None: data = {}
    
    # Use a stable model. Switch to 'gemini-2.0-flash-exp' if you have access.
    model_name ="gemini-2.5-flash-lite"
    
    # --- 1. DETERMINE MODE & DEFINE SCHEMA ---
    
    # CASE A: EVALUATION MODE (Grading an answer)
    if "custom_prompt" in data:
        prompt = data["custom_prompt"]
        
        # Define strict schema for grading
        schema = {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "spellingErrors": {"type": "array", "items": {"type": "string"}},
                "technicalAccuracy": {"type": "string"},
                "improvedAnswer": {"type": "string"},
                "keyConceptsMissed": {"type": "array", "items": {"type": "string"}},
                "isCorrect": {"type": "boolean"},
            },
            "required": ["score", "technicalAccuracy", "improvedAnswer", "isCorrect"]
        }

    # CASE B: GENERATION MODE (Creating questions)
    else:
        topic = data.get("topic", "Software Engineering")
        
        # Add randomness to prompt to prevent repetitive questions
        styles = ["conceptual", "debugging", "system design", "best practices"]
        chosen_style = random.choice(styles)
        seed = random.randint(1, 100000)
        
        prompt = (
            f"Generate {num} unique technical interview question(s) about {topic}. "
            f"Focus on a {chosen_style} aspect. Random Seed: {seed}"
        )
        
        # Define strict schema for a LIST of questions
        schema = {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "text": {"type": "string"},
                    "difficulty": {"type": "string", "enum": ["Beginner", "Intermediate", "Advanced"]},
                    "topic": {"type": "string"},
                },
                "required": ["text", "difficulty", "topic"]
            }
        }

    # --- 2. CALL GEMINI API ---
    try:
        model = genai.GenerativeModel(model_name)
        
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json", # Forces JSON output
                response_schema=schema,                # Forces specific structure
                temperature=0.7 
            )
        )

        result_text = response.text
        parsed_json = json.loads(result_text)

        # --- 3. FORMATTING FIX FOR APP.PY ---
        # app.py expects a list (it calls result[0]). 
        # Evaluation mode returns a dict. We must wrap it.
        if isinstance(parsed_json, dict):
            return json.dumps([parsed_json])
            
        # Generation mode is already a list.
        return result_text

    except Exception as e:
        print(f"❌ Gemini API Error: {e}")
        # Return an empty list string so app.py doesn't crash on json.loads()
        return "[]"