import mongoose, { Document, Schema } from 'mongoose';

export interface IBotInviteEvent extends Document<mongoose.Types.ObjectId> {
  inviterTelegramId: number;
  inviteeTelegramId: number;
  createdAt: Date;
}

const botInviteEventSchema = new Schema<IBotInviteEvent>(
  {
    inviterTelegramId: { type: Number, required: true },
    inviteeTelegramId: { type: Number, required: true }
  },
  { timestamps: true }
);

botInviteEventSchema.index({ inviterTelegramId: 1, inviteeTelegramId: 1 }, { unique: true });
botInviteEventSchema.index({ inviterTelegramId: 1, createdAt: -1 });

export default mongoose.models.BotInviteEvent ||
  mongoose.model<IBotInviteEvent>('BotInviteEvent', botInviteEventSchema);

