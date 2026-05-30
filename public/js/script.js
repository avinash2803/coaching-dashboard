let students = [];

async function loadStudents() {
  try {
    const res = await fetch("http://localhost:3000/api/students");
    students = await res.json();
    renderStudents();
  } catch (err) {
    console.error("Failed to load students", err);
  }
}

/* Call on page load */
window.onload = loadStudents;