import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUserChat extends Document {
  _id: Types.ObjectId;
  userId: string; // String ID from auth system
  chatId: Types.ObjectId;
  joinedAt: Date;
  isAdmin: boolean;
  nickname?: string;
  userEmail?: string; // Cached from auth token
  lastUserSync: Date;
}

const UserChatSchema = new Schema<IUserChat>({
  userId: {
    type: String,
    required: true,
    trim: true
  },
  chatId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Chat'
  },
  joinedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false
  },
  nickname: {
    type: String,
    required: false,
    trim: true,
    maxlength: 50
  },
  userEmail: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  lastUserSync: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  collection: 'user_chats'
});

// Compound indexes
UserChatSchema.index({ userId: 1, chatId: 1 }, { unique: true });
UserChatSchema.index({ chatId: 1 });
UserChatSchema.index({ userId: 1 });
UserChatSchema.index({ isAdmin: 1 });

export const UserChat = mongoose.model<IUserChat>('UserChat', UserChatSchema);
