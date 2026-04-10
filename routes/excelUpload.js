import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";
import Student from "../models/student.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/* ================= TEST UPLOAD ================= */

router.post("/upload-tests", upload.single("file"), async (req, res) => {
  try {
    let { testName, subject, fullMarks, testType, batch } = req.body;
    const year = String(req.body.year).split("(")[0].trim();


    if (testType === "Class Test") testType = "classTests";
    if (testType === "Mock Exam") testType = "mockTests";

    if (!req.file) return res.status(400).json({ error: "Excel file missing" });
    if (!testName) return res.status(400).json({ error: "Test name missing" });
    if (!testType) return res.status(400).json({ error: "Test type missing" });
    if (!batch) return res.status(400).json({ error: "Batch not selected" });
    if (!req.body.year) return res.status(400).json({ error: "Year missing" });

    let updated = 0;
    let notFound = [];
    let errors = [];

    // delete old test
    await Student.updateMany(
      { course: batch, year },
      { $unset: { [`${testType}.${testName}`]: "" } }
    );

    // set AB for all
    await Student.updateMany(
      { course: batch, year },
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

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { range: 3 });
    fs.unlinkSync(req.file.path);
    console.log("TOTAL ROWS:", data.length);

    for (const row of data) {
      try {
        const roll = parseInt(String(row.Roll || row["Roll No"]).trim());
        const score = Number(Number(row.Marks || 0).toFixed(2));
        const rank = Number(row.Rank || 0);

        if (!roll) {
          errors.push(row);
          continue;
        }

      const cleanBatch = String(batch).trim();

const student = await Student.findOne({
  roll,
  year,
  course: cleanBatch
});

        if (!student) {
          notFound.push(roll);
          continue;
        }

        const percent = ((score / Number(fullMarks)) * 100).toFixed(2);

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