const sendEmail = require("../utils/sendEmail");

const maskEmail = email => {
    const [local, domain] = String(email || "").split("@");
    return local && domain ? `${local.slice(0, 1)}***@${domain}` : "<invalid-email>";
};

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

exports.sendNotificationEmail = async ({ to, title, message, link, details = [] }) => {
    if (!to || !(process.env.EMAIL_HOST || process.env.MAIL_HOST)) {
        console.warn("[Email] Skipped: recipient or SMTP host is unavailable");
        return;
    }
    console.log("[Email] emailService called", { recipient: maskEmail(to), title });
    const appUrl = (process.env.APP_URL || "http://localhost:5000").replace(/\/$/, "");
    const actionUrl = link ? `${appUrl}${link}` : appUrl;
    const safeDetails = details.filter(detail => detail && detail.label && detail.value);
    const detailHtml = safeDetails.map(detail => `<p style="margin:6px 0;color:#455;">${escapeHtml(detail.label)}: <strong>${escapeHtml(detail.value)}</strong></p>`).join("");
    await sendEmail({
        to,
        subject: `MediCore: ${title}`,
        text: `${title}\n\n${message}\n\nOpen MediCore: ${actionUrl}`,
        html: `<!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#1d2939;"><div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5eaf1;"><div style="padding:24px;background:#0f766e;color:#fff;font-size:24px;font-weight:bold;">MediCore</div><div style="padding:28px;"><h1 style="font-size:22px;margin-top:0;">${escapeHtml(title)}</h1><p style="line-height:1.6;">${escapeHtml(message)}</p>${detailHtml}<a href="${escapeHtml(actionUrl)}" style="display:inline-block;margin-top:18px;padding:12px 18px;background:#0f766e;color:#fff;text-decoration:none;border-radius:6px;">View in MediCore</a></div><div style="padding:18px 28px;background:#f8fafc;color:#667085;font-size:12px;">This is an automated message from MediCore. Please sign in to view private medical information.</div></div></body></html>`
    });
};
