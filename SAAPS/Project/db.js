const mysql = require("mysql2");

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

module.exports = db;