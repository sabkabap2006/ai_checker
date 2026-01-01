import os
import json
import time
import random 
import re  # <--- NEW: Import Regex
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from dotenv import load_dotenv
from bson import ObjectId

# Import helper
from geminiapi import generate_response

load_dotenv()

app = Flask(__name__)
CORS(app) 

# Database Configuration
uri = os.getenv("MONGO_URI")
if not uri:
    uri = "mongodb://localhost:27017/ai_checker_db"

app.config["MONGO_URI"] = uri
mongo = PyMongo(app)

def get_timestamp():
    return int(time.time() * 1000)

def serialize_doc(doc):
    if not doc: return None
    if '_id' in doc:
        doc['id'] = str(doc['_id'])
        del doc['_id']
    return doc

# --- ROBUST PARSER FUNCTION ---
def robust_parse_ai_response(response, default_topic="General"):
    """
    Tries to extract a valid question object from ANY format the AI returns.
    """
    print(f"DEBUG: Raw AI Response Type: {type(response)}")
    print(f"DEBUG: Raw AI Response Content: {response}")

    # Case 1: It's already a list or dict (No parsing needed)
    if isinstance(response, (list, dict)):
        data = response
    
    # Case 2: It's a string, try to clean and parse JSON
    elif isinstance(response, str):
        cleaned = response.strip()
        # Remove Markdown wrappers
        if cleaned.startswith("```json"): cleaned = cleaned[7:]
        elif cleaned.startswith("```"): cleaned = cleaned[3:]
        if cleaned.endswith("```"): cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            print("WARNING: JSON Parse failed. Trying Regex extraction...")
            # Case 3: Regex Rescue - Find "text": "Something..." pattern
            match = re.search(r'"text":\s*"([^"]+)"', cleaned)
            if match:
                return {
                    "text": match.group(1),
                    "difficulty": "Intermediate",
                    "topic": default_topic
                }
            else:
                # Case 4: Total JSON failure? Just use the raw text as the question!
                # This ensures we see the error in the UI instead of the generic fallback.
                return {
                    "text": cleaned, 
                    "difficulty": "Unknown",
                    "topic": default_topic
                }
    else:
        return None

    # Normalize data to a single dict object
    if isinstance(data, list):
        if len(data) > 0:
            return data[0]
        else:
            return None
    return data

# --- 1. GENERATE Endpoint ---
@app.route('/api/generate', methods=['POST'])
def generate_question():
    data = request.json
    topic = data.get('topic', 'Software Engineering')

    try:
        print(f"Generating NEW question for topic: {topic}")

        # SIMPLIFIED PROMPT (Easier for AI to follow)
        prompt = f"""
            Generate 1 technical interview question about "{topic}".
            
            Return ONLY a single valid JSON object (no markdown, no code blocks) with this format:
            {{
                "text": "The question string",
                "difficulty": "Beginner/Intermediate/Advanced", 
                "topic": "{topic}"
            }}
        """

        input_data = { "custom_prompt": prompt }
        
        # Call Gemini
        raw_response = generate_response(data=input_data, num=1)
        
        # --- USE ROBUST PARSER ---
        question_data = robust_parse_ai_response(raw_response, topic)

        # Final Safety Net
        if not question_data or 'text' not in question_data:
             print("❌ parsing failed completely. Using fallback.")
             question_data = {
                 "text": f"Explain the core concepts of {topic}.", 
                 "difficulty": "Intermediate", 
                 "topic": topic
             }

        # Ensure topic exists
        question_data['topic'] = topic
        question_data['timestamp'] = get_timestamp()
        
        # Save to DB
        mongo.db.questions.insert_one(question_data)
        
        return jsonify(serialize_doc(question_data)), 200

    except Exception as e:
        print(f"Generate Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# --- 2. EVALUATE Endpoint ---
@app.route('/api/evaluate', methods=['POST'])
def evaluate_answer():
    data = request.json
    question_obj = data.get('question', {})
    user_answer = data.get('user_answer')

    if not question_obj or not user_answer:
        return jsonify({"error": "Missing data"}), 400

    try:
        eval_prompt = f"""
            Evaluate this answer. 
            Question: "{question_obj.get('text')}"
            Answer: "{user_answer}"
            
            Return ONLY a JSON object:
            {{
                "score": 0-100,
                "isCorrect": boolean,
                "spellingErrors": ["error1"],
                "keyConceptsMissed": ["concept1"],
                "technicalAccuracy": "comment",
                "improvedAnswer": "better answer"
            }}
        """

        input_data = { "custom_prompt": eval_prompt }
        raw_response = generate_response(data=input_data, num=1)
        
        # Use the same robust parser
        evaluation_data = robust_parse_ai_response(raw_response)

        if not evaluation_data:
             evaluation_data = {
                "score": 0,
                "technicalAccuracy": "Error parsing AI response. Check server logs."
            }

        return jsonify(evaluation_data), 200

    except Exception as e:
        print(f"Evaluate Error: {e}")
        return jsonify({"error": str(e)}), 500


# --- 3. ATTEMPTS Endpoint ---
@app.route('/api/attempts', methods=['GET', 'POST'])
def handle_attempts():
    try:
        if request.method == 'GET':
            cursor = mongo.db.attempts.find().sort("timestamp", -1)
            history = [serialize_doc(doc) for doc in cursor]
            return jsonify(history), 200

        elif request.method == 'POST':
            data = request.json
            if '_id' in data: 
                del data['_id']
            mongo.db.attempts.insert_one(data)
            return jsonify({"message": "Saved successfully"}), 201

    except Exception as e:
        print(f"History Error: {e}")
        return jsonify({"error": str(e)}), 500

# --- 4. FEEDBACK Endpoint ---
@app.route('/api/feedback', methods=['POST'])
def save_feedback():
    try:
        data = request.json
        mongo.db.feedback.insert_one(data)
        return jsonify({"message": "Feedback received"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- 5. GET LATEST QUESTION Endpoint ---
@app.route('/api/questions/latest', methods=['GET'])
def get_latest_question():
    try:
        latest = mongo.db.questions.find_one(sort=[("timestamp", -1)])
        return jsonify(serialize_doc(latest) if latest else None), 200 
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Server running on http://localhost:5001")
    app.run(debug=True, port=5001)