import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import database from "./lib/mongoose";

import { ChatRoutes, MessageRoutes } from "./routes";
import handleErrors from "./lib/handlers/errors";
import dotenv from 'dotenv';
dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: database.isConnectedToDatabase() ? "connected" : "disconnected",
  });
});

// ============================== ROUTES ==============================

app.use("/api/chats", ChatRoutes);
app.use("/api/messages", MessageRoutes);

// =====================================================================

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    return handleErrors(err, res);
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

export { app };
