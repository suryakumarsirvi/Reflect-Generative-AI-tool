import mongoose from "mongoose";
import { CONFIG } from "./env.config.js";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(CONFIG.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
