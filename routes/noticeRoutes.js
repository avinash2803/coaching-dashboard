import express from "express";
import Notice from "../models/notice.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();


// Add Notice Page
router.get("/add-notice", adminAuth, (req,res)=>{
  res.render("admin/add-notice");
});


// Save Notice
router.post("/add-notice", adminAuth, async (req,res)=>{

  try{

    await Notice.create({

  title: req.body.title,

  description: req.body.description,

  type: req.body.type,

  link: req.body.link

});

    res.redirect("/admin/add-notice");

  }catch(err){

    console.log(err);
    res.send("Error saving notice");

  }

});


// Manage Notices
router.get("/manage-notice", adminAuth, async (req,res)=>{

  const notices = await Notice.find()
  .sort({createdAt:-1});

  res.render("admin/manage-notice",{
    notices
  });

});

export default router;