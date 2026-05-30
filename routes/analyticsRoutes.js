router.get("/analytics", async (req, res) => {

  try {

    const tests = await Test.find();

    const groupedTests = {};

    tests.forEach(test => {

      if (!groupedTests[test.testName]) {

        groupedTests[test.testName] = [];
      }

      groupedTests[test.testName].push(test);
    });

    const testAnalytics = [];

    for (const testName in groupedTests) {

      const records = groupedTests[testName];

      const subject =
        records[0].subject;

      const fullMarks =
        records[0].fullMarks;

      const appearedStudents =
        records.filter(
          r => r.score !== "AB"
        );

      const absentStudents =
        records.filter(
          r => r.score === "AB"
        ).length;

      const scores =
        appearedStudents.map(
          r => Number(r.score)
        );

      const candidatesAppeared =
        appearedStudents.length;

      const totalScore =
        scores.reduce(
          (sum, score) =>
            sum + score,
          0
        );

      const averageScore =
        candidatesAppeared > 0
        ? (
            totalScore /
            candidatesAppeared
          ).toFixed(2)
        : 0;

      const averagePercentage =
        (
          (averageScore / fullMarks)
          * 100
        ).toFixed(2);

      const above50 =
        scores.filter(
          score =>
            (
              (score / fullMarks)
              * 100
            ) >= 50
        ).length;

      const topScore =
        Math.max(...scores);

      const topper =
        appearedStudents.find(
          r =>
            Number(r.score)
            === topScore
        );

      testAnalytics.push({

        testName,

        subject,

        fullMarks,

        candidatesAppeared,

        absentStudents,

        averageScore,

        averagePercentage,

        above50,

        topperName:
          topper?.studentName
          || "N/A",

        topScore
      });
    }

    res.render("analytics", {

      testAnalytics
    });

  } catch (error) {

    console.log(error);

    res.send("Analytics Error");
  }
});