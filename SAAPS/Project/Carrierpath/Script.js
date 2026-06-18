document.getElementById('prediction-form').addEventListener('submit', function (e) {
    e.preventDefault();  // Prevent the default form submission

    // Get selected skills from the form
    const skills = [];
    document.querySelectorAll('input[name="skills"]:checked').forEach(function (checkbox) {
        skills.push(checkbox.value);  // Add selected skills to the array
    });

    // Prepare the form data to be sent to the backend
    const formData = new FormData();

    // Append selected skills to the form data
    skills.forEach(function (skill) {
        formData.append('skills', skill);  // Append each selected skill
    });

    // Append the uploaded certificates (files)
    const files = document.getElementById('certificate-upload').files;
    for (let i = 0; i < files.length; i++) {
        formData.append('certificate', files[i]);  // Append each file to the form data
    }

    // Send the form data to the Flask backend via a POST request
    fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        body: formData  // Send form data (including certificates and skills)
    })
    .then(response => response.json())  // Parse the JSON response from the backend
    .then(data => {
        // Display the career path prediction result
        document.getElementById('career-path').textContent = data.career_path;
        document.getElementById('result-container').style.display = 'block';  // Show the result container
    })
    .catch(error => {
        console.error('Error:', error);  // Log any errors to the console
        alert('An error occurred. Please try again.');
    });
});
