import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  code: String,
  title: String,
  expectedStudents: Number,
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.model("Course", courseSchema);
