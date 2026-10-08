import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";
import Student from "../models/student.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/* ================= TEST UPLOAD ================= */

/* ================= TEST UPLOAD ================= */

router.post("/upload-tests", upload.single("file"), async (req, res) => {
  try {
    let { testName, subject, fullMarks, testType, batch } = req.body;
    const year = String(req.body.year).split("(")[0].trim();

    /* ================= NORMALIZE TEST TYPE ================= */

    if (testType === "Class Test") testType = "classTests";
    if (testType === "Mock Exam") testType = "mockTests";

    /* ================= BASIC VALIDATION ================= */

    if (!req.file) {
      return res.status(400).json({ error: "Excel file missing" });
    }

    if (!testName) {
      return res.status(400).json({ error: "Test name missing" });
    }

    if (!testType) {
      return res.status(400).json({ error: "Test type missing" });
    }

    if (!batch) {
      return res.status(400).json({ error: "Batch not selected" });
    }

    if (!req.body.year) {
      return res.status(400).json({ error: "Year missing" });
    }

    if (!subject) {
      return res.status(400).json({ error: "Subject missing" });
    }

    if (!fullMarks || isNaN(Number(fullMarks)) || Number(fullMarks) <= 0) {
      return res.status(400).json({ error: "Valid full marks required" });
    }

    let updated = 0;
    let notFound = [];
    let errors = [];

    /* ================= READ EXCEL ================= */

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const data = xlsx.utils.sheet_to_json(sheet, {
      header: 1,
      defval: ""
    });

    fs.unlinkSync(req.file.path);

    console.log("FIRST ROW:", data[0]);
    console.log("TOTAL ROWS:", data.length);

    /*
      NEW EXCEL FORMAT:

      Row 1:
      BALCO Connect Bhoramdev Vidyapeeth

      Row 2:
      Subject | Type | Date | Max Marks

      Row 3:
      S.No. | Roll No. | Student Name | Obtained | Max

      Row 4 onwards:
      Student data

      Column mapping:

      A = row[0] → S.No.          IGNORE
      B = row[1] → Roll No.       USE
      C-E         → Student Name  IGNORE
      F = row[5] → Obtained       USE
      G = row[6] → Max            IGNORE

      Full Marks comes from the website form.
    */

    /* ================= READ STUDENT RESULTS ================= */

    const testResults = [];

    for (let i = 3; i < data.length; i++) {
      try {
        const row = data[i];

        const roll = Number(row[1]);   // Column B = Roll No.
        const score = Number(row[5]);  // Column F = Obtained Marks

        // Ignore completely blank rows
        if (row.every(cell => String(cell).trim() === "")) {
          continue;
        }

        // Validate Roll and Score
        if (!roll || isNaN(score)) {
          errors.push({
            row: i + 1,
            data: row,
            reason: "Invalid Roll No. or Obtained Marks"
          });
          continue;
        }

        // Score cannot be negative
        if (score < 0) {
          errors.push({
            row: i + 1,
            data: row,
            reason: "Obtained marks cannot be negative"
          });
          continue;
        }

        // Score cannot exceed full marks
        if (score > Number(fullMarks)) {
          errors.push({
            row: i + 1,
            data: row,
            reason: "Obtained marks greater than full marks"
          });
          continue;
        }

        testResults.push({
          roll,
          score
        });

      } catch (err) {
        console.error("Excel row error:", err);
        errors.push({
          row: i + 1,
          data: data[i],
          reason: err.message
        });
      }
    }

    console.log("VALID TEST RESULTS:", testResults.length);

    /* ================= CHECK EXCEL DATA ================= */

    if (testResults.length === 0) {
      return res.status(400).json({
        error: "No valid student test data found in Excel",
        errorsCount: errors.length
      });
    }

    /* ================= CALCULATE RANK ================= */

    /*
      Rank is calculated automatically from Obtained Marks.

      Example:

      154.76 → Rank 1
      145.46 → Rank 2
      145.46 → Rank 2
      138.82 → Rank 4

      Competition ranking:
      1, 2, 2, 4
    */

    const rankedResults = [...testResults].sort(
      (a, b) => b.score - a.score
    );

    let previousScore = null;
    let currentRank = 0;

    rankedResults.forEach((result, index) => {

      if (
        previousScore === null ||
        result.score !== previousScore
      ) {
        currentRank = index + 1;
      }

      result.rank = currentRank;

      previousScore = result.score;
    });

    console.log("RANKED RESULTS:", rankedResults);

    /* ================= RESET OLD TEST ================= */

    /*
      IMPORTANT:
      We only reset/delete the existing test AFTER
      successfully reading and validating the Excel.

      Therefore a bad Excel file will not destroy
      an existing test.
    */

    await Student.updateMany(
      {
        course: {
          $regex: `^${batch.trim()}$`,
          $options: "i"
        },
        year
      },
      {
        $unset: {
          [`${testType}.${testName}`]: ""
        }
      }
    );

    /* ================= SET ALL STUDENTS AS AB ================= */

    await Student.updateMany(
      {
        course: {
          $regex: `^${batch.trim()}$`,
          $options: "i"
        },
        year
      },
      {
        $set: {
          [`${testType}.${testName}`]: {
            subject,
            fullMarks: Number(fullMarks),
            score: "AB",
            percent: "AB",
            rank: "AB"
          }
        }
      }
    );

    /* ================= UPDATE STUDENTS ================= */

    for (const result of rankedResults) {
      try {

        const { roll, score, rank } = result;

        const cleanBatch = String(batch).trim();

        const student = await Student.findOne({
          roll,
          year,
          course: {
            $regex: `^${cleanBatch}$`,
            $options: "i"
          }
        });

        /* ---------- STUDENT NOT FOUND ---------- */

        if (!student) {
          console.log("NOT FOUND:", {
            roll,
            batch,
            year
          });

          notFound.push(roll);
          continue;
        }

        /* ---------- CALCULATE PERCENTAGE ---------- */

        const percent =
          ((score / Number(fullMarks)) * 100).toFixed(2);

        /* ---------- SAVE TEST RESULT ---------- */

        student[testType] = student[testType] || {};

        student[testType][testName] = {
          subject,
          fullMarks: Number(fullMarks),
          score,
          percent,
          rank
        };

        student.markModified(testType);

        await student.save();

        console.log("TEST SAVED:", {
          roll,
          batch: student.course,
          year: student.year,
          testName,
          score,
          percent,
          rank
        });

        updated++;

      } catch (err) {

        console.error("Student update error:", err);

        errors.push({
          roll: result.roll,
          score: result.score,
          reason: err.message
        });
      }
    }

    /* ================= RESPONSE ================= */

    res.json({
      success: true,
      updated,
      notFound,
      errorsCount: errors.length
    });

  } catch (err) {

    console.error("TEST UPLOAD ERROR:", err);

    res.status(500).json({
      error: "Upload failed"
    });
  }
});


