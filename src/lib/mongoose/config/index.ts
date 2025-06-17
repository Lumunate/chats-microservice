import mongoose from "mongoose";
import { DatabaseConfig } from "../interfaces";

export const getDatabaseConfig = (): DatabaseConfig => {
  const url =
    process.env.DATABASE_URL || "mongodb://localhost:27017/chat_service";

  const options: mongoose.ConnectOptions = {
    // Connection options
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferCommands: false, // Disable mongoose buffering

    // Additional options for production
    ...(process.env.NODE_ENV === "production" && {
      retryWrites: true,
      w: "majority",
      readPreference: "primary",
    }),
  };

  return { url, options };
};
