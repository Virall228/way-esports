import express from 'express';
import { auth } from '../middleware/auth';
import DeviceVerification from '../models/DeviceVerification';
import DeviceBlacklist from '../models/DeviceBlacklist';
// import { sendVerificationEmail } from '../services/emailService';

const router = express.Router();

// Initialize device verification
router.post('/valorant-mobile/verify-device/init', auth, async (req, res) => {
  try {
    const {
      deviceId,
      deviceModel,
      osVersion,
      manufacturer,
      specs
    } = req.body;

    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if device is blacklisted
    const isBlacklisted = await (DeviceBlacklist as any).isBlacklisted(deviceId, 'valorant-mobile');
    if (isBlacklisted) {
      const blacklist = await DeviceBlacklist.findOne({
        deviceId,
        gameId: 'valorant-mobile'
      });
      
      return res.status(403).json({
        status: 'error',
        message: 'Device is blacklisted',
        blacklist: {
          reason: blacklist?.reason || 'Unknown',
          expiresAt: blacklist?.expiresAt,
          appealStatus: blacklist?.appealStatus || 'pending',
          canAppeal: blacklist && typeof blacklist.canAppeal === 'function' ? blacklist.canAppeal() : false
        }
      });
    }

    // Check if device is already verified
    let deviceVerification = await DeviceVerification.findOne({
      deviceId,
      gameId: 'valorant-mobile'
    });

    if (deviceVerification && deviceVerification.isVerified) {
      return res.json({
        status: 'success',
        message: 'Device already verified',
        isVerified: true,
        deviceVerification
      });
    }

    // Create new device verification if doesn't exist
    if (!deviceVerification) {
      deviceVerification = new DeviceVerification({
        userId: req.user._id,
        deviceId,
        deviceModel,
        osVersion,
        manufacturer,
        specs,
        gameId: 'valorant-mobile'
      });
    }

    // Generate new verification code
    const verificationCode = deviceVerification.generateVerificationCode();

    // Save device verification
    await deviceVerification.save();

    // Send verification code via email
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    // await sendVerificationEmail(req.user.email as string, verificationCode);
    console.log(`Verification code would be sent to user: ${verificationCode}`);

    res.json({
      status: 'success',
      message: 'Verification code sent',
      deviceVerification: {
        ...deviceVerification.toObject(),
        verificationCode: undefined // Don't send code in response
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error initializing device verification',
      error: (error as Error).message
    });
  }
});

// Verify device with code
router.post('/valorant-mobile/verify-device/confirm', auth, async (req, res) => {
  try {
    const { deviceId, verificationCode } = req.body;

    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if device is blacklisted
    const isBlacklisted = await (DeviceBlacklist as any).isBlacklisted(deviceId, 'valorant-mobile');
    if (isBlacklisted) {
      const blacklist = await DeviceBlacklist.findOne({
        deviceId,
        gameId: 'valorant-mobile'
      });
      
      return res.status(403).json({
        status: 'error',
        message: 'Device is blacklisted',
        blacklist: {
          reason: blacklist?.reason || 'Unknown',
          expiresAt: blacklist?.expiresAt,
          appealStatus: blacklist?.appealStatus || 'pending',
          canAppeal: blacklist && typeof blacklist.canAppeal === 'function' ? blacklist.canAppeal() : false
        }
      });
    }

    const deviceVerification = await DeviceVerification.findOne({
      deviceId,
      gameId: 'valorant-mobile',
      userId: req.user._id
    });

    if (!deviceVerification) {
      return res.status(404).json({
        status: 'error',
        message: 'Device verification not found'
      });
    }

    // Check if verification code is expired
    if (deviceVerification.verificationExpiry < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Verification code expired'
      });
    }

    // Check verification code
    if (deviceVerification.verificationCode !== verificationCode) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid verification code'
      });
    }

    // Check device requirements
    if (typeof deviceVerification.meetsMinimumRequirements === 'function' ? !deviceVerification.meetsMinimumRequirements() : true) {
      deviceVerification.status = 'rejected';
      await deviceVerification.save();
      
      return res.status(400).json({
        status: 'error',
        message: 'Device does not meet minimum requirements',
        requirements: {
          android: {
            minVersion: '8.0',
            minRam: '4GB',
            minStorage: '4GB'
          },
          ios: {
            minVersion: '13.0',
            supportedDevices: ['iPhone 8', 'iPhone X', 'iPad 6th gen']
          }
        }
      });
    }

    // Verify device
    deviceVerification.verify();
    await deviceVerification.save();

    res.json({
      status: 'success',
      message: 'Device verified successfully',
      deviceVerification
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error verifying device',
      error: (error as Error).message
    });
  }
});

// Get device verification status
router.get('/valorant-mobile/verify-device/status/:deviceId', auth, async (req, res) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if device is blacklisted
    const isBlacklisted = await (DeviceBlacklist as any).isBlacklisted(req.params.deviceId, 'valorant-mobile');
    if (isBlacklisted) {
      const blacklist = await DeviceBlacklist.findOne({
        deviceId: req.params.deviceId,
        gameId: 'valorant-mobile'
      });
      
      return res.status(403).json({
        status: 'error',
        message: 'Device is blacklisted',
        blacklist: {
          reason: blacklist?.reason || 'Unknown',
          expiresAt: blacklist?.expiresAt,
          appealStatus: blacklist?.appealStatus || 'pending',
          canAppeal: blacklist && typeof blacklist.canAppeal === 'function' ? blacklist.canAppeal() : false
        }
      });
    }

    const deviceVerification = await DeviceVerification.findOne({
      deviceId: req.params.deviceId,
      gameId: 'valorant-mobile',
      userId: req.user._id
    });

    if (!deviceVerification) {
      return res.status(404).json({
        status: 'error',
        message: 'Device verification not found'
      });
    }

    res.json({
      status: 'success',
      deviceVerification
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error getting device verification status',
      error: (error as Error).message
    });
  }
});

// Revoke device verification
router.post('/valorant-mobile/verify-device/revoke', auth, async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    const deviceVerification = await DeviceVerification.findOne({
      deviceId,
      gameId: 'valorant-mobile',
      userId: req.user._id
    });

    if (!deviceVerification) {
      return res.status(404).json({
        status: 'error',
        message: 'Device verification not found'
      });
    }

    deviceVerification.isVerified = false;
    deviceVerification.status = 'pending';
    await deviceVerification.save();

    res.json({
      status: 'success',
      message: 'Device verification revoked',
      deviceVerification
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error revoking device verification',
      error: (error as Error).message
    });
  }
});

export default router; 