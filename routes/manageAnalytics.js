import express from "express";

import Analytics
from "../models/analytics.js";

const router =
express.Router();


// =========================================
// GET PAGE
// =========================================

router.get(
  "/",
  async (req, res) => {

    try {

      const analyticsData =
      await Analytics.find({});

      res.render(
        "admin/manageanalytics",
        {
          analyticsData
        }
      );

    } catch(error){

      console.log(error);

      res.send(
        "Manage Analytics Error"
      );
    }
});


// =========================================
// SAVE ANALYTICS
// =========================================

router.post(
  "/",
  async (req, res) => {

    try {

      const {

        year,

        totalStudents,

        activeStudents,

        dropoutStudents,

        employedStudents

      } = req.body;

      await Analytics.findOneAndUpdate(

        { year },

        {

          year,

          totalStudents,

          activeStudents,

          dropoutStudents,

          employedStudents
        },

        {

          upsert: true,

          new: true
        }
      );

      res.redirect(
        "/manageanalytics"
      );

    } catch(error){

      console.log(error);

      res.send(
        "Analytics Save Error"
      );
    }
});

export default router;