const cgpscCtx = document
  .getElementById("cgpscChart");

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

      data: [72, 78, 80, 76, 84, 82],

      borderColor: "#0072ce",

      backgroundColor:
        "rgba(0,114,206,0.10)",

      tension: 0.4,

      fill: true
    }]
  },

  options: {

    responsive: true,

    maintainAspectRatio: false
  }
});