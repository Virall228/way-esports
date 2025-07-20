import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceVerification extends Document {
  userId: mongoose.Types.ObjectId;
  deviceId: string;
  deviceModel: string;
  osVersion: string;
  manufacturer: string;
  isVerified: boolean;
  verificationCode: string;
  verificationExpiry: Date;
  lastVerifiedAt: Date;
  gameId: string;
  specs: {
    ram: string;
    processor: string;
    gpu: string;
    storage: string;
  };
  status: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const DeviceVerificationSchema = new Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
DeviceVerificationSchema.index({ deviceId: 1, gameId: 1 }, { unique: true });
DeviceVerificationSchema.index({ userId: 1, gameId: 1 });

// Method to check if device meets minimum requirements
DeviceVerificationSchema.methods.meetsMinimumRequirements = function(): boolean {
  const minimumRequirements = {
    android: {
      version: '8.0',
      ram: '4GB',
      storage: '4GB'
    },
    ios: {
      version: '13.0',
      devices: ['iPhone 8', 'iPhone X', 'iPad 6th gen']
    }
  };

  // Parse RAM to number (remove 'GB' and convert to number)
  const deviceRam = parseInt(this.specs.ram.replace('GB', ''));
  const minRam = parseInt(minimumRequirements.android.ram.replace('GB', ''));

  if (this.deviceModel.toLowerCase().includes('iphone') || this.deviceModel.toLowerCase().includes('ipad')) {
    const iosVersion = parseFloat(this.osVersion);
    return iosVersion >= parseFloat(minimumRequirements.ios.version);
  } else {
    const androidVersion = parseFloat(this.osVersion);
    return androidVersion >= parseFloat(minimumRequirements.android.version) && 
           deviceRam >= minRam;
  }
};

// Method to generate verification code
DeviceVerificationSchema.methods.generateVerificationCode = function(): string {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  this.verificationCode = code;
  this.verificationExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiry
  return code;
};

// Method to verify device
DeviceVerificationSchema.methods.verify = function(): void {
  this.isVerified = true;
  this.status = 'verified';
  this.lastVerifiedAt = new Date();
};

export const DeviceVerification = mongoose.model<IDeviceVerification>('DeviceVerification', DeviceVerificationSchema); 