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
    socialLinks: {
      website: {
        type: String,
        trim: true,
        default: 'https://wayesports.space/'
      },
      x: {
        type: String,
        trim: true,
        default: 'https://x.com/wayesports_org?s=21'
      },
      discord: {
        type: String,
        trim: true,
        default: 'https://discord.gg/wayesports'
      },
      twitch: {
        type: String,
        trim: true,
        default: 'https://www.twitch.tv/WAY_Esports'
      }
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

UiSettingsSchema.index({ key: 1 }, { unique: true });

const UiSettings = mongoose.models.UiSettings || mongoose.model('UiSettings', UiSettingsSchema);

export default UiSettings;
