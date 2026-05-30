import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {

  try {

    const testAnalytics = [

      {

        testName: "Test-1",

        subject: "Indian History + Polity",

        fullMarks: 200,

        candidatesAppeared: 82,

        absentStudents: 14,

        averageScore: 94,

        averagePercentage: 47,

        above50: 26,

        topperName: "Ravi Kumar",

        topScore: 188
      }
    ];

    res.render("analytics", {

      testAnalytics
    });

  } catch (error) {

    console.log(error);

    res.send("Analytics Error");
  }
});

export default router;