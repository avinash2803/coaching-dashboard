import mongoose from "mongoose";

const achievementCategorySchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    type: {
        type: String,
        enum: ["EMPLOYMENT", "QUALIFICATION"],
        required: true
    },

    active: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

export default mongoose.model(
    "AchievementCategory",
    achievementCategorySchema
);