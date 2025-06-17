import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttachment extends Document {
  _id: Types.ObjectId;
  messageId: Types.ObjectId;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
  messageId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Message'
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  url: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  size: {
    type: Number,
    required: true,
    min: 0,
    max: 100 * 1024 * 1024 // 100MB limit
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  collection: 'attachments'
});

// Indexes
AttachmentSchema.index({ messageId: 1 });
AttachmentSchema.index({ createdAt: -1 });

export const Attachment = mongoose.model<IAttachment>('Attachment', AttachmentSchema);
