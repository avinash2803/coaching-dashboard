import express from "express";

import Student from "../models/student.js";

const router = express.Router();

router.get("/", async (req, res) => {

  try {

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

const selectedYear =
req.query.year;

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

    res.render("analytics", {

      cgpscAttendance,

      vyapamAttendance
    });

  } catch (error) {

    console.log(error);

    res.send("Analytics Error");
  }
});

export default router;