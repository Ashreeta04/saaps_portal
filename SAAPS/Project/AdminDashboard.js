const baseURL = "http://localhost:5000";

let allStudents = [];
let allFaculty  = [];

/* =========================
   WAIT UNTIL PAGE LOADS
========================= */
document.addEventListener("DOMContentLoaded", () => {
  loadDashboardStats();
  setupForms();
});

/* =========================
   LOAD DASHBOARD STATS
========================= */
function loadDashboardStats() {

  // ── Students ──────────────────────────────────────────────────────────────
  fetch(`${baseURL}/admin/get-students`)
    .then(res => res.json())
    .then(data => {
      allStudents = data;

      // Total count on dashboard
      const countEl = document.getElementById("studentCount");
      if (countEl) countEl.textContent = data.length;

      // Year distribution — FE/SE/TE/BE
      const yearMap = { FE: "year1", SE: "year2", TE: "year3", BE: "year4" };
      Object.entries(yearMap).forEach(([year, elId]) => {
        const el = document.getElementById(elId);
        if (el) el.textContent = data.filter(s => s.year === year).length;
      });
    })
    .catch(err => console.error("Student fetch error:", err));

  // ── Faculty ───────────────────────────────────────────────────────────────
  fetch(`${baseURL}/admin/get-faculty`)
    .then(res => res.json())
    .then(data => {
      allFaculty = data;

      const countEl = document.getElementById("teacherCount");
      if (countEl) countEl.textContent = data.length;
    })
    .catch(err => console.error("Teacher fetch error:", err));
}

/* =========================
   RENDER STUDENT TABLE
========================= */
function renderStudentTable() {
  const tbody = document.getElementById("studentTableBody");
  if (!tbody) return;

  if (allStudents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;opacity:0.6;">No students found</td></tr>`;
    return;
  }

  tbody.innerHTML = allStudents.map(s => `
    <tr>
      <td>${s.id}</td>
      <td>${s.name}</td>
      <td>${s.email}</td>
      <td>${s.phone || "—"}</td>
      <td>${s.year || "—"}</td>
      <td><button class="btn-delete" onclick="deleteStudent(${s.id})">🗑 Delete</button></td>
    </tr>
  `).join("");
}

/* =========================
   RENDER TEACHER TABLE
========================= */
function renderTeacherTable() {
  const tbody = document.getElementById("teacherTableBody");
  if (!tbody) return;

  if (allFaculty.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;opacity:0.6;">No faculty found</td></tr>`;
    return;
  }

  tbody.innerHTML = allFaculty.map(f => `
    <tr>
      <td>${f.id}</td>
      <td>${f.name}</td>
      <td>${f.email}</td>
      <td>${f.phone || "—"}</td>
      <td><button class="btn-delete" onclick="deleteFaculty(${f.id})">🗑 Delete</button></td>
    </tr>
  `).join("");
}

/* =========================
   LOAD ACHIEVEMENTS
========================= */
function loadAchievements() {
  const tbody = document.getElementById("achievementTableBody");
  if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:0.6;">Loading...</td></tr>`;

  fetch(`${baseURL}/admin/get-achievements`)
    .then(res => res.json())
    .then(data => {
      if (!tbody) return;

      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;opacity:0.6;">No achievements found</td></tr>`;
        return;
      }

      tbody.innerHTML = data.map(a => `
        <tr>
          <td>${a.owner_name || "—"}</td>
          <td style="text-transform:capitalize;">${a.type}</td>
          <td style="text-transform:capitalize;">${a.category}</td>
          <td>${a.uploaded_at ? new Date(a.uploaded_at).toLocaleDateString() : "—"}</td>
        </tr>
      `).join("");
    })
    .catch(err => console.error("Achievement fetch error:", err));
}

/* =========================
   DELETE STUDENT
========================= */
function deleteStudent(id) {
  if (!confirm("Are you sure you want to delete this student?")) return;
  fetch(`${baseURL}/admin/delete-student/${id}`, { method: "DELETE" })
    .then(res => res.json())
    .then(() => {
      allStudents = allStudents.filter(s => s.id !== id);
      renderStudentTable();
      // Update counts instantly
      const countEl = document.getElementById("studentCount");
      if (countEl) countEl.textContent = allStudents.length;
      const yearMap = { FE: "year1", SE: "year2", TE: "year3", BE: "year4" };
      Object.entries(yearMap).forEach(([year, elId]) => {
        const el = document.getElementById(elId);
        if (el) el.textContent = allStudents.filter(s => s.year === year).length;
      });
    })
    .catch(err => console.error("Delete error:", err));
}

