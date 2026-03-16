import mongoose from "mongoose";

const successSchema = new mongoose.Schema({
  name: String,
  slug: String,
  photo: String,
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