const FaceAuthenticationProvider = require("./FaceAuthenticationProvider");
module.exports = class HttpFaceAuthenticationProvider extends FaceAuthenticationProvider {
  async verify({ video, patientReferenceId }) {
    const url = process.env.FACE_AUTH_VERIFY_URL;
    const clientId = process.env.FACE_AUTH_CLIENT_ID;
    if (!url || !clientId) return { ok: false, code: "PROVIDER_NOT_CONFIGURED" };
    // The authorized provider is responsible for face detection, single-face
    // checks, liveness and matching. MediCore never retains the clip.
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", "x-client-id": clientId }, body: JSON.stringify({ video, patientReferenceId }), signal: AbortSignal.timeout(15000) });
    if (!response.ok) return { ok: false, code: "PROVIDER_UNAVAILABLE" };
    const body = await response.json();
    return body.verified ? { ok: true, transactionId: body.transactionId } : { ok: false, code: body.code || "VERIFICATION_FAILED" };
  }
};
