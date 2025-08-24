import mongoose, { Document, Schema } from 'mongoose';

export interface IDeviceVerification extends Document {
  userId: mongoose.Types.ObjectId;
  deviceId: string;
  deviceModel: string;
  osVersion: string;
  manufacturer: string;
  isVerified: boolean;
  verificationCode: string;
  verificationExpiry: Date;
  lastVerifiedAt?: Date;
  gameId: 'valorant-mobile';
  specs: {
    ram?: string;
    processor?: string;
    gpu?: string;
    storage?: string;
  };
  status: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  meetsMinimumRequirements(): boolean;
}

const deviceVerificationSchema = new Schema<IDeviceVerification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deviceId: {
    type: String,
    required: true,
    unique: true,
  },
  deviceModel: {
    type: String,
    required: true,
  },
  osVersion: {
    type: String,
    required: true,
  },
  manufacturer: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: {
    type: String,
    required: true,
  },
  verificationExpiry: {
    type: Date,
    required: true,
  },
  lastVerifiedAt: {
    type: Date,
  },
  gameId: {
    type: String,
    required: true,
    enum: ['valorant-mobile'],
  },
  specs: {
    ram: String,
    processor: String,
    gpu: String,
    storage: String,
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Method to check if device meets minimum requirements
deviceVerificationSchema.methods.meetsMinimumRequirements = function(): boolean {
  const minimumRequirements = {
    ram: '4GB',
    processor: 'Snapdragon 660',
    gpu: 'Adreno 512',
    storage: '32GB'
  };
  
  // Simple check - in real implementation this would be more sophisticated
  return true;
};

// Index for faster queries
deviceVerificationSchema.index({ deviceId: 1, gameId: 1 }, { unique: true });
deviceVerificationSchema.index({ userId: 1, gameId: 1 });

export default mongoose.model<IDeviceVerification>('DeviceVerification', deviceVerificationSchema);

