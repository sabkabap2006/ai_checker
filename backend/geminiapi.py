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
    
    # ✅ USE A STABLE MODEL
    # 'gemini-1.5-flash' is the safest, fastest choice for free tier.
    # You can try 'gemini-2.0-flash' if your API key supports it.
    model_name = "gemini-3-pro-preview"
    
    prompt = data.get("custom_prompt", "")
    topic = data.get("topic", "General")

    # --- 1. DETERMINE MODE & DEFINE SCHEMA ---
    
    # We check the prompt text to decide which Schema to enforce.
    # If the prompt contains "Evaluate", we use the Grading Schema.
    is_evaluation = "Evaluate" in prompt or "score" in prompt

    if is_evaluation:
        # CASE A: EVALUATION MODE
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
    else:
        # CASE B: GENERATION MODE
        # If no custom prompt was passed, build one
        if not prompt:
            styles = ["conceptual", "debugging", "system design", "best practices"]
            chosen_style = random.choice(styles)
            seed = random.randint(1, 100000)
            
            prompt = (
                f"Generate {num} unique technical interview question(s) about {topic}. "
                f"Focus on a {chosen_style} aspect. Random Seed: {seed}"
            )
        
        # Schema for a LIST of questions
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
                temperature=0.8 
            )
        )

        result_text = response.text
        parsed_json = json.loads(result_text)

        # --- 3. FORMATTING FIX FOR APP.PY ---
        # app.py expects a list.
        # If we got a single object (Evaluation), wrap it in a list.
        if isinstance(parsed_json, dict):
            return json.dumps([parsed_json])
            
        # If we got a list (Questions), return as is.
        return result_text

    except Exception as e:
        print(f"❌ Gemini API Error: {e}")
        # Return an empty list string so app.py doesn't crash
        return "[]"