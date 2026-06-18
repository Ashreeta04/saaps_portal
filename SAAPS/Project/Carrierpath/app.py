from flask import Flask, request, jsonify, render_template
import os
import numpy as np
from sklearn import svm
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Upload settings
UPLOAD_FOLDER = 'uploads/'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'pdf', 'jpeg', 'png'}

# All skills from your list
SKILL_LIST = [
    'HTML', 'CSS', 'Java', 'SQL', 'JavaScript', 'React.js', 'AngularJS',
    'Python', 'PHP', 'Spring Boot', 'Advanced Java', '.NET', 'AWS',
    'Cloud Computing', 'DevOps', 'Machine Learning', 'Bootstrap', 'C'
]

# Corresponding training data
X_train = [
    # Front-End Dev
    [1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],  # HTML+CSS+JS+Bootstrap
    [1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],  # React.js

    # Software Engineer
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],  # Java + Spring Boot + Adv Java
    [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],  # PHP + SQL
    [0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],  # Java + SQL + Python

    # Data Scientist
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],  # Python + SQL + ML
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],  # Python + ML

    # Cloud / DevOps
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],  # AWS + Cloud + DevOps
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],  # AWS + DevOps

    # Embedded Systems
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],  # C

    # .NET Developer
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],  # .NET

    # Android Dev
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],  # Java + Advanced Java
]

y_train = [
    'Front-End Developer',
    'Front-End Developer',
    'Software Engineer',
    'Software Engineer',
    'Software Engineer',
    'Data Scientist',
    'Data Scientist',
    'Cloud/DevOps Engineer',
    'Cloud/DevOps Engineer',
    'Embedded Systems Developer',
    '.NET Developer',
    'Android Developer'
]

# Train the SVM model
svm_model = svm.SVC(kernel='linear')
svm_model.fit(X_train, y_train)

# Allow certificate uploads
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('Index.html')

@app.route('/predict', methods=['POST'])
def predict():
    selected_skills = request.form.getlist('skills')
    uploaded_files = request.files.getlist('certificate')
    certificates = []

    for file in uploaded_files:
        if file and allowed_file(file.filename):
            filename = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filename)
            certificates.append(filename)

    career_path = predict_career_path(selected_skills)
    return jsonify({'career_path': career_path})

def predict_career_path(skills):
    # Map selected skills to binary input
    skill_vector = [1 if skill in skills else 0 for skill in SKILL_LIST]
    prediction = svm_model.predict([skill_vector])
    return prediction[0]

if __name__ == '__main__':
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(debug=True)
