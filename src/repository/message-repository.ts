import { Types } from "mongoose";
import NotFoundError from "../lib/handlers/errors/types/NotFoundError";
import { Attachment, IAttachment } from "../models/attachment";
import { Chat } from "../models/chat";
import { IMessage, Message } from "../models/message";
import { IReadReceipt, ReadReceipt } from "../models/read-reciept";
import { MessageWithRelations } from "../types/message";

export async function create(
  chatId: string,
  senderId: string,
  content: string,
  metadata?: any
): Promise<IMessage> {
  if (!Types.ObjectId.isValid(chatId)) {
    throw new NotFoundError(`Invalid chat ID: ${chatId}`);
  }

  const session = await Message.startSession();

  try {
    return await session.withTransaction(async () => {
      // Create the message
      const [message] = await Message.create(
        [
          {
            chatId: new Types.ObjectId(chatId),
            senderId,
            content,
            metadata,
          },
        ],
        { session }
      );

      // Update the chat's lastMessage timestamp
      await Chat.findByIdAndUpdate(
        chatId,
        {
          lastMessage: new Date(),
          updatedAt: new Date(),
        },
        { session }
      );

      return message;
    });
  } finally {
    await session.endSession();
  }
}

export async function createWithCachedInfo(
  chatId: string,
  senderId: string,
  content: string,
  metadata?: any,
  senderEmail?: string
): Promise<IMessage> {
  if (!Types.ObjectId.isValid(chatId)) {
    throw new NotFoundError(`Invalid chat ID: ${chatId}`);
  }

  const session = await Message.startSession();

  try {
    return await session.withTransaction(async () => {
      const [message] = await Message.create(
        [
          {
            chatId: new Types.ObjectId(chatId),
            senderId,
            content,
            senderEmail,
            metadata,
          },
        ],
        { session }
      );

      await Chat.findByIdAndUpdate(
        chatId,
        {
          lastMessage: new Date(),
          updatedAt: new Date(),
        },
        { session }
      );

      return message;
    });
  } finally {
    await session.endSession();
  }
}

export async function findById(
  id: string
): Promise<MessageWithRelations | null> {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  const message = await Message.findById(id).lean();
  if (!message) {
    return null;
  }

  const [attachments, readBy] = await Promise.all([
    Attachment.find({ messageId: message._id }).lean(),
    ReadReceipt.find({ messageId: message._id }).lean(),
  ]);

  return {
    ...message,
    sender: {
      id: message.senderId,
      username: message.senderEmail?.split("@")[0] || message.senderId,
      email: message.senderEmail || "",
    },
    attachments,
    readBy,
  } as unknown as MessageWithRelations;
}

export async function findByChatId(
  chatId: string,
  limit: number,
  offset: number
): Promise<MessageWithRelations[]> {
  if (!Types.ObjectId.isValid(chatId)) {
    throw new NotFoundError(`Invalid chat ID: ${chatId}`);
  }

  const messages = await Message.find({ chatId: new Types.ObjectId(chatId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .lean()
    .exec();

  // Get attachments and read receipts for all messages
  const messageIds = messages.map((m) => m._id);
  const [attachments, readReceipts] = await Promise.all([
    Attachment.find({ messageId: { $in: messageIds } }).lean(),
    ReadReceipt.find({ messageId: { $in: messageIds } }).lean(),
  ]);

  // Group attachments and read receipts by messageId
  const attachmentsByMessage = new Map<string, IAttachment[]>();
  const readReceiptsByMessage = new Map<string, IReadReceipt[]>();

  attachments.forEach((attachment) => {
    const messageId = attachment.messageId.toString();
    if (!attachmentsByMessage.has(messageId)) {
      attachmentsByMessage.set(messageId, []);
    }
    attachmentsByMessage.get(messageId)!.push(attachment);
  });

  readReceipts.forEach((receipt) => {
    const messageId = receipt.messageId.toString();
    if (!readReceiptsByMessage.has(messageId)) {
      readReceiptsByMessage.set(messageId, []);
    }
    readReceiptsByMessage.get(messageId)!.push(receipt);
  });

  return messages.map(
    (message) =>
      ({
        ...message,
        sender: {
          id: message.senderId,
          username: message.senderEmail?.split("@")[0] || message.senderId,
          email: message.senderEmail || "",
        },
        attachments: attachmentsByMessage.get(message._id.toString()) || [],
        readBy: readReceiptsByMessage.get(message._id.toString()) || [],
      }) as unknown as MessageWithRelations
  );
}

export async function markAsRead(
  messageId: string,
  userId: string
): Promise<void> {
  if (!Types.ObjectId.isValid(messageId)) {
    throw new NotFoundError(`Invalid message ID: ${messageId}`);
  }

  // Check if message exists
  const message = await Message.findById(messageId);
  if (!message) {
    throw new NotFoundError(`Message with ID ${messageId} not found`);
  }

  // Create or update read receipt
  await ReadReceipt.findOneAndUpdate(
    {
      userId,
      messageId: new Types.ObjectId(messageId),
    },
    {
      userId,
      messageId: new Types.ObjectId(messageId),
      readAt: new Date(),
    },
    {
      upsert: true,
      new: true,
    }
  );
}

export async function addAttachment(
  messageId: string,
  attachment: { name: string; url: string; type: string; size: number }
): Promise<IAttachment> {
  if (!Types.ObjectId.isValid(messageId)) {
    throw new NotFoundError(`Invalid message ID: ${messageId}`);
  }

  // Check if message exists
  const message = await Message.findById(messageId);
  if (!message) {
    throw new NotFoundError(`Message with ID ${messageId} not found`);
  }

  return await Attachment.create({
    messageId: new Types.ObjectId(messageId),
    ...attachment,
  });
}
