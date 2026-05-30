function addTeacher() {
    const name = document.getElementById("name").value;
    const subject = document.getElementById("subject").value;

    if (!name || !subject) {
        alert("Please fill all fields");
        return;
    }

    const list = document.getElementById("teacherList");

    const div = document.createElement("div");
    div.className = "teacher-item";

    div.innerHTML = `
        <span>${name} - ${subject}</span>
        <div class="actions">
            <button>Edit</button>
            <button class="delete">Delete</button>
        </div>
    `;

    list.appendChild(div);

    document.getElementById("name").value = "";
    document.getElementById("subject").value = "";
}
