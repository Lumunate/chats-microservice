import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";

import { IAuthAdapter } from "../auth";
import { ChatService, MessageService, UserPresenceService } from "../../services";

export class ChatSocket {
  private io: Server;
  private userSocketMap: Map<string, string> = new Map(); // userId -> socketId
  private socketUserMap: Map<string, string> = new Map(); // socketId -> userId

  constructor(
    server: HTTPServer,
    private authAdapter: IAuthAdapter
  ) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"],
      },
    });

    this.initializeSocketServer();
  }

  private initializeSocketServer(): void {
    this.io.use(async (socket, next) => {
      try {
        // Get token from handshake
        const token = socket.handshake.auth.token as string;
        if (!token) {
          return next(new Error("Authentication error"));
        }

        // Verify token
        const { userId, isValid } = await this.authAdapter.verifyToken(token);
        if (!isValid) {
          return next(new Error("Authentication error"));
        }

        // Store user connection
        socket.data.userId = userId;
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });

    this.io.on("connection", (socket: Socket) => {
      this.handleConnection(socket);

      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });

      socket.on("join-chat", (chatId: string) => {
        this.handleJoinChat(socket, chatId);
      });

      socket.on("leave-chat", (chatId: string) => {
        this.handleLeaveChat(socket, chatId);
      });

      socket.on(
        "send-message",
        async (data: { chatId: string; content: string; metadata?: any }) => {
          await this.handleSendMessage(socket, data);
        }
      );

      socket.on("typing", (chatId: string) => {
        this.handleTyping(socket, chatId);
      });

      socket.on("read-message", async (messageId: string) => {
        await this.handleReadMessage(socket, messageId);
      });
    });
  }

  private async handleConnection(socket: Socket): Promise<void> {
    try {
      const userId = socket.data.userId;

      // Map user to socket
      this.userSocketMap.set(userId, socket.id);
      this.socketUserMap.set(socket.id, userId);

      // Update user online status
      await UserPresenceService.setUserOnline(userId);

      // Get user chats and join their rooms
      const chats = await ChatService.getUserChats(userId);
      chats.forEach((chat) => {
        socket.join(`chat:${chat.id}`);
      });

      // Broadcast user online status to relevant users
      this.io.emit("user-status-changed", { userId, isOnline: true });

      console.log(`User ${userId} connected with socket ID ${socket.id}`);
    } catch (error) {
      console.error("Error handling connection:", error);
    }
  }

  private async handleDisconnect(socket: Socket): Promise<void> {
    try {
      const userId = this.socketUserMap.get(socket.id);
      if (!userId) return;

      // Remove mappings
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(socket.id);

      // Update user offline status
      await UserPresenceService.setUserOffline(userId);

      // Broadcast user offline status to relevant users
      this.io.emit("user-status-changed", { userId, isOnline: false });

      console.log(`User ${userId} disconnected`);
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  }

  private handleJoinChat(socket: Socket, chatId: string): void {
    try {
      socket.join(`chat:${chatId}`);
      console.log(`User ${socket.data.userId} joined chat ${chatId}`);
    } catch (error) {
      console.error("Error handling join chat:", error);
    }
  }

  private handleLeaveChat(socket: Socket, chatId: string): void {
    try {
      socket.leave(`chat:${chatId}`);
      console.log(`User ${socket.data.userId} left chat ${chatId}`);
    } catch (error) {
      console.error("Error handling leave chat:", error);
    }
  }

  private async handleSendMessage(
    socket: Socket,
    data: { chatId: string; content: string; metadata?: any }
  ): Promise<void> {
    try {
      const userId = socket.data.userId;
      const { chatId, content, metadata } = data;

      // Save message to database
      const message = await MessageService.sendMessage(
        chatId,
        userId,
        content,
        metadata
      );

      // Broadcast message to chat room
      this.io.to(`chat:${chatId}`).emit("new-message", message);

      console.log(`User ${userId} sent message to chat ${chatId}`);
    } catch (error) {
      console.error("Error handling send message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  }

  private handleTyping(socket: Socket, chatId: string): void {
    try {
      const userId = socket.data.userId;

      // Broadcast typing indicator to chat room (except sender)
      socket.to(`chat:${chatId}`).emit("user-typing", { userId, chatId });
    } catch (error) {
      console.error("Error handling typing:", error);
    }
  }

  private async handleReadMessage(
    socket: Socket,
    messageId: string
  ): Promise<void> {
    try {
      const userId = socket.data.userId;

      // Mark message as read in database
      await MessageService.readMessage(messageId, userId);

      // Get message details to determine which chat to broadcast to
      const message = await MessageService.getChatMessages(
        /* This would need to be refactored to get a single message by ID */
        /* For now, we're leaving this as a placeholder */
        messageId,
        userId,
        1,
        1
      );

      if (message.length > 0) {
        const chatId = message[0].chatId;

        // Broadcast read receipt to chat room
        this.io
          .to(`chat:${chatId}`)
          .emit("message-read", { messageId, userId, chatId });
      }
    } catch (error) {
      console.error("Error handling read message:", error);
      socket.emit("error", { message: "Failed to mark message as read" });
    }
  }

  // Utility methods for external use

  public notifyUserAdded(
    chatId: string,
    userId: string,
    addedBy: string
  ): void {
    this.io
      .to(`chat:${chatId}`)
      .emit("user-added", { chatId, userId, addedBy });

    // Join the user to the chat room if they're online
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(`chat:${chatId}`);
      }
    }
  }

  public notifyUserRemoved(
    chatId: string,
    userId: string,
    removedBy: string
  ): void {
    this.io
      .to(`chat:${chatId}`)
      .emit("user-removed", { chatId, userId, removedBy });

    // Remove the user from the chat room if they're online
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(`chat:${chatId}`);
      }
    }
  }

  public notifyMetadataUpdated(
    chatId: string,
    metadata: any,
    updatedBy: string
  ): void {
    this.io
      .to(`chat:${chatId}`)
      .emit("metadata-updated", { chatId, metadata, updatedBy });
  }
}
