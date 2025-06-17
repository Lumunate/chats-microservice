import express from "express";
import { ChatController } from "../controllers";

const router = express.Router();

// Create a direct chat
router.post("/direct", (req, res) => ChatController.createDirectChat(req, res));

// Create a group chat
router.post("/group", (req, res) => ChatController.createGroupChat(req, res));

// Get all chats for the current user
router.get("/", (req, res) => ChatController.getUserChats(req, res));

// Add a user to a chat
router.post("/:chatId/users", (req, res) =>
  ChatController.addUserToChat(req, res)
);

// Remove a user from a chat
router.delete("/:chatId/users/:userId", (req, res) =>
  ChatController.removeUserFromChat(req, res)
);

// Update chat metadata
router.patch("/:chatId/metadata", (req, res) =>
  ChatController.updateChatMetadata(req, res)
);

export default router;
