import mongoose from "mongoose";

const successSchema = new mongoose.Schema({
  name: String,
  slug: String,

  photoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "uploads.files"
  },

  title: String,
  subtitle: String,
  achievement: String,
  village: String,
  category: String,
  story: String,
  year: Number,
  featured: Boolean
});

const Success = mongoose.model("Success", successSchema);

export default Success;