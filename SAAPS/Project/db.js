/*const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Ashreeta@1234",          // put your mysql password here if any
    database: "ashreeta"
});

db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
        return;
    }
    console.log("✅ MySQL Connected Successfully");
});

module.exports = db;*/

const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "Ashreeta@1234",
    database: process.env.DB_NAME || "ashreeta",
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_HOST ? { rejectUnauthorized: true } : undefined
});

db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
        return;
    }
    console.log("✅ MySQL Connected Successfully");
});

module.exports = db;