// utils.js

// ---------- Attendance helpers ----------
function calcAttendancePercent(m) {
  const p = Number(m.present) || 0;
  const t = Number(m.total) || 0;
  return t ? +((p / t) * 100).toFixed(2) : 0;
}

function avgAttendanceFor(student) {
  const months = Object.values(student.attendance || {}).filter(
    m => Number(m.total) > 0
  );
  if (!months.length) return 0;
  const vals = months.map(calcAttendancePercent);
  return +(
    vals.reduce((a, b) => a + b, 0) / vals.length
  ).toFixed(2);
}

// ---------- Test helpers ----------
function finalScoreOf(test, course) {
  const correct = Number(test.correct) || 0;
  const incorrect = Number(test.incorrect) || 0;

  const marksPerQuestion = 2;
  const negativeFraction =
    String(course || "").toUpperCase() === "VYAPAM" ? 1 / 4 : 1 / 3;

  const negativeMarks = marksPerQuestion * negativeFraction;
  const score =
    correct * marksPerQuestion - incorrect * negativeMarks;

  return +score.toFixed(2);
}

function percentOfTest(test, course) {
  const fm = Number(test.fullMarks) || 0;
  if (!fm) return 0;
  const sc = finalScoreOf(test, course);
  return +((sc / fm) * 100).toFixed(2);
}

function avgTestPercentFor(student) {
  const tests = Object.values(student.tests || {});
  if (!tests.length) return 0;
  const vals = tests.map(t => percentOfTest(t, student.course));
  return +(
    vals.reduce((a, b) => a + b, 0) / vals.length
  ).toFixed(2);
}

// ---------- UI helpers ----------
function finalColorClass(val) {
  if (val < 40) return "score-red";
  if (val < 70) return "score-orange";
  return "score-green";
}

function attColorClass(pct) {
  if (pct < 75) return "att-red";
  if (pct < 90) return "att-orange";
  return "att-green";
}

function escapeHtml(s) {
  if (s === undefined || s === null) return "";
  return String(s).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

// expose globally
window.calcAttendancePercent = calcAttendancePercent;
window.avgAttendanceFor = avgAttendanceFor;
window.finalScoreOf = finalScoreOf;
window.percentOfTest = percentOfTest;
window.avgTestPercentFor = avgTestPercentFor;
window.finalColorClass = finalColorClass;
window.attColorClass = attColorClass;
window.escapeHtml = escapeHtml;
