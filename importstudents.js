import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import Student from "./models/student.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection
mongoose.connect("mongodb+srv://AVI_BPCP_db_user:%23%23%234876%40Avi@cluster0.9knyxgn.mongodb.net/studentDB")
.then(() => {
    console.log("MongoDB Connected");
    importData();
})
.catch(err => console.log(err));

const yearsFolder = path.join(__dirname, "Year");

async function importData(){

    const years = fs.readdirSync(yearsFolder);

    for(const year of years){

        const filePath = path.join(yearsFolder, year, "students.json");

        if(!fs.existsSync(filePath)){
            console.log(`No students.json found for ${year}`);
            continue;
        }

        const students = JSON.parse(fs.readFileSync(filePath));

        for(const s of students){

            const student = new Student({
                ...s,
                year: year
            });

            await student.save();
        }

        console.log(`Students imported for year ${year}`);
    }

    console.log("All years imported successfully");
    process.exit();
}