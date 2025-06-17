import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReadReceipt extends Document {
  _id: Types.ObjectId;
  userId: string; // String ID from auth system
  messageId: Types.ObjectId;
  readAt: Date;
}

const ReadReceiptSchema = new Schema<IReadReceipt>({
  userId: {
    type: String,
    required: true,
    trim: true
  },
  messageId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Message'
  },
  readAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  collection: 'read_receipts'
});

// Compound unique index
ReadReceiptSchema.index({ userId: 1, messageId: 1 }, { unique: true });
ReadReceiptSchema.index({ messageId: 1 });
ReadReceiptSchema.index({ userId: 1 });

export const ReadReceipt = mongoose.model<IReadReceipt>('ReadReceipt', ReadReceiptSchema);
