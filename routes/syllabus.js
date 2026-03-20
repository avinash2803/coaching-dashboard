import express from "express";
import XLSX from "xlsx";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

let syllabusData = [];

// Upload Excel
router.post("/upload-syllabus", upload.single("file"), (req, res) => {
  const workbook = XLSX.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  syllabusData = XLSX.utils.sheet_to_json(sheet);

  res.redirect("/admin/syllabus");
});

// Show page
router.get("/syllabus", (req, res) => {
  res.render("syllabus", { data: syllabusData });
});

export default router;