const User = require("../models/User");

// Must run after `protect` and patient-role authorization. Re-read the status
// from MongoDB for every protected request so a stale request object, altered
// browser value, or old session can never unlock medical information.
module.exports = async (req, res, next) => {
  let patient;
  try {
    patient = await User.findById(req.user?._id).select("identityVerified identityVerificationStatus faceVerificationStatus");
  } catch (_) {
    return res.status(503).send("Unable to verify access at this time.");
  }

  const verified = patient?.identityVerified === true &&
    patient.identityVerificationStatus === "verified" &&
    patient.faceVerificationStatus === "verified" &&
    req.session?.identitySessionVerified === true &&
    String(req.session?.identitySessionUserId || "") === String(req.user?._id || "");
  if (verified) return next();

  const wantsJson = req.xhr || String(req.get("accept") || "").includes("application/json");
  if (wantsJson) {
    return res.status(403).json({
      success: false,
      code: "IDENTITY_VERIFICATION_REQUIRED",
      message: "Identity verification is required to access protected medical information."
    });
  }
  return res.redirect("/patient/dashboard?identityRequired=1");
};
