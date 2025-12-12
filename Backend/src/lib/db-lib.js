import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI missing in env. Exiting.");
  process.exit(1);
}

const conDb = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);

    console.log(`MongoDB connected: ${conn.connection.host}:${conn.connection.port}`);
    return conn;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});
mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

export default conDb;
