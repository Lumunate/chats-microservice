import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPresence extends Document {
  _id: string; // Use userId as primary key
  isOnline: boolean;
  lastOnline?: Date;
  updatedAt: Date;
  activeInChats: string[]; // Array of chat IDs where user is currently active
}

const UserPresenceSchema = new Schema<IUserPresence>({
  _id: {
    type: String,
    required: true
  },
  isOnline: {
    type: Boolean,
    required: true,
    default: false
  },
  lastOnline: {
    type: Date,
    required: false
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  activeInChats: [{
    type: String,
    trim: true
  }]
}, {
  collection: 'user_presence',
  _id: false // We're using custom _id
});

// Indexes
UserPresenceSchema.index({ isOnline: 1 });
UserPresenceSchema.index({ lastOnline: -1 });
UserPresenceSchema.index({ updatedAt: -1 });

export const UserPresence = mongoose.model<IUserPresence>('UserPresence', UserPresenceSchema);
