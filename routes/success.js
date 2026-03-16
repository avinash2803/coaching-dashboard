import express from "express";
import Success from "../models/success.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

/* Manage success stories */
router.get("/admin/manage-success", adminAuth, async (req,res)=>{

const stories = await Success.find();

res.render("admin/managesuccess",{stories});

});

/* Add story page */
router.get("/admin/add-success", adminAuth,(req,res)=>{
res.render("admin/addsuccess");
});

/* Save story */
router.post("/admin/add-success", adminAuth, async (req,res)=>{

const { name, achievement, photo, story } = req.body;

await Success.create({
name,
achievement,
photo,
story
});

res.redirect("/admin/manage-success");

});

export default router;