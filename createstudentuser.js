import mongoose from "mongoose";
import Student from "./models/student.js";
import User from "./models/user.js";

mongoose.connect("mongodb+srv://AVI_BPCP_db_user:%23%23%234876%40Avi@cluster0.9knyxgn.mongodb.net/studentDB");

async function createUsers(){

const students = await Student.find();

for(const s of students){

if(!s.roll){
console.log("Skipping student without roll:", s.name);
continue;
}

const existing = await User.findOne({ username: s.roll.toString() });

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