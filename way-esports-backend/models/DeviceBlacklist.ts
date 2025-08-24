import mongoose, { Document, Schema } from 'mongoose';

export interface IDeviceBlacklist extends Document {
  deviceId: string;
  reason: string;
  bannedAt: Date;
  bannedBy: mongoose.Types.ObjectId;
  gameId: 'valorant-mobile';
  deviceInfo: {
    model?: string;
    manufacturer?: string;
    osVersion?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const deviceBlacklistSchema = new Schema<IDeviceBlacklist>({
  deviceId: {
    type: String,
    required: true,
    unique: true,
  },
  reason: {
    type: String,
    required: true,
  },
  bannedAt: {
    type: Date,
    default: Date.now,
  },
  bannedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  gameId: {
    type: String,
    required: true,
    enum: ['valorant-mobile'],
  },
  deviceInfo: {
    model: String,
    manufacturer: String,
    osVersion: String,
  },
}, {
  timestamps: true,
});

// Indexes
deviceBlacklistSchema.index({ deviceId: 1 }, { unique: true });
deviceBlacklistSchema.index({ gameId: 1 });
deviceBlacklistSchema.index({ bannedAt: 1 });

export default mongoose.model<IDeviceBlacklist>('DeviceBlacklist', deviceBlacklistSchema);

