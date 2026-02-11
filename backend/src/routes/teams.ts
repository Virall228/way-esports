import express from 'express';
import Team, { ITeam } from '../models/Team';
import User from '../models/User';
import Tournament from '../models/Tournament';
import TournamentRegistration from '../models/TournamentRegistration';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { checkTournamentAccess } from '../middleware/tournamentAccess';

const router = express.Router();

const getUserId = (req: any): string | null => {
  const value = req.user?._id || req.user?.id;
  return value ? value.toString() : null;
};

const isAdminUser = (req: any): boolean => {
  const role = req.user?.role;
  return role === 'admin' || role === 'developer';
};

const getTournamentParticipationTeamId = async (
  userId: string,
  tournamentId: string
): Promise<string | null> => {
  const activeRegistration: any = await TournamentRegistration.findOne({
    userId,
    tournamentId,
    status: 'active'
  }).select('teamId').lean();

  if (activeRegistration?.teamId) {
    return activeRegistration.teamId.toString();
  }

  const legacyTeam: any = await Team.findOne({
    tournamentId,
    $or: [
      { captain: userId },
      { members: userId }
    ]
  }).select('_id').lean();

  return legacyTeam?._id ? legacyTeam._id.toString() : null;
};

// Get all teams
router.get('/', async (req, res) => {
  try {
    const { game, status } = req.query;
    const query: any = {};

    if (game) query.game = game;
    if (status) query.status = status;

    const teams = await Team.find(query)
      .populate('captain', 'username firstName lastName profileLogo')
      .populate('members', 'username firstName lastName profileLogo')
      .populate('achievements.tournamentId', 'name prizePool')
      .sort({ 'stats.winRate': -1 })
      .lean();

    // Transform for frontend compatibility
    const transformed = teams.map((team: any) => ({
      id: String(team._id),
      name: team.name,
      tag: team.tag || '',
      logo: team.logo || '',
      game: team.game,
      description: team.description || '',
      isPrivate: !!team.isPrivate,
      requiresApproval: team.requiresApproval !== false,
      tournamentId: team.tournamentId?.toString?.() || team.tournamentId || null,
      status: team.status || 'active',
      captain: team.captain ? {
        id: team.captain._id?.toString() || '',
        username: team.captain.username || '',
        firstName: team.captain.firstName || '',
        lastName: team.captain.lastName || '',
        profileLogo: team.captain.profileLogo || ''
      } : null,
      members: (team.members || []).map((member: any) => ({
        id: member._id?.toString() || member.toString(),
        username: member.username || '',
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        profileLogo: member.profileLogo || ''
      })),
      stats: {
        totalMatches: team.stats?.totalMatches || 0,
        wins: team.stats?.wins || 0,
        losses: team.stats?.losses || 0,
        winRate: team.stats?.winRate || 0,
        totalPrizeMoney: team.stats?.totalPrizeMoney || 0
      },
      achievements: (team.achievements || []).map((ach: any) => ({
        tournamentId: ach.tournamentId?._id?.toString() || ach.tournamentId?.toString() || '',
        tournamentName: ach.tournamentId?.name || '',
        position: ach.position || 0,
        prize: ach.prize || 0,
        date: ach.date?.toISOString() || new Date().toISOString()
      })),
      tournaments: team.achievements?.length || 0,
      createdAt: team.createdAt?.toISOString(),
      updatedAt: team.updatedAt?.toISOString()
    }));

    res.json({
      success: true,
      data: transformed
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams'
    });
  }
});

