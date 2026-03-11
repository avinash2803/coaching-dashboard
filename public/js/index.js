
  const topBar = document.querySelector(".top-bar");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 80) {
      topBar.classList.add("scrolled");
    } else {
      topBar.classList.remove("scrolled");
    }
  });
  const yearSelect = document.getElementById("yearSelect");

  // Load saved year (if any)
  const savedYear = localStorage.getItem("bvcpYear");
  if (savedYear) {
    yearSelect.value = savedYear;
  }

  // Save year on change
  yearSelect.addEventListener("change", () => {
    localStorage.setItem("bvcpYear", yearSelect.value);
    console.log("Selected Year:", yearSelect.value);
  });
  const slides = document.querySelectorAll(".slide");
let currentSlide = 0;

function showSlide(index) {
    const slides = document.querySelectorAll(".slide");
  if (!slides.length) return;   // ✅ ADD THIS LINE
  slides.forEach(slide => slide.classList.remove("active"));
  slides[index].classList.add("active");
}

setInterval(() => {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}, 4500);
