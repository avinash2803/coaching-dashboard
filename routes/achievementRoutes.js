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
    const { studentId, examQualified, year } = req.body;

const existing = await Achievement.findOne({
  studentId: new mongoose.Types.ObjectId(studentId)
});

if (existing) {
  // 👉 Update instead of duplicate
  existing.examQualified = examQualified;
  existing.year = year;
  await existing.save();
} else {
  // 👉 Create new
  await Achievement.create({
  studentId: new mongoose.Types.ObjectId(studentId),
  examQualified,
  year
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
    const year = req.query.year || "2025-26";

// 👉 ACHIEVEMENTS FIX
let achievements;

if (year === "all") {
  achievements = await Achievement.find()
    .populate("studentId")
    .lean();
} else {
  achievements = await Achievement.find({ year })
    .populate("studentId")
    .lean();
}

// 👉 STATS FIX
let stats = {};

if (year === "all") {
  const allStats = await Dashboardstats.find();

  let totalStudents = 0, boys = 0, girls = 0;

  allStats.forEach(s => {
    totalStudents += s.students?.total || 0;
    boys += s.students?.boys || 0;
    girls += s.students?.girls || 0;
  });

  stats = {
    students: { total: totalStudents, boys, girls },
    qualified: [],
    employment: []
  };

} else {
  stats = await Dashboardstats.findOne({ year }) || {};
}

    res.render("admin/manage-achievement", {
      year,
      achievements,
      stats
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
  totalStudents,
  boys,
  girls,
  examName,
  examBoys,
  examGirls,
  empName,
  empBoys,
  empGirls
} = req.body;

// ✅ QUALIFIED
let exams = [];
if (examName) {
  for (let i = 0; i < examName.length; i++) {
    if (examName[i]) {
      exams.push({
        name: examName[i],
        boys: Number(examBoys[i]) || 0,
        girls: Number(examGirls[i]) || 0
      });
    }
  }
}

// ✅ EMPLOYMENT
let employment = [];
if (empName) {
  for (let i = 0; i < empName.length; i++) {
    if (empName[i]) {
      employment.push({
        name: empName[i],
        boys: Number(empBoys[i]) || 0,
        girls: Number(empGirls[i]) || 0
      });
    }
  }
}

// ✅ SAVE
await Dashboardstats.findOneAndUpdate(
  { year },
  {
    students: {
      total: Number(totalStudents) || 0,
      boys: Number(boys) || 0,
      girls: Number(girls) || 0
    },
    qualified: exams,
    employment: employment
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