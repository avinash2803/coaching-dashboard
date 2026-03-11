import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({

username: String,

password: String,

role: {
type: String,
enum: ["admin","student"]
},

studentId: {
type: mongoose.Schema.Types.ObjectId,
ref: "Student"
}

});

export default mongoose.model("User", UserSchema);