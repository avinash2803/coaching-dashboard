/* ---------- Events ---------- */
document.addEventListener("DOMContentLoaded", () => {

  /* ---------- FILTERS ---------- */
  const searchEl = document.getElementById("searchBox");
  const catEl = document.getElementById("filterCategory");
  const genderEl = document.getElementById("filterGender");
  const courseEl = document.getElementById("filterCourse");
  const sortEl = document.getElementById("sortBy");

  [searchEl, catEl, genderEl, courseEl, sortEl]
    .forEach(el => {
      if (el) {
        el.addEventListener("input", renderStudents);
      }
    });

  /* ---------- DASHBOARD TOGGLE ---------- */
  const toggleBtn = document.getElementById("toggleDashboard");
  const dashboardArea = document.getElementById("dashboardArea");

  if (toggleBtn && dashboardArea) {
    toggleBtn.addEventListener("click", () => {
      const show = dashboardArea.style.display === "none";
      dashboardArea.style.display = show ? "block" : "none";
      if (show && typeof renderDashboard === "function") {
        renderDashboard();
      }
    });
  }

});