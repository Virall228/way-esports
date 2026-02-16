import express from 'express';
import Match from '../models/Match';
import Team from '../models/Team';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

const resolveUserId = (req: any): string | null => {
  const value = req.user?._id || req.user?.id;
  return value ? value.toString() : null;
};

const isAdminRole = (req: any): boolean => {
  const role = req.user?.role;
  return role === 'admin' || role === 'developer';
};

const isUserMatchParticipant = async (match: any, userId: string): Promise<boolean> => {
  const [team1, team2] = await Promise.all([
    Team.findById(match.team1).select('members players captain').lean(),
    Team.findById(match.team2).select('members players captain').lean()
  ]);

  const isInTeam = (team: any) => {
    if (!team) return false;
    const members = Array.isArray(team.members) ? team.members.map((m: any) => m.toString()) : [];
    const players = Array.isArray(team.players) ? team.players.map((m: any) => m.toString()) : [];
    const captainId = team.captain?.toString?.();
    return members.includes(userId) || players.includes(userId) || captainId === userId;
  };

  return isInTeam(team1) || isInTeam(team2);
};

router.post('/join', authenticateJWT, async (req: any, res: any) => {
  try {
    const roomId = String(req.body?.roomId || '').trim().toUpperCase();
    const password = String(req.body?.password || '').trim();
    const requesterId = resolveUserId(req);

    if (!requesterId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!roomId || !password) {
      return res.status(400).json({ success: false, error: 'roomId and password are required' });
    }

    const match: any = await Match.findOne({
      'roomCredentials.roomId': roomId,
      'roomCredentials.password': password
    })
      .select('team1 team2 tournament game map startTime status round roomCredentials')
      .lean();

    if (!match) {
      return res.status(404).json({ success: false, error: 'Invalid room credentials' });
    }

    if (!isAdminRole(req)) {
      const isParticipant = await isUserMatchParticipant(match, requesterId);
      if (!isParticipant) {
        return res.status(403).json({ success: false, error: 'Access denied for this room' });
      }
    }

    const now = new Date();
    const visibleAt = match.roomCredentials?.visibleAt ? new Date(match.roomCredentials.visibleAt) : null;
    const expiresAt = match.roomCredentials?.expiresAt ? new Date(match.roomCredentials.expiresAt) : null;

    if (visibleAt && now < visibleAt) {
      return res.status(403).json({
        success: false,
        error: 'Room is not available yet',
        availableAt: visibleAt.toISOString()
      });
    }

    if (expiresAt && now > expiresAt) {
      return res.status(410).json({ success: false, error: 'Room credentials expired' });
    }

    return res.json({
      success: true,
      data: {
        matchId: match._id?.toString?.() || '',
        tournamentId: match.tournament?.toString?.() || '',
        game: match.game || '',
        map: match.map || '',
        round: match.round || '',
        startTime: match.startTime,
        status: match.status || 'scheduled',
        roomId,
        password
      }
    });
  } catch (error) {
    console.error('Error joining tournament room:', error);
    return res.status(500).json({ success: false, error: 'Failed to join tournament room' });
  }
});

export default router;
