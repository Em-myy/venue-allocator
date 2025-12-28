import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue" },
  day: { type: String, required: true },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
});

export default mongoose.model("Timetable", timetableSchema);