/* ================= ATTENDANCE UPLOAD ================= */

router.post("/upload-attendance", upload.single("file"), async (req, res) => {
  try {
    const batch = String(req.body.batch).trim();
const totalDays = req.body.totalDays;

    const month = req.body.month.trim();
    const rawYear = req.body.year;
    const year = String(rawYear)
  .split("(")[0]
  .trim();


    if (!req.file) return res.status(400).json({ error: "Excel file missing" });
    if (!batch) return res.status(400).json({ error: "Batch missing" });
    if (!month) return res.status(400).json({ error: "Month missing" });
    if (!totalDays) return res.status(400).json({ error: "Total days missing" });
    if (!year) return res.status(400).json({ error: "Year missing" });

    let updated = 0;
    let notFound = [];
    let errors = [];

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, {
  range: 2,
  defval: 0
});

    fs.unlinkSync(req.file.path);

    for (const row of data) {
  try {

    const roll = Number(row["Roll No"]);
const present = Number(row["Present"]);
const absent = Number(row["Absent"]);

    if (!roll || isNaN(present) || isNaN(absent)) {
      errors.push(row);
      continue;
    }

    
      const cleanBatch = String(batch).trim();
console.log("MATCH TRY:", {
  roll: Number(roll),
  batch,
  year
});

const student = await Student.findOne({
  roll: Number(roll),
  year: year,
  course: { $regex: `^${cleanBatch}$`, $options: "i" }
});

        if (!student) {
  console.log("NOT FOUND:", {
    roll: Number(roll),
    batch,
    year
  });
  notFound.push(roll);
  continue;   // 🔥 VERY IMPORTANT
}

        const percentage = ((present / totalDays) * 100).toFixed(2);

        student.attendance = student.attendance || {};

student.attendance[month] = {
  total: Number(totalDays),
  present,
  absent
};
student.markModified("attendance");
          await student.save();
         console.log("SAVED:", {
  roll,
  batch: student.course,
  year: student.year,
  month,
  data: student.attendance[month]
});

        updated++;

      } catch (err) {
        errors.push(row);
      }
    }

    res.json({
      success: true,
      updated,
      notFound,
      errorsCount: errors.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;