import express from "express";
import AchievementCategory from "../models/achievementCategory.js";

const router = express.Router();

router.get("/", async (req, res) => {

    const categories = await AchievementCategory
        .find({ active: true })
        .sort({ type: 1, name: 1 });

    res.json(categories);

});

router.post("/add", async (req, res) => {

    const { name, type } = req.body;

    await AchievementCategory.create({
        name,
        type
    });

    res.json({
        success: true
    });

});

export default router;