// src/validators/messageValidator.ts
import { z } from "zod";
import { IAttachment } from "../models/attachment";
import { IMessage } from "../models/message";
import { IReadReceipt } from "../models/read-reciept";

export const sendMessageSchema = z.object({
  chatId: z.string().min(1, "Chat ID is required"),
  content: z.string().min(1, "Message content is required"),
  metadata: z.record(z.any()).optional(),
});

export const adminBypass__sendMessageSchema = sendMessageSchema.extend({
  userId: z.string().min(1, "User ID is required"),
});

export const getMessagesSchema = z.object({
  chatId: z.string().min(1, "Chat ID is required"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const markAsReadSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
});

export const addAttachmentsSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  attachments: z
    .array(
      z.object({
        name: z.string().min(1, "File name is required"),
        url: z.string().url("Valid URL is required"),
        type: z.string().min(1, "File type is required"),
        size: z.number().int().min(1, "File size is required"),
      })
    )
    .min(1, "At least one attachment is required"),
});

export type MessageWithRelations = IMessage & {
  sender: { id: string; username: string; email: string };
  attachments: IAttachment[];
  readBy: IReadReceipt[];
  isRead: boolean;
};
