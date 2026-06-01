import express from "express";
import Analytics
from "../models/analytics.js";
import Student from "../models/student.js";

const router = express.Router();

router.get("/", async (req, res) => {

  try {
    
    const selectedYear =
req.query.year;


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

if(
  selectedYear &&
  selectedYear !== "all"
){

  filter.year =
  selectedYear;
}

const students =
await Student.find(filter);


      const monthlyAverage = [];

      for (const month of months) {

        let totalPercentage = 0;

        let count = 0;

        students.forEach(student => {

          const attendance =
          student.attendance?.[month];

          if (

            attendance &&
            attendance.total > 0

          ) {

            const percentage =

            (
              attendance.present /
              attendance.total
            ) * 100;

            totalPercentage +=
            percentage;

            count++;
          }
        });

        const average =

          count > 0
          ? totalPercentage / count
          : 0;

        monthlyAverage.push(

          Number(
            average.toFixed(1)
          )
        );
      }

      return monthlyAverage;
    }

    const cgpscAttendance =

    await getBatchAttendance(
      "CGPSC"
    );

    const vyapamAttendance =

    await getBatchAttendance(
      "VYAPAM"
    );

    const combinedAttendance = [
  ...cgpscAttendance,
  ...vyapamAttendance
];

const averageAttendance =
combinedAttendance.length > 0
? (
    combinedAttendance.reduce(
      (sum, val) => sum + val,
      0
    ) / combinedAttendance.length
  ).toFixed(1)
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

const analyticsData =
await Analytics.findOne({
  year: selectedYear
}) || {};

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