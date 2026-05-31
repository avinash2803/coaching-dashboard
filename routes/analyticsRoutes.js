import express from "express";

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

const students =
await Student.find({});

const testMap = {};

students.forEach(student => {

  const tests =
  student.classTests || {};

  Object.entries(tests)
  .forEach(([testName, testData]) => {

    if(!testMap[testName]){

      testMap[testName] = {

        testName,

        appeared: 0,

        above50: 0,

        topper: "",

        topScore: 0,

        fullMarks:
        testData.fullMarks || 0
      };
    }

    const score =
    Number(testData.score || 0);

    const percent =
    Number(testData.percent || 0);

    if(score > 0){

      testMap[testName]
      .appeared++;

      if(percent >= 50){

        testMap[testName]
        .above50++;
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

const classTestAnalytics =
Object.values(testMap);

res.render("analytics", {

  cgpscAttendance,

  vyapamAttendance,

  classTestAnalytics,

  selectedYear
});



  } catch (error) {

    console.log(error);

    res.send("Analytics Error");
  }
});

export default router;