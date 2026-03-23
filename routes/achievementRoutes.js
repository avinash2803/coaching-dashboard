import express from "express";
import Achievement from "../models/achievement.js";
import Student from "../models/student.js";

const router = express.Router();


// 👉 SHOW ADD FORM
router.get("/add", async (req, res) => {
  const students = await Student.find();
  res.render("admin/add-achievement", { students });
});


// 👉 SAVE ACHIEVEMENT
router.post("/add", async (req, res) => {
  const { studentId, examQualified } = req.body;

  await Achievement.create({
    studentId,
    examQualified
  });

  res.redirect("/achievement/manage");
});


// 👉 SHOW ALL ACHIEVEMENTS
router.get("/manage", async (req, res) => {
  const achievements = await Achievement.find()
    .populate("studentId");

  res.render("admin/manage-achievement", { achievements });
});

export default router;