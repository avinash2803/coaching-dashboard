import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema({

  title: String,

  description: String,

  type: {
    type: String,
    enum: ["Notice", "Event"],
    default: "Notice"
  },

  link: String,

  image: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

export default mongoose.model("Notice", noticeSchema);