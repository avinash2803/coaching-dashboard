import authRoutes from "./routes/auth.js";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import excelUpload from "./routes/excelUpload.js";
import studentsRoutes from "./routes/student.js";
import uploadRoutes from "./routes/upload.js"; // ✅ IMPORTANT
import Student from "./models/student.js";
import User from "./models/user.js";

const app = express();

/* Fix __dirname */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* Middleware */
app.use(cors());
app.use(express.json());



app.use(express.static(path.join(__dirname, "public")));
app.use("/Years", express.static(path.join(__dirname, "Years")));

import session from "express-session";

app.use(session({
  secret: "bvcp-secret",
  resave: false,
  saveUninitialized: false
}));

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
mongoose.connect("mongodb+srv://AVI_BPCP_db_user:%23%23%234876%40Avi@cluster0.9knyxgn.mongodb.net/studentDB")
  .then(() => console.log("MongoDB Atlas Connected"))
  .catch(err => console.error(err));

/* Routes */
app.use("/api/upload", uploadRoutes);   // ✅ MUST be BEFORE app.listen
app.use("/api/students", studentsRoutes);
app.use("/auth", authRoutes);
app.use("/api/excel", excelUpload);
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

app.get("/syllabus", (req, res) => {
  res.render("syllabus");
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
app.get("/success", (req, res) => {
  res.render("success");
});
app.get("/login", (req,res)=>{
res.render("login");
});
/* Start Server */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
