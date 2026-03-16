import express from "express";
import Success from "../models/success.js";
import adminAuth from "../middleware/adminAuth.js";
import multer from "multer";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";
const router = express.Router();

/* Multer setup */
const storage = multer.memoryStorage();
const upload = multer({ storage });
let gfs;

mongoose.connection.once("open", () => {
  gfs = new GridFSBucket(mongoose.connection.db, {
    bucketName: "photos"
  });
});

/* ===============================
   Manage Success Stories
================================ */

router.get("/admin/manage-success", adminAuth, async (req,res)=>{

  const stories = await Success.find();

  res.render("admin/managesuccess",{stories});

});

/* ===============================
   Add Success Story Page
================================ */

router.get("/admin/add-success", adminAuth,(req,res)=>{
  res.render("admin/addsuccess");
});

/* ===============================
   Save New Story
================================ */

router.post(
  "/admin/add-success",
  adminAuth,
  upload.single("photo"),
  async (req, res) => {

    try {

      const { name, title, subtitle, achievement, village, story } = req.body;

      // create success story
      const newStory = new Success({
        name,
        title,
        subtitle,
        achievement,
        village,
        story
      });

      // if photo uploaded → upload using existing API
      if (req.file) {

  const uploadStream = gfs.openUploadStream(`${name}.jpg`, {
    contentType: "image/jpeg"
  });

  uploadStream.end(req.file.buffer);

  uploadStream.on("finish", async () => {

    newStory.photoId = uploadStream.id;
    await newStory.save();

    res.redirect("/admin/manage-success");

  });

} else {

  await newStory.save();
  res.redirect("/admin/manage-success");

}

    } catch (err) {

      console.error(err);
      res.redirect("/admin/manage-success");

    }

});

/* ===============================
   EDIT SUCCESS STORY PAGE
================================ */

router.get("/admin/edit-success/:id", adminAuth, async (req, res) => {

  try {

    const story = await Success.findById(req.params.id);

    if (!story) {
      return res.redirect("/admin/manage-success");
    }

    res.render("admin/edit-success", { story });

  } catch (err) {

    console.error(err);
    res.redirect("/admin/manage-success");

  }

});

/* ===============================
   UPDATE STORY
================================ */

router.post("/admin/update-success/:id", adminAuth, async (req,res)=>{

  try{

    const { name, title, subtitle, achievement, village, story } = req.body;

    await Success.findByIdAndUpdate(req.params.id,{
      name,
      title,
      subtitle,
      achievement,
      village,
      story
    });

    res.redirect("/admin/manage-success");

  }catch(err){

    console.error(err);
    res.redirect("/admin/manage-success");

  }

});

export default router;