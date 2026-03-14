const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        console.warn("MongoDB is completely unreachable. Continuing in detached/memory mode for UI demonstration...");
    }
};

module.exports = connectDB;
