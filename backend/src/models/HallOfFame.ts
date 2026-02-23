import mongoose, { Document, Schema } from 'mongoose';

export interface IHallOfFame extends Document<mongoose.Types.ObjectId> {
  userId: mongoose.Types.ObjectId;
  username: string;
  consecutiveDaysRank1: number;
  firstRank1At?: Date;
  lastRank1At?: Date;
  updatedAt: Date;
  createdAt: Date;
}

const hallOfFameSchema = new Schema<IHallOfFame>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    username: {
      type: String,
      required: true
    },
    consecutiveDaysRank1: {
      type: Number,
      default: 0
    },
    firstRank1At: {
      type: Date
    },
    lastRank1At: {
      type: Date
    }
  },
  { timestamps: true }
);

hallOfFameSchema.index({ consecutiveDaysRank1: -1, updatedAt: -1 });

export default mongoose.models.HallOfFame ||
  mongoose.model<IHallOfFame>('HallOfFame', hallOfFameSchema);

