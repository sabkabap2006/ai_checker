import os
import json
import time
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
    # Use localhost if .env is missing
    uri = "mongodb://localhost:27017/ai_checker_db"

app.config["MONGO_URI"] = uri
mongo = PyMongo(app)

def get_timestamp():
    return int(time.time() * 1000)

def serialize_doc(doc):
    """Helper to convert MongoDB ObjectIds to strings for JSON"""
    if not doc: return None
    # FIX: Check if _id exists before trying to convert it
    if '_id' in doc:
        doc['id'] = str(doc['_id'])
        del doc['_id']
    return doc

# --- 1. GENERATE Endpoint ---
@app.route('/api/generate', methods=['POST'])
def generate_question():
    data = request.json
    topic = data.get('topic', 'Software Engineering')

    try:
        input_data = { "topic": topic }
        print(f"Generating NEW unique question for topic: {topic}")
        
        # Call Gemini via your helper
        json_string = generate_response(data=input_data, num=1)
        generated_list = json.loads(json_string)

        if not generated_list:
             generated_list = [{
                 "text": f"Explain the core concepts of {topic}.", 
                 "difficulty": "Intermediate", 
                 "topic": topic
             }]

        question_data = generated_list[0]
        
        # Normalize fields
        if 'text' not in question_data:
            question_data['text'] = question_data.get('question', 'Question text missing')

        question_data['topic'] = topic
        question_data['timestamp'] = get_timestamp()
        
        # FIX IS HERE: Remove .copy() so 'question_data' receives the new _id from Mongo
        mongo.db.questions.insert_one(question_data)
        
        # Now serialize_doc will find the _id
        return jsonify(serialize_doc(question_data)), 200

    except Exception as e:
        print(f"Generate Error: {e}")
        # Print the full traceback in console to debug
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
            You are a technical interviewer.
            Question: "{question_obj.get('text')}"
            Candidate Answer: "{user_answer}"
            
            Evaluate this answer. Return a JSON object with strictly these keys:
            - "score": number (0-100)
            - "isCorrect": boolean
            - "spellingErrors": list of strings (typos)
            - "keyConceptsMissed": list of strings (important missing technical details)
            - "technicalAccuracy": string (brief analytical comment)
            - "improvedAnswer": string (a better, more complete version of the answer)
        """

        input_data = { "custom_prompt": eval_prompt }

        # Call Gemini
        json_string = generate_response(data=input_data, num=1)
        generated_list = json.loads(json_string)
        evaluation_data = generated_list[0] if generated_list else {}

        return jsonify(evaluation_data), 200

    except Exception as e:
        print(f"Evaluate Error: {e}")
        return jsonify({"error": str(e)}), 500


# --- 3. ATTEMPTS Endpoint (History) ---
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
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        mongo.db.feedback.insert_one(data)
        return jsonify({"message": "Feedback received"}), 201
    except Exception as e:
        print(f"Feedback Error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("🚀 Server running on http://localhost:5001")
    app.run(debug=True, port=5001)