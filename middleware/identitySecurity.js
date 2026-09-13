const crypto = require("crypto");
const REGISTER_CSRF_COOKIE = "register_csrf";
const isProduction = () => process.env.NODE_ENV === "production";

const safeEqual = (left, right) => {
  if (!left || !right || left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
};

// Registration happens before a user has an authenticated session. Keep its
// CSRF token in a same-site cookie so server restarts cannot invalidate a form
// that is already open in the browser. The submitted token must still match
// the browser-only cookie (double-submit cookie protection).
exports.registrationCsrfToken = (req, res) => {
  let token = String(req.cookies?.[REGISTER_CSRF_COOKIE] || "");
  if (token.length !== 64) {
    token = crypto.randomBytes(32).toString("hex");
    res.cookie(REGISTER_CSRF_COOKIE, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: isProduction(),
      maxAge: 60 * 60 * 1000,
      path: "/",
    });
  }
  return token;
};

exports.verifyRegistrationCsrf = (req, res, next) => {
  const submitted = String(req.body.csrfToken || "");
  const cookieToken = String(req.cookies?.[REGISTER_CSRF_COOKIE] || "");
  if (!safeEqual(submitted, cookieToken)) {
    return res.redirect(303, "/register?csrf=expired");
  }
  next();
};

exports.identityRateLimit = (() => {
  const attempts = new Map();
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const current = attempts.get(key) || { count: 0, startedAt: now };
    if (now - current.startedAt > 15 * 60 * 1000) Object.assign(current, { count: 0, startedAt: now });
    current.count += 1;
    attempts.set(key, current);
    if (current.count > 5) return res.status(429).render("auth/register", { errors: [], message: "Too many identity attempts. Please wait and try again.", csrfToken: undefined });
    next();
  };
})();

exports.csrfToken = (req) => {
  if (!req.session.identityCsrf) req.session.identityCsrf = crypto.randomBytes(32).toString("hex");
  return req.session.identityCsrf;
};

exports.verifyIdentityCsrf = (req, res, next) => {
  const supplied = String(req.body.csrfToken || "");
  if (!safeEqual(supplied, String(req.session.identityCsrf || ""))) {
    return res.status(403).send("Your verification session has expired. Please start again.");
  }
  next();
};
