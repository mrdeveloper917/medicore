const { validationResult } = require("express-validator");
const User = require("../models/User");
const VerificationSession = require("../models/VerificationSession");
const generateToken = require("../utils/generateToken");
const { getAadhaarProvider } = require("../services/aadhaar");
const { getFaceProvider } = require("../services/face");
const { auditIdentityEvent } = require("../utils/identityAudit");
const { csrfToken, registrationCsrfToken } = require("../middleware/identitySecurity");

const TWELVE_DIGITS = /^\d{12}$/;
const cleanAadhaar = (value) => String(value || "").replace(/[\s-]/g, "");
const callbackUrl = (req) => `${req.protocol}://${req.get("host")}/identity/aadhaar/callback`;
const messageFor = (code) => ({ CONSENT_REQUIRED: "Consent is required to continue.", PROVIDER_NOT_CONFIGURED: "Identity verification is temporarily unavailable. Your account and appointments remain available; please try again later.", PROVIDER_UNAVAILABLE: "Identity provider is temporarily unavailable. Please try again later.", RATE_LIMITED: "Too many attempts. Please wait before trying again.", INVALID_PROVIDER_RESPONSE: "The identity provider returned an invalid response.", VERIFICATION_FAILED: "Identity verification failed. Please try again." }[code] || "We could not complete identity verification.");
const isDemoMode = () => process.env.IDENTITY_DEMO_MODE === "true" && process.env.NODE_ENV !== "production";
const identityViewData = (req, message = null) => ({
  title: "Verify your identity",
  user: req.user,
  csrfToken: csrfToken(req),
  demoMode: isDemoMode(),
  sessionVerified: req.session?.identitySessionVerified === true && String(req.session?.identitySessionUserId || "") === String(req.user?._id || ""),
  message
});

exports.registrationPage = (req, res) => res.render("auth/register", {
  title: "Register",
  errors: [],
  message: req.query.csrf === "expired" ? "Your form session was refreshed. Please submit again." : null,
  csrfToken: registrationCsrfToken(req, res),
});

