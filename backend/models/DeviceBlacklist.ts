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
  // Additional fields used by routes
  appealStatus?: 'pending' | 'approved' | 'rejected';
  appealNotes?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods referenced in routes
  isExpired?(): boolean;
  canAppeal?(): boolean;
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
  appealStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  appealNotes: {
    type: String,
  },
  expiresAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
deviceBlacklistSchema.index({ deviceId: 1 }, { unique: true });
deviceBlacklistSchema.index({ gameId: 1 });
deviceBlacklistSchema.index({ bannedAt: 1 });

// Methods
deviceBlacklistSchema.methods.isExpired = function(): boolean {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
};

deviceBlacklistSchema.methods.canAppeal = function(): boolean {
  if (this.appealStatus !== 'rejected') return true;
  const lastUpdate = this.updatedAt instanceof Date ? this.updatedAt : new Date();
  const nextAppealDate = new Date(lastUpdate.getTime() + 30 * 24 * 60 * 60 * 1000);
  return new Date() >= nextAppealDate;
};

export default mongoose.model<IDeviceBlacklist>('DeviceBlacklist', deviceBlacklistSchema);
// Static helper used in routes
(deviceBlacklistSchema.statics as any).isBlacklisted = async function(deviceId: string, gameId: string): Promise<boolean> {
  const found = await this.findOne({ deviceId, gameId });
  if (!found) return false;
  if (typeof found.isExpired === 'function') {
    return !found.isExpired();
  }
  return true;
};

