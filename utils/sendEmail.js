const resend = require("../config/mail");

const maskEmail = (email) => {
    const [local, domain] = String(email || "").split("@");

    return local && domain
        ? `${local.slice(0, 1)}***@${domain}`
        : "<invalid-email>";
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

        if (!process.env.RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is not configured");
        }

        if (!options.to) {
            throw new Error("Recipient email is required");
        }

        if (!process.env.EMAIL_FROM) {
            throw new Error("EMAIL_FROM is not configured");
        }

        console.log("[Email] Resend API called", {
            recipient: maskEmail(options.to),
            subject: options.subject
        });

        const { data, error } = await resend.emails.send({

            from: process.env.EMAIL_FROM,

            to: [options.to],

            subject: options.subject,

            text: options.text || "",

            html: options.html || ""

        });

        if (error) {

            console.error("[Email] RESEND FAILED", {
                recipient: maskEmail(options.to),
                message: error.message || "Resend API error"
            });

            throw new Error(
                error.message || "Resend email sending failed"
            );
        }

        console.log("[Email] EMAIL SENT", {
            recipient: maskEmail(options.to),
            messageId: data?.id || null
        });

        console.log("====================================");
        console.log("✅ Email Sent Successfully");
        console.log("Message ID:", data?.id || "N/A");
        console.log("====================================");

        return data;

    } catch (error) {

        console.error("[Email] EMAIL FAILED", {

            recipient: maskEmail(options.to),

            message: error.message || "Unknown email error"

        });

        console.log("====================================");
        console.log("❌ Email Sending Failed");
        console.log(error.message);
        console.log("====================================");

        throw error;
    }
};

module.exports = sendEmail;