import os
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from dotenv import load_dotenv

# Import helper
from geminiapi import generate_response

load_dotenv()

app = Flask(__name__)
CORS(app) 

# Database Configuration
uri = os.getenv("MONGO_URI")
if not uri:
    print("⚠️  .env not found or MONGO_URI missing. Using default localhost.")
    uri = "mongodb://localhost:27017/ai_checker_db"

app.config["MONGO_URI"] = uri
mongo = PyMongo(app)

def get_timestamp():
    return int(time.time() * 1000)

# --- 1. GENERATE Endpoint ---
@app.route('/api/generate', methods=['POST'])
def generate_question():
    data = request.json
    topic = data.get('topic', 'Software Engineering')

    try:
        # We only need to send the topic. geminiapi handles the randomization/styles.
        input_data = {
            "topic": topic
        }

        print(f"Generating NEW unique question for topic: {topic}")
        
        json_string = generate_response(data=input_data, num=1)
        generated_list = json.loads(json_string)

        if not generated_list:
             # Fallback if AI fails (keeps app alive)
             generated_list = [{
                 "text": f"Explain the core concepts of {topic}.", 
                 "difficulty": "Intermediate", 
                 "topic": topic
             }]

        question_data = generated_list[0]
        
        # Fix missing 'text' field if AI names it 'question'
        if 'text' not in question_data:
            question_data['text'] = question_data.get('question', 'Question text missing')

        # Add Metadata
        question_data['topic'] = topic
        question_data['timestamp'] = get_timestamp()
        
        # Save to DB
        result = mongo.db.questions.insert_one(question_data)
        question_data['id'] = str(result.inserted_id)
        if '_id' in question_data: del question_data['_id']
        
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
        # Define the Evaluation Prompt
        eval_prompt = f"""
            You are a technical interviewer.
            Question: "{question_obj.get('text')}"
            Candidate Answer: "{user_answer}"
            
            Evaluate this answer. Return a JSON object with strictly these keys:
            - "score": number (0-100)
            - "spellingErrors": list of strings (typos)
            - "technicalAccuracy": string (brief comment)
            - "improvedAnswer": string (better version)
            - "keyConceptsMissed": list of strings
            - "isCorrect": boolean
        """

        # Send as 'custom_prompt' to trigger Evaluation Mode in geminiapi
        input_data = {
            "custom_prompt": eval_prompt
        }

        json_string = generate_response(data=input_data, num=1)
        generated_list = json.loads(json_string)
        evaluation_data = generated_list[0] if generated_list else {}

        # Save Attempt
        attempt_record = {
            "question": question_obj,
            "userAnswer": user_answer,
            "evaluation": evaluation_data,
            "timestamp": get_timestamp()
        }

        result = mongo.db.attempts.insert_one(attempt_record)
        attempt_record['id'] = str(result.inserted_id)
        if '_id' in attempt_record: del attempt_record['_id']

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
    # Kept port 5001 as requested
    app.run(debug=True, port=5001)