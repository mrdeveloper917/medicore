const crypto = require("crypto");
const IdentityAuditLog = require("../models/IdentityAuditLog");

exports.auditIdentityEvent = async (req, event) => {
  try {
    const ip = req.ip || req.socket?.remoteAddress || "";
    await IdentityAuditLog.create({
      ...event,
      ipHash: crypto.createHash("sha256").update(ip).digest("hex"),
      userAgent: String(req.get("user-agent") || "").slice(0, 300)
    });
  } catch (_) {
    // Audit availability must not disclose identity data or break a patient flow.
  }
};
