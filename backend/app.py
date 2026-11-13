from flask import Flask, request, jsonify
from flask_cors import CORS
import pdfplumber
from analyzer import (
    extract_skills,
    calculate_ats_score,
    match_job_description,
    generate_resume_feedback
)

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return jsonify({"message": "AI Resume Analyzer API is running"})


@app.route("/upload", methods=["POST"])
def upload():
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["resume"]
    job_description = request.form.get("job_description", "")
    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files allowed"}), 400

    text = ""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            text += (page.extract_text() or "") + "\n"
    skills = extract_skills(text)
    analysis = calculate_ats_score(text, skills)
    feedback = generate_resume_feedback(text, skills)
    job_match = None

    if job_description.strip():
        job_match = match_job_description(
            text,
            job_description
        )        

    return jsonify({
    "filename": file.filename,
    "characters": len(text),
    "text": text,
    "skills": skills,
    "total_skills": len(skills),
    "ats_score": analysis["ats_score"],
    "score_breakdown": analysis["breakdown"],
    "suggestions": analysis["suggestions"],
    "job_match": job_match,
    "resume_feedback": feedback
})     

    
if __name__ == "__main__":
    app.run(debug=True)