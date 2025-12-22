import mongoose from mongoose;

const venueSchema = new mongoose.Schema({
    name: String,
    capacity: Number,
    type: String
});

export default mongoose.model("Venue", venueSchema);