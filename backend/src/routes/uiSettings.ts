import { Router } from 'express';
import UiSettings from '../models/UiSettings';
import { authenticateJWT, isAdmin } from '../middleware/auth';

const router = Router();
const DEFAULT_SOCIAL_LINKS = {
  website: 'https://wayesports.space/',
  x: 'https://x.com/wayesports_org?s=21',
  discord: 'https://discord.gg/wayesports',
  twitch: 'https://www.twitch.tv/WAY_Esports'
};

const ensureSettings = async () => {
  let settings: any = await UiSettings.findOneAndUpdate(
    { key: 'global' },
    {
      $setOnInsert: {
        key: 'global',
        backgroundPreset: 'auto',
        socialLinks: DEFAULT_SOCIAL_LINKS
      }
    },
    { upsert: true, new: true }
  );

  const mergedSocialLinks = {
    ...DEFAULT_SOCIAL_LINKS,
    ...(settings?.socialLinks ? {
      website: String(settings.socialLinks.website || DEFAULT_SOCIAL_LINKS.website),
      x: String(settings.socialLinks.x || DEFAULT_SOCIAL_LINKS.x),
      discord: String(settings.socialLinks.discord || DEFAULT_SOCIAL_LINKS.discord),
      twitch: String(settings.socialLinks.twitch || DEFAULT_SOCIAL_LINKS.twitch)
    } : {})
  };

  const needsSocialLinksUpdate =
    !settings?.socialLinks ||
    settings.socialLinks.website !== mergedSocialLinks.website ||
    settings.socialLinks.x !== mergedSocialLinks.x ||
    settings.socialLinks.discord !== mergedSocialLinks.discord ||
    settings.socialLinks.twitch !== mergedSocialLinks.twitch;

  if (needsSocialLinksUpdate) {
    settings = await UiSettings.findOneAndUpdate(
      { key: 'global' },
      { $set: { socialLinks: mergedSocialLinks } },
      { new: true }
    );
  }

  return settings;
};

router.get('/public', async (_req, res) => {
  try {
    const settings = await ensureSettings();
    return res.json({
      success: true,
      data: {
        backgroundPreset: settings?.backgroundPreset || 'auto',
        socialLinks: {
          website: String(settings?.socialLinks?.website || DEFAULT_SOCIAL_LINKS.website),
          x: String(settings?.socialLinks?.x || DEFAULT_SOCIAL_LINKS.x),
          discord: String(settings?.socialLinks?.discord || DEFAULT_SOCIAL_LINKS.discord),
          twitch: String(settings?.socialLinks?.twitch || DEFAULT_SOCIAL_LINKS.twitch)
        },
        updatedAt: settings?.updatedAt || null
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to load UI settings' });
  }
});

router.get('/admin', authenticateJWT, isAdmin, async (_req, res) => {
  try {
    const settings = await ensureSettings();
    return res.json({
      success: true,
      data: {
        backgroundPreset: settings?.backgroundPreset || 'auto',
        socialLinks: {
          website: String(settings?.socialLinks?.website || DEFAULT_SOCIAL_LINKS.website),
          x: String(settings?.socialLinks?.x || DEFAULT_SOCIAL_LINKS.x),
          discord: String(settings?.socialLinks?.discord || DEFAULT_SOCIAL_LINKS.discord),
          twitch: String(settings?.socialLinks?.twitch || DEFAULT_SOCIAL_LINKS.twitch)
        },
        updatedAt: settings?.updatedAt || null,
        updatedBy: settings?.updatedBy ? String(settings.updatedBy) : null
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to load admin UI settings' });
  }
});

router.patch('/admin', authenticateJWT, isAdmin, async (req: any, res) => {
  try {
    const preset = String(req.body?.backgroundPreset || '').toLowerCase();
    if (!['auto', 'subtle', 'default', 'strong'].includes(preset)) {
      return res.status(400).json({ success: false, error: 'Invalid backgroundPreset' });
    }

    const settings = await UiSettings.findOneAndUpdate(
      { key: 'global' },
      {
        $set: {
          backgroundPreset: preset,
          updatedBy: req.user?.userId || null
        }
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      data: {
        backgroundPreset: settings?.backgroundPreset || 'auto',
        socialLinks: {
          website: String(settings?.socialLinks?.website || DEFAULT_SOCIAL_LINKS.website),
          x: String(settings?.socialLinks?.x || DEFAULT_SOCIAL_LINKS.x),
          discord: String(settings?.socialLinks?.discord || DEFAULT_SOCIAL_LINKS.discord),
          twitch: String(settings?.socialLinks?.twitch || DEFAULT_SOCIAL_LINKS.twitch)
        },
        updatedAt: settings?.updatedAt || null,
        updatedBy: settings?.updatedBy ? String(settings.updatedBy) : null
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to update UI settings' });
  }
});

export default router;
