import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  chatId: Types.ObjectId;
  senderId: string; // String ID from auth system
  content: string;
  createdAt: Date;
  updatedAt: Date;
  senderEmail?: string; // Cached from auth token
  metadata?: Record<string, any>;
}

const MessageSchema = new Schema<IMessage>({
  chatId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Chat'
  },
  senderId: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000 // Reasonable message length limit
  },
  senderEmail: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    required: false
  }
}, {
  timestamps: true,
  collection: 'messages'
});

// Indexes for performance
MessageSchema.index({ chatId: 1, createdAt: -1 }); // For chat message history
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
