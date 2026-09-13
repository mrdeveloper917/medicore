const FaceAuthenticationProvider = require("./FaceAuthenticationProvider");

// UI/demo-only: validates a short browser-generated WebM payload, but performs
// no face matching, liveness, or Aadhaar authentication.
module.exports = class FaceDevelopmentDemoProvider extends FaceAuthenticationProvider {
  async verify({ video }) {
    if (process.env.NODE_ENV === "production" || process.env.IDENTITY_DEMO_MODE !== "true") return { ok: false, code: "PROVIDER_NOT_CONFIGURED" };
    return /^data:video\/webm;base64,/.test(String(video || "")) ? { ok: true, transactionId: `demo-video-${Date.now()}`, demo: true } : { ok: false, code: "INVALID_VIDEO" };
  }
};
