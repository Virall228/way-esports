import express from 'express';
import TermsAndConditions from '../models/TermsAndConditions';
import UserAgreement from '../models/UserAgreement';
import { authenticateJWT } from '../middleware/auth';
import { logInfo } from '../services/loggingService';

const router = express.Router();

/**
 * Get current active terms and conditions
 */
router.get('/current', async (req, res) => {
  try {
    const terms = await TermsAndConditions.findOne({ isActive: true })
      .sort({ effectiveDate: -1 });

    if (!terms) {
      return res.status(404).json({ error: 'No active terms and conditions found' });
    }

    res.json({
      version: terms.version,
      title: terms.title,
      content: terms.content,
      effectiveDate: terms.effectiveDate
    });
  } catch (error) {
    console.error('Failed to get terms:', error);
    res.status(500).json({ error: 'Failed to get terms and conditions' });
  }
});

/**
 * Get all terms versions (for admin)
 */
router.get('/all', authenticateJWT, async (req, res) => {
  try {
    const terms = await TermsAndConditions.find()
      .sort({ effectiveDate: -1 });

    res.json(terms);
  } catch (error) {
    console.error('Failed to get all terms:', error);
    res.status(500).json({ error: 'Failed to get terms and conditions' });
  }
});

/**
 * Accept terms and conditions
 */
router.post('/accept', authenticateJWT, async (req, res) => {
  try {
    const { termsVersion, accepted } = req.body;
    const userId = (req.user as any)._id;

    if (!termsVersion) {
      return res.status(400).json({ error: 'Terms version required' });
    }

    if (accepted === false) {
      // User declined terms - redirect away or show message
      return res.json({ 
        success: false, 
        message: 'Terms acceptance required to continue' 
      });
    }

    // Verify terms version exists and is active
    const terms = await TermsAndConditions.findOne({ 
      version: termsVersion,
      isActive: true 
    });

    if (!terms) {
      return res.status(404).json({ error: 'Invalid terms version' });
    }

    // Check if user already accepted this version
    const existingAgreement = await UserAgreement.findOne({
      userId,
      termsVersion,
      isWithdrawn: false
    });

    if (existingAgreement) {
      return res.json({ 
        success: true, 
        message: 'Terms already accepted',
        acceptedAt: existingAgreement.acceptedAt
      });
    }

    // Create new agreement record
    const agreement = new UserAgreement({
      userId,
      termsVersion,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    await agreement.save();

    logInfo('terms_accepted', {
      userId,
      termsVersion,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Terms accepted successfully',
      acceptedAt: agreement.acceptedAt
    });
  } catch (error) {
    console.error('Failed to accept terms:', error);
    res.status(500).json({ error: 'Failed to accept terms and conditions' });
  }
});

/**
 * Check if user has accepted current terms
 */
router.get('/status', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any)._id;

    // Get current active terms
    const currentTerms = await TermsAndConditions.findOne({ isActive: true })
      .sort({ effectiveDate: -1 });

    if (!currentTerms) {
      return res.json({ 
        hasCurrentTerms: false,
        required: false
      });
    }

    // Check if user accepted current terms
    const agreement = await UserAgreement.findOne({
      userId,
      termsVersion: currentTerms.version,
      isWithdrawn: false
    });

    res.json({
      hasCurrentTerms: true,
      required: true,
      accepted: !!agreement,
      acceptedAt: agreement?.acceptedAt,
      termsVersion: currentTerms.version,
      termsTitle: currentTerms.title
    });
  } catch (error) {
    console.error('Failed to check terms status:', error);
    res.status(500).json({ error: 'Failed to check terms status' });
  }
});

/**
 * Get user's agreement history
 */
router.get('/history', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any)._id;

    const agreements = await UserAgreement.find({ userId })
      .populate('termsVersion', 'version title effectiveDate')
      .sort({ acceptedAt: -1 });

    res.json(agreements);
  } catch (error) {
    console.error('Failed to get agreement history:', error);
    res.status(500).json({ error: 'Failed to get agreement history' });
  }
});

/**
 * Create new terms version (admin only)
 */
router.post('/create', authenticateJWT, async (req, res) => {
  try {
    const user = req.user as any;
    
    // Check if user is admin
    if (user.role !== 'admin' && user.role !== 'developer') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { version, title, content, effectiveDate } = req.body;

    if (!version || !title || !content) {
      return res.status(400).json({ 
        error: 'Version, title, and content required' 
      });
    }

    // Check if version already exists
    const existingTerms = await TermsAndConditions.findOne({ version });
    if (existingTerms) {
      return res.status(409).json({ error: 'Terms version already exists' });
    }

    // Create new terms
    const terms = new TermsAndConditions({
      version,
      title,
      content,
      effectiveDate: effectiveDate || new Date(),
      isActive: true
    });

    await terms.save();

    logInfo('terms_created', {
      version,
      title,
      effectiveDate: terms.effectiveDate,
      adminId: user._id
    });

    res.json({
      success: true,
      terms: {
        version: terms.version,
        title: terms.title,
        effectiveDate: terms.effectiveDate,
        isActive: terms.isActive
      }
    });
  } catch (error) {
    console.error('Failed to create terms:', error);
    res.status(500).json({ error: 'Failed to create terms and conditions' });
  }
});

/**
 * Update terms version (admin only)
 */
router.put('/:version', authenticateJWT, async (req, res) => {
  try {
    const user = req.user as any;
    const { version } = req.params;
    
    if (user.role !== 'admin' && user.role !== 'developer') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, content, isActive, effectiveDate } = req.body;

    const terms = await TermsAndConditions.findOne({ version });
    if (!terms) {
      return res.status(404).json({ error: 'Terms version not found' });
    }

    if (title) terms.title = title;
    if (content) terms.content = content;
    if (isActive !== undefined) terms.isActive = isActive;
    if (effectiveDate) terms.effectiveDate = effectiveDate;

    await terms.save();

    logInfo('terms_updated', {
      version,
      updatedBy: user._id,
      changes: { title, isActive, effectiveDate }
    });

    res.json({
      success: true,
      terms
    });
  } catch (error) {
    console.error('Failed to update terms:', error);
    res.status(500).json({ error: 'Failed to update terms and conditions' });
  }
});

/**
 * Get terms acceptance statistics (admin only)
 */
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    const user = req.user as any;
    
    if (user.role !== 'admin' && user.role !== 'developer') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const currentTerms = await TermsAndConditions.findOne({ isActive: true })
      .sort({ effectiveDate: -1 });

    if (!currentTerms) {
      return res.json({
        totalUsers: 0,
        acceptedUsers: 0,
        acceptanceRate: 0,
        termsVersion: null
      });
    }

    const totalUsers = await require('../models/User').countDocuments();
    const acceptedUsers = await UserAgreement.countDocuments({
      termsVersion: currentTerms.version,
      isWithdrawn: false
    });

    const acceptanceRate = totalUsers ? (acceptedUsers / totalUsers) * 100 : 0;

    res.json({
      totalUsers,
      acceptedUsers,
      acceptanceRate,
      termsVersion: currentTerms.version,
      termsTitle: currentTerms.title
    });
  } catch (error) {
    console.error('Failed to get terms stats:', error);
    res.status(500).json({ error: 'Failed to get terms statistics' });
  }
});

export default router;
