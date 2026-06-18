document.addEventListener("DOMContentLoaded", () => {

  const dynamicContent = document.getElementById("dynamicContent");

  // ================= HOME =================
  function showHomePage() {
    dynamicContent.innerHTML = `
      <div class="hero-wrap">
        <div class="hero-chip">✦ Academic Achievement Portal</div>
        <h1 class="hero-title">Certificate Upload &amp;<br>Analysis System</h1>
        <p class="hero-subtitle">
          Upload certificates, track academic achievements, and generate
          comprehensive reports — all in one place.
        </p>
        <div class="hero-actions">
          <button class="btn-hero-primary" id="homeRegisterBtn">🆕 Get Started</button>
          <button class="btn-hero-outline"  id="homeLoginBtn">🔐 Login</button>
        </div>

        <!-- Live stats -->
        <div class="hero-stats">
          <div class="stat-card">
            <div class="stat-icon">🎓</div>
            <div class="stat-number" id="stat-students">—</div>
            <div class="stat-label">Students Enrolled</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-number" id="stat-achievements">—</div>
            <div class="stat-label">Achievements Uploaded</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📂</div>
            <div class="stat-number" id="stat-categories">—</div>
            <div class="stat-label">Achievement Categories</div>
          </div>
        </div>
      </div>
    `;

    attachHomeButtonEvents();
    loadPortalStats();

    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    document.getElementById("homeLink")?.classList.add("active");
  }

  function loadPortalStats() {
    fetch("http://localhost:5000/portal-stats")
      .then(res => res.json())
      .then(data => {
        animateCount("stat-students",     data.students);
        animateCount("stat-achievements", data.achievements);
        animateCount("stat-categories",   data.categories);
      })
      .catch(() => {
        ["stat-students","stat-achievements","stat-categories"]
          .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = "—";
          });
      });
  }

  function animateCount(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const duration  = 1200;
    const steps     = 40;
    const interval  = duration / steps;
    let current     = 0;
    const increment = target / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        el.textContent = target;
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(current);
      }
    }, interval);
  }

  function attachHomeButtonEvents() {
    document.getElementById("homeRegisterBtn")?.addEventListener("click", () => {
      toggleDropdown("createAccountDropdown");
      document.querySelector(".sidebar").scrollIntoView({ behavior: "smooth" });
    });
    document.getElementById("homeLoginBtn")?.addEventListener("click", () => {
      toggleDropdown("loginDropdown");
      document.querySelector(".sidebar").scrollIntoView({ behavior: "smooth" });
    });
  }

  function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    const isOpen   = dropdown.style.display === "block";
    document.querySelectorAll(".dropdown-container").forEach(d => d.style.display = "none");
    document.querySelectorAll(".nav-toggle").forEach(t => t.classList.remove("open"));
    if (!isOpen) {
      dropdown.style.display = "block";
      dropdown.previousElementSibling?.classList.add("open");
    }
  }

  // ================= LOGIN =================
  function showLoginForm(role) {
    dynamicContent.innerHTML = `
      <div class="form-container">
        <h2>🔐 ${role} Login</h2>
        <input type="email"    id="loginEmail"    class="form-control mb-3" placeholder="Email address" required>
        <input type="password" id="loginPassword" class="form-control mb-3" placeholder="Password"      required>
        <button id="loginBtn" class="btn btn-primary w-100">Login →</button>

        <!-- Forgot Password link -->
        <div class="text-center mt-3">
          <a href="#" id="forgotPasswordLink" style="font-size:0.85rem; color:#6366f1; text-decoration:none;">
            🔑 Forgot Password?
          </a>
        </div>

        <p id="loginMessage" class="mt-3 text-danger" style="font-size:0.88rem;"></p>
      </div>
    `;

    document.getElementById("loginBtn").addEventListener("click", () => {
      const email    = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();
      const msgEl    = document.getElementById("loginMessage");

      if (!email || !password) {
        msgEl.textContent = "❌ Please fill all fields";
        return;
      }

      fetch("http://localhost:5000/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password, role })
      })
      .then(res => res.json())
      .then(data => {
        if (data.message === "Login Successful") {
          localStorage.setItem("student_id",    data.user.id);
          localStorage.setItem("student_name",  data.user.name);
          localStorage.setItem("student_email", data.user.email);
          localStorage.setItem("role",          role);

          if (role === "Faculty") {
            localStorage.setItem("faculty_user", JSON.stringify(data.user));
          }
          if (role === "Admin") {
            localStorage.setItem("admin_user", JSON.stringify(data.user));
          }

          if (role === "Student") {
            window.location.href = "StudentProfile.html";
          } else if (role === "Faculty") {
            window.location.href = "FacultyProfile.html";
          } else if (role === "Admin") {
            window.location.href = "AdminDashboard.html";
          }
        } else {
          msgEl.textContent = "❌ " + data.message;
        }
      })
      .catch(err => {
        console.error(err);
        msgEl.textContent = "❌ Server error. Make sure server is running.";
      });
    });

    // Forgot password link → show reset form for same role
    document.getElementById("forgotPasswordLink").addEventListener("click", (e) => {
      e.preventDefault();
      showForgotPasswordForm(role);
    });
  }

  // ================= FORGOT PASSWORD =================
  function showForgotPasswordForm(role) {
    dynamicContent.innerHTML = `
      <div class="form-container">
        <h2>🔑 Reset Password</h2>
        <p style="font-size:0.88rem; color:#94a3b8; margin-bottom:1.2rem;">
          Enter your registered email and choose a new password.
        </p>

        <input type="email"    id="resetEmail"           class="form-control mb-3" placeholder="Registered Email" required>
        <input type="password" id="resetNewPassword"     class="form-control mb-3" placeholder="New Password"     required>
        <input type="password" id="resetConfirmPassword" class="form-control mb-3" placeholder="Confirm New Password" required>

        <button id="resetBtn" class="btn btn-success w-100">Reset Password →</button>

        <div class="text-center mt-3">
          <a href="#" id="backToLoginLink" style="font-size:0.85rem; color:#6366f1; text-decoration:none;">
            ← Back to Login
          </a>
        </div>

        <p id="resetMessage" class="mt-3" style="font-size:0.88rem;"></p>
      </div>
    `;

    document.getElementById("resetBtn").addEventListener("click", () => {
      const email           = document.getElementById("resetEmail").value.trim();
      const newPassword     = document.getElementById("resetNewPassword").value.trim();
      const confirmPassword = document.getElementById("resetConfirmPassword").value.trim();
      const msgEl           = document.getElementById("resetMessage");

      // Client-side validation
      if (!email || !newPassword || !confirmPassword) {
        msgEl.className   = "mt-3 text-danger";
        msgEl.textContent = "❌ Please fill all fields.";
        return;
      }
      if (newPassword !== confirmPassword) {
        msgEl.className   = "mt-3 text-danger";
        msgEl.textContent = "❌ Passwords do not match.";
        return;
      }
      if (newPassword.length < 6) {
        msgEl.className   = "mt-3 text-danger";
        msgEl.textContent = "❌ Password must be at least 6 characters.";
        return;
      }

      msgEl.className   = "mt-3 text-secondary";
      msgEl.textContent = "⏳ Processing...";

      fetch("http://localhost:5000/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, newPassword, role })
      })
      .then(res => res.json())
      .then(data => {
        const ok = data.message?.toLowerCase().includes("success");
        msgEl.className   = ok ? "mt-3 text-success" : "mt-3 text-danger";
        msgEl.textContent = (ok ? "✅ " : "❌ ") + data.message;

        // Auto-redirect back to login after 2 seconds on success
        if (ok) {
          setTimeout(() => showLoginForm(role), 2000);
        }
      })
      .catch(err => {
        console.error(err);
        msgEl.className   = "mt-3 text-danger";
        msgEl.textContent = "❌ Server error. Make sure server is running.";
      });
    });

    document.getElementById("backToLoginLink").addEventListener("click", (e) => {
      e.preventDefault();
      showLoginForm(role);
    });
  }

  // ================= DEPARTMENT OPTIONS (single source of truth) =================
  const departmentOptions = `
    <option value="">Select Department</option>
    <option value="IT">IT</option>
    <option value="CS">CS</option>
    <option value="MECH">Mechanical</option>
    <option value="CIVIL">Civil</option>
    <option value="AIDS">AIDS</option>
    <option value="ENTC">ENTC</option>
    <option value="FY">First Year</option>
    <option value="OTHERS">Others</option>
  `;

  // ================= REGISTER =================
  function showCreateAccountForm(role) {

    let extraField = "";

    if (role === "Student") {
      extraField = `
        <div class="mb-3">
          <label class="form-label">Year</label>
          <select class="form-select" id="year" required>
            <option value="">Select Year</option>
            <option value="FE">First Year (FE)</option>
            <option value="SE">Second Year (SE)</option>
            <option value="TE">Third Year (TE)</option>
            <option value="BE">Final Year (BE)</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Department</label>
          <select class="form-select" id="department" required>
            ${departmentOptions}
          </select>
        </div>
      `;
    }

    if (role === "Admin") {
      extraField = `
        <div class="mb-3">
          <label class="form-label">🔑 Admin Secret Key</label>
          <input type="password" class="form-control" id="adminKey" placeholder="Enter secret key to register as Admin" required>
          <small style="color:#94a3b8;">Contact the system administrator to get the secret key.</small>
        </div>
      `;
    }

    dynamicContent.innerHTML = `
      <div class="form-container">
        <h2>🆕 ${role} Registration</h2>
        <input type="text"     id="name"           class="form-control mb-3" placeholder="Full Name"        required>
        <input type="email"    id="email"           class="form-control mb-3" placeholder="Email"            required>
        <input type="text"     id="phone"           class="form-control mb-3" placeholder="Phone Number"     required>
        <input type="password" id="password"        class="form-control mb-3" placeholder="Password"         required>
        <input type="password" id="confirmPassword" class="form-control mb-3" placeholder="Confirm Password" required>
        ${extraField}
        <button id="createAccountButton" class="btn btn-success w-100">Create Account →</button>
        <p id="registrationMessage" class="mt-3" style="font-size:0.88rem;"></p>
      </div>
    `;

    document.getElementById("createAccountButton").addEventListener("click", () => {
      const name            = document.getElementById("name").value.trim();
      const email           = document.getElementById("email").value.trim();
      const phone           = document.getElementById("phone").value.trim();
      const password        = document.getElementById("password").value.trim();
      const confirmPassword = document.getElementById("confirmPassword").value.trim();
      const year            = document.getElementById("year")?.value       || null;
      const department      = document.getElementById("department")?.value || null;
      const adminKey        = document.getElementById("adminKey")?.value   || null;
      const msgEl           = document.getElementById("registrationMessage");

      if (!name || !email || !phone || !password || !confirmPassword) {
        msgEl.className   = "mt-3 text-danger";
        msgEl.textContent = "❌ Please fill all fields!";
        return;
      }
      if (password !== confirmPassword) {
        msgEl.className   = "mt-3 text-danger";
        msgEl.textContent = "❌ Passwords do not match!";
        return;
      }
      if (role === "Student") {
        if (!year) {
          msgEl.className   = "mt-3 text-danger";
          msgEl.textContent = "❌ Please select your year!";
          return;
        }
        if (!department) {
          msgEl.className   = "mt-3 text-danger";
          msgEl.textContent = "❌ Please select your department!";
          return;
        }
      }
      if (role === "Admin") {
        if (!adminKey) {
          msgEl.className   = "mt-3 text-danger";
          msgEl.textContent = "❌ Please enter the admin secret key!";
          return;
        }
        if (adminKey !== "APCOER@ADMIN2026") {
          msgEl.className   = "mt-3 text-danger";
          msgEl.textContent = "❌ Invalid admin secret key!";
          return;
        }
      }

      fetch("http://localhost:5000/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, phone, password, role, year, department })
      })
      .then(res => res.json())
      .then(data => {
        const ok = data.message.toLowerCase().includes("success");
        msgEl.className   = ok ? "mt-3 text-success" : "mt-3 text-danger";
        msgEl.textContent = (ok ? "✅ " : "❌ ") + data.message;
      })
      .catch(err => {
        console.error(err);
        msgEl.className   = "mt-3 text-danger";
        msgEl.textContent = "❌ Registration failed. Make sure server is running.";
      });
    });
  }

  // ================= SIDEBAR EVENTS =================
  document.getElementById("homeLink")?.addEventListener("click", (e) => {
    e.preventDefault();
    showHomePage();
  });

  document.getElementById("loginLink")?.addEventListener("click", (e) => {
    e.preventDefault();
    toggleDropdown("loginDropdown");
  });

  document.getElementById("createAccountLink")?.addEventListener("click", (e) => {
    e.preventDefault();
    toggleDropdown("createAccountDropdown");
  });

  document.getElementById("studentLogin")?.addEventListener("click",  (e) => { e.preventDefault(); showLoginForm("Student"); });
  document.getElementById("facultyLogin")?.addEventListener("click",  (e) => { e.preventDefault(); showLoginForm("Faculty"); });
  document.getElementById("adminLogin")?.addEventListener("click",    (e) => { e.preventDefault(); showLoginForm("Admin");   });

  document.getElementById("studentAccount")?.addEventListener("click", (e) => { e.preventDefault(); showCreateAccountForm("Student"); });
  document.getElementById("facultyAccount")?.addEventListener("click", (e) => { e.preventDefault(); showCreateAccountForm("Faculty"); });
  document.getElementById("adminAccount")?.addEventListener("click",   (e) => { e.preventDefault(); showCreateAccountForm("Admin");   });

  // ================= INIT =================
  showHomePage();

});