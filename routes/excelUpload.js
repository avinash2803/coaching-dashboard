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
      { course: batch, year: req.body.year },
      { $unset: { [`${testType}.${testName}`]: "" } }
    );

    // set AB for all
    await Student.updateMany(
      { course: batch, year: req.body.year },
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
    const data = xlsx.utils.sheet_to_json(sheet, { range: 2 });
    fs.unlinkSync(req.file.path);

    for (const row of data) {
      try {
        const roll = parseInt(String(row.Roll).trim());
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
  course: { $regex: `^${cleanBatch}$`, $options: "i" }
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
let yearMatch = String(rawYear).match(/\d{4}[-–]\d{2}/);

const year = yearMatch ? yearMatch[0].replace("–", "-") : null;

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
    const data = xlsx.utils.sheet_to_json(sheet, { range: 2 });

    fs.unlinkSync(req.file.path);

    for (const row of data) {
  try {

    const keys = Object.keys(row);

    let rollRaw = row[keys.find(k => k.toLowerCase().includes("roll"))];

const roll = Number(String(rollRaw).trim().replace(".0", ""));

// 🔥 YAHI ADD KARNA HAI
    console.log("ROLL:", rollRaw, "→", roll);

    const present = Number(row[keys.find(k => k.toLowerCase().includes("present"))]);
    const absent = Number(row[keys.find(k => k.toLowerCase().includes("absent"))]);

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
}

        const percentage = ((present / totalDays) * 100).toFixed(2);

        student.attendance = student.attendance || {};

student.attendance[month] = {
  total: Number(totalDays),
  present,
  absent
};

    

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

export default router;