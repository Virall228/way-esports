import express from 'express';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import DeviceBlacklist from '../models/DeviceBlacklist';
import DeviceVerification from '../models/DeviceVerification';

const router = express.Router();

// Add device to blacklist (admin only)
router.post('/valorant-mobile/blacklist', adminAuth, async (req, res) => {
  try {
    const {
      deviceId,
      deviceModel,
      manufacturer,
      reason,
      expiresAt,
      isGlobalBan,
      notes
    } = req.body;

    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if device is already blacklisted
    const existingBlacklist = await DeviceBlacklist.findOne({
      deviceId,
      gameId: 'valorant-mobile'
    });

    if (existingBlacklist) {
      return res.status(400).json({
        status: 'error',
        message: 'Device is already blacklisted'
      });
    }

    // Create blacklist entry
    const blacklist = new DeviceBlacklist({
      deviceId,
      deviceModel,
      manufacturer,
      reason,
      blacklistedBy: req.user._id,
      expiresAt,
      isGlobalBan,
      gameId: 'valorant-mobile',
      notes
    });

    await blacklist.save();

    // Revoke any existing device verifications
    await DeviceVerification.updateMany(
      { deviceId, gameId: 'valorant-mobile' },
      { 
        $set: { 
          isVerified: false,
          status: 'rejected'
        }
      }
    );

    res.status(201).json({
      status: 'success',
      message: 'Device added to blacklist',
      blacklist
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error adding device to blacklist',
      error: (error as Error).message
    });
  }
});

// Remove device from blacklist (admin only)
router.delete('/valorant-mobile/blacklist/:deviceId', adminAuth, async (req, res) => {
  try {
    const blacklist = await DeviceBlacklist.findOneAndDelete({
      deviceId: req.params.deviceId,
      gameId: 'valorant-mobile'
    });

    if (!blacklist) {
      return res.status(404).json({
        status: 'error',
        message: 'Device not found in blacklist'
      });
    }

    res.json({
      status: 'success',
      message: 'Device removed from blacklist',
      blacklist
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error removing device from blacklist',
      error: (error as Error).message
    });
  }
});

// Get blacklist status for device
router.get('/valorant-mobile/blacklist/status/:deviceId', auth, async (req, res) => {
  try {
    const blacklist = await DeviceBlacklist.findOne({
      deviceId: req.params.deviceId,
      gameId: 'valorant-mobile'
    });

    if (!blacklist) {
      return res.json({
        status: 'success',
        isBlacklisted: false
      });
    }

    const isExpired = typeof blacklist.isExpired === 'function' ? blacklist.isExpired() : false;
    res.json({
      status: 'success',
      isBlacklisted: isExpired,
      blacklist: isExpired ? undefined : blacklist
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error checking blacklist status',
      error: (error as Error).message
    });
  }
});

// Submit appeal for blacklisted device
router.post('/valorant-mobile/blacklist/appeal/:deviceId', auth, async (req, res) => {
  try {
    const { appealNotes } = req.body;
    const blacklist = await DeviceBlacklist.findOne({
      deviceId: req.params.deviceId,
      gameId: 'valorant-mobile'
    });

    if (!blacklist) {
      return res.status(404).json({
        status: 'error',
        message: 'Device not found in blacklist'
      });
    }

    const canAppeal = typeof blacklist.canAppeal === 'function' ? blacklist.canAppeal() : false;
    if (!canAppeal) {
      return res.status(400).json({
        status: 'error',
        message: 'Appeal not allowed at this time',
        nextAppealDate: blacklist.appealStatus === 'rejected' 
          ? new Date(blacklist.updatedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
          : undefined
      });
    }

    blacklist.appealStatus = 'pending';
    blacklist.appealNotes = appealNotes;
    await blacklist.save();

    // Уведомление админу о новой апелляции (лог)
    const userId = req.user ? req.user._id : 'unknown';
    console.log(`[APPEAL] New appeal submitted for device ${blacklist.deviceId} by user ${userId}`);

    res.json({
      status: 'success',
      message: 'Appeal submitted successfully',
      blacklist
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error submitting appeal',
      error: (error as Error).message
    });
  }
});

// Review appeal (admin only)
router.post('/valorant-mobile/blacklist/appeal/:deviceId/review', adminAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const blacklist = await DeviceBlacklist.findOne({
      deviceId: req.params.deviceId,
      gameId: 'valorant-mobile'
    });

    if (!blacklist) {
      return res.status(404).json({
        status: 'error',
        message: 'Device not found in blacklist'
      });
    }

    if (blacklist.appealStatus !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'No pending appeal found'
      });
    }

    blacklist.appealStatus = status;
    blacklist.appealNotes = notes;

    if (status === 'approved') {
      // If appeal is approved, set expiry to now to effectively unban
      blacklist.expiresAt = new Date();
    }

    await blacklist.save();

    // Уведомление пользователю о решении (лог)
    console.log(`[APPEAL] Appeal for device ${blacklist.deviceId} reviewed: ${status}`);

    res.json({
      status: 'success',
      message: 'Appeal reviewed successfully',
      blacklist
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error reviewing appeal',
      error: (error as Error).message
    });
  }
});

// Get all blacklisted devices (admin only)
router.get('/valorant-mobile/blacklist', adminAuth, async (req, res) => {
  try {
    const blacklist = await DeviceBlacklist.find({
      gameId: 'valorant-mobile'
    }).sort({ blacklistedAt: -1 });

    res.json({
      status: 'success',
      count: blacklist.length,
      blacklist
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error fetching blacklist',
      error: (error as Error).message
    });
  }
});

export default router; 