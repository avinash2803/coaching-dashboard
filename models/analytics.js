
import mongoose from "mongoose";

const analyticsSchema =
new mongoose.Schema({

  year: String,

  totalStudents: Number,

  activeStudents: Number,

  dropoutStudents: Number,

  employedStudents: Number,

    qualifiedStudents: Number,

  hybridStudents: Number
});

export default mongoose.model(
  "Analytics",
  analyticsSchema
);