/* =========================
   DELETE FACULTY
========================= */
function deleteFaculty(id) {
  if (!confirm("Are you sure you want to delete this faculty member?")) return;
  fetch(`${baseURL}/admin/delete-faculty/${id}`, { method: "DELETE" })
    .then(res => res.json())
    .then(() => {
      allFaculty = allFaculty.filter(f => f.id !== id);
      renderTeacherTable();
      const countEl = document.getElementById("teacherCount");
      if (countEl) countEl.textContent = allFaculty.length;
    })
    .catch(err => console.error("Delete error:", err));
}

/* =========================
   SECTION SWITCHING
========================= */
function showSection(sectionId) {
  document.querySelectorAll(".content-section").forEach(sec => {
    sec.style.display = "none";
  });

  const section = document.getElementById(sectionId);
  if (section) section.style.display = "block";

  // Update topbar title
  const titles = {
    dashboardView:      "Dashboard Overview",
    classView:          "Class Distribution",
    studentSection:     "Student Management",
    teacherSection:     "Faculty Management",
    achievementSection: "All Achievements"
  };
  const topbarEl = document.querySelector(".topbar h1");
  if (topbarEl && titles[sectionId]) topbarEl.textContent = titles[sectionId];

  // Load achievements fresh each time section opens
  if (sectionId === "achievementSection") loadAchievements();
}

/* =========================
   STUDENT SUB SECTION
========================= */
function showStudentSub(type) {
  document.getElementById("studentView").style.display = "none";
  document.getElementById("studentAdd").style.display  = "none";

  if (type === "view") {
    document.getElementById("studentView").style.display = "block";
    renderStudentTable();  // ✅ uses already-loaded allStudents array
  }
  if (type === "add") {
    document.getElementById("studentAdd").style.display = "block";
  }
}

/* =========================
   TEACHER SUB SECTION
========================= */
function showTeacherSub(type) {
  document.getElementById("teacherView").style.display = "none";
  document.getElementById("teacherAdd").style.display  = "none";

  if (type === "view") {
    document.getElementById("teacherView").style.display = "block";
    renderTeacherTable();  // ✅ uses already-loaded allFaculty array
  }
  if (type === "add") {
    document.getElementById("teacherAdd").style.display = "block";
  }
}

/* =========================
   REGISTER FORMS
========================= */
function setupForms() {

  const studentForm = document.getElementById("studentForm");
  if (studentForm) {
    studentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msgEl = document.getElementById("studentMsg");
      const data = {
        name:     document.getElementById("sname").value,
        email:    document.getElementById("semail").value,
        phone:    document.getElementById("sphone").value,
        password: document.getElementById("spassword").value,
        year:     document.getElementById("syear").value,
        role:     "Student"
      };
      try {
        const res    = await fetch(`${baseURL}/register`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
        });
        const result = await res.json();
        const ok = result.message.toLowerCase().includes("success");
        msgEl.style.color = ok ? "#4ade80" : "#f87171";
        msgEl.textContent = (ok ? "✅ " : "❌ ") + result.message;
        if (ok) {
          studentForm.reset();
          fetch(`${baseURL}/admin/get-students`)
            .then(r => r.json())
            .then(d => {
              allStudents = d;
              const countEl = document.getElementById("studentCount");
              if (countEl) countEl.textContent = d.length;
              const yearMap = { FE: "year1", SE: "year2", TE: "year3", BE: "year4" };
              Object.entries(yearMap).forEach(([year, elId]) => {
                const el = document.getElementById(elId);
                if (el) el.textContent = d.filter(s => s.year === year).length;
              });
            });
        }
      } catch {
        msgEl.style.color = "#f87171";
        msgEl.textContent = "❌ Error submitting form.";
      }
    });
  }

  const facultyForm = document.getElementById("facultyForm");
  if (facultyForm) {
    facultyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msgEl = document.getElementById("facultyMsg");
      const data = {
        name:     document.getElementById("fname").value,
        email:    document.getElementById("femail").value,
        phone:    document.getElementById("fphone").value,
        password: document.getElementById("fpassword").value,
        role:     "Faculty"
      };
      try {
        const res    = await fetch(`${baseURL}/register`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
        });
        const result = await res.json();
        const ok = result.message.toLowerCase().includes("success");
        msgEl.style.color = ok ? "#4ade80" : "#f87171";
        msgEl.textContent = (ok ? "✅ " : "❌ ") + result.message;
        if (ok) {
          facultyForm.reset();
          fetch(`${baseURL}/admin/get-faculty`)
            .then(r => r.json())
            .then(d => {
              allFaculty = d;
              const countEl = document.getElementById("teacherCount");
              if (countEl) countEl.textContent = d.length;
            });
        }
      } catch {
        msgEl.style.color = "#f87171";
        msgEl.textContent = "❌ Error submitting form.";
      }
    });
  }
}

/* =========================
   LOGOUT
========================= */
function logout() {
  localStorage.removeItem("admin_user");
  localStorage.removeItem("role");
  window.location.href = "index.html";
}