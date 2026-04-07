import express from 'express';
import mongoose from 'mongoose';
import { body } from 'express-validator';
import SponsorshipApplication from '../models/SponsorshipApplication';
import { authenticateJWT } from '../middleware/auth';
import { idempotency } from '../middleware/idempotency';
import { validateRequest } from '../middleware/validate';
import {
  getSponsorshipOverview,
  SPONSORSHIP_OPEN_STATUSES,
  SPONSORSHIP_REVIEW_WINDOW_DAYS
} from '../services/sponsorshipService';

const router = express.Router();

const createApplicationValidators = [
  body('applicantType')
    .isIn(['player', 'team'])
    .withMessage('applicantType must be player or team'),
  body('teamId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('teamId is required'),
  body('contactName')
    .isString()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('contactName must be between 2 and 120 characters'),
  body('contactEmail')
    .isEmail()
    .withMessage('contactEmail must be a valid email'),
  body('requestSummary')
    .isString()
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('requestSummary must be between 10 and 200 characters'),
  body('comment')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage('comment cannot exceed 2000 characters'),
  body('contactTelegram')
    .optional()
    .isString()
    .isLength({ max: 120 })
    .withMessage('contactTelegram cannot exceed 120 characters'),
  body('contactDiscord')
    .optional()
    .isString()
    .isLength({ max: 120 })
    .withMessage('contactDiscord cannot exceed 120 characters')
];

const getUserId = (req: any): string | null => {
  const value = req.user?._id || req.user?.id;
  return value ? String(value) : null;
};

const normalizeNicknames = (input: unknown): string[] => {
  const raw = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(/[\n,]/g)
      : [];

  const normalized = raw
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .slice(0, 10);

  return Array.from(new Set(normalized));
};

router.get('/overview', authenticateJWT, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const overview = await getSponsorshipOverview(userId);
    return res.json({ success: true, data: overview });
  } catch (error: any) {
    return res.status(error?.statusCode || 500).json({
      success: false,
      error: error?.message || 'Failed to load sponsorship overview'
    });
  }
});

router.post(
  '/applications',
  authenticateJWT,
  idempotency({ required: true }),
  createApplicationValidators,
  validateRequest,
  async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const teamId = String(req.body?.teamId || '').trim();
      const applicantType = String(req.body?.applicantType || '').trim() as 'player' | 'team';
      if (!mongoose.Types.ObjectId.isValid(teamId)) {
        return res.status(400).json({ success: false, error: 'Invalid teamId' });
      }

      const nicknames = normalizeNicknames(req.body?.nicknames);
      if (nicknames.length === 0) {
        return res.status(400).json({ success: false, error: 'At least one nickname is required' });
      }

      const overview = await getSponsorshipOverview(userId);
      const selectedTeam = Array.isArray(overview?.teams)
        ? overview.teams.find((team: any) => String(team?.id || '') === teamId)
        : null;

      if (!selectedTeam) {
        return res.status(403).json({
          success: false,
          error: 'Selected team is not available for this account'
        });
      }

      const eligibility = applicantType === 'team'
        ? selectedTeam?.eligibility?.team
        : selectedTeam?.eligibility?.player;

      if (!eligibility?.eligible) {
        return res.status(400).json({
          success: false,
          error: 'Sponsorship conditions are not met',
          details: eligibility?.reasons || []
        });
      }

      const existingOpen = await SponsorshipApplication.findOne({
        submittedBy: userId,
        team: teamId,
        applicantType,
        status: { $in: SPONSORSHIP_OPEN_STATUSES }
      })
        .select('_id')
        .lean();

      if (existingOpen?._id) {
        return res.status(409).json({
          success: false,
          error: 'You already have an active sponsorship application for this team and type'
        });
      }

      const now = new Date();
      const reviewDeadlineAt = new Date(now.getTime() + SPONSORSHIP_REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      const snapshotReasons = applicantType === 'team'
        ? selectedTeam?.eligibility?.team?.reasons || []
        : selectedTeam?.eligibility?.player?.reasons || [];

      const application = await SponsorshipApplication.create({
        submittedBy: userId,
        team: teamId,
        applicantType,
        status: 'pending',
        contactName: String(req.body?.contactName || '').trim(),
        contactEmail: String(req.body?.contactEmail || '').trim().toLowerCase(),
        contactTelegram: String(req.body?.contactTelegram || '').trim(),
        contactDiscord: String(req.body?.contactDiscord || '').trim(),
        nicknames,
        requestSummary: String(req.body?.requestSummary || '').trim(),
        comment: String(req.body?.comment || '').trim(),
        reviewDeadlineAt,
        eligibilitySnapshot: {
          checkedAt: now,
          userTournamentWins: Number(selectedTeam?.metrics?.userTournamentWins || 0),
          teamTournamentWins: Number(selectedTeam?.metrics?.teamTournamentWins || 0),
          teamRank:
            selectedTeam?.metrics?.teamRank === null || selectedTeam?.metrics?.teamRank === undefined
              ? undefined
              : Number(selectedTeam.metrics.teamRank),
          isTop20: Boolean(selectedTeam?.metrics?.isTop20),
          topRankLimit: Number(overview?.requirements?.teamTopRank || 20),
          teamCreatedAt: selectedTeam?.createdAt ? new Date(selectedTeam.createdAt) : undefined,
          teamAgeDays: Number(selectedTeam?.metrics?.teamAgeDays || 0),
          teamAgeEligibleAt: selectedTeam?.metrics?.teamAgeEligibleAt
            ? new Date(selectedTeam.metrics.teamAgeEligibleAt)
            : undefined,
          minTeamAgeMonths: Number(overview?.requirements?.teamAgeMonths || 3),
          isTeamOldEnough: Boolean(selectedTeam?.metrics?.isTeamOldEnough),
          applicantEligible: true,
          reasons: snapshotReasons
        },
        statusTimeline: [{
          status: 'pending',
          note: 'Application submitted',
          actor: req.user?._id,
          createdAt: now
        }]
      });

      return res.status(201).json({
        success: true,
        data: {
          id: String(application._id),
          reviewDeadlineAt: reviewDeadlineAt.toISOString()
        }
      });
    } catch (error: any) {
      return res.status(error?.statusCode || 500).json({
        success: false,
        error: error?.message || 'Failed to create sponsorship application'
      });
    }
  }
);

export default router;
