import AuthError, {
    AuthErrorType,
} from "../lib/handlers/errors/types/AuthError";
import NotFoundError from "../lib/handlers/errors/types/NotFoundError";
import ValidationError from "../lib/handlers/errors/types/ValidationError";
import { IChat } from "../models/chat";
import { ChatRepository } from "../repository";
import { ChatWithParticipants } from "../types/user";

export async function createDirectChat(
  user1Id: string,
  user2Id: string
): Promise<IChat> {
  // Check if a direct chat already exists between these users
  const existingChat = await ChatRepository.findDirectChat([user1Id, user2Id]);
  if (existingChat) {
    return existingChat;
  }

  // Create a new direct chat
  return ChatRepository.create(null, false, [user1Id, user2Id]);
}

export async function createGroupChat(
  name: string,
  participantIds: string[],
  adminId: string,
  metadata?: Object
): Promise<IChat> {
  // Ensure admin is in the participant list
  if (!participantIds.includes(adminId)) {
    participantIds.push(adminId);
  }

  // Create the group chat
  return ChatRepository.create(name, true, participantIds, metadata);
}

export async function getUserChats(
  userId: string
): Promise<ChatWithParticipants[]> {
  return ChatRepository.findUserChats(userId);
}

export async function addUserToChat(
  chatId: string,
  userId: string,
  addedBy: string
): Promise<boolean> {
  const chat = await ChatRepository.findById(chatId);
  if (!chat) {
    throw new NotFoundError(`Chat with ID ${chatId} not found`);
  }

  if (!chat.isGroup) {
    throw new ValidationError("Cannot add users to direct chats");
  }

  // Check if the user adding has admin permissions
  const adminUserChat = chat.participants.find((p) => p.userId === addedBy);
  if (!adminUserChat || !adminUserChat.isAdmin) {
    throw new AuthError(AuthErrorType.UNAUTHORIZED);
  }

  // Check if user is already in the chat
  const isAlreadyInChat = chat.participants.some((p) => p.userId === userId);
  if (isAlreadyInChat) {
    throw new ValidationError("User is already in this chat");
  }

  // Add the user to the chat
  await ChatRepository.addParticipant(chatId, userId);
  return true;
}

export async function removeUserFromChat(
  chatId: string,
  userId: string,
  removedBy: string
): Promise<boolean> {
  // Check if chat exists and is a group chat
  const chat = await ChatRepository.findById(chatId);
  if (!chat) {
    throw new NotFoundError(`Chat with ID ${chatId} not found`);
  }

  if (!chat.isGroup) {
    throw new ValidationError("Cannot remove users from direct chats");
  }

  // A user can remove themselves, or an admin can remove anyone
  if (userId !== removedBy) {
    const adminUserChat = chat.participants.find((p) => p.userId === removedBy);
    if (!adminUserChat || !adminUserChat.isAdmin) {
      throw new AuthError(AuthErrorType.UNAUTHORIZED, 401);
    }
  }

  // Check if user to be removed is in the chat
  const userToRemove = chat.participants.find((p) => p.userId === userId);
  if (!userToRemove) {
    throw new NotFoundError(`User with ID ${userId} is not in this chat`);
  }

  // Don't allow removing the last admin
  if (userToRemove.isAdmin) {
    const adminCount = chat.participants.filter((p) => p.isAdmin).length;
    if (adminCount === 1) {
      throw new ValidationError(
        "Cannot remove the last admin from the group chat"
      );
    }
  }

  // Remove the user from the chat
  await ChatRepository.removeParticipant(chatId, userId);
  return true;
}

export async function storeCustomData(
  chatId: string,
  userId: string,
  metadata: any
): Promise<IChat> {
  // Check if chat exists
  const chat = await ChatRepository.findById(chatId);
  if (!chat) {
    throw new NotFoundError(`Chat with ID ${chatId} not found`);
  }

  // Check if user is in the chat
  const isUserInChat = chat.participants.some((p) => p.userId === userId);
  if (!isUserInChat) {
    throw new AuthError(AuthErrorType.UNAUTHORIZED, 401);
  }

  // Store the metadata
  return ChatRepository.updateMetadata(chatId, metadata);
}
