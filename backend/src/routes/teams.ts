import express from 'express';
import Team, { ITeam } from '../models/Team';
import User from '../models/User';

const router = express.Router();

// Get all teams
router.get('/', async (req, res) => {
  try {
    const { game, status } = req.query;
    const query: any = {};

    if (game) query.game = game;
    if (status) query.status = status;

    const teams = await Team.find(query)
      .populate('captain', 'username firstName lastName')
      .populate('members', 'username firstName lastName')
      .sort({ 'stats.winRate': -1 });

    res.json({
      success: true,
      data: teams
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
    const team = await Team.findById(req.params.id)
      .populate('captain')
      .populate('members')
      .populate('achievements.tournamentId');

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    res.json({
      success: true,
      data: team
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
router.post('/', async (req, res) => {
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

    res.status(201).json({
      success: true,
      data: team
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
router.put('/:id', async (req, res) => {
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

    const updatedTeam = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      data: updatedTeam
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

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove team member'
    });
  }
});

export default router; 