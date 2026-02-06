import express from 'express';
import Team, { ITeam } from '../models/Team';
import User from '../models/User';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';

const router = express.Router();

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
router.post('/batch', async (req, res) => {
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
  body('name').optional().notEmpty().withMessage('Team name cannot be empty'),
  body('tag').optional().isLength({ min: 2, max: 5 }).withMessage('Tag must be 2-5 characters'),
  validateRequest,
  async (req: any, res: any) => {
    try {
      const team = await Team.findById(req.params.id);

      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }

      if (req.user?.id && team.captain && team.captain.toString() !== req.user.id) {
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
router.post('/:id/members', async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    if (req.user?.id && team.captain && team.captain.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add members'
      });
    }

    if (team.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'User is already a team member'
      });
    }

    team.members.push(userId);
    await team.save();

    // Add team to user's teams
    await User.findByIdAndUpdate(userId, {
      $push: { teams: team._id }
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
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    if (req.user?.id && team.captain && team.captain.toString() !== req.user.id) {
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

    // Transform response
    const transformed: any = {
      id: String(team._id),
      name: team.name,
      tag: team.tag || '',
      logo: team.logo || '',
      game: team.game,
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
router.delete('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    if (req.user?.id && team.captain && team.captain.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this team'
      });
    }

    await Team.findByIdAndDelete(req.params.id);

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