exports.startRegistration = async (req, res) => {
  const validation = validationResult(req);
  if (!validation.isEmpty()) return res.status(400).render("auth/register", { errors: validation.array(), message: null, csrfToken: registrationCsrfToken(req, res) });
  if (req.body.password !== req.body.confirmPassword) return res.status(400).render("auth/register", { errors: [], message: "Passwords do not match.", csrfToken: registrationCsrfToken(req, res) });
  try {
    if (await User.exists({ $or: [{ email: req.body.email?.toLowerCase() }, { phone: req.body.phone }] })) return res.status(409).render("auth/register", { errors: [], message: "An account with this email or phone already exists.", csrfToken: registrationCsrfToken(req, res) });
    const user = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email?.toLowerCase(),
      phone: req.body.phone,
      password: req.body.password,
      gender: req.body.gender,
      role: "patient",
      dob: req.body.dob || undefined,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      profileImage: req.file ? `/images/patients/${req.file.filename}` : undefined,
      identityVerificationStatus: "pending",
      faceVerificationStatus: "not_started",
    });
    res.clearCookie("register_csrf", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/" });
    if (req.body.startIdentityVerification === "yes") {
      res.cookie("token", generateToken(user._id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.redirect("/patient/identity");
    }
    res.redirect("/login?registered=pending-verification");
  } catch (error) {
    // Do not silently swallow registration failures: surface safe validation
    // feedback to the user and retain the detailed cause in server logs.
    console.error("Registration failed", { name: error.name, code: error.code, message: error.message });
    const message = error?.code === 11000
      ? "An account with this email or phone already exists."
      : error?.name === "ValidationError"
        ? Object.values(error.errors).map((item) => item.message).join(" ")
        : "We could not create your account. Please try again.";
    return res.status(error?.name === "ValidationError" || error?.code === 11000 ? 400 : 500)
      .render("auth/register", { errors: [], message, csrfToken: registrationCsrfToken(req, res) });
  }
};

exports.startIdentityVerification = async (req, res) => {
  const aadhaar = cleanAadhaar(req.body.aadhaarNumber);
  if (!TWELVE_DIGITS.test(aadhaar)) return res.status(400).render("patient/identity", identityViewData(req, "Enter a valid 12-digit Aadhaar number."));
  if (!req.body.identityConsent) return res.status(400).render("patient/identity", identityViewData(req, messageFor("CONSENT_REQUIRED")));
  try {
    const result = await getAadhaarProvider().startAuthentication({ aadhaar, consent: true, callbackUrl: callbackUrl(req) });
    if (!result.ok) return res.status(503).render("patient/identity", identityViewData(req, messageFor(result.code)));
    await VerificationSession.create({ patient: req.user._id, transactionId: result.transactionId, provider: process.env.AADHAAR_PROVIDER || "configured-provider", expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
    await User.findByIdAndUpdate(req.user._id, { identityVerificationStatus: "in_progress" });
    await auditIdentityEvent(req, { patient: req.user._id, actor: req.user._id, action: "IDENTITY_VERIFICATION_STARTED", success: true, provider: process.env.AADHAAR_PROVIDER || "configured-provider", transactionId: result.transactionId });
    res.redirect(result.redirectUrl);
  } catch (_) { res.status(503).render("patient/identity", identityViewData(req, "Identity verification could not be started. Please try again later.")); }
};

exports.completeRegistration = async (req, res) => {
  const transactionId = String(req.query.transactionId || req.body.transactionId || "");
  const session = await VerificationSession.findOne({ transactionId, status: "in_progress", expiresAt: { $gt: new Date() } });
  if (!session) return res.status(400).send("This verification session is no longer valid. Start again from Identity Verification.");
  try {
    const result = await getAadhaarProvider().completeAuthentication({ transactionId, callbackPayload: req.body });
    if (!result.ok) { await VerificationSession.findByIdAndUpdate(session._id, { status: "failed" }); await User.findByIdAndUpdate(session.patient, { identityVerificationStatus: "failed" }); await auditIdentityEvent(req, { patient: session.patient, action: "IDENTITY_VERIFICATION_FAILED", success: false, provider: session.provider, transactionId }); return res.redirect("/patient/identity?failed=1"); }
    const linked = await User.findOne({ aadhaarReferenceId: result.aadhaarReferenceId }).select("+aadhaarReferenceId");
    if (linked && String(linked._id) !== String(session.patient)) return res.redirect("/patient/identity?duplicate=1");
    await User.findByIdAndUpdate(session.patient, { aadhaarReferenceId: result.aadhaarReferenceId, identityVerified: true, identityVerifiedAt: new Date(), identityVerificationStatus: "verified", identityVerificationProvider: session.provider, faceVerificationStatus: "pending" });
    await VerificationSession.findByIdAndUpdate(session._id, { status: "verified", completedAt: new Date() });
    await auditIdentityEvent(req, { patient: session.patient, actor: session.patient, action: "IDENTITY_VERIFICATION_SUCCESS", success: true, provider: session.provider, transactionId: result.providerTransactionId });
    req.session.identityAadhaarVerified = true;
    req.session.identitySessionVerified = false;
    req.session.identitySessionUserId = String(session.patient);
    res.redirect("/patient/identity/face-verification");
  } catch (_) { res.redirect("/patient/identity?failed=1"); }
};

exports.identityPage = (req, res) => res.render("patient/identity", identityViewData(req, req.query.failed ? "Verification was not completed. You can try again." : req.query.duplicate ? "This verified identity is already linked to another account." : null));
exports.facePage = (req, res) => {
  if (req.session.identityAadhaarVerified !== true || String(req.session.identitySessionUserId || "") !== String(req.user._id)) return res.redirect("/patient/identity");
  res.render("patient/face-verification", { title: "Face verification", user: req.user, csrfToken: csrfToken(req), demoMode: isDemoMode() });
};
exports.verifyFace = async (req, res) => {
  const video = String(req.body.video || "");
  if (!/^data:video\/webm;base64,/.test(video) || video.length > 8_000_000) return res.status(413).json({ ok: false, message: "The recording is too large. Please retry with a shorter clip." });
  try {
    const identityUser = await User.findById(req.user._id).select("+aadhaarReferenceId");
    if (!identityUser?.aadhaarReferenceId) return res.status(400).json({ ok: false, message: "Identity verification must be completed before face verification." });
    await auditIdentityEvent(req, { patient: req.user._id, actor: req.user._id, action: "VIDEO_VERIFICATION_STARTED", success: true, provider: process.env.FACE_AUTH_PROVIDER || "configured-provider" });
    const result = await getFaceProvider().verify({ video, patientReferenceId: identityUser.aadhaarReferenceId });
    if (!result.ok) { await auditIdentityEvent(req, { patient: req.user._id, actor: req.user._id, action: "FACE_VERIFICATION_FAILED", success: false, provider: process.env.FACE_AUTH_PROVIDER || "configured-provider", transactionId: result.transactionId }); await auditIdentityEvent(req, { patient: req.user._id, actor: req.user._id, action: "VIDEO_VERIFICATION_FAILED", success: false, provider: process.env.FACE_AUTH_PROVIDER || "configured-provider", transactionId: result.transactionId }); return res.status(400).json({ ok: false, message: "Face verification failed. Please improve lighting and try again." }); }
    await User.findByIdAndUpdate(req.user._id, { faceVerificationStatus: "verified", faceVerifiedAt: new Date() });
    req.session.identitySessionVerified = true;
    req.session.identitySessionUserId = String(req.user._id);
    await auditIdentityEvent(req, { patient: req.user._id, actor: req.user._id, action: "VIDEO_VERIFICATION_SUCCESS", success: true, provider: process.env.FACE_AUTH_PROVIDER || "configured-provider", transactionId: result.transactionId });
    await auditIdentityEvent(req, { patient: req.user._id, actor: req.user._id, action: "FACE_VERIFICATION_SUCCESS", success: true, provider: process.env.FACE_AUTH_PROVIDER || "configured-provider", transactionId: result.transactionId });
    res.json({ ok: true, redirectUrl: "/patient/dashboard?identityVerified=1" });
  } catch (_) { res.status(503).json({ ok: false, message: "Face verification is temporarily unavailable. Please try again later." }); }
};
