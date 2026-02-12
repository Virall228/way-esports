import mongoose, { Document, Schema } from 'mongoose';

export interface IContactMessage extends Document<mongoose.Types.ObjectId> {
  name: string;
  email: string;
  message: string;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const contactMessageSchema = new Schema<IContactMessage>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 4000
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

contactMessageSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model<IContactMessage>('ContactMessage', contactMessageSchema);
