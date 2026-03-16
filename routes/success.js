import express from "express";
import Success from "../models/success.js";
import adminAuth from "../middleware/adminAuth.js";
import multer from "multer";


const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });


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
router.post(
  "/admin/add-success",
  adminAuth,
  upload.single("photo"),
  async (req, res) => {

    const { name, title, subtitle, achievement, village, story } = req.body;

    let photoId = null;

    if (req.file) {
      photoId = req.file.id; // GridFS file id
    }

    await Success.create({
      name,
      title,
      subtitle,
      achievement,
      village,
      story,
      photoId
    });

    res.redirect("/admin/manage-success");
  }
);

export default router;