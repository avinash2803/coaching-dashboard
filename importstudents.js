import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import Student from "./models/Student.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

mongoose.connect("mongodb://127.0.0.1:27017/studentDB")
.then(()=>console.log("MongoDB Connected"));

const year = "2025-26";

const filePath = path.join(__dirname,"Years",year,"students.json");

const students = JSON.parse(fs.readFileSync(filePath));

async function importData(){

for(const s of students){

    const student = new Student({
        ...s,
        year: year
    });

    await student.save();
}

console.log("Students Imported");
process.exit();

}

importData();