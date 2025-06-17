import { IUserPresence } from "../models/user-presence";
import { UserPresenceRepository } from "../repository";

export async function setUserOnline(userId: string): Promise<IUserPresence> {
  return UserPresenceRepository.updateOnlineStatus(userId, true);
}

export async function setUserOffline(userId: string): Promise<IUserPresence> {
  return UserPresenceRepository.updateOnlineStatus(userId, false);
}

export async function updateActiveChats(
  userId: string,
  chatIds: string[]
): Promise<IUserPresence> {
  return UserPresenceRepository.updateActiveChats(userId, chatIds);
}

export async function getUserPresence(
  userId: string
): Promise<IUserPresence | null> {
  return UserPresenceRepository.findById(userId);
}

export async function getOnlineUsers(
  userIds: string[]
): Promise<IUserPresence[]> {
  return UserPresenceRepository.findOnlineUsers(userIds);
}
