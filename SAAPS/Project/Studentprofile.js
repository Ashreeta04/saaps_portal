/* =====================================================
   studentprofile.js  –  Full form fields per DB schema
   ===================================================== */

const SERVER = "http://localhost:5000";

/* ── Magic-byte MIME detection (shared by view + download) ── */
function detectFileType(bytes) {
    if (bytes[0] === 0x25 && bytes[1] === 0x50) {
        return { mimeType: "application/pdf", ext: "pdf" };   // %P = PDF
    } else if (bytes[0] === 0x89 && bytes[1] === 0x50) {
        return { mimeType: "image/png", ext: "png" };          // PNG
    } else if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
        return { mimeType: "image/jpeg", ext: "jpg" };          // JPEG
    }
    return { mimeType: "application/octet-stream", ext: "" };
}

/* ── Certificate Viewer (Blob + magic-byte MIME detection) ── */
async function viewCert(table, id) {
    try {
        const res = await fetch(`${SERVER}/get-certificate/${table}/${id}`);
        if (!res.ok) { alert("Certificate not found."); return; }

        const arrayBuffer = await res.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const { mimeType } = detectFileType(bytes);

        const blob = new Blob([arrayBuffer], { type: mimeType });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
    } catch (err) {
        alert("Failed to load certificate.");
        console.error(err);
    }
}

