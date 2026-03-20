import express from "express";
import XLSX from "xlsx";
import multer from "multer";
import mongoose from "mongoose"; // ✅ add this

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Upload Excel + Save to MongoDB
router.post("/upload-syllabus", upload.single("file"), async (req, res) => {

  const workbook = XLSX.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log("DATA TO SAVE:", data); // ✅ debug

  // 🔥 MongoDB me save
  await mongoose.connection.collection("syllabus").insertMany(data);

  console.log("DATA SAVED IN DB");

  res.redirect("/admin/syllabus");
});


// Show page (MongoDB se data fetch)
router.get("/syllabus", async (req, res) => {

  const data = await mongoose.connection
    .collection("syllabus")
    .find()
    .toArray();

  console.log("DATA FROM DB:", data); // ✅ debug

  res.render("syllabus", { data });
});

export default router;