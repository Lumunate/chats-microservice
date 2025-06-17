import {
  addAttachmentsSchema,
  getMessagesSchema,
  markAsReadSchema,
  sendMessageSchema,
} from "../types/message";
import { Request, Response } from "express";
import handleErrors from "../lib/handlers/errors";
import AuthError, {
  AuthErrorType,
} from "../lib/handlers/errors/types/AuthError";

import * as AuthService from "../services/auth-service";
import * as MessageService from "../services/message-service";

export async function sendMessage(req: Request, res: Response) {
  try {
    const auth = await AuthService.authenticate(req);
    if (!auth) {
      throw new AuthError(AuthErrorType.UNAUTHORIZED);
    }

    const body = req.body;
    const { chatId, content, metadata } = sendMessageSchema.parse(body);

    const message = await MessageService.sendMessage(
      chatId,
      auth.userId,
      content,
      metadata
    );

    return res.status(201).json({ message });
  } catch (error) {
    return handleErrors(error, res);
  }
}

export async function getChatMessages(req: Request, res: Response) {
  try {
    const auth = await AuthService.authenticate(req);
    if (!auth) {
      throw new AuthError(AuthErrorType.UNAUTHORIZED);
    }

    const chatId = req.query.chatId as string;
    const page = parseInt((req.query.page as string) || "1");
    const pageSize = parseInt((req.query.pageSize as string) || "20");

    const {
      chatId: validatedChatId,
      page: validatedPage,
      pageSize: validatedPageSize,
    } = getMessagesSchema.parse({ chatId, page, pageSize });

    const messages = await MessageService.getChatMessages(
      validatedChatId,
      auth.userId,
      validatedPage,
      validatedPageSize
    );

    return res.status(200).json({ messages });
  } catch (error) {
    return handleErrors(error, res);
  }
}

export async function markAsRead(req: Request, res: Response) {
  try {
    const auth = await AuthService.authenticate(req);
    if (!auth) {
      throw new AuthError(AuthErrorType.UNAUTHORIZED);
    }

    const body = req.body;
    const { messageId } = markAsReadSchema.parse(body);

    await MessageService.readMessage(messageId, auth.userId);

    return res.status(200).json({ success: true });
  } catch (error) {
    return handleErrors(error, res);
  }
}

export async function addAttachments(req: Request, res: Response) {
  try {
    const auth = await AuthService.authenticate(req);
    if (!auth) {
      throw new AuthError(AuthErrorType.UNAUTHORIZED);
    }

    const body = req.body;
    const { messageId, attachments } = addAttachmentsSchema.parse(body);

    const savedAttachments = await MessageService.addAttachments(
      messageId,
      attachments
    );

    return res.status(201).json({ attachments: savedAttachments });
  } catch (error) {
    return handleErrors(error, res);
  }
}
