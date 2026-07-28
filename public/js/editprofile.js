function escapeHtml(s) {
    if (s === undefined || s === null) return "";

    return String(s).replace(/[&<>"']/g, m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[m]));
}
function renderProfileEditHtml(s, idx){
  return `
    <div class="row g-2">
      <div class="col-md-6"><label class="label-sm">Student Name</label><input id="edit_name_${idx}" class="form-control" value="${escapeHtml(s.name)}"></div>
      <div class="col-md-6"><label class="label-sm">Mobile</label><input id="edit_studentMobile_${idx}" class="form-control" value="${escapeHtml(s.studentMobile||'')}"></div>
      <div class="col-md-6"><label class="label-sm">Father's Name</label><input id="edit_father_${idx}" class="form-control" value="${escapeHtml(s.father||'')}"></div>
      <div class="col-md-6"><label class="label-sm">Father's Mobile</label><input id="edit_fatherMobile_${idx}" class="form-control" value="${escapeHtml(s.fatherMobile||'')}"></div>
      <div class="col-md-6"><label class="label-sm">Email</label><input id="edit_email_${idx}" class="form-control" value="${escapeHtml(s.email||'')}"></div>
      <div class="col-md-6"><label class="label-sm">DOB</label><input id="edit_dob_${idx}" class="form-control" value="${escapeHtml(s.dob||'')}"></div>
      <div class="col-md-4"><label class="label-sm">Gender</label>
        <select id="edit_gender_${idx}" class="form-select">
          <option ${s.gender==='MALE'?'selected':''}>MALE</option>
          <option ${s.gender==='FEMALE'?'selected':''}>FEMALE</option>
          <option ${s.gender==='OTHER'?'selected':''}>OTHER</option>
        </select>
      </div>
      <div class="col-md-4"><label class="label-sm">Category</label>
        <select id="edit_category_${idx}" class="form-select">
          <option ${s.category==='SC'?'selected':''}>SC</option>
          <option ${s.category==='ST'?'selected':''}>ST</option>
          <option ${s.category==='OBC'?'selected':''}>OBC</option>
          <option ${s.category==='General'?'selected':''}>General</option>
        </select>
      </div>
      <div class="col-md-4">
  <label class="label-sm">Course</label>
  <select id="edit_course_${idx}" class="form-select">
    <option ${s.course==='CGPSC'?'selected':''}>CGPSC</option>
    <option ${s.course==='VYAPAM'?'selected':''}>VYAPAM</option>
  </select>
</div>

      <div class="col-md-4"><label class="label-sm">Aadhaar</label><input id="edit_aadhaar_${idx}" class="form-control" value="${escapeHtml(s.aadhaar||'')}"></div>
      <div class="col-md-4"><label class="label-sm">Rank</label><input id="edit_rank_${idx}" class="form-control" value="${escapeHtml(s.rank||'')}"></div>
<div class="col-md-4">
  <label class="label-sm">Blood Group</label>
  <input id="edit_blood_${idx}" class="form-control"
         value="${escapeHtml(s.bloodGroup || '')}">
</div>

<div class="col-md-4">
  <label class="label-sm">Area</label>
  <input id="edit_area_${idx}" class="form-control"
         value="${escapeHtml(s.area || '')}">
</div>

<!-- Status -->
<div class="col-md-4">
  <label class="label-sm">Status</label>

  <select id="edit_status_${idx}" class="form-select">
      <option value="Active"
        ${s.status==="Active" ? "selected" : ""}>
        🟢 Active
      </option>

      <option value="Dropout"
        ${s.status==="Dropout" ? "selected" : ""}>
        🔴 Dropout
      </option>
  </select>
</div>

<!-- Career Status -->

<div class="col-12 mt-2">

<label class="label-sm"><strong>Career Status</strong></label>

<div class="form-check">
<input
type="checkbox"
class="form-check-input"
id="qualified_${idx}"
${s.achievements?.includes("Qualified") ? "checked" : ""}>

<label class="form-check-label" for="qualified_${idx}">
🏆 Qualified
</label>
</div>

<div class="form-check">
<input
type="checkbox"
class="form-check-input"
id="employed_${idx}"
${s.achievements?.includes("Employed") ? "checked" : ""}>

<label class="form-check-label" for="employed_${idx}">
💼 Employed
</label>
</div>

</div>

<!-- Dropout Details -->

<div id="dropoutSection_${idx}" class="${s.status==="Dropout" ? "" : "d-none"}">

<div class="row">

<div class="col-md-6">
<label class="label-sm">Dropout Date</label>

<input
type="date"
id="edit_dropoutDate_${idx}"
class="form-control"
value="${s.dropoutDate || ""}">
</div>

<div class="col-md-6">
<label class="label-sm">Dropout Reason</label>

<textarea
id="edit_dropoutReason_${idx}"
rows="2"
class="form-control">${escapeHtml(s.dropoutReason || "")}</textarea>

</div>

</div>

</div>

<div class="col-12 text-end mt-3 d-flex justify-content-between">

<button
id="deleteStudent-${idx}"
class="btn btn-danger">

Delete Student

</button>

<button
id="saveProfile-${idx}"
class="btn btn-success">

Save Profile

</button>

</div>
  `;
}
window.renderProfileEditHtml = renderProfileEditHtml;

document.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("searchStudentBtn");

    if (!btn) return;

    btn.addEventListener("click", searchStudent);

});
async function searchStudent(){

    const keyword = document
        .getElementById("studentSearch")
        .value
        .trim();

    if(!keyword){
        alert("Enter Name or Roll Number");
        return;
    }

    const res = await fetch("/api/students");

const students = await res.json();

const student = students.find(s =>

    s.name.toLowerCase().includes(keyword.toLowerCase())

    ||

    String(s.roll) === keyword

);

if (!student) {
    alert("Student not found");
    return;
}

document.getElementById("studentProfileContainer").innerHTML =
    renderProfileEditHtml(student, 0);

}