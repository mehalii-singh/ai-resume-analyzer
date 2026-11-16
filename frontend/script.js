const API_URL =
  location.hostname === "127.0.0.1" || location.hostname === "localhost"
    ? "http://127.0.0.1:5000"
    : "https://YOUR-APP.onrender.com";
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
        const response = await fetch(`${API_URL}/upload`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        console.log(data);

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
        renderBreakdown(data.score_breakdown || {});

        saveHistory({
  date: new Date().toLocaleString(),
  file: data.filename || "resume.pdf",
  ats: score,
  match: match,
});
renderHistory();

        results.hidden = false;

    } catch (error) {
        alert("Error: " + error.message);
        console.error(error);
    } finally {
        loading.hidden = true;
    }
});
function renderBreakdown(breakdown) {
  const parts = [
    { key: "contact", label: "Contact info", max: 15 },
    { key: "skills", label: "Skills", max: 20 },
    { key: "education", label: "Education", max: 15 },
    { key: "experience", label: "Experience", max: 20 },
    { key: "projects", label: "Projects", max: 15 },
    { key: "achievements", label: "Achievements", max: 15 },
  ];

  const rows = parts.map((p, i) => {
    const value = Number(breakdown[p.key]) || 0;
    const scale = Math.min(value / p.max, 1);
    return `
      <div class="bd-row" style="--d:${i * 110}ms">
        <div class="bd-label">
          <span>${p.label}</span>
          <span class="bd-num" data-to="${value}" data-max="${p.max}">0/${p.max}</span>
        </div>
        <div class="bd-track"><div class="bd-fill" style="--s:${scale}"></div></div>
      </div>`;
  }).join("");

  const grid = document.querySelector(".dashboard-grid");
  if (!grid) return;

  const old = grid.querySelector(".breakdown-card");
  if (old) old.remove();

  const card = document.createElement("div");
  card.className = "dashboard-card breakdown-card";
  card.innerHTML = `<h3>Score Breakdown</h3>${rows}`;
  grid.insertBefore(card, grid.children[2] || null);

  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    card.classList.add("in");
    card.querySelectorAll(".bd-num").forEach((el, i) => countUp(el, i * 110 + 200));
  }, { threshold: 0.3 });
  io.observe(card);
}

function countUp(el, delay) {
  const to = Number(el.dataset.to);
  const max = el.dataset.max;
  const start = performance.now() + delay;
  const tick = (now) => {
    const p = Math.min(Math.max((now - start) / 1000, 0), 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + "/" + max;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("cvibe_history") || "[]");
  } catch (e) {
    return [];
  }
}

function saveHistory(entry) {
  try {
    const list = getHistory();
    list.unshift(entry);
    localStorage.setItem("cvibe_history", JSON.stringify(list.slice(0, 10)));
  } catch (e) {}
}

function renderHistory() {
  const grid = document.querySelector(".dashboard-grid");
  if (!grid) return;

  const old = grid.querySelector(".history-card");
  if (old) old.remove();

  const list = getHistory();
  if (!list.length) return;

  const card = document.createElement("div");
  card.className = "dashboard-card history-card";

  const head = document.createElement("div");
  head.className = "history-head";
  const title = document.createElement("h3");
  title.textContent = "Past analyses";
  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "hist-clear";
  clear.textContent = "Clear history";
  clear.onclick = () => {
    localStorage.removeItem("cvibe_history");
    card.remove();
  };
  head.append(title, clear);
  card.appendChild(head);

  list.forEach((item, i) => {
    const row = document.createElement("div");
    row.className = "hist-row";
    row.style.setProperty("--d", i * 80 + "ms");

    const cells = [
      [item.date, ""],
      [item.file, ""],
      ["ATS " + item.ats, "hist-score"],
      ["Match " + item.match + "%", "hist-score"],
    ];
    cells.forEach(([text, cls]) => {
      const span = document.createElement("span");
      span.textContent = text; // textContent keeps odd file names safe
      if (cls) span.className = cls;
      row.appendChild(span);
    });
    card.appendChild(row);
  });

  grid.appendChild(card);
}