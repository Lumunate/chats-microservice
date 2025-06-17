import { z } from "zod";
import { IChat } from "../models/chat";
import { IUserChat } from "../models/user-chat";

export const getUsersWithChatsSchema = z.object({
  searchTerm: z.string().optional(),
});

export type ChatWithParticipants = IChat & {
  lastMessageBody: string;
  participants: Array<
    IUserChat & {
      user: {
        id: string;
        username: string;
        email: string;
        isOnline: boolean;
        lastOnline: Date | null;
      };
    }
  >;
};
