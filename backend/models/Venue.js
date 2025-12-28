import mongoose from mongoose;

const venueSchema = new mongoose.Schema({
    name: {type: String, required: true},
    capacity: {type: String, required: true},
    type: {type: String, enum: ["Laboratory", "Lecture Hall"], default: "Lecture Hall"},
    resources: [String]
});

export default mongoose.model("Venue", venueSchema);