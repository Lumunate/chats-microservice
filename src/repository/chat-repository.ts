import { Types } from "mongoose";
import NotFoundError from "../lib/handlers/errors/types/NotFoundError";
import { Chat, IChat } from "../models/chat";
import { IUserChat, UserChat } from "../models/user-chat";
import { ChatWithParticipants } from "../types/user";
import { findByChatId } from "./message-repository";

export async function create(
  name: string | null,
  isGroup: boolean,
  participantIds: string[],
  metadata?: Object
): Promise<IChat> {
  // Start a session for transaction
  const session = await Chat.startSession();

  try {
    return await session.withTransaction(async () => {
      // Create the chat
      const [chat] = await Chat.create(
        [
          {
            name,
            isGroup,
            metadata,
          },
        ],
        { session, ordered: true }
      );

      // Add all participants
      const userChatData = participantIds.map((userId, index) => ({
        userId,
        chatId: chat._id,
        isAdmin: isGroup && index === 0, // First user is admin for group chats
        userEmail: `${userId}@temp.com`, // This would be updated from auth token
        joinedAt: new Date(),
      }));

      await UserChat.create(userChatData, { session, ordered: true });

      return chat;
    });
  } finally {
    await session.endSession();
  }
}

export async function createWithCachedInfo(
  name: string | null,
  isGroup: boolean,
  participants: Array<{ userId: string; email?: string; isAdmin?: boolean }>
): Promise<IChat> {
  const session = await Chat.startSession();

  try {
    return await session.withTransaction(async () => {
      const [chat] = await Chat.create(
        [
          {
            name,
            isGroup,
          },
        ],
        { session }
      );

      const userChatData = participants.map((participant) => ({
        userId: participant.userId,
        chatId: chat._id,
        isAdmin: participant.isAdmin || false,
        userEmail: participant.email,
        joinedAt: new Date(),
      }));

      await UserChat.create(userChatData, { session });

      return chat;
    });
  } finally {
    await session.endSession();
  }
}

export async function findById(
  id: string
): Promise<ChatWithParticipants | null> {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  const chat = await Chat.findById(id).lean();
  if (!chat) {
    return null;
  }

  const participants = await UserChat.find({ chatId: new Types.ObjectId(id) })
    .lean()
    .exec();

  const result = {
    ...chat,
    participants: participants.map((p) => ({
      ...p,
      user: {
        id: p.userId,
        username: p.userEmail?.split("@")[0] || p.userId,
        email: p.userEmail || "",
        isOnline: false, // This would be fetched from UserPresence if needed
        lastOnline: null,
      },
    })),
  };

  return result as unknown as ChatWithParticipants;
}

export async function findDirectChat(
  userIds: [string, string]
): Promise<IChat | null> {
  // Find chats where both users are participants and it's not a group chat
  const chats = await Chat.aggregate([
    {
      $match: { isGroup: false },
    },
    {
      $lookup: {
        from: "user_chats",
        localField: "_id",
        foreignField: "chatId",
        as: "participants",
      },
    },
    {
      $match: {
        "participants.userId": { $all: userIds },
        participants: { $size: 2 },
      },
    },
    {
      $limit: 1,
    },
  ]);

  return chats.length > 0 ? chats[0] : null;
}

export async function findUserChats(
  userId: string
): Promise<ChatWithParticipants[]> {
  const userChats = await UserChat.find({ userId })
    .populate({
      path: "chatId",
      model: "Chat",
    })
    .lean()
    .exec();

  const chatsWithParticipants = await Promise.all(
    userChats.map(async (userChat) => {
      const chat = userChat.chatId as unknown as IChat;

      const [allParticipants, messages] = await Promise.all([
       UserChat.find({ chatId: chat._id }).lean(),
       findByChatId(chat._id.toString(), 10, 0),
    ]);

    const unreadCount = messages?.filter((msg) => !msg.readBy?.some((r) => r.userId === userId))?.length || 0;

      return {
        _id: chat._id,
        name: chat.name,
        isGroup: chat.isGroup,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        lastMessage: chat.lastMessage,
        lastMessageBody: messages[0]?.content,
        unreadCount,
        metadata: chat.metadata,
        participants: allParticipants.map((p) => ({
          _id: p._id,
          userId: p.userId,
          chatId: p.chatId,
          isAdmin: p.isAdmin,
          userEmail: p.userEmail,
          joinedAt: p.joinedAt,
          user: {
            id: p.userId,
            username: p.userEmail?.split("@")[0] || p.userId,
            email: p.userEmail || "",
            isOnline: false,
            lastOnline: null,
          },
        })),
      } as ChatWithParticipants;
    })
  );

  // Sort by lastMessage or createdAt
  return chatsWithParticipants.sort((a, b) => {
    const aTime = a.lastMessage || a.createdAt;
    const bTime = b.lastMessage || b.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

export async function addParticipant(
  chatId: string,
  userId: string,
  isAdmin = false
): Promise<IUserChat> {
  if (!Types.ObjectId.isValid(chatId)) {
    throw new NotFoundError(`Invalid chat ID: ${chatId}`);
  }

  // Check if chat exists
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new NotFoundError(`Chat with ID ${chatId} not found`);
  }

  // Check if user is already in the chat
  const existingUserChat = await UserChat.findOne({
    userId,
    chatId: new Types.ObjectId(chatId),
  });

  if (existingUserChat) {
    throw new Error("User is already in this chat");
  }

  return await UserChat.create({
    userId,
    chatId: new Types.ObjectId(chatId),
    isAdmin,
    joinedAt: new Date(),
  });
}

export async function removeParticipant(
  chatId: string,
  userId: string
): Promise<void> {
  if (!Types.ObjectId.isValid(chatId)) {
    throw new NotFoundError(`Invalid chat ID: ${chatId}`);
  }

  const result = await UserChat.deleteOne({
    userId,
    chatId: new Types.ObjectId(chatId),
  });

  if (result.deletedCount === 0) {
    throw new NotFoundError(`User ${userId} not found in chat ${chatId}`);
  }
}

export async function updateLastMessage(chatId: string): Promise<IChat> {
  if (!Types.ObjectId.isValid(chatId)) {
    throw new NotFoundError(`Invalid chat ID: ${chatId}`);
  }

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    {
      lastMessage: new Date(),
      updatedAt: new Date(),
    },
    { new: true }
  );

  if (!chat) {
    throw new NotFoundError(`Chat with ID ${chatId} not found`);
  }

  return chat;
}

export async function updateMetadata(
  chatId: string,
  metadata: any
): Promise<IChat> {
  if (!Types.ObjectId.isValid(chatId)) {
    throw new NotFoundError(`Invalid chat ID: ${chatId}`);
  }

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { metadata },
    { new: true }
  );

  if (!chat) {
    throw new NotFoundError(`Chat with ID ${chatId} not found`);
  }

  return chat;
}
