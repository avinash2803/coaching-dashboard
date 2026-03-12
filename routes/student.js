import express from "express";
import Student from "../models/student.js";

const router = express.Router();

/* ✅ IMPORT JSON (NEW – ADD THIS) */
router.post("/import", async (req, res) => {
  try {
    const students = req.body;

    if (!Array.isArray(students)) {
      return res.status(400).json({ message: "Invalid JSON format" });
    }

    // Optional: clear old records before import
    await Student.deleteMany({ year: students[0].year });

    // Insert all students
    await Student.insertMany(students);

    res.json({ message: "Students imported into MongoDB successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* CREATE */
router.post("/", async (req, res) => {
  const student = await Student.create(req.body);
  res.json(student);
});
/* READ BY YEAR */
router.get("/year/:year", async (req, res) => {

  try {

    const year = req.params.year;

    // student login → return only their profile
    if(req.session.user && req.session.user.role === "student"){

      const student = await Student.findById(req.session.user.studentId);

      if(!student){
        return res.json([]);
      }

      if(student.year !== year){
        return res.json([]);
      }

      return res.json([student]);

    }

    // admin login → return all students for that year
    const students = await Student.find({ year }).sort({ roll: 1 });

    res.json(students);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

});
/* READ ALL + SEARCH */
router.get("/", async (req, res) => {
  const { q } = req.query;
  const filter = q
    ? { name: { $regex: q, $options: "i" } }
    : {};

  const students = await Student.find(filter).sort({ roll: 1 });
  res.json(students);
});

/* UPDATE */
router.put("/:id", async (req, res) => {
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(student);
});

/* DELETE */
router.delete("/:id", async (req, res) => {

  if(!req.session.user || req.session.user.role !== "admin"){
    return res.status(403).json({error:"Admin access required"});
  }

  try {

    await Student.findByIdAndDelete(req.params.id);

    res.json({ success: true });

  } catch(err){

    res.status(500).json({error:"Delete failed"});

  }

});
/* UPDATE PHOTO */
/* UPDATE PHOTO */
router.put("/:id/photo", async (req, res) => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: "fileId required" });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { photo: fileId },
      { new: true }
    );

    res.json(student);
  } catch (err) {
    res.status(500).json({ error: "Photo update failed" });
  }
});


export default router;
