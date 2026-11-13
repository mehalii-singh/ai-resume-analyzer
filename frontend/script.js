const form = document.getElementById("resumeForm");
const loading = document.getElementById("loading");
const results = document.getElementById("results");

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const resume = document.getElementById("resume").files[0];
    const jobDescription = document.getElementById("jobDescription").value;

    if (!resume) {
        alert("Please upload your resume PDF.");
        return;
    }

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("job_description", jobDescription);

    loading.hidden = false;
    results.hidden = true;

    try {
        const response = await fetch("http://127.0.0.1:5000/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Analysis failed.");
        }

        const score = Number(data.ats_score) || 0;
        const match = Number(data.job_match?.match_score) || 0;

        const matched = data.job_match?.matched_skills || [];
        const missing = data.job_match?.missing_skills || [];

        results.innerHTML = `
            <h2>Resume Analysis Dashboard</h2>

            <div class="dashboard-grid">

                <div class="dashboard-card">
                    <h3>ATS Score</h3>
                    <div class="score-circle"
                         style="--score:${score}">
                        <span>${score}</span>
                    </div>
                    <p>Out of 100</p>
                </div>

                <div class="dashboard-card">
                    <h3>Job Match</h3>
                    <h2>${match}%</h2>
                    <div class="progress-bar">
                        <div style="width:${Math.min(100, Math.max(0, match))}%"></div>
                    </div>
                    <p>Skills compatibility</p>
                </div>

            </div>

            <div class="dashboard-card">
                <h3>Extracted Skills</h3>
                <div class="skill-list">
                    ${(data.skills || []).map(s =>
                        `<span class="skill">${s}</span>`
                    ).join("") || "No skills detected"}
                </div>
            </div>

            <div class="dashboard-grid">

                <div class="dashboard-card">
                    <h3>✓ Matched Skills</h3>
                    ${matched.map(s =>
                        `<p class="matched">✓ ${s}</p>`
                    ).join("") || "<p>None</p>"}
                </div>

                <div class="dashboard-card">
                    <h3>✕ Missing Skills</h3>
                    ${missing.map(s =>
                        `<p class="missing">✕ ${s}</p>`
                    ).join("") || "<p>None</p>"}
                </div>

            </div>

            <div class="dashboard-card">
                <h3>Improvement Suggestions</h3>
                <ul>
                    ${(data.suggestions || []).map(s =>
                        `<li>${s}</li>`
                    ).join("")}
                </ul>
            </div>

            <div class="dashboard-card">
                <h3>Resume Feedback</h3>
                <ul>
                    ${(data.resume_feedback || []).map(s =>
                        `<li>${s}</li>`
                    ).join("")}
                </ul>
            </div>
        `;

        results.hidden = false;

    } catch (error) {
        alert("Error: " + error.message);
        console.error(error);
    } finally {
        loading.hidden = true;
    }
});