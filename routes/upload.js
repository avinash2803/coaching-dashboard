import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";
import sharp from "sharp";
import Student from "../models/student.js";
import Success from "../models/success.js";
const router = express.Router();

/* ---------- GridFS ---------- */
let gfs;

mongoose.connection.once("open", () => {
  gfs = new GridFSBucket(mongoose.connection.db, {
    bucketName: "photos"
  });
});

/* ---------- Multer ---------- */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ---------- Upload Photo ---------- */
router.post("/", upload.single("photo"), async (req, res) => {

  if (!gfs) {
    return res.status(500).json({ error: "File system not ready" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const studentId = req.body.studentId;
const successId = req.body.successId;
  try {

    const student = await Student.findById(studentId);let doc = null;
let type = "";

if (studentId) {
  doc = await Student.findById(studentId);
  type = "student";
}

if (successId) {
  doc = await Success.findById(successId);
  type = "success";
}

if (!doc) {
  return res.status(404).json({ error: "Record not found" });
}

    /* ---------- Delete old photo ---------- */
   if (doc.photoId) {
  try {
    await gfs.delete(new mongoose.Types.ObjectId(doc.photoId));
  }
  catch (err) {
    console.log("Old photo already deleted");
  }
}

    /* ---------- Compress Image ---------- */
    const compressedImage = await sharp(req.file.buffer)
      .resize(400, 400, { fit: "cover" }) // square student photo
      .jpeg({ quality: 70 }) // compress
      .toBuffer();

    /* ---------- Upload compressed image ---------- */
    const uploadStream = gfs.openUploadStream(`${doc.name}.jpg`, {
  contentType: "image/jpeg"
});

    uploadStream.end(compressedImage);

    uploadStream.on("finish", async () => {

  doc.photoId = uploadStream.id;
  await doc.save();

  res.json({
    fileId: uploadStream.id.toString(),
    filename: uploadStream.filename
  });

});

  } catch (err) {

    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });

  }

});

/* ---------- Get Photo ---------- */
router.get("/:id", async (req, res) => {

  try {

    if (!gfs) {
      return res.status(500).json({ error: "File system not ready" });
    }

    const fileId = new mongoose.Types.ObjectId(req.params.id);

    const downloadStream = gfs.openDownloadStream(fileId);

    downloadStream.on("error", () => {
      res.status(404).json({ error: "File not found" });
    });

    downloadStream.pipe(res);

  } catch (err) {

    res.status(400).json({ error: "Invalid file id" });

  }

});

export default router;