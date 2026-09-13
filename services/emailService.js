const sendEmail = require("../utils/sendEmail");

const maskEmail = (email) => {
    const [local, domain] = String(email || "").split("@");

    return local && domain
        ? `${local.slice(0, 1)}***@${domain}`
        : "<invalid-email>";
};

const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));


exports.sendNotificationEmail = async ({
    to,
    title,
    message,
    link,
    details = []
}) => {

    // --------------------------------------------
    // Validate email configuration
    // --------------------------------------------

    if (!to) {
        console.warn("[Email] Skipped: recipient unavailable");
        return;
    }

    if (!process.env.RESEND_API_KEY) {
        console.error("[Email] RESEND_API_KEY is not configured");
        return;
    }

    if (!process.env.EMAIL_FROM) {
        console.error("[Email] EMAIL_FROM is not configured");
        return;
    }


    // --------------------------------------------
    // Log email request
    // --------------------------------------------

    console.log("[Email] emailService called", {
        recipient: maskEmail(to),
        title
    });


    // --------------------------------------------
    // MediCore URL
    // --------------------------------------------

    const appUrl = (
        process.env.APP_URL ||
        "http://localhost:5000"
    ).replace(/\/$/, "");

    const actionUrl = link
        ? `${appUrl}${link}`
        : appUrl;


    // --------------------------------------------
    // Email details
    // --------------------------------------------

    const safeDetails = details.filter(
        (detail) =>
            detail &&
            detail.label &&
            detail.value
    );

    const detailHtml = safeDetails
        .map(
            (detail) => `
                <p style="margin:6px 0;color:#455;">
                    ${escapeHtml(detail.label)}:
                    <strong>
                        ${escapeHtml(detail.value)}
                    </strong>
                </p>
            `
        )
        .join("");


    // --------------------------------------------
    // Send Email using Resend
    // --------------------------------------------

    await sendEmail({

        to,

        subject: `MediCore: ${title}`,

        text: `${title}

${message}

Open MediCore:
${actionUrl}`,

        html: `
<!doctype html>

<html>

<body style="
    margin:0;
    background:#f4f7fb;
    font-family:Arial,sans-serif;
    color:#1d2939;
">

<div style="
    max-width:600px;
    margin:24px auto;
    background:#fff;
    border-radius:12px;
    overflow:hidden;
    border:1px solid #e5eaf1;
">

    <!-- Header -->

    <div style="
        padding:24px;
        background:#0f766e;
        color:#fff;
        font-size:24px;
        font-weight:bold;
    ">
        MediCore
    </div>


    <!-- Content -->

    <div style="padding:28px;">

        <h1 style="
            font-size:22px;
            margin-top:0;
        ">
            ${escapeHtml(title)}
        </h1>

        <p style="
            line-height:1.6;
        ">
            ${escapeHtml(message)}
        </p>

        ${detailHtml}


        <!-- Button -->

        <a
            href="${escapeHtml(actionUrl)}"
            style="
                display:inline-block;
                margin-top:18px;
                padding:12px 18px;
                background:#0f766e;
                color:#fff;
                text-decoration:none;
                border-radius:6px;
            "
        >
            View in MediCore
        </a>

    </div>


    <!-- Footer -->

    <div style="
        padding:18px 28px;
        background:#f8fafc;
        color:#667085;
        font-size:12px;
    ">
        This is an automated message from MediCore.
        Please sign in to view private medical information.
    </div>

</div>

</body>

</html>
`
    });

};