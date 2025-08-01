import { Request, Response } from "express";
import handleErrors from "../lib/handlers/errors";
import AuthError, {
    AuthErrorType,
} from "../lib/handlers/errors/types/AuthError";
import {
    addUserToChatSchema,
    createDirectChatSchema,
    createGroupChatSchema,
    removeUserFromChatSchema,
    updateChatMetadataSchema,
} from "../types/chat";

import { AuthService, ChatService } from "../services";

export async function createDirectChat(req: Request, res: Response) {
  try {
    const auth = await AuthService.authenticate(req);
    if (!auth) {
      throw new AuthError(AuthErrorType.UNAUTHORIZED);
    }

    const body = req.body;
    const { recipientId } = createDirectChatSchema.parse(body);

    const chat = await ChatService.createDirectChat(auth.userId, recipientId);

    return res.status(201).json({ chat });
  } catch (error) {
    return handleErrors(error, res);
  }
}

export async function createGroupChat(req: Request, res: Response) {
  try {
    const auth = await AuthService.authenticate(req);
    if (!auth) {
      throw new AuthError(AuthErrorType.UNAUTHORIZED);
    }

    const body = req.body;
    const { name, participantIds, metadata } = createGroupChatSchema.parse(body);

    const chat = await ChatService.createGroupChat(
      name,
      participantIds,
      auth.userId,
      metadata
    );

    return res.status(201).json({ chat });
  } catch (error) {
    return handleErrors(error, res);
  }
}

export async function getUserChats(req: Request, res: Response) {
  try {
    const auth = await AuthService.authenticate(req);
    if (!auth) {
      throw new AuthError(AuthErrorType.UNAUTHORIZED);
    }

    const chats = await ChatService.getUserChats(auth.userId);

    return res.status(200).json({ chats });
  } catch (error) {
    return handleErrors(error, res);
  }
}

export async function addUserToChat(req: Request, res: Response) {
  try {
    const auth = await AuthService.authenticate(req);
    if (!auth) {
      throw new AuthError(AuthErrorType.UNAUTHORIZED);
    }

    const { chatId } = req.params;
    const body = req.body;
    const { userId } = addUserToChatSchema.parse(body);

    await ChatService.addUserToChat(chatId, userId, auth.userId);

    return res.status(200).json({ success: true });
  } catch (error) {
    return handleErrors(error, res);
  }
}

export async function removeUserFromChat(req: Request, res: Response) {
  try {
    const auth = await AuthService.authenticate(req);
    if (!auth) {
      throw new AuthError(AuthErrorType.UNAUTHORIZED);
    }

    const { chatId } = req.params;
    const body = req.body;
    const { userId } = removeUserFromChatSchema.parse(body);

    await ChatService.removeUserFromChat(chatId, userId, auth.userId);

    return res.status(200).json({ success: true });
  } catch (error) {
    return handleErrors(error, res);
  }
}

export async function updateChatMetadata(req: Request, res: Response) {
  try {
    const auth = await AuthService.authenticate(req);
    if (!auth) {
      throw new AuthError(AuthErrorType.UNAUTHORIZED);
    }

    const { chatId } = req.params;
    const body = req.body;
    const { metadata } = updateChatMetadataSchema.parse(body);

    const chat = await ChatService.storeCustomData(
      chatId,
      auth.userId,
      metadata
    );

    return res.status(200).json({ chat });
  } catch (error) {
    return handleErrors(error, res);
  }
}
