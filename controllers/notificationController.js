const mongoose = require("mongoose");
const Notification = require("../models/Notification");

exports.list = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
        if (req.accepts(["json", "html"]) === "json") return res.json({ notifications });
        return res.render(`${req.user.role}/notifications`, { title: "Notifications", user: req.user, notifications });
    } catch (error) { console.error("Notification list error:", error.message); return res.status(500).json({ message: "Unable to load notifications" }); }
};
exports.unreadCount = async (req, res) => {
    try { return res.json({ count: await Notification.countDocuments({ user: req.user._id, isRead: false }) }); }
    catch (error) { console.error("Notification count error:", error.message); return res.status(500).json({ message: "Unable to load unread count" }); }
};
exports.markRead = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid notification id" });
    try { const result = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true }, { returnDocument: "after" }); if (!result) return res.status(404).json({ message: "Notification not found" }); return res.json({ success: true }); }
    catch (error) { console.error("Mark notification read error:", error.message); return res.status(500).json({ message: "Unable to update notification" }); }
};
exports.markAllRead = async (req, res) => {
    try { await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true }); return res.json({ success: true }); }
    catch (error) { console.error("Mark all notifications read error:", error.message); return res.status(500).json({ message: "Unable to update notifications" }); }
};
