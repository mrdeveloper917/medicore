const Sandbox = require("./AadhaarSandboxProvider");
const Production = require("./AadhaarProductionProvider");
const Demo = require("./AadhaarDevelopmentDemoProvider");
exports.getAadhaarProvider = () => {
  if (process.env.AADHAAR_PROVIDER === "demo" && process.env.IDENTITY_DEMO_MODE === "true" && process.env.NODE_ENV !== "production") return new Demo();
  return process.env.AADHAAR_ENV === "production" ? new Production() : new Sandbox();
};
