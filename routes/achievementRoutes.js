import express from "express";
import mongoose from "mongoose";
import Achievement from "../models/achievement.js";
import Student from "../models/student.js";
import Dashboardstats from "../models/dashboardstats.js";

function buildEmploymentSummary(achievements) {

    const uniqueStudents = new Set();

    const departmentMap = {};

    achievements.forEach(item => {

        if (item.type !== "EMPLOYMENT") return;

        uniqueStudents.add(item.studentId._id.toString());

        const category = item.category.trim();

departmentMap[category] =
    (departmentMap[category] || 0) + 1;

    });

    const departments = Object.entries(departmentMap)
        .map(([name, total]) => ({
            name,
            total
        }))
        .sort((a, b) => b.total - a.total);

    return {

        studentsEmployed: uniqueStudents.size,

        employmentAchievements: departments.reduce(
            (sum, d) => sum + d.total,
            0
        ),

        departments

    };

}

const router = express.Router();
function buildQualificationSummary(achievements) {

    const uniqueStudents = new Set();

    const examMap = {};

    achievements.forEach(item => {

        if (item.type !== "QUALIFICATION") return;

        uniqueStudents.add(item.studentId._id.toString());

        const category = item.category.trim();

        examMap[category] =
            (examMap[category] || 0) + 1;

    });

    const exams = Object.entries(examMap)
        .map(([name, total]) => ({
            name,
            total
        }))
        .sort((a, b) => b.total - a.total);

    return {

        studentsQualified: uniqueStudents.size,

        qualificationAchievements:
            exams.reduce((sum, e) => sum + e.total, 0),

        exams

    };

}

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
    const { studentId, type, category, year } = req.body;

await Achievement.create({
    studentId: new mongoose.Types.ObjectId(studentId),
    type,
    category,
    year
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
    const year = req.query.year || "2025-26";

// ================= ACHIEVEMENTS =================

const rawAchievements =
  year === "all"
    ? await Achievement.find().populate("studentId").lean()
    : await Achievement.find({ year }).populate("studentId").lean();

const studentMap = {};

rawAchievements.forEach(item => {

    const id = item.studentId?._id?.toString();

    if (!id) return;

    if (!studentMap[id]) {

        studentMap[id] = {

            _id: id,

            studentId: item.studentId,

            employment: [],

            qualification: []

        };

    }

    if (item.type === "EMPLOYMENT") {

        studentMap[id].employment.push(item.category);

    }

    if (item.type === "QUALIFICATION") {

        studentMap[id].qualification.push(item.category);

    }

});

const achievements = Object.values(studentMap);

// ================= DASHBOARD STATS =================

let stats = {};

if (year === "all") {

    stats = await Dashboardstats.findOne({ year: "2025-26" }) || {};

} else {

    stats = await Dashboardstats.findOne({ year }) || {};

}

// ================= AUTO EMPLOYMENT =================

const employmentSummary = buildEmploymentSummary(rawAchievements);
const qualificationSummary =
buildQualificationSummary(rawAchievements);

    res.render("admin/manage-achievement", {
      year,
      achievements,
      stats,
      employmentSummary,
      qualificationSummary
});

  } catch (err) {
    console.error("ERROR IN /achievement/manage:", err);
    res.send("Error loading Manage Achievement page");
  }
});


// 👉 SAVE DASHBOARD STATS
router.post("/admin/save-dashboard-stats", async (req, res) => {
  try {
    const {
  year,
  students,
  qualified,
  employment,
  achievementNote
} = req.body;

// ✅ SAVE DIRECTLY (same format as frontend)
await Dashboardstats.findOneAndUpdate(
  { year },
  {
    students: {
      total: Number(students?.total) || 0,
      boys: Number(students?.boys) || 0,
      girls: Number(students?.girls) || 0
    },
    qualified: qualified || [],
employment: employment || [],
achievementNote: achievementNote || ""
  },
  { upsert: true }
);
    res.send("Dashboard Saved");

  } catch (err) {
    console.error(err);
    res.send("Error saving dashboard");
  }
});

// 👉 GET DASHBOARD STATS (FOR AUTO LOAD)
router.get("/admin/dashboard-stats", async (req, res) => {
  try {
    const { year } = req.query;

    const data = await Dashboardstats.findOne({ year });

    res.json(data || {});

  } catch (err) {
    console.error(err);
    res.json({});
  }
});

export default router;