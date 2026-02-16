import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document<mongoose.Types.ObjectId> {
  actorId?: mongoose.Types.ObjectId;
  actorRole?: string;
  actorTelegramId?: number;
  action: 'create' | 'update' | 'delete' | 'custom';
  entity: string;
  entityId?: string;
  method: string;
  path: string;
  statusCode: number;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  durationMs?: number;
  payload?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    actorRole: {
      type: String
    },
    actorTelegramId: {
      type: Number
    },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'custom'],
      required: true
    },
    entity: {
      type: String,
      required: true
    },
    entityId: {
      type: String
    },
    method: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    statusCode: {
      type: Number,
      required: true
    },
    requestId: {
      type: String
    },
    ip: {
      type: String
    },
    userAgent: {
      type: String
    },
    durationMs: {
      type: Number
    },
    payload: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ method: 1, path: 1, createdAt: -1 });

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
