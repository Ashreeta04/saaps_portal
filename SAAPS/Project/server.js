const express = require("express");
const mysql   = require("mysql2");
const cors    = require("cors");
const multer  = require("multer");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() }).fields([
    { name: "certificate",   maxCount: 1 },
    { name: "scorecard_pdf", maxCount: 1 }
]);

const db = mysql.createConnection({
    host:     "localhost",
    user:     "root",
    password: "Ashreeta@1234",
    database: "ashreeta"
});

db.connect(err => {
    if (err) throw err;
    console.log("✅ MySQL Connected");
});

const tableMap = {
    conference: "conference_publications",
    cultural:   "cultural_participation",
    higher:     "higher_education",
    internship: "internship_achievements",
    journal:    "journal_publications",
    sports:     "sports_participation",
    technical:  "technical_events"
};

const facultyTableMap = {
    Awards:     "awards_faculty",
    Conference: "conference_publications_faculty",
    Journal:    "journal_publications_faculty",
    FDP:        "fdps_faculty",
    Patent:     "patents_faculty",
    Workshop:   "workshops_faculty",
    others:     "others_faculty"
};

const numericFields = new Set([
    "year", "duration_months", "stipend", "financial_support",
    "prize_money", "publication_year"
]);
const dateFields = new Set([
    "conference_date", "start_date", "end_date",
    "award_date", "filing_date", "grant_date", "publication_date",
    "achievement_date"
]);

function sanitise(key, raw) {
    if (raw === undefined || raw === null || raw === "") {
        if (numericFields.has(key) || dateFields.has(key)) return null;
        return "";
    }
    if (numericFields.has(key)) {
        const n = Number(raw);
        return isNaN(n) ? null : n;
    }
    return raw;
}

function detectContentType(buf) {
    if (buf[0] === 0x25 && buf[1] === 0x50) return "application/pdf";
    if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
    if (buf[0] === 0xFF && buf[1] === 0xD8) return "image/jpeg";
    return "application/octet-stream";
}

// =============================================================================
// GET /portal-stats
// =============================================================================
app.get("/portal-stats", (req, res) => {
    const studentTables = Object.values(tableMap);
    const facultyTables = Object.values(facultyTableMap);
    const allTables     = [...studentTables, ...facultyTables];
    let totalAchievements = 0;
    let completed = 0;

    db.query("SELECT COUNT(*) AS cnt FROM students", (err, rows) => {
        const studentCount = err ? 0 : rows[0].cnt;
        allTables.forEach(table => {
            db.query(`SELECT COUNT(*) AS cnt FROM \`${table}\``, (err, rows) => {
                completed++;
                if (!err) totalAchievements += rows[0].cnt;
                if (completed === allTables.length) {
                    res.json({
                        students:     studentCount,
                        achievements: totalAchievements,
                        categories:   studentTables.length + facultyTables.length
                    });
                }
            });
        });
    });
});

// =============================================================================
// GET /class-achievements?year=BE&department=CS
// =============================================================================
app.get("/class-achievements", (req, res) => {
    const { year, department } = req.query;

    if (!year && !department)
        return res.status(400).json({ error: "Please provide at least year or department" });

    let studentQuery  = "SELECT id, name, department FROM students WHERE 1=1";
    const studentVals = [];
    if (year)       { studentQuery += " AND year = ?";       studentVals.push(year); }
    if (department) { studentQuery += " AND department = ?"; studentVals.push(department); }

    if (year && department) { studentQuery += " AND department IS NOT NULL"; }

    db.query(studentQuery, studentVals, (err, students) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!students || students.length === 0) return res.json([]);

        const studentIds = students.map(s => s.id);
        if (studentIds.length === 0) return res.json([]);

        const studentMap = {};
        students.forEach(s => {
            studentMap[s.id] = { name: s.name, department: s.department };
        });

        const entries = Object.entries(tableMap);
        let allData = [], completed = 0;

        entries.forEach(([category, table]) => {
            const placeholders = studentIds.map(() => "?").join(", ");

            db.query(
                `SELECT *, '${category}' AS category, '${table}' AS source FROM \`${table}\` WHERE student_id IN (${placeholders})`,
                studentIds,
                (err, rows) => {
                    completed++;
                    if (!err && rows && rows.length > 0) {
                        const clean = rows.map(row => {
                            const r = { ...row };
                            r.has_certificate = !!(r.certificate_file);
                            delete r.certificate_file;
                            delete r.scorecard_file;
                            r.student_name = studentMap[r.student_id]?.name       || "Unknown";
                            r.department   = studentMap[r.student_id]?.department || "—";
                            return r;
                        });
                        allData = allData.concat(clean);
                    }
                    if (completed === entries.length) res.json(allData);
                }
            );
        });
    });
});

