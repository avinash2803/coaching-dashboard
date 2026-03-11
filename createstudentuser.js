import mongoose from "mongoose";
import Student from "./models/student.js";
import User from "./models/user.js";

mongoose.connect("mongodb://127.0.0.1:27017/studentDB");

async function createUsers(){

const students = await Student.find();

for(const s of students){

const existing = await User.findOne({ username: s.roll });

if(existing) continue;

await User.create({

username: s.roll.toString(),
password: s.dob,
role: "student",
studentId: s._id

});

}

console.log("Student users created successfully");

process.exit();

}

createUsers();