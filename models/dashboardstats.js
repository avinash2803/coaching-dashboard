import mongoose from "mongoose";

const dashboardStatsSchema = new mongoose.Schema({
  year: { type: String, required: true, unique: true },

  students: {
    total: Number,
    boys: Number,
    girls: Number
  },

  qualified: {
    cgpsc: {
      boys: Number,
      girls: Number
    },
    ctet: {
      boys: Number,
      girls: Number
    },
    lab: {
      boys: Number,
      girls: Number
    }
  },

  employment: {
    total: Number,
    boys: Number,
    girls: Number
  }

}, { timestamps: true });

export default mongoose.model("DashboardStats", dashboardStatsSchema);