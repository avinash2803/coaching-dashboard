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
const { course, year } = req.body;
  const workbook = XLSX.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const raw = XLSX.utils.sheet_to_json(sheet, { range: 1 });

  const data = raw.map((row, index) => ({
    sn: row["S.N"] || index + 1,
    subject: row["Subject"] || "",
    faculty: row["Faculty"] || "",
    startDate: row["Start Date"] || "",
    endDate: row["End Date"] || "",
    planned: Number(row["Planned"]) || 0,
    executed: Number(row["Executed"]) || 0,
    status: row["Status"] || "",
    course: course,
  year: year        
  }));

  await mongoose.connection.collection("syllabus").deleteMany({});
  await mongoose.connection.collection("syllabus").insertMany(data);

  res.redirect("/admin/syllabus");
});

// ✅ Show syllabus page
router.get("/syllabus", async (req, res) => {

  const CGpscData = await mongoose.connection
  .collection("syllabus")
  .find({ course: "CGPSC" })
  .toArray();

const vyapamData = await mongoose.connection
  .collection("syllabus")
  .find({ course: "VYAPAM" })
  .toArray();

  res.render("syllabus", {
  CGpscData,
  vyapamData,
  CGpscProgress: 90,
  vyapamProgress: 80
});
});

export default router;