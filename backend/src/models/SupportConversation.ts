import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportConversation extends Document<mongoose.Types.ObjectId> {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  subject: string;
  source: 'settings' | 'profile' | 'team' | 'other';
  status: 'open' | 'waiting_user' | 'waiting_admin' | 'resolved';
  priority: 'normal' | 'high' | 'urgent';
  aiEnabled: boolean;
  assignedAdminId?: mongoose.Types.ObjectId;
  unreadForUser: number;
  unreadForAdmin: number;
  lastMessagePreview?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const supportConversationSchema = new Schema<ISupportConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 180,
      default: 'Emergency Support'
    },
    source: {
      type: String,
      enum: ['settings', 'profile', 'team', 'other'],
      default: 'settings'
    },
    status: {
      type: String,
      enum: ['open', 'waiting_user', 'waiting_admin', 'resolved'],
      default: 'open'
    },
    priority: {
      type: String,
      enum: ['normal', 'high', 'urgent'],
      default: 'normal'
    },
    aiEnabled: {
      type: Boolean,
      default: true
    },
    assignedAdminId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    unreadForUser: {
      type: Number,
      default: 0
    },
    unreadForAdmin: {
      type: Number,
      default: 0
    },
    lastMessagePreview: {
      type: String,
      trim: true,
      maxlength: 300
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

supportConversationSchema.index({ userId: 1, teamId: 1, status: 1 });
supportConversationSchema.index({ status: 1, lastMessageAt: -1 });
supportConversationSchema.index({ unreadForAdmin: 1, lastMessageAt: -1 });

export default mongoose.models.SupportConversation ||
  mongoose.model<ISupportConversation>('SupportConversation', supportConversationSchema);

