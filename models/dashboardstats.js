import mongoose from "mongoose";

const dashboardstatsSchema = new mongoose.Schema({
  year: { type: String, required: true, unique: true },

  students: {
    total: Number,
    boys: Number,
    girls: Number
  },

qualified: [
  {
    name: String,
    boys: Number,
    girls: Number
  }
],

 employment: [
  {
    name: String,
    boys: Number,
    girls: Number
  }
]

}, { timestamps: true });

export default mongoose.model("Dashboardstats", dashboardstatsSchema);