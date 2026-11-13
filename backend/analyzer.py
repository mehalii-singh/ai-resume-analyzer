import re

SKILLS = [
    # Languages
    "Python", "Java", "C++", "C#", "JavaScript", "TypeScript", "PHP", "Kotlin", "Swift", "Ruby",
    # Web
    "HTML", "CSS", "React", "Angular", "Vue", "Node.js", "Express", "Flask", "Django",
    "Bootstrap", "Tailwind", "REST API", "jQuery",
    # Data and AI
    "Machine Learning", "Deep Learning", "Artificial Intelligence", "Data Analysis",
    "Data Science", "NLP", "Pandas", "NumPy", "TensorFlow", "PyTorch", "Scikit-learn",
    "Power BI", "Tableau", "Excel",
    # Databases
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "SQLite", "Firebase",
    # Tools and cloud
    "Git", "GitHub", "Docker", "Linux", "AWS", "Azure", "Postman", "VS Code",
    # Core CS
    "Data Structures", "Algorithms", "OOP", "Operating Systems", "Computer Networks",
    # Soft skills
    "Communication", "Leadership", "Teamwork", "Problem Solving", "Time Management",
]

ALIASES = {
    "JavaScript": ["js"],
    "TypeScript": ["ts"],
    "Machine Learning": ["ml"],
    "Artificial Intelligence": ["ai"],
    "Deep Learning": ["dl"],
    "Node.js": ["nodejs", "node"],
    "React": ["reactjs", "react.js"],
    "PostgreSQL": ["postgres"],
    "MongoDB": ["mongo"],
    "C++": ["cpp"],
    "Data Structures": ["dsa"],
    "OOP": ["object oriented", "object-oriented"],
    "Problem Solving": ["problem-solving"],
    "Scikit-learn": ["sklearn"],
}

def extract_skills(text):
    found_skills = []

    for skill in SKILLS:
        names = [skill] + ALIASES.get(skill, [])

        for name in names:
            pattern = r"(?<!\w)" + re.escape(name) + r"(?!\w)"
            if re.search(pattern, text, re.IGNORECASE):
                found_skills.append(skill)
                break

    return found_skills

def calculate_ats_score(text, skills):

    score = 0
    breakdown = {}
    suggestions = []

    # 1. Contact Information (15 points)
    contact_score = 0

    if re.search(r'\S+@\S+\.\S+', text):
        contact_score += 8
    else:
        suggestions.append("Add your email address.")

    if re.search(r'\b\d{10}\b', text):
        contact_score += 7
    else:
        suggestions.append("Add your phone number.")

    breakdown["contact"] = contact_score
    score += contact_score

    # 2. Skills (20 points)
    skill_score = min(len(skills) * 4, 20)

    breakdown["skills"] = skill_score
    score += skill_score

    if len(skills) < 3:
        suggestions.append("Include more relevant skills.")

    # 3. Education (15 points)
    education_words = [
        "education", "university", "college",
        "bachelor", "master", "degree"
    ]

    education_score = 15 if any(
        word in text.lower() for word in education_words
    ) else 0

    breakdown["education"] = education_score
    score += education_score

    if education_score == 0:
        suggestions.append("Add an education section.")

    # 4. Experience (20 points)
    experience_words = [
        "experience", "internship",
        "employment", "worked"
    ]

    experience_score = 20 if any(
        word in text.lower() for word in experience_words
    ) else 0

    breakdown["experience"] = experience_score
    score += experience_score

    if experience_score == 0:
        suggestions.append("Add your work experience or internships.")

    # 5. Projects (15 points)
    project_score = 15 if "project" in text.lower() else 0

    breakdown["projects"] = project_score
    score += project_score

    if project_score == 0:
        suggestions.append("Include relevant projects.")

    # 6. Measurable achievements (15 points)
    achievement_score = 15 if re.search(
        r'\b\d+%|\b\d+\+|\b\d+\s*(users|clients|projects)\b',
        text.lower()
    ) else 0

    breakdown["achievements"] = achievement_score
    score += achievement_score

    if achievement_score == 0:
        suggestions.append(
            "Include measurable achievements wherever possible."
        )

    return {
        "ats_score": score,
        "breakdown": breakdown,
        "suggestions": suggestions
    }

def match_job_description(resume_text, job_description):

    resume_skills = extract_skills(resume_text)
    required_skills = extract_skills(job_description)

    matched_skills = []
    missing_skills = []

    for skill in required_skills:
        if skill in resume_skills:
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    if len(required_skills) > 0:
        match_score = round(
            len(matched_skills) / len(required_skills) * 100
        )
    else:
        match_score = 0

    return {
        "match_score": match_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "total_required_skills": len(required_skills)
    }

def generate_resume_feedback(text, skills):

    feedback = []
    text_lower = text.lower()

    # Check resume length
    if len(text) < 1000:
        feedback.append(
            "Your resume seems too short. Add more relevant details."
        )

    # Check skills
    if len(skills) < 5:
        feedback.append(
            "Add more relevant technical and professional skills."
        )

    # Check experience
    if "experience" not in text_lower:
        feedback.append(
            "Add a dedicated work experience section."
        )

    # Check projects
    if "project" not in text_lower:
        feedback.append(
            "Include projects to demonstrate practical experience."
        )

    # Check education
    education_words = ["education", "b.tech", "bachelor", "degree", "university", "college", "diploma"]
    if not any(w in text_lower for w in education_words):
        feedback.append(
            "Add your educational qualifications."
        )

    # Check measurable achievements
    if not re.search(r"\d+\s*%|\d+\+|[$₹]\s?\d", text_lower):
        feedback.append(
            "Include measurable achievements wherever possible."
        )

    if not feedback:
        feedback.append(
            "Your resume looks good. Keep improving your achievements."
        )

    return feedback