// =============================================================================
// GET /all-student-achievements?year=BE&department=CS
// =============================================================================
app.get("/all-student-achievements", (req, res) => {
    const { year, department } = req.query;

    let studentQuery  = "SELECT id, name, department, year FROM students WHERE 1=1";
    const studentVals = [];
    if (year)       { studentQuery += " AND year = ?";       studentVals.push(year); }
    if (department) { studentQuery += " AND department = ?"; studentVals.push(department); }

    db.query(studentQuery, studentVals, (err, students) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!students || students.length === 0) return res.json([]);

        const studentIds = students.map(s => s.id);
        const studentMap = {};
        students.forEach(s => {
            studentMap[s.id] = { name: s.name, department: s.department, year: s.year };
        });

        const entries = Object.entries(tableMap);
        let allData   = [];
        let completed = 0;

        entries.forEach(([category, table]) => {
            const placeholders = studentIds.map(() => "?").join(", ");
            db.query(
                `SELECT *, '${category}' AS category, '${table}' AS source FROM \`${table}\` WHERE student_id IN (${placeholders})`,
                studentIds,
                (err, rows) => {
                    completed++;
                    if (!err && rows && rows.length > 0) {
                        const clean = rows.map(row => {
                            const r           = { ...row };
                            r.has_certificate = !!(r.certificate_file);
                            delete r.certificate_file;
                            delete r.scorecard_file;
                            r.student_name    = studentMap[r.student_id]?.name       || "Unknown";
                            r.department      = studentMap[r.student_id]?.department || "—";
                            return r;
                        });
                        allData = allData.concat(clean);
                    }
                    if (completed === entries.length) res.json(allData);
                }
            );
        });
    });
});

// =============================================================================
// GET /certificates-by-year-dept?academic_year=2024-25&department=CS
// =============================================================================
app.get("/certificates-by-year-dept", (req, res) => {
    const { academic_year, department } = req.query;

    if (!academic_year && !department)
        return res.status(400).json({ error: "Please provide at least academic_year or department" });

    let studentQuery  = "SELECT id, name, department FROM students WHERE 1=1";
    const studentVals = [];
    if (department) { studentQuery += " AND department = ?"; studentVals.push(department); }

    db.query(studentQuery, studentVals, (err, students) => {
        if (err) return res.status(500).json({ error: err.message });
        if (students.length === 0) return res.json([]);

        const studentIds = students.map(s => s.id);
        const studentMap = {};
        students.forEach(s => { studentMap[s.id] = { name: s.name, department: s.department }; });

        const entries = Object.entries(tableMap);
        let allData = [], completed = 0;

        entries.forEach(([category, table]) => {
            let query  = `SELECT *, '${category}' AS category, '${table}' AS source FROM \`${table}\` WHERE student_id IN (?)`;
            const vals = [studentIds];
            if (academic_year) { query += " AND academic_year = ?"; vals.push(academic_year); }

            db.query(query, vals, (err, rows) => {
                completed++;
                if (!err && rows.length > 0) {
                    const clean = rows.map(row => {
                        const r        = { ...row };
                        r.has_certificate = !!(r.certificate_file);
                        delete r.certificate_file;
                        delete r.scorecard_file;
                        r.student_name = studentMap[r.student_id]?.name       || "Unknown";
                        r.department   = studentMap[r.student_id]?.department || "—";
                        return r;
                    });
                    allData = allData.concat(clean);
                }
                if (completed === entries.length) res.json(allData);
            });
        });
    });
});