// Create team for a specific tournament (strict one-team-per-tournament rule)
router.post('/create',
  authenticateJWT,
  checkTournamentAccess,
  body('name').notEmpty().withMessage('Team name is required'),
  body('tag').isLength({ min: 2, max: 5 }).withMessage('Tag must be 2-5 characters'),
  body('game').notEmpty().withMessage('Game is required'),
  body('tournamentId').isMongoId().withMessage('Tournament ID is required'),
  validateRequest,
  async (req: any, res: any) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const tournamentId = req.body.tournamentId;
      const tournament = await Tournament.findById(tournamentId).select('_id isRegistrationOpen status');

      if (!tournament) {
        return res.status(404).json({ success: false, error: 'Tournament not found' });
      }

      if (tournament.isRegistrationOpen === false || tournament.status !== 'upcoming') {
        return res.status(400).json({ success: false, error: 'Tournament registration is closed' });
      }

      const participationTeamId = await getTournamentParticipationTeamId(userId, tournamentId);
      if (participationTeamId) {
        return res.status(409).json({
          success: false,
          error: 'You are already participating in this tournament'
        });
      }

      const existingTeam = await Team.findOne({
        $or: [
          { name: req.body.name },
          { tag: req.body.tag }
        ]
      }).select('_id');

      if (existingTeam) {
        return res.status(400).json({ success: false, error: 'Team name or tag already exists' });
      }

      const team = new Team({
        ...req.body,
        tournamentId,
        captain: userId,
        members: [userId],
        players: [userId]
      });
      await team.save();

      try {
        await TournamentRegistration.create({
          userId,
          teamId: team._id,
          tournamentId,
          role: 'owner',
          status: 'active'
        });
      } catch (registrationError: any) {
        await Team.findByIdAndDelete(team._id);
        if (registrationError?.code === 11000) {
          return res.status(409).json({
            success: false,
            error: 'You are already participating in this tournament'
          });
        }
        throw registrationError;
      }

      await User.findByIdAndUpdate(userId, {
        $addToSet: {
          teams: team._id,
          participatingTournaments: tournamentId
        }
      });

      await Tournament.findByIdAndUpdate(tournamentId, {
        $addToSet: { registeredTeams: team._id }
      });

      return res.status(201).json({
        success: true,
        data: {
          id: String(team._id),
          name: team.name,
          tag: team.tag || '',
          logo: team.logo || '',
          game: team.game,
          description: team.description || '',
          tournamentId: team.tournamentId?.toString() || null,
          status: team.status || 'active',
          members: team.members.map((member: any) => member.toString())
        }
      });
    } catch (error: any) {
      console.error('Error creating tournament team:', error);
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'You are already participating in this tournament'
        });
      }
      return res.status(500).json({ success: false, error: 'Failed to create team' });
    }
  }
);

// Join an existing team for a specific tournament
router.post('/join',
  authenticateJWT,
  checkTournamentAccess,
  body('teamId').isMongoId().withMessage('Team ID is required'),
  body('tournamentId').optional().isMongoId().withMessage('Invalid tournament ID'),
  validateRequest,
  async (req: any, res: any) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { teamId } = req.body;
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }

      const resolvedTournamentId = req.body.tournamentId || team.tournamentId?.toString();
      if (!resolvedTournamentId) {
        return res.status(400).json({
          success: false,
          error: 'Team is not linked to a tournament'
        });
      }

      if (team.tournamentId && team.tournamentId.toString() !== resolvedTournamentId) {
        return res.status(400).json({
          success: false,
          error: 'Tournament mismatch for selected team'
        });
      }

      const tournament = await Tournament.findById(resolvedTournamentId).select('_id isRegistrationOpen status');
      if (!tournament) {
        return res.status(404).json({ success: false, error: 'Tournament not found' });
      }

      if (tournament.isRegistrationOpen === false || tournament.status !== 'upcoming') {
        return res.status(400).json({ success: false, error: 'Tournament registration is closed' });
      }

      const participationTeamId = await getTournamentParticipationTeamId(userId, resolvedTournamentId);
      if (participationTeamId && participationTeamId !== String(team._id)) {
        return res.status(409).json({
          success: false,
          error: 'You are already participating in this tournament'
        });
      }

      if (team.members.some((member: any) => member.toString() === userId)) {
        return res.status(400).json({ success: false, error: 'User is already a team member' });
      }

      team.members.push(userId as any);
      if (!Array.isArray(team.players)) {
        team.players = [];
      }
      if (!team.players.some((player: any) => player.toString() === userId)) {
        team.players.push(userId as any);
      }
      await team.save();

      await TournamentRegistration.findOneAndUpdate(
        { userId, tournamentId: resolvedTournamentId },
        {
          $set: {
            teamId: team._id,
            role: 'member',
            status: 'active'
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await User.findByIdAndUpdate(userId, {
        $addToSet: {
          teams: team._id,
          participatingTournaments: resolvedTournamentId
        }
      });

      await Tournament.findByIdAndUpdate(resolvedTournamentId, {
        $addToSet: { registeredTeams: team._id }
      });

      return res.json({
        success: true,
        data: {
          id: String(team._id),
          name: team.name,
          tag: team.tag || '',
          game: team.game,
          tournamentId: resolvedTournamentId,
          members: team.members.map((member: any) => member.toString())
        }
      });
    } catch (error: any) {
      console.error('Error joining tournament team:', error);
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'You are already participating in this tournament'
        });
      }
      return res.status(500).json({ success: false, error: 'Failed to join team' });
    }
  }
);