/* ── Certificate Downloader (Blob + magic-byte MIME detection) ── */
async function downloadCert(table, id) {
    try {
        const res = await fetch(`${SERVER}/get-certificate/${table}/${id}`);
        if (!res.ok) { alert("Certificate not found."); return; }

        const arrayBuffer = await res.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const { mimeType, ext } = detectFileType(bytes);

        const blob = new Blob([arrayBuffer], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `certificate_${table}_${id}${ext ? "." + ext : ""}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        alert("Failed to download certificate.");
        console.error(err);
    }
}

/* ── Section Switchers ──────────────────────────────── */
function showUploadSection() {
    document.getElementById("uploadSection").classList.remove("d-none");
    document.getElementById("viewSection").classList.add("d-none");
    document.getElementById("portfolioSection").classList.add("d-none");
}

function showViewSection() {
    document.getElementById("uploadSection").classList.add("d-none");
    document.getElementById("viewSection").classList.remove("d-none");
    document.getElementById("portfolioSection").classList.add("d-none");
    loadAchievements();
}

function showPortfolioSection() {
    document.getElementById("uploadSection").classList.add("d-none");
    document.getElementById("viewSection").classList.add("d-none");
    document.getElementById("portfolioSection").classList.remove("d-none");
    buildPortfolioForm();

    const name  = localStorage.getItem("student_name")  || "";
    const email = localStorage.getItem("student_email") || "";
    setTimeout(() => {
        if (name)  { const el = document.getElementById("pf_fname"); if(el) el.value = name.split(" ")[0]; }
        if (email) { const el = document.getElementById("pf_email"); if(el) el.value = email; }
    }, 50);
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

/* ══════════════════════════════════════════════════════
   BUILD PORTFOLIO FORM
══════════════════════════════════════════════════════ */
function buildPortfolioForm() {
    const section = document.getElementById("portfolioSection");
    section.innerHTML = `
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
      .pf-card { background:#fff;border-radius:14px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,.06); }
      .pf-card h2 { font-family:'Playfair Display',serif;font-size:26px;margin:0 0 4px; }
      .pf-card .subtitle { color:#999;font-size:13px;margin-bottom:28px; }
      .pf-section-label {
        font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
        color:#3aada8;margin:28px 0 12px;display:flex;align-items:center;gap:8px;
      }
      .pf-section-label::after { content:'';flex:1;height:1px;background:#e8f5f4; }
      .pf-grid2 { display:grid;grid-template-columns:1fr 1fr;gap:14px; }
      .pf-grid3 { display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px; }
      .pf-span2 { grid-column:span 2; }
      .pf-field { display:flex;flex-direction:column;gap:5px; }
      .pf-field label { font-size:11.5px;font-weight:600;color:#555;letter-spacing:.03em; }
      .pf-field input,.pf-field textarea,.pf-field select {
        border:1px solid #e4e4e4;border-radius:8px;padding:9px 13px;
        font-family:'DM Sans',sans-serif;font-size:13.5px;color:#111;
        background:#fafafa;outline:none;transition:border-color .18s,background .18s;width:100%;
      }
      .pf-field input:focus,.pf-field textarea:focus,.pf-field select:focus {
        border-color:#3aada8;background:#fff;
      }
      .pf-field textarea { resize:vertical; }
      .pf-hint { font-size:11px;color:#bbb;margin-top:2px; }
      .pf-edu-block {
        background:#f8fffe;border:1px solid #d6efed;border-radius:9px;
        padding:14px 16px;margin-bottom:10px;
      }
      .sw-row { display:flex;gap:10px;align-items:center;margin-bottom:10px; }
      .sw-row input { flex:1; }
      .sw-row select { width:140px;flex-shrink:0; }
      .tags-wrap {
        display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;
        border:1px solid #e4e4e4;border-radius:8px;background:#fafafa;
        min-height:44px;cursor:text;transition:border-color .18s;
      }
      .tags-wrap:focus-within { border-color:#3aada8;background:#fff; }
      .tag {
        display:inline-flex;align-items:center;gap:5px;
        background:#e4f5f4;border:1px solid #b8e2e0;
        border-radius:20px;padding:3px 10px;
        font-size:12px;font-weight:500;color:#2a8a85;
      }
      .tag button { background:none;border:none;cursor:pointer;color:#999;font-size:14px;padding:0;line-height:1; }
      #coreTagInput,#softTagInput {
        border:none;outline:none;background:transparent;
        font-family:'DM Sans',sans-serif;font-size:13px;flex:1;min-width:100px;
      }
      .pf-btn-gen {
        width:100%;margin-top:28px;padding:14px;
        background:#111;color:#fff;border:none;border-radius:10px;
        font-size:15px;font-weight:600;cursor:pointer;
        font-family:'DM Sans',sans-serif;letter-spacing:.3px;
        transition:background .2s;
      }
      .pf-btn-gen:hover { background:#222; }
      @media(max-width:640px){
        .pf-grid2,.pf-grid3{grid-template-columns:1fr;}
        .pf-span2{grid-column:span 1;}
        .sw-row{flex-direction:column;}
        .sw-row select{width:100%;}
      }
    </style>

    <div class="pf-card">
      <h2>Create Your Portfolio</h2>
      <p class="subtitle">Fill in the details — achievements are pulled automatically from your account.</p>

      <!-- PROFILE -->
      <div class="pf-section-label">👤 Profile</div>
      <div class="pf-grid2" style="margin-bottom:14px;">
        <div class="pf-field">
          <label>First Name</label>
          <input id="pf_fname" placeholder="e.g. Anvee">
        </div>
        <div class="pf-field">
          <label>Last Name <span style="color:#3aada8;">(shown in teal)</span></label>
          <input id="pf_lname" placeholder="e.g. Mulay">
        </div>
        <div class="pf-field pf-span2">
          <label>Profile Photo</label>
          <input type="file" id="pf_photo" accept="image/*">
          <span class="pf-hint">Appears inside the teal blob shape on the portfolio</span>
        </div>
        <div class="pf-field pf-span2">
          <label>Bio / About Me</label>
          <textarea id="pf_bio" rows="4" placeholder="Write 2–3 lines about yourself, your interests and goals…"></textarea>
        </div>
      </div>

      <!-- CONTACT -->
      <div class="pf-section-label">📬 Contact</div>
      <div class="pf-grid2" style="margin-bottom:4px;">
        <div class="pf-field"><label>Email</label><input id="pf_email" type="email" placeholder="you@email.com"></div>
        <div class="pf-field"><label>Phone</label><input id="pf_phone" placeholder="+91 99999 00000"></div>
        <div class="pf-field"><label>LinkedIn / Portfolio URL</label><input id="pf_linkedin" placeholder="linkedin.com/in/yourname"></div>
        <div class="pf-field"><label>Location</label><input id="pf_location" placeholder="City, State"></div>
      </div>

      <!-- EDUCATION -->
      <div class="pf-section-label">🎓 Education <span style="font-weight:400;font-size:10px;color:#aaa;">(up to 3)</span></div>
      ${[1,2,3].map(i=>`
      <div class="pf-edu-block">
        <div class="pf-grid2">
          <div class="pf-field pf-span2">
            <label>Institution ${i}</label>
            <input id="pf_edu_inst${i}" placeholder="College / University name">
          </div>
          <div class="pf-field">
            <label>Duration</label>
            <input id="pf_edu_year${i}" placeholder="e.g. 2021 – 2025">
          </div>
          <div class="pf-field">
            <label>Degree / Course</label>
            <input id="pf_edu_deg${i}" placeholder="B.E. Computer Engineering">
          </div>
        </div>
      </div>`).join("")}

      <!-- LANGUAGES -->
      <div class="pf-section-label">🌐 Languages <span style="font-weight:400;font-size:10px;color:#aaa;">(up to 3)</span></div>
      ${[1,2,3].map(i=>`
      <div class="pf-grid3" style="margin-bottom:10px;">
        <div class="pf-field">
          <label>Language ${i}</label>
          <input id="pf_lang${i}" placeholder="e.g. English">
        </div>
        <div class="pf-field">
          <label>Level</label>
          <select id="pf_lang_lvl${i}">
            <option value="">— Select —</option>
            <option>Native</option><option>Fluent</option><option>Advanced</option>
            <option>Intermediate</option><option>Basic</option>
          </select>
        </div>
        <div class="pf-field">
          <label>Note <span style="color:#bbb;font-weight:400;">(optional)</span></label>
          <input id="pf_lang_note${i}" placeholder="e.g. IELTS Band 6.0">
        </div>
      </div>`).join("")}

      <!-- SOFTWARE SKILLS -->
      <div class="pf-section-label">💻 Software / Tech Skills <span style="font-weight:400;font-size:10px;color:#aaa;">(up to 6 with proficiency bar)</span></div>
      <div class="pf-grid2">
        ${[1,2,3,4,5,6].map(i=>`
        <div class="sw-row">
          <input id="pf_sw${i}" placeholder="e.g. Python, AutoCAD…">
          <select id="pf_sw_lvl${i}">
            <option value="0">— Level —</option>
            <option value="25">Beginner</option>
            <option value="50">Intermediate</option>
            <option value="75">Advanced</option>
            <option value="100">Expert</option>
          </select>
        </div>`).join("")}
      </div>

      <!-- CORE SKILLS -->
      <div class="pf-section-label">🔧 Core Skills</div>
      <div class="pf-field">
        <label>Type and press Enter or comma to add</label>
        <div class="tags-wrap" id="coreTagsWrap" onclick="document.getElementById('coreTagInput').focus()">
          <input id="coreTagInput" placeholder="e.g. DBMS, Cloud Computing, Circuit Design…">
        </div>
        <input type="hidden" id="pf_core_skills">
      </div>

      <!-- SOFT SKILLS -->
      <div class="pf-section-label" style="margin-top:20px;">🤝 Soft Skills</div>
      <div class="pf-field">
        <label>Type and press Enter or comma to add</label>
        <div class="tags-wrap" id="softTagsWrap" onclick="document.getElementById('softTagInput').focus()">
          <input id="softTagInput" placeholder="e.g. Leadership, Teamwork, Communication…">
        </div>
        <input type="hidden" id="pf_soft_skills">
      </div>

      <button class="pf-btn-gen" id="generateBtn" onclick="generatePortfolio()">✦ Generate Portfolio</button>
      <p id="portfolioMsg" style="text-align:center;font-size:13px;color:#e53e3e;margin-top:10px;min-height:18px;"></p>
    </div>`;

    initTagInputs();
}

/* ── Tag inputs ── */
let coreSkills = [], softSkills = [];

function initTagInputs() {
    coreSkills = []; softSkills = [];
    setupTagInput("coreTagInput","coreTagsWrap","pf_core_skills", coreSkills);
    setupTagInput("softTagInput","softTagsWrap","pf_soft_skills", softSkills);
}

function setupTagInput(inputId, wrapId, hiddenId, arr) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const val = input.value.trim().replace(/,$/, "");
            if (val && !arr.includes(val)) {
                arr.push(val);
                renderTags(wrapId, inputId, hiddenId, arr);
            }
            input.value = "";
        } else if (e.key === "Backspace" && input.value === "" && arr.length) {
            arr.pop();
            renderTags(wrapId, inputId, hiddenId, arr);
        }
    });
}

function renderTags(wrapId, inputId, hiddenId, arr) {
    const wrap  = document.getElementById(wrapId);
    const input = document.getElementById(inputId);
    wrap.innerHTML = "";
    arr.forEach((s, i) => {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.innerHTML = `${esc(s)}<button type="button" onclick="removeSkillTag('${wrapId}','${inputId}','${hiddenId}',${i})">×</button>`;
        wrap.appendChild(tag);
    });
    wrap.appendChild(input);
    document.getElementById(hiddenId).value = arr.join(",");
}

function removeSkillTag(wrapId, inputId, hiddenId, idx) {
    const arr = hiddenId === "pf_core_skills" ? coreSkills : softSkills;
    arr.splice(idx, 1);
    renderTags(wrapId, inputId, hiddenId, arr);
}

/* ── Helpers ── */
function v(id) { const el=document.getElementById(id); return el?el.value.trim():""; }
function esc(s) {
    return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* ══════════════════════════════════════════════════════
   GENERATE PORTFOLIO
══════════════════════════════════════════════════════ */
async function generatePortfolio() {
    const btn   = document.getElementById("generateBtn");
    const msgEl = document.getElementById("portfolioMsg");
    msgEl.innerText = "";

    const fname    = v("pf_fname");
    const lname    = v("pf_lname");
    const bio      = v("pf_bio");
    const email    = v("pf_email");
    const phone    = v("pf_phone");
    const linkedin = v("pf_linkedin");
    const location = v("pf_location");

    if (!fname) { msgEl.innerText = "⚠️ Please enter your first name."; return; }
    if (!email) { msgEl.innerText = "⚠️ Please enter your email.";      return; }

    // Photo → base64
    let photoSrc = "";
    const photoFile = document.getElementById("pf_photo")?.files?.[0];
    if (photoFile) {
        photoSrc = await new Promise(res => {
            const r = new FileReader();
            r.onload = e => res(e.target.result);
            r.readAsDataURL(photoFile);
        });
    }

    const edu = [1,2,3].map(i=>({
        inst: v(`pf_edu_inst${i}`), year: v(`pf_edu_year${i}`), deg: v(`pf_edu_deg${i}`)
    })).filter(e=>e.inst);

    const langs = [1,2,3].map(i=>({
        lang: v(`pf_lang${i}`), level: v(`pf_lang_lvl${i}`), note: v(`pf_lang_note${i}`)
    })).filter(l=>l.lang);

    const swSkills = [1,2,3,4,5,6].map(i=>({
        name: v(`pf_sw${i}`), level: parseInt(v(`pf_sw_lvl${i}`)||"0")
    })).filter(s=>s.name && s.level>0);

    const coreList = v("pf_core_skills").split(",").filter(Boolean);
    const softList = v("pf_soft_skills").split(",").filter(Boolean);

    const studentId = localStorage.getItem("student_id");
    if (!studentId) { alert("Session expired."); window.location.href="index.html"; return; }

    btn.disabled=true; btn.textContent="Generating…";
    let achievements=[];
    try {
        const res = await fetch(`${SERVER}/get-student-achievements/${studentId}`);
        achievements = await res.json();
        if (!Array.isArray(achievements)) achievements=[];
    } catch(e) { achievements=[]; }
    btn.disabled=false; btn.textContent="✦ Generate Portfolio";

    const html = buildPortfolioHTML({ fname,lname,bio,email,phone,linkedin,location,
                                       photoSrc,edu,langs,swSkills,coreList,softList,achievements });
    document.getElementById("portfolioOutput").innerHTML = html;
    document.getElementById("portfolioModal").style.display = "block";
    document.body.style.overflow = "hidden";
}

/* ══════════════════════════════════════════════════════
   PORTFOLIO HTML — matches reference design exactly
══════════════════════════════════════════════════════ */
function buildPortfolioHTML({fname,lname,bio,email,phone,linkedin,location,
    photoSrc,edu,langs,swSkills,coreList,softList,achievements}) {

    const TEAL = "#3aada8";

    /* ── Photo blob ── */
    const photoBlock = photoSrc
        ? `<div style="position:absolute;top:-10px;right:-10px;width:210px;height:250px;z-index:1;">
             <svg viewBox="0 0 210 250" xmlns="http://www.w3.org/2000/svg"
                  style="width:100%;height:100%;">
               <defs>
                 <clipPath id="blobClip">
                   <path d="M105,8 C155,8 202,45 202,105 C202,168 162,238 105,242
                            C48,246 8,188 8,128 C8,68 55,8 105,8 Z"/>
                 </clipPath>
               </defs>
               <path d="M105,8 C155,8 202,45 202,105 C202,168 162,238 105,242
                         C48,246 8,188 8,128 C8,68 55,8 105,8 Z" fill="${TEAL}"/>
               <image href="${photoSrc}" x="8" y="8" width="194" height="234"
                      clip-path="url(#blobClip)" preserveAspectRatio="xMidYMid slice"/>
             </svg>
           </div>`
        : `<div style="position:absolute;top:-10px;right:-10px;width:210px;height:250px;z-index:1;
                        border-radius:60% 40% 55% 45% / 50% 60% 40% 50%;
                        background:${TEAL};display:flex;align-items:center;justify-content:center;">
             <span style="font-size:72px;">👤</span>
           </div>`;

    /* ── Contact items ── */
    const ci = (icon,txt) => txt ? `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <div style="width:26px;height:26px;border:1.5px solid ${TEAL};border-radius:6px;flex-shrink:0;
                    display:flex;align-items:center;justify-content:center;font-size:12px;">${icon}</div>
        <span style="font-size:12.5px;color:#333;">${esc(txt)}</span>
      </div>` : "";

    /* ── Education ── */
    const eduHTML = edu.map(e=>`
      <div style="margin-bottom:18px;">
        <div style="font-size:14px;font-weight:700;color:#111;">${esc(e.inst)}</div>
        ${e.year?`<div style="font-size:12px;color:#888;margin-top:2px;">${esc(e.year)}</div>`:""}
        ${e.deg ?`<div style="font-size:13px;color:${TEAL};margin-top:3px;">${esc(e.deg)}</div>`:""}
      </div>`).join("");

    /* ── Languages ── */
    const langHTML = langs.map(l=>`
      <div style="display:flex;align-items:center;border:1px solid #ddd;border-radius:8px;
                  padding:9px 15px;margin-bottom:8px;gap:10px;">
        <span style="font-size:13px;font-weight:600;color:#111;min-width:72px;">${esc(l.lang)}</span>
        <span style="font-size:12px;color:${TEAL};font-weight:600;">${esc(l.level)}</span>
        ${l.note?`<span style="font-size:11px;color:#aaa;margin-left:auto;">${esc(l.note)}</span>`:""}
      </div>`).join("");

    /* ── Software bars — 2 cols ── */
    const swBar = s => `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:34px;height:34px;background:${TEAL};border-radius:7px;flex-shrink:0;
                    display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-size:11px;font-weight:700;letter-spacing:-.5px;">
            ${esc(s.name.substring(0,2).toUpperCase())}
          </span>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:12.5px;font-weight:600;color:#1a1a1a;margin-bottom:5px;
                      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(s.name)}</div>
          <div style="display:flex;gap:4px;">
            ${[25,50,75,100].map(t=>`
              <div style="height:6px;flex:1;border-radius:4px;
                          background:${s.level>=t ? TEAL : "#e4e4e4"};"></div>`).join("")}
          </div>
        </div>
      </div>`;

    const swLeft  = swSkills.slice(0,3);
    const swRight = swSkills.slice(3,6);

    /* ── Bullet list ── */
    const bullets = arr => arr.map(s=>
        `<div style="font-size:13px;color:#333;margin-bottom:6px;line-height:1.5;">• ${esc(s)}</div>`
    ).join("");

    /* ── Achievements ── */
    const catMeta = {
        conference:"Conference Publications", journal:"Journal Publications",
        internship:"Internships", sports:"Sports", cultural:"Cultural Events",
        technical:"Technical Events", higher:"Higher Education",
    };
    const grouped={};
    achievements.forEach(a=>{
        const c=a.category||"other";
        if(!grouped[c]) grouped[c]=[];
        grouped[c].push(a);
    });
    const achHTML = Object.keys(grouped).map(cat=>{
        const label = catMeta[cat]||cat;
        const items = grouped[cat].map(a=>{
            const title=esc(a.paper_title||a.event_name||a.internship_title||a.university_name||a.award||a.sport_name||"—");
            const sub  =esc(a.conference_name||a.company_name||a.organizer||"");
            const yr   =esc(a.academic_year||"");
            return `<div style="display:flex;justify-content:space-between;gap:16px;
                                padding:9px 0;border-bottom:1px solid #f0ede8;">
                      <div>
                        <span style="font-size:13px;font-weight:600;color:#1a1a1a;">${title}</span>
                        ${sub?`<span style="font-size:12px;color:${TEAL};margin-left:6px;">— ${sub}</span>`:""}
                      </div>
                      ${yr?`<span style="font-size:11px;color:#bbb;white-space:nowrap;flex-shrink:0;">${yr}</span>`:""}
                    </div>`;
        }).join("");
        return `
        <div style="margin-bottom:24px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
                      color:${TEAL};margin-bottom:8px;">${esc(label)}</div>
          ${items}
        </div>`;
    }).join("");

    /* ══ FULL HTML ══ */
    return `
    <div style="font-family:'DM Sans',sans-serif;background:#f0ede8;padding:56px 60px;color:#111;
                min-height:100%;position:relative;">

      <!-- ░░ HERO — name + photo ░░ -->
      <div style="position:relative;padding-right:240px;min-height:260px;margin-bottom:48px;">
        ${photoBlock}

        <h1 style="font-family:'Playfair Display',serif;font-size:40px;font-weight:900;
                   letter-spacing:-.02em;line-height:1.1;margin:0 0 16px;">
          Hello, I am
          <span style="color:${TEAL};font-style:italic;"> ${esc(fname)}${lname?" "+esc(lname):""}</span>
        </h1>

        ${bio?`<p style="font-size:13.5px;color:#444;line-height:1.8;max-width:480px;margin:0 0 28px;">${esc(bio)}</p>`:""}

        <!-- Contact -->
        <div>
          <h2 style="font-family:'Playfair Display',serif;font-size:22px;font-weight:900;margin:0 0 14px;">Contact</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 28px;max-width:460px;">
            ${ci("✉",email)}${ci("🔗",linkedin)}
            ${ci("📞",phone)}${ci("📍",location)}
          </div>
        </div>
      </div>

      <div style="border-top:1px solid #ccc8c0;margin-bottom:44px;"></div>

      <!-- ░░ EDUCATION + LANGUAGES ░░ -->
      ${(edu.length||langs.length)?`
      <div style="display:grid;grid-template-columns:${langs.length?"1fr 1fr":"1fr"};gap:52px;margin-bottom:44px;">
        ${edu.length?`
        <div>
          <h2 style="font-family:'Playfair Display',serif;font-size:24px;font-weight:900;margin:0 0 20px;">Education</h2>
          ${eduHTML}
        </div>`:""}
        ${langs.length?`
        <div>
          <h2 style="font-family:'Playfair Display',serif;font-size:24px;font-weight:900;margin:0 0 20px;">Languages</h2>
          ${langHTML}
        </div>`:""}
      </div>
      <div style="border-top:1px solid #ccc8c0;margin-bottom:44px;"></div>`:""}

      <!-- ░░ SOFTWARE SKILLS ░░ -->
      ${swSkills.length?`
      <div style="margin-bottom:44px;">
        <h2 style="font-family:'Playfair Display',serif;font-size:24px;font-weight:900;margin:0 0 20px;">Software &amp; Technical Skills</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 52px;">
          <div>${swLeft.map(swBar).join("")}</div>
          <div>${swRight.map(swBar).join("")}</div>
        </div>
      </div>
      <div style="border-top:1px solid #ccc8c0;margin-bottom:44px;"></div>`:""}

      <!-- ░░ CORE + SOFT SKILLS ░░ -->
      ${(coreList.length||softList.length)?`
      <div style="display:grid;grid-template-columns:${(coreList.length&&softList.length)?"1fr 1fr":"1fr"};gap:52px;margin-bottom:44px;">
        ${coreList.length?`
        <div>
          <h2 style="font-family:'Playfair Display',serif;font-size:24px;font-weight:900;margin:0 0 16px;">Core Skills</h2>
          ${bullets(coreList)}
        </div>`:""}
        ${softList.length?`
        <div>
          <h2 style="font-family:'Playfair Display',serif;font-size:24px;font-weight:900;margin:0 0 16px;">Soft Skills</h2>
          ${bullets(softList)}
        </div>`:""}
      </div>`:""}

      <!-- ░░ ACHIEVEMENTS ░░ -->
      ${achHTML?`
      <div style="border-top:1px solid #ccc8c0;padding-top:44px;margin-bottom:44px;">
        <h2 style="font-family:'Playfair Display',serif;font-size:24px;font-weight:900;margin:0 0 20px;">Academic Achievements</h2>
        ${achHTML}
      </div>`:""}

      <!-- ░░ FOOTER ░░ -->
      <div style="border-top:1px solid #ccc8c0;padding-top:16px;
                  display:flex;justify-content:space-between;font-size:11px;color:#bbb;">
        <span>APCOER Achievement Portal</span>
        <span>${new Date().toLocaleDateString("en-IN",{year:"numeric",month:"long",day:"numeric"})}</span>
      </div>
    </div>`;
}

function closePortfolio() {
    document.getElementById("portfolioModal").style.display = "none";
    document.body.style.overflow = "";
}
function printPortfolio() { window.print(); }

/* ── Dynamic Form Loader ────────────────────────────── */
function loadCategoryForm() {
    const category  = document.getElementById("category").value;
    const container = document.getElementById("dynamicFields");

    const inp = (id,ph,type="text",extra="") =>
        `<input id="${id}" name="${id}" type="${type}" class="form-control mb-2" placeholder="${ph}" ${extra}>`;
    const sel = (id,label,opts) =>
        `<select id="${id}" name="${id}" class="form-select mb-2">
            <option value="">-- ${label} --</option>
            ${opts.map(o=>`<option value="${o}">${o}</option>`).join("")}
         </select>`;
    const ta  = (id,ph,rows=2) =>
        `<textarea id="${id}" name="${id}" class="form-control mb-2" placeholder="${ph}" rows="${rows}"></textarea>`;
    const fld = (label,html) =>
        `<div class="mb-2"><label class="form-label fw-semibold">${label}</label>${html}</div>`;

    const certField = `
        <div class="mb-2 mt-3">
            <label class="form-label fw-semibold">Upload Certificate (PDF / Image)</label>
            <input type="file" id="certificate" name="certificate"
                   class="form-control" accept=".pdf,.jpg,.jpeg,.png" required>
        </div>`;

    if (category==="conference") {
        container.innerHTML=`<div class="row">
          <div class="col-md-6">${fld("Academic Year",inp("academic_year","e.g. 2024-25"))}</div>
          <div class="col-md-6">${fld("Student Name",inp("student_name","Full Name"))}</div>
          <div class="col-md-6">${fld("Roll No",inp("roll_no","Roll Number"))}</div>
          <div class="col-md-6">${fld("Department",inp("department","Department"))}</div>
          <div class="col-md-6">${fld("Year of Study",sel("year","Select Year",["1","2","3","4"]))}</div>
          <div class="col-md-6">${fld("Mobile No",inp("mobile_no","Mobile Number","tel"))}</div>
          <div class="col-12">${fld("Paper Title",inp("paper_title","Full paper title"))}</div>
          <div class="col-12">${fld("Proceedings Title",inp("proceedings_title","Proceedings / Book title"))}</div>
          <div class="col-md-6">${fld("Conference Name",inp("conference_name","Conference Name"))}</div>
          <div class="col-md-6">${fld("Conference Level",sel("conference_level","Select Level",["International","National","State","District"]))}</div>
          <div class="col-md-6">${fld("Conference Date",inp("conference_date","","date"))}</div>
          <div class="col-md-6">${fld("Conference Venue",inp("conference_venue","Venue"))}</div>
          <div class="col-md-6">${fld("Publication Year",inp("publication_year","YYYY","number"))}</div>
          <div class="col-md-6">${fld("ISSN",inp("issn","ISSN Number"))}</div>
          <div class="col-12">${fld("Affiliating Institute",inp("affiliating_institute","Institute Name"))}</div>
          <div class="col-12">${fld("Paper Link (URL)",inp("paper_link","https://...","url"))}</div>
          <div class="col-md-6">${fld("Financial Support (₹)",inp("financial_support","Amount","number"))}</div>
        </div>${certField}`;
    } else if (category==="cultural") {
        container.innerHTML=`<div class="row">
          <div class="col-md-6">${fld("Academic Year",inp("academic_year","e.g. 2024-25"))}</div>
          <div class="col-md-6">${fld("Student Name",inp("student_name","Full Name"))}</div>
          <div class="col-md-6">${fld("Roll No",inp("roll_no","Roll Number"))}</div>
          <div class="col-md-6">${fld("Email",inp("email","Email Address","email"))}</div>
          <div class="col-md-6">${fld("Mobile",inp("mobile","Mobile Number","tel"))}</div>
          <div class="col-md-6">${fld("Year of Study",sel("year","Select Year",["1","2","3","4"]))}</div>
          <div class="col-md-6">${fld("Role",sel("role","Select Role",["Participant","Winner","Runner-up","Organizer","Volunteer"]))}</div>
          <div class="col-md-6">${fld("Event Name",inp("event_name","Event Name"))}</div>
          <div class="col-md-6">${fld("Sub Event",inp("sub_event","Sub-event / Category"))}</div>
          <div class="col-md-6">${fld("Event Type",sel("event_type","Select Type",["Intra-College","Inter-College","University","State","National","International"]))}</div>
          <div class="col-md-6">${fld("Activity Type",sel("activity_type","Select Activity",["Dance","Music","Drama","Fine Arts","Literary","Other"]))}</div>
          <div class="col-md-6">${fld("Organizer Name",inp("organizer_name","Organizing Body"))}</div>
          <div class="col-md-6">${fld("Organizer Level",sel("organizer_level","Select Level",["International","National","State","University","District","College"]))}</div>
          <div class="col-md-6">${fld("Place",inp("place","City / Venue"))}</div>
          <div class="col-md-6">${fld("Start Date",inp("start_date","","date"))}</div>
          <div class="col-md-6">${fld("End Date",inp("end_date","","date"))}</div>
          <div class="col-md-6">${fld("Financial Support (₹)",inp("financial_support","Amount","number"))}</div>
          <div class="col-md-6">${fld("Award / Prize",inp("award","Award received"))}</div>
        </div>${certField}`;
    } else if (category==="higher") {
        container.innerHTML=`<div class="row">
          <div class="col-md-6">${fld("Academic Year",inp("academic_year","e.g. 2024-25"))}</div>
          <div class="col-md-6">${fld("Student Name",inp("student_name","Full Name"))}</div>
          <div class="col-md-6">${fld("Roll No",inp("roll_no","Roll Number"))}</div>
          <div class="col-md-6">${fld("Mobile No",inp("mobile_no","Mobile Number","tel"))}</div>
          <div class="col-md-6">${fld("Email",inp("email","Email Address","email"))}</div>
          <div class="col-md-6">${fld("Parent Mobile",inp("parent_mobile","Parent Mobile","tel"))}</div>
          <div class="col-md-6">${fld("Passing Year",inp("passing_year","e.g. 2024"))}</div>
          <div class="col-md-6">${fld("Qualifying Exam",inp("qualifying_exam","e.g. CET / GATE / GRE"))}</div>
          <div class="col-md-6">${fld("University Name",inp("university_name","University / Institution"))}</div>
          <div class="col-md-6">${fld("Specialization",inp("specialization","Course / Specialization"))}</div>
        </div>
        <div class="mb-2 mt-2"><label class="form-label fw-semibold">Upload Scorecard</label>
          <input type="file" id="scorecard_pdf" name="scorecard_pdf" class="form-control" accept=".pdf,.jpg,.jpeg,.png">
        </div>
        <div class="mb-2"><label class="form-label fw-semibold">Upload Admission Proof</label>
          <input type="file" id="certificate" name="certificate" class="form-control" accept=".pdf,.jpg,.jpeg,.png" required>
        </div>`;
    } else if (category==="internship") {
        container.innerHTML=`<div class="row">
          <div class="col-md-6">${fld("Academic Year",inp("academic_year","e.g. 2024-25"))}</div>
          <div class="col-md-6">${fld("Student Name",inp("student_name","Full Name"))}</div>
          <div class="col-md-6">${fld("Roll No",inp("roll_no","Roll Number"))}</div>
          <div class="col-md-6">${fld("Year of Study",sel("year","Select Year",["1","2","3","4"]))}</div>
          <div class="col-md-6">${fld("Mobile No",inp("mobile_no","Mobile Number","tel"))}</div>
          <div class="col-12">${fld("Internship Title",inp("internship_title","Title / Role"))}</div>
          <div class="col-md-6">${fld("Company Name",inp("company_name","Company Name"))}</div>
          <div class="col-md-6">${fld("Company Website",inp("company_website","https://...","url"))}</div>
          <div class="col-12">${fld("Company Address",ta("company_address","Full Company Address"))}</div>
          <div class="col-md-6">${fld("Duration (Months)",inp("duration_months","e.g. 2","number"))}</div>
          <div class="col-md-6">${fld("Mode",sel("mode","Select Mode",["Online","Offline","Hybrid"]))}</div>
          <div class="col-md-6">${fld("Stipend (₹/month)",inp("stipend","0 if unpaid","number"))}</div>
          <div class="col-md-6">${fld("Internal Mentor",inp("internal_mentor","Faculty Mentor Name"))}</div>
          <div class="col-md-6">${fld("External Mentor",inp("external_mentor","Company Mentor Name"))}</div>
        </div>${certField}`;
    } else if (category==="journal") {
        container.innerHTML=`<div class="row">
          <div class="col-md-6">${fld("Academic Year",inp("academic_year","e.g. 2024-25"))}</div>
          <div class="col-md-6">${fld("Student Name",inp("student_name","Full Name"))}</div>
          <div class="col-md-6">${fld("Roll No",inp("roll_no","Roll Number"))}</div>
          <div class="col-md-6">${fld("Year of Study",sel("year","Select Year",["1","2","3","4"]))}</div>
          <div class="col-md-6">${fld("Mobile No",inp("mobile_no","Mobile Number","tel"))}</div>
          <div class="col-12">${fld("Paper Title",inp("paper_title","Full paper title"))}</div>
          <div class="col-12">${fld("Journal Name",inp("proceedings_title","Journal / Proceedings Name"))}</div>
          <div class="col-md-6">${fld("Conference Name",inp("conference_name","Conference / Journal Name"))}</div>
          <div class="col-md-6">${fld("Level",sel("conference_level","Select Level",["International","National","State","District"]))}</div>
          <div class="col-md-6">${fld("Publication Date",inp("conference_date","","date"))}</div>
          <div class="col-md-6">${fld("Venue / Publisher",inp("conference_venue","Venue or Publisher"))}</div>
          <div class="col-md-6">${fld("Publication Year",inp("publication_year","YYYY","number"))}</div>
          <div class="col-md-6">${fld("ISSN",inp("issn","ISSN Number"))}</div>
          <div class="col-12">${fld("Affiliating Institute",inp("affiliating_institute","Institute Name"))}</div>
        </div>${certField}`;
    } else if (category==="sports") {
        container.innerHTML=`<div class="row">
          <div class="col-md-6">${fld("Academic Year",inp("academic_year","e.g. 2024-25"))}</div>
          <div class="col-md-6">${fld("Student Name",inp("student_name","Full Name"))}</div>
          <div class="col-md-6">${fld("Roll No",inp("roll_no","Roll Number"))}</div>
          <div class="col-md-6">${fld("Year of Study",sel("year","Select Year",["1","2","3","4"]))}</div>
          <div class="col-md-6">${fld("Role",sel("role","Select Role",["Player","Captain","Coach","Manager","Volunteer"]))}</div>
          <div class="col-md-6">${fld("Event Name",inp("event_name","Tournament / Event Name"))}</div>
          <div class="col-md-6">${fld("Sub Event",inp("sub_event","e.g. 100m, Football, Chess"))}</div>
          <div class="col-md-6">${fld("Sports Type",sel("sports_type","Select Type",["Indoor","Outdoor","Water Sports","E-Sports","Other"]))}</div>
          <div class="col-md-6">${fld("Activity Type",sel("activity_type","Select Activity",["Individual","Team","Mixed"]))}</div>
          <div class="col-md-6">${fld("Organizer",inp("organizer","Organizing Body"))}</div>
          <div class="col-md-6">${fld("Level",sel("level","Select Level",["International","National","State","University","District","College"]))}</div>
          <div class="col-md-6">${fld("Place",inp("place","City / Venue"))}</div>
          <div class="col-md-6">${fld("Start Date",inp("start_date","","date"))}</div>
          <div class="col-md-6">${fld("End Date",inp("end_date","","date"))}</div>
          <div class="col-md-6">${fld("Financial Support (₹)",inp("financial_support","Amount","number"))}</div>
          <div class="col-md-6">${fld("Award / Medal",inp("award","e.g. Gold, Silver, Bronze"))}</div>
          <div class="col-md-6">${fld("Prize Money (₹)",inp("prize_money","0 if none","number"))}</div>
          <div class="col-12">${fld("Remarks",ta("remarks","Any additional remarks"))}</div>
        </div>
        <div class="mb-2 mt-2"><label class="form-label fw-semibold">Upload Photo Proof / Certificate</label>
          <input type="file" id="certificate" name="certificate" class="form-control" accept=".pdf,.jpg,.jpeg,.png" required>
        </div>`;
    } else if (category==="technical") {
        container.innerHTML=`<div class="row">
          <div class="col-md-6">${fld("Academic Year",inp("academic_year","e.g. 2024-25"))}</div>
          <div class="col-md-6">${fld("Student Name",inp("student_name","Full Name"))}</div>
          <div class="col-md-6">${fld("Roll No",inp("roll_no","Roll Number"))}</div>
          <div class="col-md-6">${fld("Email",inp("email","Email Address","email"))}</div>
          <div class="col-md-6">${fld("Mobile No",inp("mobile_no","Mobile Number","tel"))}</div>
          <div class="col-md-6">${fld("Department",inp("department","Department"))}</div>
          <div class="col-md-6">${fld("Year of Study",sel("year","Select Year",["1","2","3","4"]))}</div>
          <div class="col-md-6">${fld("Participation Type",sel("participation_type","Select Type",["Individual","Team"]))}</div>
          <div class="col-md-6">${fld("Event Name",inp("event_name","Event Name"))}</div>
          <div class="col-md-6">${fld("Sub Event",inp("sub_event","e.g. Hackathon, Quiz, Coding"))}</div>
          <div class="col-md-6">${fld("Event Type",sel("event_type","Select Type",["Intra-College","Inter-College","University","National","International"]))}</div>
          <div class="col-md-6">${fld("Activity Type",sel("activity_type","Select Activity",["Competition","Workshop","Seminar","Exhibition","Other"]))}</div>
          <div class="col-md-6">${fld("Role",sel("role","Select Role",["Participant","Winner","Runner-up","Organizer","Mentor","Judge"]))}</div>
          <div class="col-md-6">${fld("Organizer",inp("organizer","Organizing Body"))}</div>
          <div class="col-md-6">${fld("Level",sel("level","Select Level",["International","National","State","University","District","College"]))}</div>
          <div class="col-md-6">${fld("Mode",sel("mode","Select Mode",["Online","Offline","Hybrid"]))}</div>
          <div class="col-md-6">${fld("Place",inp("place","City / Venue"))}</div>
          <div class="col-md-6">${fld("Start Date",inp("start_date","","date"))}</div>
          <div class="col-md-6">${fld("End Date",inp("end_date","","date"))}</div>
        </div>${certField}`;
    } else {
        container.innerHTML="";
    }
}

/* ── Submit Achievement ─────────────────────────────── */
function submitAchievement() {
    const category  = document.getElementById("category").value;
    const fileInput = document.getElementById("certificate");

    if (!category) { alert("Please select a category."); return; }
    if (!fileInput||!fileInput.files[0]) { alert("Please upload a certificate / proof document."); return; }

    const studentId = localStorage.getItem("student_id");
    if (!studentId) { alert("Session expired. Please log in again."); window.location.href="index.html"; return; }

    const formData = new FormData();
    formData.append("category",   category);
    formData.append("student_id", studentId);
    formData.append("certificate", fileInput.files[0]);

    const scorecard = document.getElementById("scorecard_pdf");
    if (scorecard&&scorecard.files[0]) formData.append("scorecard_pdf", scorecard.files[0]);

    document.querySelectorAll(
        "#dynamicFields input:not([type='file']), #dynamicFields select, #dynamicFields textarea"
    ).forEach(field => { if(field.id) formData.append(field.id, field.value); });

    const btn = document.querySelector("button[onclick='submitAchievement()']");
    if(btn) { btn.disabled=true; btn.textContent="Uploading..."; }

    fetch(`${SERVER}/addAchievement`,{method:"POST",body:formData})
        .then(res=>res.json())
        .then(data=>{
            if(data.error) alert("❌ Error: "+data.error);
            else { alert("✅ "+data.message); location.reload(); }
        })
        .catch(err=>{ console.error(err); alert("Submission failed."); })
        .finally(()=>{ if(btn){btn.disabled=false;btn.textContent="Upload Achievement";} });
}

/* ── Load Achievements ──────────────────────────────── */
function loadAchievements() {
    const studentId = localStorage.getItem("student_id");
    if (!studentId) return;
    fetch(`${SERVER}/get-student-achievements/${studentId}`)
        .then(res=>res.json())
        .then(data=>{
            const list = document.getElementById("achievementList");
            list.innerHTML="";
            if(!data.length){
                list.innerHTML=`<li class="list-group-item text-muted">No achievements found.</li>`;
                return;
            }
            data.forEach(item=>{
                const li=document.createElement("li");
                li.className="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2";
                li.innerHTML=`
                    <span>
                        <span class="badge bg-primary me-2">${item.category}</span>
                        ${item.student_name||""} &mdash;
                        ${item.event_name||item.paper_title||item.internship_title||item.university_name||""}
                    </span>
                    <div class="d-flex align-items-center gap-2">
                        <small class="text-muted">${item.academic_year||""}</small>
                        <a href="#" onclick="viewCert('${item.source}',${item.id}); return false;"
                           class="btn btn-sm btn-outline-secondary">View</a>
                        <a href="#" onclick="downloadCert('${item.source}',${item.id}); return false;"
                           class="btn btn-sm btn-outline-primary">Download</a>
                        <button class="btn btn-sm btn-outline-danger"
                                onclick="deleteAchievement('${item.source}',${item.id})">Delete</button>
                    </div>`;
                list.appendChild(li);
            });
        })
        .catch(err=>console.error("Failed to load achievements:",err));
}

/* ── Delete Achievement ─────────────────────────────── */
function deleteAchievement(table,id) {
    if(!confirm("Are you sure you want to delete this achievement?")) return;
    fetch(`${SERVER}/delete-achievement/${table}/${id}`,{method:"DELETE"})
        .then(res=>res.json())
        .then(data=>{ alert(data.message); loadAchievements(); })
        .catch(err=>console.error("Delete failed:",err));
}