const AadhaarProvider = require("./AadhaarProvider");

// Adapter boundary for an authorized AUA/KUA/Sub-AUA provider only. It does not
// construct UIDAI PID/XML locally and it never writes identity inputs to disk.
class HttpAadhaarProvider extends AadhaarProvider {
  constructor({ environment }) { super(); this.environment = environment; }
  config() {
    const prefix = this.environment === "production" ? "AADHAAR_PRODUCTION" : "AADHAAR_SANDBOX";
    return {
      startUrl: process.env[`${prefix}_AUTH_START_URL`] || (this.environment === "sandbox" ? process.env.AADHAAR_AUTH_URL : undefined),
      callbackUrl: process.env[`${prefix}_AUTH_CALLBACK_URL`] || (this.environment === "sandbox" ? process.env.AADHAAR_CALLBACK_URL : undefined),
      clientId: process.env[`${prefix}_CLIENT_ID`] || (this.environment === "sandbox" ? process.env.AADHAAR_CLIENT_ID : undefined)
    };
  }
  async startAuthentication({ aadhaar, consent, callbackUrl }) {
    if (!consent) return { ok: false, code: "CONSENT_REQUIRED" };
    const cfg = this.config();
    if (!cfg.startUrl || !cfg.clientId) return { ok: false, code: "PROVIDER_NOT_CONFIGURED" };
    const response = await fetch(cfg.startUrl, { method: "POST", headers: { "content-type": "application/json", "x-client-id": cfg.clientId }, body: JSON.stringify({ aadhaar, consent: true, callbackUrl }), signal: AbortSignal.timeout(15000) });
    if (!response.ok) return { ok: false, code: response.status === 429 ? "RATE_LIMITED" : "PROVIDER_UNAVAILABLE" };
    const body = await response.json();
    return body.transactionId && body.redirectUrl ? { ok: true, transactionId: body.transactionId, redirectUrl: body.redirectUrl } : { ok: false, code: "INVALID_PROVIDER_RESPONSE" };
  }
  async completeAuthentication({ transactionId, callbackPayload }) {
    const cfg = this.config();
    if (!cfg.callbackUrl || !cfg.clientId) return { ok: false, code: "PROVIDER_NOT_CONFIGURED" };
    const response = await fetch(cfg.callbackUrl, { method: "POST", headers: { "content-type": "application/json", "x-client-id": cfg.clientId }, body: JSON.stringify({ transactionId, callbackPayload }), signal: AbortSignal.timeout(15000) });
    if (!response.ok) return { ok: false, code: "PROVIDER_UNAVAILABLE" };
    const body = await response.json();
    // Provider must return a non-reversible vault/reference key, never a raw Aadhaar number.
    return body.verified && body.aadhaarReferenceId ? { ok: true, aadhaarReferenceId: body.aadhaarReferenceId, providerTransactionId: body.transactionId || transactionId } : { ok: false, code: "VERIFICATION_FAILED" };
  }
}
module.exports = HttpAadhaarProvider;
