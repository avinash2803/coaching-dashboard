import mongoose from "mongoose";
import dotenv from "dotenv";
import Achievement from "../models/achievement.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

console.log("MongoDB Connected");

const result = await Achievement.deleteMany({
    type: null
});

console.log("Deleted :", result.deletedCount);

process.exit();