// =============================================================================
// GET /download-class-pdf?year=BE&department=CS
// =============================================================================
app.get("/download-class-pdf", async (req, res) => {
    const { year, department } = req.query;

    if (!year && !department)
        return res.status(400).json({ error: "Please provide at least year or department" });

    try {
        const { PDFDocument } = require("pdf-lib");

        let studentQuery  = "SELECT id, name FROM students WHERE 1=1";
        const studentVals = [];
        if (year)       { studentQuery += " AND year = ?";       studentVals.push(year); }
        if (department) { studentQuery += " AND department = ?"; studentVals.push(department); }

        const students = await new Promise((resolve, reject) => {
            db.query(studentQuery, studentVals, (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        if (students.length === 0)
            return res.status(404).json({ error: "No students found for the selected filters" });

        const studentIds = students.map(s => s.id);
        const studentMap = {};
        students.forEach(s => { studentMap[s.id] = s.name; });

        const allCerts = [];
        for (const [category, table] of Object.entries(tableMap)) {
            const rows = await new Promise((resolve, reject) => {
                db.query(
                    `SELECT id, student_id, certificate_file FROM \`${table}\` WHERE student_id IN (?) AND certificate_file IS NOT NULL`,
                    [studentIds],
                    (err, rows) => { if (err) reject(err); else resolve(rows); }
                );
            });
            rows.forEach(row => {
                if (row.certificate_file)
                    allCerts.push({ studentName: studentMap[row.student_id] || "Unknown", category, buffer: row.certificate_file });
            });
        }

        if (allCerts.length === 0)
            return res.status(404).json({ error: "No certificates found for the selected filters" });

        const mergedPdf = await PDFDocument.create();
        for (const cert of allCerts) {
            try {
                const buf   = cert.buffer instanceof Buffer ? cert.buffer : Buffer.from(cert.buffer);
                const isPdf = buf[0] === 0x25 && buf[1] === 0x50;
                const isPng = buf[0] === 0x89 && buf[1] === 0x50;
                const isJpg = buf[0] === 0xFF && buf[1] === 0xD8;
                if (isPdf) {
                    const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
                    const pages  = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
                    pages.forEach(page => mergedPdf.addPage(page));
                } else if (isPng) {
                    const img  = await mergedPdf.embedPng(buf);
                    const page = mergedPdf.addPage([img.width, img.height]);
                    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
                } else if (isJpg) {
                    const img  = await mergedPdf.embedJpg(buf);
                    const page = mergedPdf.addPage([img.width, img.height]);
                    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
                }
            } catch (e) {
                console.warn(`Skipping corrupt cert: ${cert.studentName} - ${cert.category}:`, e.message);
            }
        }

        const pdfBytes = await mergedPdf.save();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${year || "all"}_${department || "all"}_certificates.pdf"`);
        res.send(Buffer.from(pdfBytes));

    } catch (err) {
        console.error("PDF generation error:", err);
        res.status(500).json({ error: "PDF generation failed: " + err.message });
    }
});

// =============================================================================
// GET /download-certs-pdf?academic_year=2024-25&department=CS
// =============================================================================
app.get("/download-certs-pdf", async (req, res) => {
    const { academic_year, department } = req.query;

    try {
        const { PDFDocument } = require("pdf-lib");

        let studentQuery  = "SELECT id, name FROM students WHERE 1=1";
        const studentVals = [];
        if (department) { studentQuery += " AND department = ?"; studentVals.push(department); }

        const students = await new Promise((resolve, reject) => {
            db.query(studentQuery, studentVals, (err, rows) => {
                if (err) reject(err); else resolve(rows);
            });
        });

        if (students.length === 0)
            return res.status(404).json({ error: "No students found for the selected filters" });

        const studentIds = students.map(s => s.id);
        const studentMap = {};
        students.forEach(s => { studentMap[s.id] = s.name; });

        const allCerts = [];
        for (const [category, table] of Object.entries(tableMap)) {
            let query  = `SELECT id, student_id, certificate_file FROM \`${table}\` WHERE student_id IN (?) AND certificate_file IS NOT NULL`;
            const vals = [studentIds];
            if (academic_year) { query += " AND academic_year = ?"; vals.push(academic_year); }

            const rows = await new Promise((resolve, reject) => {
                db.query(query, vals, (err, rows) => { if (err) reject(err); else resolve(rows); });
            });

            rows.forEach(row => {
                if (row.certificate_file)
                    allCerts.push({ studentName: studentMap[row.student_id] || "Unknown", category, buffer: row.certificate_file });
            });
        }

        if (allCerts.length === 0)
            return res.status(404).json({ error: "No certificates found for the selected filters" });

        const mergedPdf = await PDFDocument.create();
        for (const cert of allCerts) {
            try {
                const buf   = cert.buffer instanceof Buffer ? cert.buffer : Buffer.from(cert.buffer);
                const isPdf = buf[0] === 0x25 && buf[1] === 0x50;
                const isPng = buf[0] === 0x89 && buf[1] === 0x50;
                const isJpg = buf[0] === 0xFF && buf[1] === 0xD8;
                if (isPdf) {
                    const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
                    const pages  = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
                    pages.forEach(page => mergedPdf.addPage(page));
                } else if (isPng) {
                    const img  = await mergedPdf.embedPng(buf);
                    const page = mergedPdf.addPage([img.width, img.height]);
                    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
                } else if (isJpg) {
                    const img  = await mergedPdf.embedJpg(buf);
                    const page = mergedPdf.addPage([img.width, img.height]);
                    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
                }
            } catch (e) {
                console.warn(`Skipping corrupt cert: ${cert.studentName} - ${cert.category}:`, e.message);
            }
        }

        const pdfBytes = await mergedPdf.save();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="certificates_${academic_year || "all"}_${department || "all"}.pdf"`);
        res.send(Buffer.from(pdfBytes));

    } catch (err) {
        console.error("PDF generation error:", err);
        res.status(500).json({ error: "PDF generation failed: " + err.message });
    }
});

// =============================================================================
// REGISTER  –  POST /register
// =============================================================================
app.post("/register", (req, res) => {
    const { name, email, phone, password, role, year, department } = req.body;
    if (!name || !email || !phone || !password || !role)
        return res.status(400).json({ message: "All fields are required" });

    let table;
    if (role === "Student")      table = "students";
    else if (role === "Faculty") table = "faculty";
    else if (role === "Admin")   table = "admins";
    else return res.status(400).json({ message: "Invalid role" });

    db.query(`SELECT id FROM \`${table}\` WHERE email = ?`, [email], (err, rows) => {
        if (err) return res.status(500).json({ message: "Server error" });
        if (rows.length > 0) return res.json({ message: "Email already registered" });

        let sql, params;
        if (role === "Student") {
            sql    = "INSERT INTO students (name, email, phone, password, year, department) VALUES (?, ?, ?, ?, ?, ?)";
            params = [name, email, phone, password, year || null, department || null];
        } else if (role === "Faculty") {
            sql    = "INSERT INTO faculty (name, email, phone, password) VALUES (?, ?, ?, ?)";
            params = [name, email, phone, password];
        } else if (role === "Admin") {
            sql    = "INSERT INTO admins (name, email, phone, password) VALUES (?, ?, ?, ?)";
            params = [name, email, phone, password];
        }

        db.query(sql, params, (err) => {
            if (err) return res.status(500).json({ message: "Registration failed: " + err.message });
            res.json({ message: "Registration successful! Please login." });
        });
    });
});

// =============================================================================
// LOGIN  –  POST /login
// =============================================================================
app.post("/login", (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password || !role)
        return res.status(400).json({ message: "All fields are required" });

    let table;
    if (role === "Student")      table = "students";
    else if (role === "Faculty") table = "faculty";
    else if (role === "Admin")   table = "admins";
    else return res.status(400).json({ message: "Invalid role" });

    db.query(
        `SELECT * FROM \`${table}\` WHERE email = ? AND password = ?`,
        [email, password],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Server error" });
            if (rows.length === 0) return res.json({ message: "Invalid email or password" });
            const user = rows[0];
            res.json({ message: "Login Successful", user: { id: user.id, name: user.name, email: user.email } });
        }
    );
});

// =============================================================================
// POST /reset-password
// =============================================================================
app.post("/reset-password", (req, res) => {
    const { email, newPassword, role } = req.body;

    if (!email || !newPassword || !role)
        return res.status(400).json({ message: "Email, new password, and role are required." });

    if (newPassword.length < 6)
        return res.status(400).json({ message: "Password must be at least 6 characters." });

    let table;
    if (role === "Student")      table = "students";
    else if (role === "Faculty") table = "faculty";
    else if (role === "Admin")   table = "admins";
    else return res.status(400).json({ message: "Invalid role." });

    db.query(`SELECT id FROM \`${table}\` WHERE email = ?`, [email], (err, rows) => {
        if (err) return res.status(500).json({ message: "Server error." });
        if (rows.length === 0)
            return res.status(404).json({ message: "No account found with this email." });

        db.query(
            `UPDATE \`${table}\` SET password = ? WHERE email = ?`,
            [newPassword, email],
            (err2) => {
                if (err2) return res.status(500).json({ message: "Failed to update password." });
                res.json({ message: "Password reset successful! Redirecting to login..." });
            }
        );
    });
});

// =============================================================================
// POST /addAchievement
// =============================================================================
app.post("/addAchievement", (req, res) => {
    upload(req, res, (uploadErr) => {
        if (uploadErr) return res.status(400).json({ error: "File upload error" });

        const category = (req.body.category || "").trim();
        const table    = tableMap[category];
        if (!table) return res.status(400).json({ error: "Invalid category" });

        const studentId = req.body.student_id || null;
        if (!studentId) return res.status(400).json({ error: "student_id is required" });

        const skipKeys = new Set(["category", "student_id"]);
        const columns  = ["student_id"];
        const values   = [studentId];

        for (const [key, raw] of Object.entries(req.body)) {
            if (skipKeys.has(key)) continue;
            columns.push(key);
            values.push(sanitise(key, raw));
        }

        if (req.files?.["certificate"]?.[0]) {
            columns.push("certificate_file");
            values.push(req.files["certificate"][0].buffer);
        }

        if (category === "higher" && req.files?.["scorecard_pdf"]?.[0]) {
            columns.push("scorecard_file");
            values.push(req.files["scorecard_pdf"][0].buffer);
        }

        const sql = `INSERT INTO \`${table}\` (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
        db.query(sql, values, (err, result) => {
            if (err) return res.status(500).json({ error: "Database error: " + err.message });
            res.json({ message: "Achievement saved successfully 🎉", insertId: result.insertId, table });
        });
    });
});

// =============================================================================
// POST /upload-faculty-achievement
// =============================================================================
app.post("/upload-faculty-achievement", (req, res) => {
    upload(req, res, (uploadErr) => {
        if (uploadErr) return res.status(400).json({ error: "File upload error" });

        const category = (req.body.category || "").trim();
        const table    = facultyTableMap[category];
        if (!table) return res.status(400).json({ error: "❌ Invalid faculty category: `" + category + "` | keys: " + Object.keys(facultyTableMap).join(", ") });

        const facultyId = req.body.faculty_id || null;
        if (!facultyId) return res.status(400).json({ error: "faculty_id is required" });

        const skipKeys = new Set(["category", "faculty_id"]);
        const columns  = ["faculty_id"];
        const values   = [facultyId];

        for (const [key, raw] of Object.entries(req.body)) {
            if (skipKeys.has(key)) continue;
            columns.push(key);
            values.push(sanitise(key, raw));
        }

        if (req.files?.["certificate"]?.[0]) {
            columns.push("certificate_file");
            values.push(req.files["certificate"][0].buffer);
        }

        const sql = `INSERT INTO \`${table}\` (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
        db.query(sql, values, (err, result) => {
            if (err) return res.status(500).json({ error: "Database error: " + err.message });
            res.json({ message: "Achievement saved successfully 🎉", insertId: result.insertId, table });
        });
    });
});

// =============================================================================
// GET /get-faculty-achievements/:id
// =============================================================================
app.get("/get-faculty-achievements/:id", (req, res) => {
    const facultyId = req.params.id;
    const entries = Object.entries(facultyTableMap);
    let allData = [], completed = 0;

    entries.forEach(([category, table]) => {
        db.query(
            `SELECT *, '${category}' AS category, '${table}' AS source FROM \`${table}\` WHERE faculty_id = ?`,
            [facultyId],
            (err, rows) => {
                completed++;
                if (!err && rows.length > 0)
                    allData = allData.concat(rows.map(row => { const r = { ...row }; delete r.certificate_file; return r; }));
                if (completed === entries.length) res.json(allData);
            }
        );
    });
});

// =============================================================================
// GET /get-student-achievements/:id
// =============================================================================
app.get("/get-student-achievements/:id", (req, res) => {
    const studentId = req.params.id;
    const entries = Object.entries(tableMap);
    let allData = [], completed = 0;

    entries.forEach(([category, table]) => {
        db.query(
            `SELECT *, '${category}' AS category, '${table}' AS source FROM \`${table}\` WHERE student_id = ?`,
            [studentId],
            (err, rows) => {
                completed++;
                if (!err && rows.length > 0)
                    allData = allData.concat(rows.map(row => { const r = { ...row }; r.has_certificate = !!(r.certificate_file); delete r.certificate_file; return r; }));
                if (completed === entries.length) res.json(allData);
            }
        );
    });
});

// =============================================================================
// GET /get-faculty-certificate/:table/:id
// =============================================================================
app.get("/get-faculty-certificate/:table/:id", (req, res) => {
    const { table, id } = req.params;
    if (!Object.values(facultyTableMap).includes(table))
        return res.status(400).json({ error: "Invalid table" });

    db.query(`SELECT certificate_file FROM \`${table}\` WHERE id = ?`, [id], (err, rows) => {
        if (err || !rows.length || !rows[0].certificate_file)
            return res.status(404).send("Not found");

        const buf = rows[0].certificate_file instanceof Buffer
                    ? rows[0].certificate_file
                    : Buffer.from(rows[0].certificate_file);

        res.setHeader("Content-Type", detectContentType(buf));
        res.setHeader("Content-Disposition", "inline");
        res.send(buf);
    });
});

// =============================================================================
// GET /get-certificate/:table/:id   ← FIXED: opens inline in browser
// =============================================================================
app.get("/get-certificate/:table/:id", (req, res) => {
    const { table, id } = req.params;
    if (!Object.values(tableMap).includes(table))
        return res.status(400).json({ error: "Invalid table" });

    db.query(`SELECT certificate_file FROM \`${table}\` WHERE id = ?`, [id], (err, rows) => {
        if (err || !rows.length || !rows[0].certificate_file)
            return res.status(404).send("Not found");

        const buf = rows[0].certificate_file instanceof Buffer
                    ? rows[0].certificate_file
                    : Buffer.from(rows[0].certificate_file);

        res.setHeader("Content-Type", detectContentType(buf));
        res.setHeader("Content-Disposition", "inline");
        res.send(buf);
    });
});

// =============================================================================
// DELETE /delete-achievement/:table/:id
// =============================================================================
app.delete("/delete-achievement/:table/:id", (req, res) => {
    const { table, id } = req.params;
    const allTables = [...Object.values(tableMap), ...Object.values(facultyTableMap)];
    if (!allTables.includes(table)) return res.status(400).json({ error: "Invalid table" });

    db.query(`DELETE FROM \`${table}\` WHERE id = ?`, [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Delete failed" });
        res.json({ message: "Deleted successfully", affectedRows: result.affectedRows });
    });
});

// =============================================================================
// ADMIN ROUTES
// =============================================================================

app.get("/admin/get-students", (req, res) => {
    db.query("SELECT id, name, email, phone, year, department FROM students ORDER BY year, name", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get("/admin/get-faculty", (req, res) => {
    db.query("SELECT id, name, email, phone FROM faculty ORDER BY name", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get("/admin/get-achievements", (req, res) => {
    const studentTables = Object.entries(tableMap);
    const facultyTables = Object.entries(facultyTableMap);
    const total = studentTables.length + facultyTables.length;
    let allData = [], completed = 0;

    function finish() {
        completed++;
        if (completed === total) {
            allData.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
            res.json(allData);
        }
    }

    studentTables.forEach(([category, table]) => {
        db.query(
            `SELECT t.id, t.student_id AS owner_id, s.name AS owner_name,
                    '${category}' AS category, 'student' AS type, t.uploaded_at
             FROM \`${table}\` t
             LEFT JOIN students s ON s.id = t.student_id
             ORDER BY t.uploaded_at DESC`,
            (err, rows) => {
                if (!err) allData = allData.concat(rows);
                finish();
            }
        );
    });

    facultyTables.forEach(([category, table]) => {
        db.query(
            `SELECT t.id, t.faculty_id AS owner_id, f.name AS owner_name,
                    '${category}' AS category, 'faculty' AS type, t.uploaded_at
             FROM \`${table}\` t
             LEFT JOIN faculty f ON f.id = t.faculty_id
             ORDER BY t.uploaded_at DESC`,
            (err, rows) => {
                if (!err) allData = allData.concat(rows);
                finish();
            }
        );
    });
});

app.delete("/admin/delete-student/:id", (req, res) => {
    db.query("DELETE FROM students WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Student deleted successfully" });
    });
});

app.delete("/admin/delete-faculty/:id", (req, res) => {
    db.query("DELETE FROM faculty WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Faculty deleted successfully" });
    });
});

// =============================================================================
app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));