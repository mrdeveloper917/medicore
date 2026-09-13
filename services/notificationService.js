const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendNotificationEmail } = require("./emailService");

const maskEmail = email => {
    const [local, domain] = String(email || "").split("@");
    return local && domain ? `${local.slice(0, 1)}***@${domain}` : "<invalid-email>";
};

const publicNotification = notification => ({
    _id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    isRead: notification.isRead,
    createdAt: notification.createdAt
});

exports.notify = async ({ app, user, type, title, message, link = "", eventKey, emailDetails = [] }) => {
    try {
        let notification;
        try {
            notification = await Notification.create({ user, type, title, message, link, eventKey });
        } catch (error) {
            if (error && error.code === 11000 && eventKey) return null;
            throw error;
        }
        console.log("[Notification] Created", { notificationId: String(notification._id), targetUserId: String(user), type });
        const payload = publicNotification(notification);
        try {
            const io = app && app.get("io");
            if (io) {
                io.to(`user:${user}`).emit("notification:new", payload);
                console.log("[Notification] Socket.IO emitted", { targetUserId: String(user), event: "notification:new" });
            }
        } catch (error) {
            console.error("Socket.IO Error:", error.message);
        }
        try {
            const recipient = await User.findById(user).select("email").lean();
            if (recipient && recipient.email) {
                console.log("[Notification] Target User.email fetched", { targetUserId: String(user), recipient: maskEmail(recipient.email) });
                console.log("[Notification] Calling emailService", { targetUserId: String(user), recipient: maskEmail(recipient.email) });
                await sendNotificationEmail({ to: recipient.email, title, message, link, details: emailDetails });
            } else {
                console.warn("[Notification] Target user has no deliverable User.email", { targetUserId: String(user) });
            }
        } catch (error) {
            console.error("Email Error:", error.message);
        }
        return notification;
    } catch (error) {
        console.error("Notification Error:", error.message);
        return null;
    }
};
