import mongoose, { Document, Schema } from 'mongoose';

export type AuthLogEvent = 'register' | 'login' | 'logout';
export type AuthLogStatus = 'success' | 'failed';
export type AuthLogMethod =
  | 'telegram_id'
  | 'telegram_webapp'
  | 'email_password'
  | 'email_otp'
  | 'google'
  | 'apple';

export interface IAuthLog extends Document<mongoose.Types.ObjectId> {
  userId?: mongoose.Types.ObjectId;
  event: AuthLogEvent;
  status: AuthLogStatus;
  method: AuthLogMethod;
  identifier?: string;
  reason?: string;
  ip?: string;
  userAgent?: string;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const authLogSchema = new Schema<IAuthLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    event: {
      type: String,
      enum: ['register', 'login', 'logout'],
      required: true
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true
    },
    method: {
      type: String,
      enum: ['telegram_id', 'telegram_webapp', 'email_password', 'email_otp', 'google', 'apple'],
      required: true
    },
    identifier: {
      type: String
    },
    reason: {
      type: String
    },
    ip: {
      type: String
    },
    userAgent: {
      type: String
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

authLogSchema.index({ createdAt: -1 });
authLogSchema.index({ event: 1, createdAt: -1 });
authLogSchema.index({ method: 1, createdAt: -1 });
authLogSchema.index({ status: 1, createdAt: -1 });
authLogSchema.index({ userId: 1, createdAt: -1 });
authLogSchema.index({ identifier: 1, createdAt: -1 });

export default mongoose.model<IAuthLog>('AuthLog', authLogSchema);

