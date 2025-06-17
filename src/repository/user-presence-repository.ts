import { IUserPresence, UserPresence } from "../models/user-presence";

export async function findById(userId: string): Promise<IUserPresence | null> {
  return await UserPresence.findById(userId).lean();
}

export async function updateOnlineStatus(
  userId: string,
  isOnline: boolean
): Promise<IUserPresence> {
  const updateData: Partial<IUserPresence> = {
    isOnline,
    updatedAt: new Date(),
  };

  if (!isOnline) {
    updateData.lastOnline = new Date();
    updateData.activeInChats = []; // Clear active chats when going offline
  }

  return await UserPresence.findByIdAndUpdate(userId, updateData, {
    upsert: true,
    new: true,
  });
}

export async function updateActiveChats(
  userId: string,
  chatIds: string[]
): Promise<IUserPresence> {
  return await UserPresence.findByIdAndUpdate(
    userId,
    {
      activeInChats: chatIds,
      updatedAt: new Date(),
    },
    {
      upsert: true,
      new: true,
    }
  );
}

export async function findOnlineUsers(
  userIds: string[]
): Promise<IUserPresence[]> {
  return await UserPresence.find({
    _id: { $in: userIds },
    isOnline: true,
  }).lean();
}
