import mongoose, { Document, Schema } from 'mongoose';

export type SponsorshipApplicantType = 'player' | 'team';
export type SponsorshipApplicationStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

export interface ISponsorshipApplication extends Document<mongoose.Types.ObjectId> {
  _id: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  team: mongoose.Types.ObjectId;
  applicantType: SponsorshipApplicantType;
  status: SponsorshipApplicationStatus;
  contactName: string;
  contactEmail: string;
  contactTelegram?: string;
  contactDiscord?: string;
  nicknames: string[];
  requestSummary: string;
  comment?: string;
  reviewComment?: string;
  reviewDeadlineAt: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  eligibilitySnapshot: {
    checkedAt: Date;
    userTournamentWins: number;
    teamTournamentWins: number;
    teamRank?: number;
    isTop20: boolean;
    topRankLimit: number;
    teamCreatedAt?: Date;
    teamAgeDays: number;
    teamAgeEligibleAt?: Date;
    minTeamAgeMonths: number;
    isTeamOldEnough: boolean;
    applicantEligible: boolean;
    reasons: string[];
  };
  statusTimeline: Array<{
    status: SponsorshipApplicationStatus;
    note?: string;
    actor?: mongoose.Types.ObjectId;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const eligibilitySnapshotSchema = new Schema(
  {
    checkedAt: {
      type: Date,
      required: true
    },
    userTournamentWins: {
      type: Number,
      default: 0
    },
    teamTournamentWins: {
      type: Number,
      default: 0
    },
    teamRank: {
      type: Number
    },
    isTop20: {
      type: Boolean,
      default: false
    },
    topRankLimit: {
      type: Number,
      required: true
    },
    teamCreatedAt: {
      type: Date
    },
    teamAgeDays: {
      type: Number,
      default: 0
    },
    teamAgeEligibleAt: {
      type: Date
    },
    minTeamAgeMonths: {
      type: Number,
      required: true
    },
    isTeamOldEnough: {
      type: Boolean,
      default: false
    },
    applicantEligible: {
      type: Boolean,
      default: false
    },
    reasons: [{
      type: String,
      trim: true
    }]
  },
  { _id: false }
);

const statusTimelineSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'in_review', 'approved', 'rejected'],
      required: true
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const sponsorshipApplicationSchema = new Schema<ISponsorshipApplication>(
  {
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true
    },
    applicantType: {
      type: String,
      enum: ['player', 'team'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 180
    },
    contactTelegram: {
      type: String,
      trim: true,
      maxlength: 120
    },
    contactDiscord: {
      type: String,
      trim: true,
      maxlength: 120
    },
    nicknames: [{
      type: String,
      trim: true,
      maxlength: 64
    }],
    requestSummary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    reviewComment: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    reviewDeadlineAt: {
      type: Date,
      required: true,
      index: true
    },
    reviewedAt: {
      type: Date
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    eligibilitySnapshot: {
      type: eligibilitySnapshotSchema,
      required: true
    },
    statusTimeline: {
      type: [statusTimelineSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

sponsorshipApplicationSchema.index({ status: 1, createdAt: -1 });
sponsorshipApplicationSchema.index({ applicantType: 1, status: 1, createdAt: -1 });
sponsorshipApplicationSchema.index({ submittedBy: 1, applicantType: 1, status: 1, createdAt: -1 });
sponsorshipApplicationSchema.index({ team: 1, applicantType: 1, status: 1, createdAt: -1 });

export default mongoose.model<ISponsorshipApplication>('SponsorshipApplication', sponsorshipApplicationSchema);
