const HttpAadhaarProvider = require("./HttpAadhaarProvider");
module.exports = class AadhaarSandboxProvider extends HttpAadhaarProvider { constructor() { super({ environment: "sandbox" }); } };
