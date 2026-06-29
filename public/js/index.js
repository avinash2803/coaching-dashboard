
  const topBar = document.querySelector(".top-bar");

if (topBar) {

    window.addEventListener("scroll", () => {

        if (window.innerWidth <= 900) return;

        if (window.scrollY > 80) {
            topBar.classList.add("scrolled");
        } else {
            topBar.classList.remove("scrolled");
        }

    });

}
  const yearSelect = document.getElementById("yearSelect");

if (yearSelect) {

    const savedYear = localStorage.getItem("bvcpYear");

    if (savedYear) {
        yearSelect.value = savedYear;
    }

    yearSelect.addEventListener("change", () => {

        localStorage.setItem("bvcpYear", yearSelect.value);

        console.log("Selected Year:", yearSelect.value);

    });

}
 const slides = document.querySelectorAll(".slide");

let currentSlide = 0;

function showSlide(index) {

    if (!slides.length) return;

    slides.forEach(slide => slide.classList.remove("active"));

    slides[index].classList.add("active");

}

if (slides.length > 1) {

    setInterval(() => {

        currentSlide = (currentSlide + 1) % slides.length;

        showSlide(currentSlide);

    }, 4500);

}

/* =========================
   SCROLL REVEAL ANIMATION
   ========================= */

const observer = new IntersectionObserver(

(entries)=>{

entries.forEach((entry)=>{

if(entry.isIntersecting){

entry.target.classList.add("show");

}

});

},

{
threshold: 0.15
}

);

document
.querySelectorAll(
".section, .stat-card, .program-card, .highlight-card"
)

.forEach((el)=>observer.observe(el));