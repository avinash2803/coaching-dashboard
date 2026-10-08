import express from "express";
import Analytics
from "../models/analytics.js";
import Student from "../models/student.js";

const router = express.Router();

function isEligible(student, month) {

    const monthMap = {
        June: 5,
        July: 6,
        August: 7,
        September: 8,
        October: 9,
        November: 10,
        December: 11,
        January: 0,
        February: 1,
        March: 2,
        April: 3,
        May: 4
    };
    if(!student.year) return false;

    const startYear = Number(student.year.split("-")[0]);

    const monthIndex = monthMap[month];

    const currentYear =
        monthIndex <= 4
            ? startYear + 1
            : startYear;

    const monthStart = new Date(currentYear, monthIndex, 1);
    const monthEnd = new Date(currentYear, monthIndex + 1, 0);

    // Admission Date
    let admission = monthStart;

    if (student.admissionDate) {

        const [d, m, y] =
            student.admissionDate.split("-");

        admission = new Date(y, m - 1, d);

        // Not admitted yet
        if (admission > monthEnd)
            return false;
    }

    // Dropout Date
    let dropout = monthEnd;

    if (
        student.status === "Dropout" &&
        student.dropoutDate
    ) {

        const [d, m, y] =
            student.dropoutDate.split("-");

        dropout = new Date(y, m - 1, d);

        // Left before this month
        if (dropout < monthStart)
            return false;
    }

    // Calculate actual overlap
    const effectiveStart =
        admission > monthStart
            ? admission
            : monthStart;

    const effectiveEnd =
        dropout < monthEnd
            ? dropout
            : monthEnd;

    const enrolledDays =
        Math.floor(
            (effectiveEnd - effectiveStart)
            / (1000 * 60 * 60 * 24)
        ) + 1;

    return enrolledDays >= 10;
}
router.get("/", async (req, res) => {

  try {
    
    const today = new Date();

const currentYear =
today.getMonth() >= 5
? `${today.getFullYear()}-${String(today.getFullYear() + 1).slice(-2)}`
: `${today.getFullYear() - 1}-${String(today.getFullYear()).slice(-2)}`;

const selectedYear =
req.query.year || "all";


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

    async function getBatchAttendance(courseName) {
    let filter = {
        course: courseName
    };

    if (
        selectedYear &&
        selectedYear.toLowerCase() !== "all"
    ) {
        filter.year = selectedYear;
    }

    const students = await Student.find(filter);

    const monthlyAverage = [];

    // Fixed sanctioned strength by academic year
    const BATCH_CAPACITY = {
        "2025-26": 100,
        "2026-27": 125
    };

    let totalPresentDays = 0;
    let totalMaximumDays = 0;

    for (const month of months) {

        let monthlyPresentDays = 0;
        let monthlyMaximumDays = 0;

        // Group students by academic year
        const studentsByYear = {};

        students.forEach(student => {

            const attendance =
                student.attendance?.[month];

            if (
                !attendance ||
                Number(attendance.total) <= 0
            ) {
                return;
            }

            const year = student.year;

            if (!studentsByYear[year]) {
                studentsByYear[year] = {
                    workingDays: Number(attendance.total) || 0,
                    presentDays: 0
                };
            }

            studentsByYear[year].presentDays +=
                Number(attendance.present) || 0;
        });

        // Calculate separately for each academic year
        Object.entries(studentsByYear).forEach(
            ([year, data]) => {

                const capacity =
                    BATCH_CAPACITY[year] || 125;

                // Add actual present days
                monthlyPresentDays +=
                    data.presentDays;

                // Maximum possible student-days
                monthlyMaximumDays +=
                    data.workingDays * capacity;
            }
        );

        // No attendance uploaded for this month
        if (monthlyMaximumDays <= 0) {
            monthlyAverage.push(0);
            continue;
        }

        // Monthly attendance percentage
        const monthlyPercentage =
            (
                monthlyPresentDays /
                monthlyMaximumDays
            ) * 100;

        monthlyAverage.push(
            Number(monthlyPercentage.toFixed(1))
        );

        // Add to overall calculation
        totalPresentDays +=
            monthlyPresentDays;

        totalMaximumDays +=
            monthlyMaximumDays;
    }

    // Overall batch attendance
    const totalAttendance =
        totalMaximumDays > 0
            ? (
                totalPresentDays /
                totalMaximumDays
            ) * 100
            : 0;

    return {
        monthlyAverage,
        totalPresentDays,
        totalMaximumDays,
        totalAttendance:
            Number(totalAttendance.toFixed(1))
    };
}

  const cgpscResult =
await getBatchAttendance("CGPSC");

const vyapamResult =
await getBatchAttendance("VYAPAM");

const cgpscAttendance =
cgpscResult.monthlyAverage;

const vyapamAttendance =
vyapamResult.monthlyAverage;

  // =====================================================
// OVERALL ATTENDANCE
// Fixed capacity = 125 for each batch
// =====================================================

// =====================================================
// OVERALL ATTENDANCE
// Capacity depends on academic year
// =====================================================

const overallPresentDays =
    cgpscResult.totalPresentDays +
    vyapamResult.totalPresentDays;

const overallMaximum =
    cgpscResult.totalMaximumDays +
    vyapamResult.totalMaximumDays;

const averageAttendance =
    overallMaximum > 0
        ? Number(
            (
                overallPresentDays /
                overallMaximum *
                100
            ).toFixed(1)
        )
        : 0;
   

const testFilter = {};

if(
  selectedYear &&
  selectedYear !== "all"
){

  testFilter.year =
  selectedYear;
}


function generateTestAnalytics(
  students,
  testField
){

  const testMap = {};

  students.forEach(student => {

    const tests =
    student[testField] || {};

    Object.entries(tests)
    .forEach(([testName, testData]) => {

      if(!testMap[testName]){

        testMap[testName] = {

          testName,

          subject:
          testData.subject || "-",

          appeared: 0,

          above60: 0,

          topper: "",

          topScore: 0,

          fullMarks:
          testData.fullMarks || 0
        };
      }

const rawScore = testData.score;

if(
  rawScore === "AB" ||
  rawScore === "" ||
  rawScore === null ||
  rawScore === undefined
){

  return;
}

const score = Number(rawScore);

const fullMarks = Number(
  testData.fullMarks || 0
);

const calculatedPercentage =

fullMarks > 0
? (score / fullMarks) * 100
: 0;
if(score > 0){

  testMap[testName]
  .appeared++;

  if(calculatedPercentage >= 60){

    testMap[testName]
    .above60++;
  }

  if(
    score >
    testMap[testName]
    .topScore
  ){

    testMap[testName]
    .topScore =
    score;

    testMap[testName]
    .topper =
    student.name;
  }
}
    });
  });

  return Object.values(testMap);
}

const cgpscStudents =
await Student.find({
  ...testFilter,
  course: "CGPSC"
});

const vyapamStudents =
await Student.find({
  ...testFilter,
  course: "VYAPAM"
});

const cgpscClassTests =
generateTestAnalytics(
  cgpscStudents,
  "classTests"
);

const cgpscMockTests =
generateTestAnalytics(
  cgpscStudents,
  "mockTests"
);

const cgpscMainsTests =
generateTestAnalytics(
  cgpscStudents,
  "mainsTests"
);

const vyapamClassTests =
generateTestAnalytics(
  vyapamStudents,
  "classTests"
);

const vyapamMockTests =
generateTestAnalytics(
  vyapamStudents,
  "mockTests"
);


const totalClassTests =

cgpscClassTests.length +
vyapamClassTests.length;

const totalMockTests =

cgpscMockTests.length +
vyapamMockTests.length;

const totalMainsTests =

cgpscMainsTests.length;

const totalTests =

totalClassTests +
totalMockTests +
totalMainsTests;
if (selectedYear && selectedYear.toLowerCase() !== "all") {

    console.log("===== UPDATE START =====");
console.log("selectedYear =", selectedYear);
console.log("averageAttendance =", averageAttendance);

const result = await Analytics.findOneAndUpdate(
        { year: selectedYear },
        {
            $set: {
                averageAttendance: Number(averageAttendance),

                attendance: {
                    cgpsc: {
                        June: cgpscAttendance[0],
                        July: cgpscAttendance[1],
                        August: cgpscAttendance[2],
                        September: cgpscAttendance[3],
                        October: cgpscAttendance[4],
                        November: cgpscAttendance[5],
                        December: cgpscAttendance[6],
                        January: cgpscAttendance[7],
                        February: cgpscAttendance[8],
                        March: cgpscAttendance[9],
                        April: cgpscAttendance[10],
                        May: cgpscAttendance[11]
                    },
                    vyapam: {
                        June: vyapamAttendance[0],
                        July: vyapamAttendance[1],
                        August: vyapamAttendance[2],
                        September: vyapamAttendance[3],
                        October: vyapamAttendance[4],
                        November: vyapamAttendance[5],
                        December: vyapamAttendance[6],
                        January: vyapamAttendance[7],
                        February: vyapamAttendance[8],
                        March: vyapamAttendance[9],
                        April: vyapamAttendance[10],
                        May: vyapamAttendance[11]
                    }
                }
            }
        },
        {
            upsert: true,
            new: true
        }
    );
console.log("Mongo Result =", result);
console.log("===== UPDATE END =====");
}

let analyticsData = {};

if(
  !selectedYear ||
  selectedYear.toLowerCase() === "all"
){

  const allAnalytics =
  await Analytics.find();

 analyticsData = {

  totalStudents:
    allAnalytics.reduce(
      (sum, item) =>
      sum + (item.totalStudents || 0),
      0
    ),

  activeStudents:
    allAnalytics.reduce(
      (sum, item) =>
      sum + (item.activeStudents || 0),
      0
    ),

  dropoutStudents:
    allAnalytics.reduce(
      (sum, item) =>
      sum + (item.dropoutStudents || 0),
      0
    ),

  employedStudents:
    allAnalytics.reduce(
      (sum, item) =>
      sum + (item.employedStudents || 0),
      0
    ),

  qualifiedStudents:
    allAnalytics.reduce(
      (sum, item) =>
      sum + (item.qualifiedStudents || 0),
      0
    ),

  hybridStudents:
    allAnalytics.reduce(
      (sum, item) =>
      sum + (item.hybridStudents || 0),
      0
    )
};

}else{

  const yearStudents =
    await Student.find({
      year: selectedYear
    });

  const existingAnalytics =
    await Analytics.findOne({
      year: selectedYear
    }) || {};

  analyticsData = {

    ...existingAnalytics.toObject(),

    totalStudents:
      yearStudents.length,

    activeStudents:
      yearStudents.filter(
        student => student.status === "Active"
      ).length,

    dropoutStudents:
      yearStudents.filter(
        student => student.status === "Dropout"
      ).length,

    employedStudents:
      yearStudents.filter(student =>
        Array.isArray(student.achievements) &&
        student.achievements.some(a =>
          String(a).toLowerCase().includes("employ")
        )
      ).length,

    qualifiedStudents:
      yearStudents.filter(student =>
        Array.isArray(student.achievements) &&
        student.achievements.some(a =>
          String(a).toLowerCase().includes("qualif")
        )
      ).length,

    // Keep existing Hybrid Learning value unchanged
    hybridStudents:
      existingAnalytics.hybridStudents || 0

  };
}

let totalDays = 0;

const sampleStudent =
[
  ...cgpscStudents,
  ...vyapamStudents
].find(student => student.attendance);

if(sampleStudent){

  Object.values(sampleStudent.attendance)
  .forEach(month => {

    totalDays += month.total || 0;

  });

}

const totalSessions =
Math.round(totalDays * 4.5);

const totalHours =
totalSessions * 2;


res.render("analytics", {

  totalDays,

totalSessions,

totalHours,
  averageAttendance,

  cgpscAttendance,

  vyapamAttendance,

 cgpscClassTests,
cgpscMockTests,
cgpscMainsTests,

vyapamClassTests,
vyapamMockTests,

  totalClassTests,

  totalMockTests,

  totalMainsTests,

  totalTests,

  analyticsData,

  selectedYear
});



  } catch (error) {

  console.log(error);

  res.send(error.message);
}
});

export default router;