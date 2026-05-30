import express from "express";
import Dashboardstats from "../models/dashboardstats.js";

const router = express.Router();


// ✅ SAVE (Create ya Update)
router.post("/save-dashboard-stats", async (req, res) => {
  try {
    const { year, students, qualified, employment } = req.body;

    if (!year) {
      return res.status(400).json({ error: "Year is required" });
    }

    const existing = await Dashboardstats.findOne({ year });

    if (existing) {
      // update
      existing.students = students;
      existing.qualified = qualified;
      existing.employment = employment;

      await existing.save();
    } else {
      // create new
      await Dashboardstats.create({
        year,
        students,
        qualified,
        employment
      });
    }

    res.json({ success: true, message: "Dashboard data saved" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});


// ✅ GET (year wise data)
router.get("/dashboard-stats", async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ error: "Year is required" });
    }

    const data = await Dashboardstats.findOne({ year });

    res.json(data || {});

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;