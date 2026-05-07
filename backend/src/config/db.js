import mongoose from "mongoose";

/**
 * =====================================
 * CONNECT DATABASE
 * =====================================
 */
const connectDB = async () => {
  try {
    /**
     * ================= VALIDATE ENV =================
     */
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is not defined"
      );
    }

    /**
     * ================= CONNECT =================
     */
    await mongoose.connect(
      process.env.MONGO_URI,
      {
        autoIndex: false,

        serverSelectionTimeoutMS: 5000,

        socketTimeoutMS: 45000,
      }
    );

    /**
     * ================= SUCCESS LOG =================
     */
    console.log(
      "✅ MongoDB Connected"
    );

    /**
     * ================= CONNECTION EVENTS =================
     */
    mongoose.connection.on(
      "error",
      (err) => {
        console.error(
          "❌ MongoDB Runtime Error:",
          err.message
        );
      }
    );

    mongoose.connection.on(
      "disconnected",
      () => {
        console.warn(
          "⚠️ MongoDB Disconnected"
        );
      }
    );

    mongoose.connection.on(
      "reconnected",
      () => {
        console.log(
          "🔄 MongoDB Reconnected"
        );
      }
    );
  } catch (error) {
    /**
     * ================= SAFE ERROR LOG =================
     */
    console.error(
      "❌ MongoDB Connection Failed:",
      error.message
    );

    process.exit(1);
  }
};

export default connectDB;