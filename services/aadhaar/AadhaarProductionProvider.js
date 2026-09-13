const HttpAadhaarProvider = require("./HttpAadhaarProvider");
module.exports = class AadhaarProductionProvider extends HttpAadhaarProvider { constructor() { super({ environment: "production" }); } };
