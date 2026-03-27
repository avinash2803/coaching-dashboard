import express from "express";
import mongoose from "mongoose";
import Achievement from "../models/achievement.js";
import Student from "../models/student.js";
import Dashboardstats from "../models/dashboardstats.js";

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

const existing = await Achievement.findOne({
  studentId: new mongoose.Types.ObjectId(studentId)
});

if (existing) {
  // 👉 Update instead of duplicate
  existing.examQualified = examQualified;
  await existing.save();
} else {
  // 👉 Create new
  await Achievement.create({
  studentId: new mongoose.Types.ObjectId(studentId),
  examQualified
});
}

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
      .populate("studentId")
      .lean();

    const year = req.query.year || "2025-26";

    const stats = await Dashboardstats.findOne({ year }) || {};

    res.render("admin/manage-achievement", {
      achievements,
      stats
    });

  } catch (err) {
    console.error("ERROR IN /achievement/manage:", err);
    res.send("Error loading Manage Achievement page");
  }
});

export default router;