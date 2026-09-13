const crypto = require("crypto");
const AadhaarProvider = require("./AadhaarProvider");

// UI/demo-only flow. It is deliberately not Aadhaar authentication and is
// blocked unless an administrator explicitly enables development demo mode.
module.exports = class AadhaarDevelopmentDemoProvider extends AadhaarProvider {
  async startAuthentication({ consent, callbackUrl }) {
    if (process.env.NODE_ENV === "production" || process.env.IDENTITY_DEMO_MODE !== "true") return { ok: false, code: "PROVIDER_NOT_CONFIGURED" };
    if (!consent) return { ok: false, code: "CONSENT_REQUIRED" };
    const transactionId = crypto.randomUUID();
    return { ok: true, transactionId, redirectUrl: `${callbackUrl}?transactionId=${encodeURIComponent(transactionId)}&demo=1` };
  }
  async completeAuthentication({ transactionId }) {
    if (process.env.NODE_ENV === "production" || process.env.IDENTITY_DEMO_MODE !== "true" || !transactionId) return { ok: false, code: "PROVIDER_NOT_CONFIGURED" };
    // UUID is an opaque demo reference; input Aadhaar is neither stored nor used.
    return { ok: true, aadhaarReferenceId: `demo-${crypto.randomUUID()}`, providerTransactionId: transactionId, demo: true };
  }
};
