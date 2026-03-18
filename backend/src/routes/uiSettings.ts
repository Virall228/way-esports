import { Router } from 'express';
import UiSettings from '../models/UiSettings';
import { authenticateJWT, isAdmin } from '../middleware/auth';

const router = Router();

const ensureSettings = async () => {
  const settings = await UiSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global', backgroundPreset: 'auto' } },
    { upsert: true, new: true }
  );
  return settings;
};

router.get('/public', async (_req, res) => {
  try {
    const settings = await ensureSettings();
    return res.json({
      success: true,
      data: {
        backgroundPreset: settings?.backgroundPreset || 'auto',
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
        updatedAt: settings?.updatedAt || null,
        updatedBy: settings?.updatedBy ? String(settings.updatedBy) : null
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to update UI settings' });
  }
});

export default router;
