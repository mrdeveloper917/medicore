const mongoose = require("mongoose");

// Intentionally contains no Aadhaar number, PID, biometric payload, or image.
const identityAuditLogSchema = new mongoose.Schema
({
  patient: { type: mongoose.Schema.Types.ObjectId,
     ref: "User" },
  actor: { type: mongoose.Schema.Types.ObjectId,
     ref: "User" },
  action: {
    type: String, 
    required: true, 
    enum: [
      "IDENTITY_VERIFICATION_STARTED", 
      "IDENTITY_VERIFICATION_SUCCESS",
      "IDENTITY_VERIFICATION_FAILED", 
      "FACE_VERIFICATION_SUCCESS",
      "FACE_VERIFICATION_FAILED", 
      "VIDEO_VERIFICATION_STARTED",
      "VIDEO_VERIFICATION_SUCCESS",
      "VIDEO_VERIFICATION_FAILED",
      "MEDICAL_RECORD_ACCESS"
    ]
  },
  success: { type: Boolean, 
    required: true },
  provider: { type: String, 
    trim: true },
  transactionId: { type: String, 
    trim: true, maxlength: 200 },
  ipHash: { type: String, trim: true, 
    maxlength: 128 },
  userAgent: { type: String, 
    trim: true,
    maxlength: 300 }
}, { timestamps: true });

identityAuditLogSchema.index({ patient: 1, 
  createdAt: -1 });
module.exports = mongoose.model("IdentityAuditLog", identityAuditLogSchema);
