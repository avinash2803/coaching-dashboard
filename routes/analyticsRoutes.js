import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {

  try {

    res.render("analytics", {

      testAnalytics: []
    });

  } catch (error) {

    console.log(error);

    res.send("Analytics Error");
  }
});

export default router;