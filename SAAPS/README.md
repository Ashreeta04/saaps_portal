🎓 Career Achievement Tracker & Career Path Prediction using Machine Learning
📘 Project Overview

This web-based system is designed to help students and faculty systematically record, track, and analyze achievements while predicting suitable career paths using Machine Learning.
It combines Flask, Tesseract OCR, and spaCy NLP for certificate text extraction, and uses Neural Networks for career path prediction with the highest accuracy.

🧠 Key Features

Student & Faculty Login System – Role-based authentication and dashboards.
Achievement Uploads – Upload certificates (stored as BLOBs) for internships, journals, sports, etc.
Automatic Text Extraction – Extracts data from uploaded certificates using OCR + NLP.
Career Path Prediction – Predicts top 3 possible career paths with confidence scores using a neural network model.
Faculty Dashboard – Enables viewing and analysis of student achievements.
Admin Dashboard – Manages users and monitors system activity.
Data Visualization – Displays achievement analytics via charts and reports.

🧩 System Architecture

The system consists of the following layers:
Frontend: HTML, CSS, JavaScript (Bootstrap/Tailwind for UI)
Backend: Flask (Python) & Node.js (for form handling and APIs)
Machine Learning: TensorFlow/Keras Neural Network
Database: MySQL (with BLOB storage for certificates)
OCR/NLP: Tesseract + spaCy for text extraction and processing

⚙️ Technologies Used
Component	Technology
Frontend	HTML, CSS, JS, Bootstrap/Tailwind
Backend	Flask, Node.js, Express
ML Model	TensorFlow/Keras
NLP	spaCy
OCR	Tesseract
Database	MySQL
Authentication	JWT / bcrypt
File Handling	Multer (for uploads)

📈 Machine Learning Performance
Algorithm	Accuracy
Decision Tree	78%
Random Forest	85%
Support Vector Machine	82%
Neural Network	87% (Best)

📂 Project Modules

Student Module – Upload, view, and track achievements; get career predictions.
Faculty Module – View student data, download reports, and monitor progress.
Admin Module – Manage users, achievements, and system analytics.
Career Prediction Engine – Predicts career paths using trained neural networks.

🚀 Setup Instructions
Clone the repository
git clone https://github.com/KunalShinde13/career-achievement-tracker-ml.git
cd career-achievement-tracker-ml


Set up the backend (Flask)
pip install -r requirements.txt
python app.py


Set up Node.js API (if applicable)
npm install
node server.js


Database Setup
Import the SQL schema from /database/schema.sql.
Update connection credentials 
Run the Application
Open your browser and go to: http://localhost:5000

🧾 Example Use Case

Student logs in and uploads achievement certificates.
OCR + NLP extract details automatically.
ML model predicts suitable career paths (e.g., Data Scientist, Software Engineer).
Faculty can view student’s achievements and reports.
Admin monitors user activity and system performance.


🔮 Future Enhancements

• Integration with LinkedIn and GitHub for real-time profile analysis  
• Use of Resume Parsing and Skill Gap Analysis  
• Deployment using cloud platforms (AWS / Azure)  
• Mobile application version  
• Use of LLMs for intelligent career counseling chatbot

