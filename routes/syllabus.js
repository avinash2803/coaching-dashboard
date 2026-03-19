const express = require("express");
const router = express.Router();
const XLSX = require("xlsx");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

let syllabusData = [];

// ✅ Excel upload
router.post("/upload-syllabus", upload.single("file"), (req, res) => {
  const workbook = XLSX.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  syllabusData = XLSX.utils.sheet_to_json(sheet);

  res.redirect("/syllabus");
});

// ✅ Show page
router.get("/syllabus", (req, res) => {
  res.render("syllabus", { data: syllabusData });
});

export default router;