import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema({

    studentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Student",
        required:true
    },

    // OLD FIELD (Keep until migration is complete)
    examQualified:{
        type:String,
        default:""
    },

    // NEW FIELD
    type:{
        type:String,
        enum:["EMPLOYMENT","QUALIFICATION"],
        default:null
    },

    category:{
        type:String,
        default:""
    },

    year:{
        type:String,
        required:true
    }

},{
    timestamps:true
});

export default mongoose.model("Achievement", achievementSchema);