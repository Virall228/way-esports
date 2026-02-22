import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportMessage extends Document<mongoose.Types.ObjectId> {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  senderType: 'user' | 'ai' | 'admin' | 'system';
  senderId?: mongoose.Types.ObjectId;
  content: string;
  provider?: 'gemini' | 'openai' | 'heuristic' | 'none';
  meta?: Record<string, any>;
  readByUser: boolean;
  readByAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const supportMessageSchema = new Schema<ISupportMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'SupportConversation',
      required: true
    },
    senderType: {
      type: String,
      enum: ['user', 'ai', 'admin', 'system'],
      required: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000
    },
    provider: {
      type: String,
      enum: ['gemini', 'openai', 'heuristic', 'none']
    },
    meta: {
      type: Schema.Types.Mixed
    },
    readByUser: {
      type: Boolean,
      default: false
    },
    readByAdmin: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

supportMessageSchema.index({ conversationId: 1, createdAt: 1 });
supportMessageSchema.index({ senderType: 1, createdAt: -1 });

export default mongoose.models.SupportMessage ||
  mongoose.model<ISupportMessage>('SupportMessage', supportMessageSchema);

