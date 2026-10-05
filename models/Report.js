import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: {
    type: String,
    required: [true, "Please provide a report name"],
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      "Lab Report",
      "X-Ray",
      "MRI",
      "CT Scan",
      "Ultrasound",
      "ECG",
      "Prescription",
      "Other"
    ]
  },
  date: {
    type: Date,
    required: [true, "Please provide report date"]
  },
  fileUrl: {
    type: String,
    required: true
  },
  cloudinaryId: {
    type: String
  },
  aiAnalysis: {
    summaryEnglish: String,
    summaryUrdu: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    urgency: {
      type: String,
      enum: ['routine', 'soon', 'urgent']
    },
    abnormalValues: [String],
    normalValues: [String],
    doctorQuestions: [String],
    foodsToEat: [String],
    foodsToAvoid: [String],
    homeRemedies: [String],
    recommendations: [String],
    analyzedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Report = mongoose.model("Report", ReportSchema);
export default Report;