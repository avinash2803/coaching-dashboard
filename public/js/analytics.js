```js
// =========================================
// COMMON MONTH LABELS
// =========================================

const monthLabels = [
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

const cgpscCtx =
document.getElementById("cgpscChart");

new Chart(cgpscCtx, {

  type: "line",

  data: {

    labels: monthLabels,

    datasets: [{

      label: "Attendance %",

      data: cgpscAttendance,

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

    labels: monthLabels,

    datasets: [{

      label: "Attendance %",

      data: vyapamAttendance,

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
```
