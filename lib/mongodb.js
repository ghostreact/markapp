import mongoose from "mongoose";


export default async function mongoConnect() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        await mongoose.connection.syncIndexes();
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}