// Get team by ID
router.get('/:id', async (req, res) => {
  try {
    const team: any = await Team.findById(req.params.id)
      .populate('captain', 'username firstName lastName profileLogo telegramId')
      .populate('members', 'username firstName lastName profileLogo telegramId')
      .populate('achievements.tournamentId', 'name prizePool startDate endDate')
      .lean();

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    // Transform for frontend compatibility
    const transformed: any = {
      id: String(team._id),
      name: team.name,
      tag: team.tag || '',
      logo: team.logo || '',
      game: team.game,
      description: team.description || '',
      isPrivate: !!team.isPrivate,
      requiresApproval: team.requiresApproval !== false,
      tournamentId: team.tournamentId?.toString?.() || team.tournamentId || null,
      status: team.status || 'active',
      captain: team.captain ? {
        id: team.captain._id?.toString() || '',
        username: team.captain.username || '',
        firstName: team.captain.firstName || '',
        lastName: team.captain.lastName || '',
        profileLogo: team.captain.profileLogo || '',
        telegramId: team.captain.telegramId || ''
      } : null,
      members: (team.members || []).map((member: any) => ({
        id: member._id?.toString() || member.toString(),
        username: member.username || '',
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        profileLogo: member.profileLogo || '',
        telegramId: member.telegramId || ''
      })),
      stats: {
        totalMatches: team.stats?.totalMatches || 0,
        wins: team.stats?.wins || 0,
        losses: team.stats?.losses || 0,
        winRate: team.stats?.winRate || 0,
        totalPrizeMoney: team.stats?.totalPrizeMoney || 0
      },
      achievements: (team.achievements || []).map((ach: any) => ({
        tournamentId: ach.tournamentId?._id?.toString() || ach.tournamentId?.toString() || '',
        tournamentName: ach.tournamentId?.name || '',
        position: ach.position || 0,
        prize: ach.prize || 0,
        date: ach.date?.toISOString() || new Date().toISOString()
      })),
      tournaments: team.achievements?.length || 0,
      createdAt: team.createdAt?.toISOString(),
      updatedAt: team.updatedAt?.toISOString()
    };

    res.json({
      success: true,
      data: transformed
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team'
    });
  }
});

