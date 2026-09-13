require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const app = require("./app");

const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// Connect Database

connectDB();

// Create Server

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CORS_ORIGIN || true, credentials: true } });
io.use((socket, next) => {
    try {
        const token = (socket.handshake.headers.cookie || "").split(";").map(value => value.trim()).find(value => value.startsWith("token="))?.slice(6);
        if (!token) return next(new Error("Unauthorized"));
        socket.userId = jwt.verify(token, process.env.JWT_SECRET).id;
        return next();
    } catch (_) { return next(new Error("Unauthorized")); }
});
io.on("connection", socket => socket.join(`user:${socket.userId}`));
app.set("io", io);

// Start Server

server.listen(PORT, () => {

    console.log("--------------------------------");

    console.log(`🚀 Server Running`);

    console.log(`🌍 http://localhost:${PORT}`);

    console.log("--------------------------------");

});
