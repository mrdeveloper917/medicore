const transporter = require("../config/mail");

const maskEmail = email => {
    const [local, domain] = String(email || "").split("@");
    return local && domain ? `${local.slice(0, 1)}***@${domain}` : "<invalid-email>";
};

/**
 * Send Email Utility
 *
 * @param {Object} options
 * @param {String} options.to
 * @param {String} options.subject
 * @param {String} options.html
 * @param {String} options.text
 */

const sendEmail = async (options) => {

    try {

        const mailOptions = {

            from: process.env.EMAIL_FROM || process.env.MAIL_FROM,

            to: options.to,

            subject: options.subject,

            text: options.text || "",

            html: options.html

        };

        console.log("[Email] Nodemailer sendMail called", { recipient: maskEmail(options.to) });
        const info = await transporter.sendMail(mailOptions);
        console.log("[Email] EMAIL SENT", { recipient: maskEmail(options.to), messageId: info.messageId });

        console.log("====================================");
        console.log("✅ Email Sent Successfully");
        console.log("Message ID:", info.messageId);
        console.log("====================================");

        return info;

    } catch (error) {

        console.error("[Email] EMAIL FAILED", {
            recipient: maskEmail(options.to),
            code: error.code || null,
            message: error.message || "Unknown email error",
            responseCode: error.responseCode || null,
            command: error.command || null
        });

        console.log("====================================");
        console.log("❌ Email Sending Failed");
        console.log(error.message);
        console.log("====================================");

        throw error;

    }

};

module.exports = sendEmail;
