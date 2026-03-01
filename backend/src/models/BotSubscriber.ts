import mongoose, { Document, Schema } from 'mongoose';

export interface IBotSubscriber extends Document<mongoose.Types.ObjectId> {
  telegramId: number;
  chatId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  startedAt: Date;
  lastSeenAt: Date;
  lastReminderAt?: Date;
  invitedByTelegramId?: number;
  viralInvitesCount: number;
  viralRewardIssuedAt?: Date;
  isActive: boolean;
}

const botSubscriberSchema = new Schema<IBotSubscriber>(
  {
    telegramId: { type: Number, required: true, unique: true },
    chatId: { type: Number, required: true },
    username: { type: String, trim: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    languageCode: { type: String, trim: true, default: 'en' },
    startedAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    lastReminderAt: { type: Date },
    invitedByTelegramId: { type: Number },
    viralInvitesCount: { type: Number, default: 0 },
    viralRewardIssuedAt: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

botSubscriberSchema.index({ lastReminderAt: 1, isActive: 1 });
botSubscriberSchema.index({ invitedByTelegramId: 1 });

export default mongoose.models.BotSubscriber ||
  mongoose.model<IBotSubscriber>('BotSubscriber', botSubscriberSchema);

