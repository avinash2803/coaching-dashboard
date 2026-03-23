import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  examQualified: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model("Achievement", achievementSchema);