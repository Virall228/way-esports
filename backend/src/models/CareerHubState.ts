import mongoose, { Document, Schema } from 'mongoose';

export interface ICareerHubClaim {
  missionId: string;
  claimedAt: Date;
  walletCredits: number;
  bonusEntries: number;
  achievementKey?: string;
}

export interface ICareerHubState extends Document<mongoose.Types.ObjectId> {
  user: mongoose.Types.ObjectId;
  weekKey: string;
  claimedMissions: ICareerHubClaim[];
  lastViewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const careerHubClaimSchema = new Schema<ICareerHubClaim>(
  {
    missionId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    claimedAt: {
      type: Date,
      default: Date.now
    },
    walletCredits: {
      type: Number,
      default: 0,
      min: 0
    },
    bonusEntries: {
      type: Number,
      default: 0,
      min: 0
    },
    achievementKey: {
      type: String,
      trim: true,
      maxlength: 120
    }
  },
  { _id: false }
);

const careerHubStateSchema = new Schema<ICareerHubState>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    weekKey: {
      type: String,
      required: true,
      trim: true
    },
    claimedMissions: {
      type: [careerHubClaimSchema],
      default: []
    },
    lastViewedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

careerHubStateSchema.index({ user: 1, weekKey: 1 }, { unique: true });
careerHubStateSchema.index({ weekKey: 1, updatedAt: -1 });

export default mongoose.model<ICareerHubState>('CareerHubState', careerHubStateSchema);
