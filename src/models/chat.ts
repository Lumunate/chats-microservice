import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChat extends Document {
  _id: Types.ObjectId;
  name?: string;
  isGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: Date;
  metadata?: Record<string, any>;
  isDeleted: boolean;
}

const ChatSchema = new Schema<IChat>({
  name: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  isGroup: {
    type: Boolean,
    required: true,
    default: false
  },
  lastMessage: {
    type: Date,
    required: false
  },
  metadata: {
    type: Schema.Types.Mixed,
    required: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'chats'
});

// Indexes for performance
ChatSchema.index({ createdAt: -1 });
ChatSchema.index({ lastMessage: -1 });
ChatSchema.index({ isGroup: 1 });

export const Chat = mongoose.model<IChat>('Chat', ChatSchema);
