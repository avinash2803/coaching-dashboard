import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";
import Student from "../models/student.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload-tests", upload.single("file"), async (req, res) => {

console.log("BODY DATA:", req.body);

try {

console.log("Excel upload started");

let { testName, subject, fullMarks, testType, batch } = req.body;

if (testType === "Class Test") testType = "classTests";
if (testType === "Mock Exam") testType = "mockTests";

// validation
if (!req.file) return res.status(400).json({ error: "Excel file missing" });
if (!testName) return res.status(400).json({ error: "Test name missing" });
if (!testType) return res.status(400).json({ error: "Test type missing" });
if (!batch) return res.status(400).json({ error: "Batch not selected" });

// Delete previous test data if same test uploaded again
if (testType === "classTests") {
  await Student.updateMany(
    { course: batch },
    { $unset: { [`classTests.${testName}`]: "" } }
  );
}

if (testType === "mockTests") {
  await Student.updateMany(
    { course: batch },
    { $unset: { [`mockTests.${testName}`]: "" } }
  );
}

console.log("Old test removed if existed:", testName);
// Create AB for all students first
await Student.updateMany(
  { course: batch },
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

console.log("Excel rows:", data.length);

const processedStudents = new Set();

for (const row of data) {

const roll = parseInt(String(row.Roll).trim());
const studentName = (row.Name || "").toString().trim().replace(/\s+/g," ");
const score = Number(Number(row.Marks || 0).toFixed(2));
const rank = Number(row.Rank || 0);

if (!roll) {
  console.log("Invalid roll:", row);
  continue;
}

if (!studentName) continue;
const student = await Student.findOne({
  roll: roll,
  course: batch
});

if (!student) {
console.log("Student not found:", studentName);
continue;
}

processedStudents.add(student._id.toString());

const percent = ((score / Number(fullMarks)) * 100).toFixed(2);

if (testType === "classTests") {

student.classTests = student.classTests || {};

student.classTests[testName] = {
subject,
fullMarks: Number(fullMarks),
score,
percent,
rank
};

student.markModified("classTests");   // ADD THIS LINE

}

if (testType === "mockTests") {

student.mockTests = student.mockTests || {};

student.mockTests[testName] = {
subject,
fullMarks: Number(fullMarks),
score,
percent,
rank
};

student.markModified("mockTests");   // ADD THIS LINE

}

await student.save();

console.log("Updated:", student.name);

}

const batchStudents = await Student.find({ course: batch });

for (const student of batchStudents) {

if (processedStudents.has(student._id.toString())) continue;

if (testType === "classTests") {

student.classTests = student.classTests || {};

student.classTests[testName] = {
subject,
fullMarks: Number(fullMarks),
score: "AB",
percent: 0,
rank: "AB"
};
student.markModified("classTests");
}

if (testType === "mockTests") {

student.mockTests = student.mockTests || {};

student.mockTests[testName] = {
subject,
fullMarks: Number(fullMarks),
score: "AB",
percent: 0,
rank: "AB"
};
student.markModified("mockTests");
}

await student.save();

console.log("Marked AB:", student.name);

}

res.json({ success: true });

} catch (err) {

console.error("Upload error:", err);
res.status(500).json({ error: "Upload failed" });

}

});
// ================= ATTENDANCE UPLOAD =================

router.post("/upload-attendance", upload.single("file"), async (req, res) => {
  try {
    const { batch, month, totalDays } = req.body;

    if (!req.file) return res.status(400).json({ error: "Excel file missing" });
    if (!batch) return res.status(400).json({ error: "Batch missing" });
    if (!month) return res.status(400).json({ error: "Month missing" });

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    fs.unlinkSync(req.file.path);

    let updated = 0;

    for (const row of data) {
      const roll = Number(row["Roll No"]);
      const present = Number(row["Present"]);
      const absent = Number(row["Absent"]);

      if (!roll) continue;

      const student = await Student.findOne({
        roll: roll,
        course: batch
      });

      if (!student) continue;

      const percentage = ((present / totalDays) * 100).toFixed(2);

      student.attendance = student.attendance || [];

      const existing = student.attendance.find(a => a.month === month);

      if (existing) {
        existing.totalDays = totalDays;
        existing.present = present;
        existing.absent = absent;
        existing.percentage = percentage;
      } else {
        student.attendance.push({
          month,
          totalDays,
          present,
          absent,
          percentage
        });
      }

      await student.save();
      updated++;
    }

    res.json({ success: true, updated });

  } catch (err) {
    console.error("Attendance upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});
export default router;