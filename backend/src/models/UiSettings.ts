import mongoose from 'mongoose';

export type BackgroundPreset = 'auto' | 'subtle' | 'default' | 'strong';

const UiSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    backgroundPreset: {
      type: String,
      enum: ['auto', 'subtle', 'default', 'strong'],
      default: 'auto'
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

UiSettingsSchema.index({ key: 1 }, { unique: true });

const UiSettings = mongoose.models.UiSettings || mongoose.model('UiSettings', UiSettingsSchema);

export default UiSettings;
