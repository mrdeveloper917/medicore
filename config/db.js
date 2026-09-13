const dns = require('dns');
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (process.env.MONGO_URL?.startsWith('mongodb+srv://')) {
            dns.setServers(['8.8.8.8', '8.8.4.4']);
            console.log('🔧 Using public DNS servers for MongoDB SRV resolution');
        }

        await mongoose.connect(process.env.MONGO_URL);
        console.log("✅ MongoDB Connected Successfully");
    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
        process.exit(1);
    }
};

module.exports = connectDB;