// Create team
router.post('/',
  authenticateJWT,
  isAdmin,
  body('name').notEmpty().withMessage('Team name is required'),
  body('tag').isLength({ min: 2, max: 5 }).withMessage('Tag must be 2-5 characters'),
  body('game').notEmpty().withMessage('Game is required'),
  validateRequest,
  async (req: any, res: any) => {
    try {
      const teamData: Partial<ITeam> = {
        ...req.body
      };
      // If authenticated user exists, attach as captain/member; otherwise allow anonymous create
      if (req.user?.id) {
        teamData.captain = req.user.id as any;
        teamData.members = [req.user.id as any];
      }

      // Check if team name or tag already exists
      const existingTeam = await Team.findOne({
        $or: [
          { name: teamData.name },
          { tag: teamData.tag }
        ]
      });

      if (existingTeam) {
        return res.status(400).json({
          success: false,
          error: 'Team name or tag already exists'
        });
      }

      const team = new Team(teamData);
      await team.save();

      // Add team to user's teams
      if (req.user?.id) {
        await User.findByIdAndUpdate(req.user.id, {
          $push: { teams: team._id }
        });
      }

      // Transform response for frontend
      const transformed: any = {
        id: String(team._id),
        name: team.name,
        tag: team.tag || '',
        logo: team.logo || '',
        game: team.game,
        description: team.description || '',
        isPrivate: !!team.isPrivate,
        requiresApproval: team.requiresApproval !== false,
        tournamentId: team.tournamentId?.toString() || null,
        status: team.status || 'active',
        captain: team.captain ? {
          id: team.captain.toString(),
          username: '',
          firstName: '',
          lastName: ''
        } : null,
        members: (team.members || []).map((m: any) => ({
          id: m.toString(),
          username: '',
          firstName: '',
          lastName: ''
        })),
        stats: {
          totalMatches: team.stats?.totalMatches || 0,
          wins: team.stats?.wins || 0,
          losses: team.stats?.losses || 0,
          winRate: team.stats?.winRate || 0,
          totalPrizeMoney: team.stats?.totalPrizeMoney || 0
        },
        tournaments: 0,
        createdAt: team.createdAt?.toISOString(),
        updatedAt: team.updatedAt?.toISOString()
      };

      res.status(201).json({
        success: true,
        data: transformed
      });
    } catch (error: any) {
      console.error('Error creating team:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, error: error.message });
      }
      if (error.code === 11000) {
        return res.status(400).json({ success: false, error: 'Team name or tag already exists' });
      }
      res.status(500).json({ success: false, error: 'Failed to create team' });
    }
  });

// Bulk create teams (admin/import use)
router.post('/batch', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    if (!items.length) {
      return res.status(400).json({ success: false, error: 'Request body must be a non-empty array' });
    }

    // Optional attach captains if caller is authenticated
    const payload = items.map((item) => {
      const doc: any = { ...item };
      if (req.user?.id && !doc.captain) {
        doc.captain = req.user.id;
        doc.members = doc.members && Array.isArray(doc.members) ? doc.members : [req.user.id];
      }
      return doc;
    });

    const result = await Team.insertMany(payload, { ordered: false });

    res.status(201).json({
      success: true,
      inserted: result.length,
      data: result
    });
  } catch (error: any) {
    console.error('Error bulk creating teams:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Duplicate team name or tag in batch' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Failed to create teams' });
  }
});

// Update team
router.put('/:id',
  authenticateJWT,
  body('name').optional().notEmpty().withMessage('Team name cannot be empty'),
  body('tag').optional().isLength({ min: 2, max: 5 }).withMessage('Tag must be 2-5 characters'),
  validateRequest,
  async (req: any, res: any) => {
    try {
      const requesterId = getUserId(req);
      if (!requesterId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const team = await Team.findById(req.params.id);

      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }

      if (!isAdminUser(req) && team.captain && team.captain.toString() !== requesterId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this team'
        });
      }

      const updatedTeam: any = await Team.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      ).populate('captain', 'username firstName lastName')
        .populate('members', 'username firstName lastName')
        .lean();

      if (!updatedTeam) {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }

      // Transform response
      const transformed: any = {
        id: String(updatedTeam._id),
        name: updatedTeam.name,
        tag: updatedTeam.tag || '',
        logo: updatedTeam.logo || '',
        game: updatedTeam.game,
        description: updatedTeam.description || '',
        isPrivate: !!updatedTeam.isPrivate,
        requiresApproval: updatedTeam.requiresApproval !== false,
        tournamentId: updatedTeam.tournamentId?.toString?.() || updatedTeam.tournamentId || null,
        status: updatedTeam.status || 'active',
        captain: updatedTeam.captain ? {
          id: updatedTeam.captain._id?.toString() || '',
          username: updatedTeam.captain.username || '',
          firstName: updatedTeam.captain.firstName || '',
          lastName: updatedTeam.captain.lastName || ''
        } : null,
        members: (updatedTeam.members || []).map((m: any) => ({
          id: m._id?.toString() || m.toString(),
          username: m.username || '',
          firstName: m.firstName || '',
          lastName: m.lastName || ''
        })),
        stats: updatedTeam.stats || {}
      };

      res.json({
        success: true,
        data: transformed
      });
    } catch (error) {
      console.error('Error updating team:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update team'
      });
    }
  });

