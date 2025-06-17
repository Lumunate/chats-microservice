import express from "express";
import { MessageController } from "../controllers";

const router = express.Router();

// Send a message
router.post("/", (req, res) => MessageController.sendMessage(req, res));

// Get messages from a chat
router.get("/", (req, res) => MessageController.getChatMessages(req, res));

// Mark a message as read
router.post("/:messageId/read", (req, res) =>
  MessageController.markAsRead(req, res)
);

// Add attachments to a message
router.post("/:messageId/attachments", (req, res) =>
  MessageController.addAttachments(req, res)
);

export default router;
