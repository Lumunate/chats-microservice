// src/validators/chatValidator.ts
import { z } from 'zod';

export const createDirectChatSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required')
});

export const createGroupChatSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  participantIds: z.array(z.string()).min(1, 'At least one participant is required'),
  metadata: z.record(z.any()).optional(),
});

export const addUserToChatSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
});

export const removeUserFromChatSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
});

export const updateChatMetadataSchema = z.object({
  metadata: z.record(z.any()).optional()
});
