import express from "express";
import User from "../models/user.js";

const router = express.Router();

/* LOGIN */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username, password });

  if (!user) {
    return res.status(401).json({ message: "Invalid login" });
  }

  // ✅ SESSION STORE (already correct)
  req.session.user = {
    id: user._id,
    role: user.role,
    studentId: user.studentId
  };

  // 🔥 IMPORTANT CHANGE
  res.redirect('/');
});

/* LOGOUT */
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

export default router;