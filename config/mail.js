// Load environment variables
require("dotenv").config();

const { Resend } = require("resend");

if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY is not configured");
}

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = resend;