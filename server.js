/*
Student Performance Portal
Developed by: Avinash
Copyright © 2026
All Rights Reserved
*/
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.js";
import adminAuth from "./middleware/adminAuth.js";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import multer from "multer";
import session from "express-session";        // ✅ ADD THIS
import MongoStore from "connect-mongo";       // ✅ ADD THIS

import excelUpload from "./routes/excelUpload.js";
import studentsRoutes from "./routes/student.js";
import uploadRoutes from "./routes/upload.js"; // ✅ IMPORTANT
import Student from "./models/student.js";
import User from "./models/user.js";
import Success from "./models/success.js";
import successRoutes from "./routes/success.js";
import syllabusRoutes from "./routes/syllabus.js";
const app = express();
const upload = multer({ dest: "uploads/" });



app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI
  })
}));

/* Fix __dirname */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* Middleware */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, "public")));
app.use("/Years", express.static(path.join(__dirname, "Years")));


app.use((req,res,next)=>{
  res.locals.user = req.session.user;
  next();
});

// ✅ ADD LOGIN ROUTE HERE
app.post("/login", async (req, res) => {

  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.json({ success:false, message:"User not found" });
  }

  let match = false;

  if (user.role === "admin") {
  match = (password === user.password);
} else {
    // student password stored as plain text
    match = (password === user.password);
  }

  if (!match) {
    return res.json({ success:false, message:"Wrong password" });
  }

  req.session.user = {
    id: user._id,
    role: user.role,
    studentId: user.studentId
  };

  res.json({ success:true, role:user.role });

});

app.get("/logout",(req,res)=>{
req.session.destroy(()=>{
res.redirect("/");
});
});


// ✅ STUDENT LOGIN (Step 3)

app.post("/student-login", async (req,res)=>{

const {year,course,roll,dob} = req.body;

const student = await Student.findOne({
year,
course,
roll: Number(roll)
});
if(!student){
return res.json({success:false,message:"Student not found"});
}

if(student.dob !== dob){
return res.json({success:false,message:"Wrong password"});
}

req.session.user = {
studentId: student._id,
role: "student"
};

res.json({success:true});

});

/* View Engine Setup */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));



 /* MongoDB */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* Routes */
app.use("/api/upload", uploadRoutes);  // ✅ MUST be BEFORE app.listen
app.use("/api/students", studentsRoutes);
app.use("/auth", authRoutes);
app.use("/api/excel", excelUpload);
app.use("/", successRoutes);
app.use("/admin", syllabusRoutes);
app.put("/api/students/:id/tests", async (req, res) => {
  try {

    const studentId = req.params.id;
    const tests = req.body;

    console.log("Saving tests for student:", studentId);
    console.log("Tests:", tests);

    const updated = await Student.findByIdAndUpdate(
      studentId,
      { tests: tests },
      { new: true }
    );

    res.json(updated);

  } catch (err) {

    console.error("Error saving tests:", err);
    res.status(500).json({ error: "Failed to update tests" });

  }

});

/* Home */
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/student", (req,res)=>{

if(!req.session.user){
return res.redirect("/login")
}

res.render("student")

})

app.get("/staff", (req, res) => {
  res.render("staff");
});


app.get("/achievements", (req, res) => {
  res.render("achievements");
});

app.get("/feedback", (req, res) => {
  res.render("feedback");
});

app.get("/testimonials", (req, res) => {
  res.render("testimonials");
});
app.get("/success", async (req, res) => {

  const stories = await Success.find();

  res.render("successstory", { stories });

});
app.get("/login", (req,res)=>{
res.render("login");
});

/* Health check */
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});


app.get("/admin/dashboard", adminAuth, (req,res)=>{
res.render("admin/dashboard");
});


app.get("/admin/manage-success", adminAuth, async (req,res)=>{

const stories = await Success.find();

res.render("admin/managesuccess",{stories});

});
app.get("/admin/add-success", adminAuth, (req,res)=>{
res.render("admin/addsuccess");
});

app.get("/admin/upload-syllabus", adminAuth, (req, res) => {
  res.render("admin/upload-syllabus");
});
/* Start Server */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
