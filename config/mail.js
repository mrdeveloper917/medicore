// Load configuration here as well as in server.js so this module remains
// correct when it is imported by a worker, test, or standalone script.
require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({

    host: process.env.EMAIL_HOST || process.env.MAIL_HOST,

    port: Number(process.env.EMAIL_PORT || process.env.MAIL_PORT || 587),

    secure: (process.env.MAIL_SECURE || "false") === "true",

    // Keep certificate verification enabled by default. Some local networks
    // intercept SMTP TLS; those environments can explicitly opt out via .env.
    tls: {
        rejectUnauthorized: process.env.MAIL_TLS_REJECT_UNAUTHORIZED !== "false"
    },

    auth: {

        user: process.env.EMAIL_USER || process.env.MAIL_USER,

        pass: process.env.EMAIL_PASS || process.env.MAIL_PASS

    }

});

module.exports = transporter;
