import mongoose from "mongoose";

const StaffSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  designation: { type: String, required: true, trim: true },
  department: { type: String, trim: true, default: "" },
  experienceYears: { type: Number, min: 0, default: 0 },
  relevantExperience: { type: String, trim: true, default: "" },
  qualification: { type: String, trim: true, default: "" },
  about: { type: String, trim: true, default: "" },
  responsibilities: { type: String, trim: true, default: "" },
  expertise: { type: String, trim: true, default: "" },
  joiningDate: { type: Date, default: null },
  email: { type: String, trim: true, lowercase: true, default: "" },
  phone: { type: String, trim: true, default: "" },
  photoUrl: { type: String, trim: true, default: "" },
  status: { type: String, enum: ["Active", "Inactive", "Left"], default: "Active" },
  leavingDate: { type: Date, default: null },
  leavingReason: { type: String, trim: true, default: "" }
}, { timestamps: true });

StaffSchema.index({ name: 1, status: 1 });

export default mongoose.models.Staff || mongoose.model("Staff", StaffSchema);
