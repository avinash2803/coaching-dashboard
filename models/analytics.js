import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({

  year: String,

  totalStudents: Number,

  activeStudents: Number,

  dropoutStudents: Number,

  employedStudents: Number,

  qualifiedStudents: Number,

  hybridStudents: Number,

  averageAttendance: Number,

  attendance: {

    cgpsc: {

      June: Number,
      July: Number,
      August: Number,
      September: Number,
      October: Number,
      November: Number,
      December: Number,
      January: Number,
      February: Number,
      March: Number,
      April: Number,
      May: Number

    },

    vyapam: {

      June: Number,
      July: Number,
      August: Number,
      September: Number,
      October: Number,
      November: Number,
      December: Number,
      January: Number,
      February: Number,
      March: Number,
      April: Number,
      May: Number

    }

  }

});

export default mongoose.model(
  "Analytics",
  analyticsSchema
);