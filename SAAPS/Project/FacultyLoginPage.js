// SWITCH SECTIONS
function showSection(section) {
    document.getElementById("dashboardSection").classList.add("d-none");
    document.getElementById("uploadSection").classList.add("d-none");

    if(section === "dashboard") {
        document.getElementById("dashboardSection").classList.remove("d-none");
    }

    if(section === "upload") {
        document.getElementById("uploadSection").classList.remove("d-none");
    }
}

// LOAD FORM BASED ON CATEGORY
function loadForm() {

    const category = document.getElementById("category").value;
    const area = document.getElementById("formArea");

    area.innerHTML = "";

    // ================== AWARDS ==================
    if(category === "awards") {
        area.innerHTML = `
        <input class="form-control" id="faculty_id" placeholder="Faculty ID">
        <input class="form-control" id="academic_year" placeholder="Academic Year">
        <input class="form-control" id="award_name" placeholder="Award Name">
        <input class="form-control" id="awarded_for" placeholder="Awarded For">
        <input class="form-control" id="awarded_by" placeholder="Awarded By">
        <input type="date" class="form-control" id="award_date">
        <input class="form-control" id="level" placeholder="Level">
        <input type="file" class="form-control" id="file">
        `;
    }

    // ================== CONFERENCE ==================
    if(category === "conference") {
        area.innerHTML = `
        <input class="form-control" id="faculty_id" placeholder="Faculty ID">
        <input class="form-control" id="academic_year" placeholder="Academic Year">
        <input class="form-control" id="paper_title" placeholder="Paper Title">
        <input class="form-control" id="proceedings_title" placeholder="Proceedings Title">
        <input class="form-control" id="conference_name" placeholder="Conference Name">
        <input class="form-control" id="conference_type" placeholder="Conference Type">
        <input type="date" class="form-control" id="conference_date">
        <input class="form-control" id="venue_organizer" placeholder="Venue / Organizer">
        <input class="form-control" id="publication_year" placeholder="Publication Year">
        <input class="form-control" id="issn_isbn" placeholder="ISSN / ISBN">
        <input class="form-control" id="affiliating_institute" placeholder="Institute">
        <input class="form-control" id="paper_link" placeholder="Paper Link">
        <input class="form-control" id="financial_support" placeholder="Financial Support">
        <input type="file" class="form-control" id="file">
        `;
    }
}

// SUBMIT
async function submitForm() {

    const category = document.getElementById("category").value;
    const inputs = document.querySelectorAll("#formArea input");

    const formData = new FormData();

    formData.append("category", category);

    inputs.forEach(input => {
        if(input.type === "file") {
            formData.append("file", input.files[0]);
        } else {
            formData.append(input.id, input.value);
        }
    });

    try {
        const res = await fetch("http://localhost:5000/upload-faculty-achievement", {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        document.getElementById("msg").innerText = data.message;

    } catch (err) {
        console.log(err);
        document.getElementById("msg").innerText = "Error uploading";
    }
}