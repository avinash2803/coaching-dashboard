import express from "express";
import XLSX from "xlsx";
import multer from "multer";
import mongoose from "mongoose";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// ✅ Upload page open
router.get("/upload-syllabus", (req, res) => {
  res.render("admin/upload-syllabus");
});

// ✅ Upload Excel
router.post("/upload-syllabus", upload.single("file"), async (req, res) => {
const { course, year, progress } = req.body;
  const workbook = XLSX.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  function excelDateToJSDate(serial) {
  if (!serial) return "";
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);

  const day = date_info.getDate().toString().padStart(2, '0');
  const month = (date_info.getMonth() + 1).toString().padStart(2, '0');
  const yr = date_info.getFullYear();

  return `${day}-${month}-${yr}`;
}

  const raw = XLSX.utils.sheet_to_json(sheet, { range: 1 });

  const data = raw.map((row, index) => ({
    
    sn: row["S.N"] || index + 1,
    subject: row["Subject"] || "",
    faculty: row["Faculty"] || "",
startDate: excelDateToJSDate(row["Start Date"]),
endDate: excelDateToJSDate(row["End Date"]),
planned: Number(row["Planned"] || row["Planned Classes"] || row["No. of classes Planned"]) || 0,
executed: Number(row["Executed"] || row["Executed Classes"] || row["No. of Classes Executed"]) || 0,
    status: row["Status"] || "",
    course: course,
  year: year,
  }));

  await mongoose.connection.collection("syllabus").deleteMany({ course, year });
  await mongoose.connection.collection("syllabus").insertMany(data);
  await mongoose.connection.collection("progress").updateOne(
  { course, year },
  { $set: { progress: Number(progress) } },
  { upsert: true }
);

  res.redirect("/admin/syllabus");
});

// ✅ Show syllabus page
router.get("/syllabus", async (req, res) => {
  const year = req.query.year || "2025-26";

  const CGpscData = await mongoose.connection
  .collection("syllabus")
  .find({ course: "CGPSC", year })
  .toArray();

const vyapamData = await mongoose.connection
  .collection("syllabus")
  .find({ course: "VYAPAM", year })
  .toArray();

const cg = await mongoose.connection.collection("progress")
  .findOne({ course: "CGPSC", year });

const vy = await mongoose.connection.collection("progress")
  .findOne({ course: "VYAPAM", year });

const cgProgress = cg?.progress || 0;
const vyapamProgress = vy?.progress || 0;

res.render("syllabus", {
  CGpscData,
  vyapamData,
  CGpscProgress: cgProgress,
  vyapamProgress: vyapamProgress
});
});

export default router;