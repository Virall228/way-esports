import mongoose, { Document, Schema } from 'mongoose';

export type BotNotificationStatus = 'pending' | 'sent' | 'failed';

export interface IBotNotification extends Document<mongoose.Types.ObjectId> {
  userId?: mongoose.Types.ObjectId;
  telegramId: number;
  chatId: number;
  eventType: string;
  title: string;
  message: string;
  payload?: Record<string, any>;
  status: BotNotificationStatus;
  sendAt: Date;
  sentAt?: Date;
  attempts: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const botNotificationSchema = new Schema<IBotNotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    telegramId: { type: Number, required: true },
    chatId: { type: Number, required: true },
    eventType: { type: String, required: true, trim: true, maxlength: 64 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    payload: { type: Schema.Types.Mixed },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    sendAt: { type: Date, default: Date.now },
    sentAt: { type: Date },
    attempts: { type: Number, default: 0 },
    lastError: { type: String, trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

botNotificationSchema.index({ status: 1, sendAt: 1 });
botNotificationSchema.index({ telegramId: 1, createdAt: -1 });
botNotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.BotNotification ||
  mongoose.model<IBotNotification>('BotNotification', botNotificationSchema);

