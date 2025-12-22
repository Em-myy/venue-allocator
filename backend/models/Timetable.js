import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue" },
  day: String,
  time: String,
});

export default mongoose.model("Timetable", timetableSchema);
