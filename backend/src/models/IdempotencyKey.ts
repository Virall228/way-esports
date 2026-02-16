import mongoose, { Document, Schema } from 'mongoose';

export type IdempotencyStatus = 'processing' | 'completed' | 'failed';

export interface IIdempotencyKey extends Document<mongoose.Types.ObjectId> {
  key: string;
  scope: string;
  userKey: string;
  requestHash: string;
  status: IdempotencyStatus;
  responseCode?: number;
  responseBody?: unknown;
  createdAt: Date;
  expiresAt: Date;
  updatedAt: Date;
}

const idempotencyKeySchema = new Schema<IIdempotencyKey>(
  {
    key: {
      type: String,
      required: true,
      trim: true
    },
    scope: {
      type: String,
      required: true,
      trim: true
    },
    userKey: {
      type: String,
      required: true,
      default: 'anonymous'
    },
    requestHash: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      required: true,
      default: 'processing'
    },
    responseCode: {
      type: Number
    },
    responseBody: {
      type: Schema.Types.Mixed
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

idempotencyKeySchema.index({ key: 1, scope: 1, userKey: 1 }, { unique: true });
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IIdempotencyKey>('IdempotencyKey', idempotencyKeySchema);
