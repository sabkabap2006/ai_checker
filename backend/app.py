import os
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
from dotenv import load_dotenv
import google.generativeai as genai

# 1. Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app) 

# 2. CONFIGURATION FIX
# We check for the environment variable. If it's missing, we default to localhost.
uri = os.getenv("MONGO_URI")
if not uri:
    print("⚠️  .env not found or MONGO_URI missing. Using default localhost.")
    uri = "mongodb://localhost:27017/ai_checker_db"

app.config["MONGO_URI"] = uri
mongo = PyMongo(app)

# 3. Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ ERROR: GEMINI_API_KEY is missing from .env file!")
else:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash')

# --- Helper: Current Timestamp (ms) ---
def get_timestamp():
    return int(time.time() * 1000)

# --- 1. GENERATE Endpoint ---
@app.route('/api/generate', methods=['POST'])
def generate_question():
    data = request.json
    topic = data.get('topic', 'Software Engineering')

    try:
        prompt = f"""
        Generate a single technical interview question about "{topic}".
        Return ONLY a JSON object with these exact keys:
        - "text": The question content.
        - "difficulty": One of ["Beginner", "Intermediate", "Advanced"].
        - "topic": "{topic}"
        """
        
        response = model.generate_content(prompt)
        clean_text = response.text.strip().replace('```json', '').replace('```', '')
        question_data = json.loads(clean_text)
        
        question_data['timestamp'] = get_timestamp()
        
        result = mongo.db.questions.insert_one(question_data)
        question_data['id'] = str(result.inserted_id)
        del question_data['_id']
        
        return jsonify(question_data), 200

    except Exception as e:
        print(f"Generate Error: {e}")
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
        prompt = f"""
        You are a senior technical interviewer.
        Question: "{question_obj.get('text')}"
        Candidate Answer: "{user_answer}"
        
        Evaluate this answer rigorously. Return ONLY a JSON object with these keys:
        - "score": number (0-100).
        - "spellingErrors": array of strings (list any typos, or empty array).
        - "technicalAccuracy": string (brief comment on technical correctness).
        - "improvedAnswer": string (a concise, ideal answer).
        - "keyConceptsMissed": array of strings (list concepts the candidate missed).
        - "isCorrect": boolean.
        """
        
        response = model.generate_content(prompt)
        clean_text = response.text.strip().replace('```json', '').replace('```', '')
        evaluation_data = json.loads(clean_text)

        attempt_record = {
            "question": question_obj,
            "userAnswer": user_answer,
            "evaluation": evaluation_data,
            "timestamp": get_timestamp()
        }

        result = mongo.db.attempts.insert_one(attempt_record)
        attempt_record['id'] = str(result.inserted_id)
        del attempt_record['_id']

        return jsonify(attempt_record), 200

    except Exception as e:
        print(f"Evaluate Error: {e}")
        return jsonify({"error": str(e)}), 500

# --- 3. CHECK HISTORY Endpoint ---
@app.route('/api/check', methods=['GET'])
def check_history():
    try:
        cursor = mongo.db.attempts.find().sort("timestamp", -1).limit(10)
        history = []
        for doc in cursor:
            doc['id'] = str(doc['_id'])
            del doc['_id']
            history.append(doc)
            
        return jsonify({"history": history}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)