// Add member to team
router.post('/:id/members', authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.body;
    const requesterId = getUserId(req);
    if (!requesterId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    if (!isAdminUser(req) && team.captain && team.captain.toString() !== requesterId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add members'
      });
    }

    if (team.members.some((member: any) => member.toString() === userId)) {
      return res.status(400).json({
        success: false,
        error: 'User is already a team member'
      });
    }

    if (team.tournamentId) {
      const participationTeamId = await getTournamentParticipationTeamId(userId, team.tournamentId.toString());
      if (participationTeamId && participationTeamId !== String(team._id)) {
        return res.status(409).json({
          success: false,
          error: 'You are already participating in this tournament'
        });
      }

      await TournamentRegistration.findOneAndUpdate(
        { userId, tournamentId: team.tournamentId },
        {
          $set: {
            teamId: team._id,
            role: 'member',
            status: 'active'
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await User.findByIdAndUpdate(userId, {
        $addToSet: { participatingTournaments: team.tournamentId }
      });
    }

    team.members.push(userId);
    await team.save();

    // Add team to user's teams
    await User.findByIdAndUpdate(userId, {
      $addToSet: { teams: team._id }
    });

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add team member'
    });
  }
});

// Remove member from team
router.delete('/:id/members/:userId', authenticateJWT, async (req, res) => {
  try {
    const requesterId = getUserId(req);
    if (!requesterId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    if (!isAdminUser(req) && team.captain && team.captain.toString() !== requesterId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to remove members'
      });
    }

    if (team.captain && req.params.userId === team.captain.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove team captain'
      });
    }

    team.members = team.members.filter(
      member => member.toString() !== req.params.userId
    );
    await team.save();

    // Remove team from user's teams
    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { teams: team._id }
    });

    if (team.tournamentId) {
      await TournamentRegistration.findOneAndUpdate(
        {
          userId: req.params.userId,
          teamId: team._id,
          tournamentId: team.tournamentId
        },
        { $set: { status: 'left' } }
      );

      await User.findByIdAndUpdate(req.params.userId, {
        $pull: { participatingTournaments: team.tournamentId }
      });
    }

    // Transform response
    const transformed: any = {
      id: String(team._id),
      name: team.name,
      tag: team.tag || '',
      logo: team.logo || '',
      game: team.game,
      description: team.description || '',
      tournamentId: team.tournamentId?.toString() || null,
      status: team.status || 'active',
      members: team.members.map((m: any) => m.toString())
    };

    res.json({
      success: true,
      data: transformed
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove team member'
    });
  }
});

// Delete team
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const requesterId = getUserId(req);
    if (!requesterId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    if (!isAdminUser(req) && team.captain && team.captain.toString() !== requesterId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this team'
      });
    }

    await Team.findByIdAndDelete(req.params.id);

    if (team.tournamentId) {
      const registrations = await TournamentRegistration.find({
        teamId: team._id,
        tournamentId: team.tournamentId
      }).select('userId').lean();

      const affectedUserIds = registrations.map((registration: any) => registration.userId);

      if (affectedUserIds.length) {
        await User.updateMany(
          { _id: { $in: affectedUserIds } },
          {
            $pull: {
              teams: team._id,
              participatingTournaments: team.tournamentId
            }
          }
        );
      }

      await TournamentRegistration.deleteMany({
        teamId: team._id,
        tournamentId: team.tournamentId
      });

      await Tournament.findByIdAndUpdate(team.tournamentId, {
        $pull: { registeredTeams: team._id }
      });
    } else {
      await User.updateMany(
        { teams: team._id },
        { $pull: { teams: team._id } }
      );
    }

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete team'
    });
  }
});

export default router;
