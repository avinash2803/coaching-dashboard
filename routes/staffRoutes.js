import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Staff from "../models/Staff.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "public", "uploads", "staff");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `staff-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error("Please upload a JPG, PNG, WEBP or GIF image."));
  }
});

const cleanText = (value, max = 5000) => String(value ?? "").trim().slice(0, max);
const formData = (body) => ({
  name: cleanText(body.name, 150),
  designation: cleanText(body.designation, 150),
  department: cleanText(body.department, 150),
  experienceYears: Math.max(0, Math.min(80, Number(body.experienceYears) || 0)),
  relevantExperience: cleanText(body.relevantExperience, 1500),
  qualification: cleanText(body.qualification, 500),
  about: cleanText(body.about, 3000),
  responsibilities: cleanText(body.responsibilities, 3000),
  expertise: cleanText(body.expertise, 1000),
  joiningDate: body.joiningDate ? new Date(body.joiningDate) : null,
  email: cleanText(body.email, 180),
  phone: cleanText(body.phone, 40),
  status: ["Active", "Inactive", "Left"].includes(body.status) ? body.status : "Active",
  leavingDate: body.leavingDate ? new Date(body.leavingDate) : null,
  leavingReason: cleanText(body.leavingReason, 1500)
});

function removeLocalPhoto(photoUrl) {
  if (!photoUrl || !photoUrl.startsWith("/uploads/staff/")) return;
  const filename = path.basename(photoUrl);
  fs.unlink(path.join(uploadDir, filename), () => {});
}

function renderForm(res, { member = {}, error = "", isEdit = false, formAction = "" } = {}) {
  return res.render("admin/manage-staff", {
    mode: isEdit ? "form" : "list",
    formMode: true,
    member,
    error,
    isEdit,
    formAction
  });
}

// Public staff directory: only active staff are shown.
router.get("/staff", async (_req, res) => {
  try {
    const staffMembers = await Staff.find({ status: "Active" }).sort({ name: 1 }).lean();
    return res.render("staff", { staffMembers });
  } catch (error) {
    console.error("Public staff directory error:", error);
    return res.status(500).send("Unable to load staff directory.");
  }
});

// Public staff profile. Capitalization intentionally matches views/StaffProfile.ejs.
router.get("/staff/profile/:id", async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, status: "Active" }).lean();
    if (!staff) return res.status(404).render("StaffProfile", { staff: null });
    return res.render("StaffProfile", { staff });
  } catch (error) {
    console.error("Staff profile error:", error);
    return res.status(400).send("Invalid staff profile link.");
  }
});

// Admin list
router.get("/admin/manage-staff", adminAuth, async (_req, res) => {
  try {
    const staffMembers = await Staff.find().sort({ status: 1, name: 1 }).lean();
    return res.render("admin/manage-staff", {
      mode: "list", formMode: false, staffMembers, message: "", error: ""
    });
  } catch (error) {
    console.error("Manage staff list error:", error);
    return res.status(500).send("Unable to load staff records.");
  }
});

// New staff form
router.get("/admin/staff/new", adminAuth, (_req, res) => {
  renderForm(res, { member: { status: "Active", experienceYears: 0 }, isEdit: false, formAction: "/admin/staff" });
});

// Create staff
router.post("/admin/staff", adminAuth, upload.single("photo"), async (req, res) => {
  try {
    const data = formData(req.body);
    if (!data.name || !data.designation) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return renderForm(res, { member: { ...data, ...req.body }, error: "Full name and designation are required.", isEdit: false, formAction: "/admin/staff" });
    }
    if (req.file) data.photoUrl = `/uploads/staff/${req.file.filename}`;
    await Staff.create(data);
    return res.redirect("/admin/manage-staff?message=Staff%20added%20successfully");
  } catch (error) {
    console.error("Create staff error:", error);
    if (req.file) fs.unlink(req.file.path, () => {});
    return renderForm(res, { member: req.body, error: error.message || "Could not create staff profile.", isEdit: false, formAction: "/admin/staff" });
  }
});

// Edit form
router.get("/admin/staff/:id/edit", adminAuth, async (req, res) => {
  try {
    const member = await Staff.findById(req.params.id).lean();
    if (!member) return res.status(404).send("Staff record not found.");
    return renderForm(res, { member, isEdit: true, formAction: `/admin/staff/${member._id}` });
  } catch (error) {
    return res.status(400).send("Invalid staff record.");
  }
});

// Update staff
router.post("/admin/staff/:id", adminAuth, upload.single("photo"), async (req, res) => {
  try {
    const member = await Staff.findById(req.params.id);
    if (!member) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).send("Staff record not found.");
    }
    const data = formData(req.body);
    if (!data.name || !data.designation) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return renderForm(res, { member: { ...member.toObject(), ...req.body }, error: "Full name and designation are required.", isEdit: true, formAction: `/admin/staff/${member._id}` });
    }
    Object.assign(member, data);
    if (req.file) {
      removeLocalPhoto(member.photoUrl);
      member.photoUrl = `/uploads/staff/${req.file.filename}`;
    }
    await member.save();
    return res.redirect("/admin/manage-staff?message=Staff%20updated%20successfully");
  } catch (error) {
    console.error("Update staff error:", error);
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).send("Could not update staff profile. Check the submitted details.");
  }
});

// Deactivate / reactivate staff, preserving their record.
router.post("/admin/staff/:id/toggle-status", adminAuth, async (req, res) => {
  try {
    const member = await Staff.findById(req.params.id);
    if (!member) return res.status(404).send("Staff record not found.");
    member.status = member.status === "Active" ? "Inactive" : "Active";
    if (member.status === "Active") {
      member.leavingDate = null;
      member.leavingReason = "";
    }
    await member.save();
    return res.redirect("/admin/manage-staff?message=Staff%20status%20updated");
  } catch (error) {
    console.error("Toggle staff status error:", error);
    return res.status(400).send("Could not change staff status.");
  }
});

// Mark as left: preserve profile and capture exit information.
router.post("/admin/staff/:id/mark-left", adminAuth, async (req, res) => {
  try {
    const member = await Staff.findById(req.params.id);
    if (!member) return res.status(404).send("Staff record not found.");
    member.status = "Left";
    member.leavingDate = req.body.leavingDate ? new Date(req.body.leavingDate) : new Date();
    member.leavingReason = cleanText(req.body.leavingReason, 1500);
    await member.save();
    return res.redirect("/admin/manage-staff?message=Staff%20marked%20as%20left");
  } catch (error) {
    console.error("Mark staff left error:", error);
    return res.status(400).send("Could not update staff status.");
  }
});

// Permanent delete; admin-only and confirmed in the UI.
router.post("/admin/staff/:id/delete", adminAuth, async (req, res) => {
  try {
    const member = await Staff.findByIdAndDelete(req.params.id);
    if (member) removeLocalPhoto(member.photoUrl);
    return res.redirect("/admin/manage-staff?message=Staff%20record%20deleted");
  } catch (error) {
    console.error("Delete staff error:", error);
    return res.status(400).send("Could not delete staff record.");
  }
});

export default router;
