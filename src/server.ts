import { createServer } from "http";
import database from "./lib/mongoose";
import { ChatSocket } from "./lib/sockets";
import { getAuthAdapter } from "./lib/auth";
import { app } from "./app";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to database
    await database.connect();

    // Create HTTP server
    const server = createServer(app);

    const authAdapter = getAuthAdapter();
    const websocketService = new ChatSocket(server, authAdapter);

    // Start listening
    server.listen(PORT, () => {
      console.log(`🚀 Chat service running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔐 Auth provider: ${process.env.AUTH_PROVIDER || "jwt"}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log("\n🔄 Shutting down gracefully...");

      server.close(() => {
        console.log("✅ HTTP server closed");
      });

      await database.disconnect();
      console.log("✅ Database disconnected");

      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
