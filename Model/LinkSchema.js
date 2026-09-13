 const mongoose = require("mongoose");

const CATEGORIES = [
  "IT", "Marketing", "Sales", "HR", "Finance", "Operations", "Other", "DevOps",
  "Design", "Legal", "Customer Support", "Product Management",
  "Business Development", "Data Science", "Quality Assurance",
  "Research and Development", "Public Relations", "Training and Development",
  "Procurement", "Logistics", "Administration", "Strategy and Planning",
  "Risk Management", "Compliance", "Investor Relations",
  "Corporate Communications", "Event Management", "Facilities Management",
  "Sustainability and CSR",
];

const MailSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  upvote: {
    type: Number,
    default: 0,
  },
  downvote: {
    type: Number,
    default: 0,
  },
  reports: {
    type: Number,
    default: 0,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  category: {
    type: String,
    enum: CATEGORIES,
    default: "Other",
  },
  AttendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  expiresAt: {
    type: Date,
    default: null,
  },
});

MailSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

 module.exports = mongoose.models.Mail || mongoose.model("Mail", MailSchema);
module.exports.CATEGORIES = CATEGORIES;