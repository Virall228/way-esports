import mongoose, { Document, Schema } from 'mongoose';

export interface ITermsAndConditions extends Document {
  version: string;
  title: string;
  content: string;
  isActive: boolean;
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const termsAndConditionsSchema = new Schema<ITermsAndConditions>({
  version: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  effectiveDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Ensure only one active version
termsAndConditionsSchema.pre('save', async function(next) {
  if (this.isActive) {
    await mongoose.model('TermsAndConditions').updateMany(
      { isActive: true },
      { isActive: false }
    );
  }
  next();
});

export default mongoose.model<ITermsAndConditions>('TermsAndConditions', termsAndConditionsSchema);
