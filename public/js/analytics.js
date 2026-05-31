const months = [
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
  "April",
  "May"
];

// =========================================
// CGPSC CHART
// =========================================

const cgpscCtx = document.getElementById("cgpscChart");

new Chart(cgpscCtx, {
  type: "line",
  data: {
    labels: months,
    datasets: [
      {
        label: "Attendance %",
        data: window.cgpscAttendance,
        borderColor: "#0072CE",
        backgroundColor: "rgba(0,114,206,0.10)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#0072CE",
        pointRadius: 4
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value) {
            return value + "%";
          }
        }
      }
    }
  }
});

// =========================================
// VYAPAM CHART
// =========================================

const vyapamCtx = document.getElementById("vyapamChart");

new Chart(vyapamCtx, {
  type: "line",
  data: {
    labels: months,
    datasets: [
      {
        label: "Attendance %",
        data: window.vyapamAttendance,
        borderColor: "#00A651",
        backgroundColor: "rgba(0,166,81,0.10)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#00A651",
        pointRadius: 4
      }
    ]
  },
options: {

  responsive: true,

  maintainAspectRatio: false,

  scales: {

    y: {

      beginAtZero: true,

      max: 100,

      ticks: {

        callback: function(value){

          return value + "%";
        }
      }
    }
  }
}
});