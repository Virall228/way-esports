import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceBlacklist extends Document {
  deviceId: string;
  deviceModel: string;
  manufacturer: string;
  reason: string;
  blacklistedAt: Date;
  blacklistedBy: mongoose.Types.ObjectId;
  expiresAt?: Date;
  isGlobalBan: boolean;
  gameId: string;
  notes?: string;
  appealStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  appealNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceBlacklistSchema = new Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },
    deviceModel: {
      type: String,
      required: true,
    },
    manufacturer: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    blacklistedAt: {
      type: Date,
      default: Date.now,
    },
    blacklistedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
    },
    isGlobalBan: {
      type: Boolean,
      default: false,
    },
    gameId: {
      type: String,
      required: true,
      enum: ['valorant-mobile'],
    },
    notes: String,
    appealStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    appealNotes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
DeviceBlacklistSchema.index({ deviceId: 1, gameId: 1 }, { unique: true });
DeviceBlacklistSchema.index({ manufacturer: 1, deviceModel: 1 });
DeviceBlacklistSchema.index({ blacklistedAt: 1 });
DeviceBlacklistSchema.index({ expiresAt: 1 });

// Method to check if blacklist is expired
DeviceBlacklistSchema.methods.isExpired = function(): boolean {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to check if device can appeal
DeviceBlacklistSchema.methods.canAppeal = function(): boolean {
  return this.appealStatus === 'none' || 
         (this.appealStatus === 'rejected' && 
          this.updatedAt < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days since last appeal
};

// Static method to check if device is blacklisted
DeviceBlacklistSchema.statics.isBlacklisted = async function(
  deviceId: string,
  gameId: string
): Promise<boolean> {
  const blacklist = await this.findOne({
    deviceId,
    gameId,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });

  return !!blacklist && !blacklist.isExpired();
};

export const DeviceBlacklist = mongoose.model<IDeviceBlacklist>('DeviceBlacklist', DeviceBlacklistSchema); 