import fs from "fs";
import mongoose from "mongoose";
import dotenv from "dotenv";

import Student from "../models/student.js";
import Achievement from "../models/achievement.js";
import Analytics from "../models/analytics.js";
import Dashboardstats from "../models/dashboardstats.js";
import Notice from "../models/notice.js";
import Success from "../models/success.js";
import User from "../models/user.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

console.log("MongoDB Connected");

if (!fs.existsSync("./exports")) {
    fs.mkdirSync("./exports");
}

async function exportCollection(name, model) {

    const data = await model.find().lean();

    fs.writeFileSync(
        `./exports/${name}.json`,
        JSON.stringify(data, null, 2)
    );

    console.log(`✅ ${name} : ${data.length}`);

}

await exportCollection("students", Student);
await exportCollection("achievements", Achievement);
await exportCollection("analytics", Analytics);
await exportCollection("dashboardstats", Dashboardstats);
await exportCollection("notices", Notice);
await exportCollection("success", Success);
await exportCollection("users", User);

await mongoose.disconnect();

console.log("🎉 Export Completed");