import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema({
  roll: Number,
  name: String,
  studentMobile: String,
  father: String,
  fatherMobile: String,
  email: String,
  dob: String,
  gender: String,
  category: String,
  course: String,
  admissionDate: String,
  aadhaar: String,
  rank: String,
  bloodGroup: String,
  area: String,
year: String,   // ⭐ ADD THIS LINE
  photoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "uploads.files" // GridFS reference
  },

  attendance: Object,
  classTests: {
  type: Object,
  default: {}
},

mockTests: {
  type: Object,
  default: {}
},

remarks: String

});

export default mongoose.model("Student", StudentSchema);
