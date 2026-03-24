import express from "express";
import Achievement from "../models/achievement.js";
import Student from "../models/student.js";

const router = express.Router();


// 👉 SHOW ADD FORM
router.get("/add", async (req, res) => {
  try {
    const students = await Student.find();

    console.log("Students count:", students.length);

    res.render("admin/add-achievement", { students });

  } catch (err) {
    console.error("ERROR IN /achievement/add:", err);
    res.send("Error loading Add Achievement page");
  }
});


// 👉 SAVE ACHIEVEMENT
router.post("/add", async (req, res) => {
  try {
    const { studentId, examQualified } = req.body;

    await Achievement.create({
      studentId,
      examQualified
    });

    res.redirect("/achievement/manage");

  } catch (err) {
    console.error("ERROR IN /achievement/add POST:", err);
    res.send("Error saving achievement");
  }
});


// 👉 SHOW ALL ACHIEVEMENTS
router.get("/manage", async (req, res) => {
  try {
    const achievements = await Achievement.find()
      .populate("studentId");

    const students = await Student.find();

    console.log("Achievements count:", achievements.length);

    // 📊 SAFE COUNTS (NO CRASH)
    const totalStudents = students.length;

    const boys = students.filter(s => s.gender === "Male" || s.gender === "male").length;

    const girls = students.filter(s => s.gender === "Female" || s.gender === "female").length;

    // 🎯 Exam counts (safe check)
    const sscCount = achievements.filter(a => a.examQualified && a.examQualified.includes("SSC")).length;

    const cgPoliceCount = achievements.filter(a => a.examQualified && a.examQualified.includes("CG")).length;

    const ctetCount = achievements.filter(a => a.examQualified && a.examQualified.includes("CTET")).length;

    res.render("admin/manage-achievement", {
      achievements,
      totalStudents,
      boys,
      girls,
      sscCount,
      cgPoliceCount,
      ctetCount
    });

  } catch (err) {
    console.error("ERROR IN /achievement/manage:", err);
    res.send("Error loading Manage Achievement page");
  }
});


export default router;