import mongoose from 'mongoose';

const SupportSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    aiEnabled: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

SupportSettingsSchema.index({ key: 1 }, { unique: true });

export default mongoose.model('SupportSettings', SupportSettingsSchema);
