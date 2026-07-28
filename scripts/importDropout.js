import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import fs from "fs";
import Student from "../models/student.js";

await mongoose.connect(process.env.MONGO_URI);

console.log("✅ MongoDB Connected");

const students = JSON.parse(
    fs.readFileSync("./Year/2025-26/dropout_students.json", "utf8")
);

try {

    const result = await Student.insertMany(students);

    console.log("✅ Imported :", result.length, "students");

} catch (err) {

    console.error(err);

}

mongoose.connection.close();