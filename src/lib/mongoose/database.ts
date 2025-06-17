import mongoose from "mongoose";
import { getDatabaseConfig } from "./config";

class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log("Database already connected");
      return;
    }

    try {
      const { url, options } = getDatabaseConfig();

      await mongoose.connect(url, options);

      this.isConnected = true;
      console.log("✅ Connected to MongoDB");

      // Set up event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error("❌ MongoDB connection error:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log("📤 Disconnected from MongoDB");
    } catch (error) {
      console.error("❌ MongoDB disconnection error:", error);
      throw error;
    }
  }

  public getConnection(): typeof mongoose {
    return mongoose;
  }

  public isConnectedToDatabase(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  private setupEventListeners(): void {
    mongoose.connection.on("connected", () => {
      console.log("🔗 Mongoose connected to MongoDB");
    });

    mongoose.connection.on("error", (error) => {
      console.error("❌ Mongoose connection error:", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("📤 Mongoose disconnected from MongoDB");
      this.isConnected = false;
    });

    // Handle application termination
    process.on("SIGINT", async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await this.disconnect();
      process.exit(0);
    });
  }
}

export { Database };

const database = Database.getInstance();
export default database;
