import mongoose from "mongoose";

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: String, required: true },
  type: {
    type: String,
    enum: ["Lab", "Lecture Hall"],
    default: "Lecture Hall",
  },
  resources: { type: [String], default: [] },
});

export default mongoose.model("Venue", venueSchema);
