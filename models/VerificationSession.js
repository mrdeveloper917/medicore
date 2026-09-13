const mongoose = require("mongoose");

const verificationSessionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  transactionId: { type: String, required: true, unique: true },
  provider: { type: String, required: true },
  status: { type: String, enum: ["in_progress", "verified", "failed", "expired"], default: "in_progress" },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  completedAt: Date
}, { timestamps: true });
module.exports = mongoose.model("VerificationSession", verificationSessionSchema);
