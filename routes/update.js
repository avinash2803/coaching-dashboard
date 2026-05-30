async function saveStudent(student) {
  if (student._id) {
    await fetch(`/api/students/${student._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student)
    });
  } else {
    await fetch(`/api/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student)
    });
  }
}