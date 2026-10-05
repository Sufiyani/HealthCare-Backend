import mongoose from "mongoose";

const VitalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  bloodPressure: {
    type: String,
    match: [/^\d{2,3}\/\d{2,3}$/, "Format should be 120/80"]
  },
  bloodSugar: Number,
  weight: Number,
  temperature: Number,
  heartRate: Number,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Vital = mongoose.model("Vital", VitalSchema);
export default Vital;
