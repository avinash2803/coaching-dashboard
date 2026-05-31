// =========================================
// CGPSC CHART
// =========================================

const cgpscCtx =
document.getElementById("cgpscChart");

new Chart(cgpscCtx, {

  type: "line",

  data: {

    labels: [
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov"
    ],

    datasets: [{

      label: "Attendance %",

      data: [72,78,80,76,84,82],

      borderColor: "#0072CE",

      backgroundColor:
      "rgba(0,114,206,0.10)",

      fill: true,

      tension: 0.4,

      pointBackgroundColor:
      "#0072CE",

      pointRadius: 4
    }]
  },

  options: {

    responsive: true,

    maintainAspectRatio: false
  }
});


// =========================================
// VYAPAM CHART
// =========================================

const vyapamCtx =
document.getElementById("vyapamChart");

new Chart(vyapamCtx, {

  type: "line",

  data: {

    labels: [
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov"
    ],

    datasets: [{

      label: "Attendance %",

      data: [65,70,74,72,76,74],

      borderColor: "#00A651",

      backgroundColor:
      "rgba(0,166,81,0.10)",

      fill: true,

      tension: 0.4,

      pointBackgroundColor:
      "#00A651",

      pointRadius: 4
    }]
  },

  options: {

    responsive: true,

    maintainAspectRatio: false
  }
});