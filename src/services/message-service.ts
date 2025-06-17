import { IMessage } from "../models/message";
import AuthError, {
  AuthErrorType,
} from "../lib/handlers/errors/types/AuthError";
import NotFoundError from "../lib/handlers/errors/types/NotFoundError";
import { ChatRepository, MessageRepository } from "../repository";
import { IAttachment } from "../models/attachment";
import { MessageWithRelations } from "../types/message";

export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
  metadata?: any
): Promise<IMessage> {
  // Check if chat exists
  const chat = await ChatRepository.findById(chatId);
  if (!chat) {
    throw new NotFoundError(`Chat with ID ${chatId} not found`);
  }

  // Check if user is a participant in the chat
  const isUserInChat = chat.participants.some((p) => p.userId === senderId);
  if (!isUserInChat) {
    throw new AuthError(AuthErrorType.UNAUTHORIZED, 401);
  }

  // Create the message
  return MessageRepository.create(chatId, senderId, content, metadata);
}

export async function getChatMessages(
  chatId: string,
  userId: string,
  page: number,
  pageSize: number
): Promise<MessageWithRelations[]> {
  // Check if chat exists
  const chat = await ChatRepository.findById(chatId);
  if (!chat) {
    throw new NotFoundError(`Chat with ID ${chatId} not found`);
  }

  // Check if user is a participant in the chat
  const isUserInChat = chat.participants.some((p) => p.userId === userId);
  if (!isUserInChat) {
    throw new AuthError(AuthErrorType.UNAUTHORIZED, 401);
  }

  // Calculate offset for pagination
  const offset = (page - 1) * pageSize;

  // Get messages
  return MessageRepository.findByChatId(chatId, pageSize, offset);
}

export async function readMessage(
  messageId: string,
  userId: string
): Promise<void> {
  // Check if message exists
  const message = await MessageRepository.findById(messageId);
  if (!message) {
    throw new NotFoundError(`Message with ID ${messageId} not found`);
  }

  // Check if user is a participant in the chat
  const chat = await ChatRepository.findById(message.chatId.toString());
  if (!chat) {
    throw new NotFoundError("Chat associated with this message not found");
  }

  const isUserInChat = chat.participants.some((p) => p.userId === userId);
  if (!isUserInChat) {
    throw new AuthError(AuthErrorType.UNAUTHORIZED, 401);
  }

  // Mark the message as read
  await MessageRepository.markAsRead(messageId, userId);
}

export async function addAttachments(
  messageId: string,
  attachmentsData: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>
): Promise<IAttachment[]> {
  // Check if message exists
  const message = await MessageRepository.findById(messageId);
  if (!message) {
    throw new NotFoundError(`Message with ID ${messageId} not found`);
  }

  // Add all attachments
  const attachmentPromises = attachmentsData.map((attachmentData) =>
    MessageRepository.addAttachment(messageId, attachmentData)
  );

  return Promise.all(attachmentPromises);
}
