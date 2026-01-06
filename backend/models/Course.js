import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  expectedStudents: { type: Number, default: 1 },
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  duration: { type: Number, default: 1 },
  requiredResources: { type: [String], default: [] },
});

export default mongoose.model("Course", courseSchema);
