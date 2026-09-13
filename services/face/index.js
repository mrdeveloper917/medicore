const HttpFaceAuthenticationProvider = require("./HttpFaceAuthenticationProvider");
const DemoFaceProvider = require("./FaceDevelopmentDemoProvider");
exports.getFaceProvider = () => process.env.FACE_AUTH_PROVIDER === "demo" && process.env.IDENTITY_DEMO_MODE === "true" && process.env.NODE_ENV !== "production" ? new DemoFaceProvider() : new HttpFaceAuthenticationProvider();
