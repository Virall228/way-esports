import { Request, Response, NextFunction } from 'express';
import Tournament from '../models/Tournament';
import { Team } from '../models/Team';
import { IUser } from '../models/User';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Check if user can manage tournament (admin or creator)
export const canManageTournament = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Admins can manage any tournament
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Tournament creator can manage their tournament
    if (tournament.createdBy && req.user && tournament.createdBy.toString() === req.user.id) {
      return next();
    }

    return res.status(403).json({ message: 'Insufficient permissions' });
  } catch (error) {
    console.error('Error checking tournament permissions:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Check if user can register for tournament
export const canRegisterForTournament = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Check if registration is open
    if (tournament.isRegistrationOpen === false) {
      return res.status(400).json({ message: 'Registration is closed' });
    }

    next();
  } catch (error) {
    console.error('Error checking registration permissions:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Check if user owns the team they're trying to register
export const canRegisterTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { teamId } = req.body;
    if (!teamId) {
      return res.status(400).json({ message: 'Team ID is required' });
    }

    // Admins can register any team
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is the team captain
    if (req.user?.id && team.captain.toString() !== req.user.id) {
      // Check if user is a member of the team
      const isMember = team.players && team.players.some(player => 
        req.user && player.userId && player.userId.toString() === req.user.id && player.isActive
      );

      if (!isMember) {
        return res.status(403).json({ message: 'You are not a member of this team' });
      }
    }

    next();
  } catch (error) {
    console.error('Error checking team registration permissions:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Check if user can update match results
export const canUpdateMatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Only admins and tournament creators can update match results
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (tournament.createdBy && req.user && tournament.createdBy.toString() === req.user.id) {
      return next();
    }

    return res.status(403).json({ message: 'Only tournament organizers can update match results' });
  } catch (error) {
    console.error('Error checking match update permissions:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Validate tournament data
export const validateTournamentData = (req: Request, res: Response, next: NextFunction) => {
  const {
    name,
    game,
    startDate,
    endDate,
    prizePool,
    description,
    rules,
    format,
    type,
    maxTeams,
    maxPlayers
  } = req.body;

  // Required fields
  if (!name || !game || !startDate || !endDate || !prizePool || !description || !rules || !format || !type) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (start <= now) {
    return res.status(400).json({ message: 'Start date must be in the future' });
  }

  if (end <= start) {
    return res.status(400).json({ message: 'End date must be after start date' });
  }

  // Validate tournament type
  if (!['team', 'solo', 'mixed'].includes(type)) {
    return res.status(400).json({ message: 'Invalid tournament type' });
  }

  // Validate format
  if (!['single_elimination', 'double_elimination', 'round_robin'].includes(format)) {
    return res.status(400).json({ message: 'Invalid tournament format' });
  }

  // Validate participant limits
  if (type === 'team' && (!maxTeams || maxTeams < 2)) {
    return res.status(400).json({ message: 'Team tournaments must have at least 2 team slots' });
  }

  if (type === 'solo' && (!maxPlayers || maxPlayers < 2)) {
    return res.status(400).json({ message: 'Solo tournaments must have at least 2 player slots' });
  }

  if (type === 'mixed' && (!maxTeams && !maxPlayers)) {
    return res.status(400).json({ message: 'Mixed tournaments must have team or player slots' });
  }

  // Validate prize pool
  if (prizePool < 0) {
    return res.status(400).json({ message: 'Prize pool cannot be negative' });
  }

  next();
};

// Rate limiting for tournament operations
const operationCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitTournamentOperations = (maxOperations: number = 10, windowMs: number = 60000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user?.id || '';
    const now = Date.now();
    const userOperations = operationCounts.get(userId);

    if (!userOperations || now > userOperations.resetTime) {
      // Reset or initialize counter
      operationCounts.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (userOperations.count >= maxOperations) {
      return res.status(429).json({ 
        message: 'Too many operations. Please try again later.',
        retryAfter: Math.ceil((userOperations.resetTime - now) / 1000)
      });
    }

    userOperations.count++;
    next();
  };
};

// Check tournament capacity before registration
export const checkTournamentCapacity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    const totalParticipants = (tournament.registeredTeams?.length || 0) + (tournament.registeredPlayers?.length || 0);
    
    if (tournament.type === 'team') {
      if (tournament.maxTeams && tournament.registeredTeams && tournament.registeredTeams.length >= tournament.maxTeams) {
        return res.status(400).json({ message: 'Tournament is full' });
      }
    } else if (tournament.type === 'solo') {
          if (tournament.maxPlayers && tournament.registeredPlayers && tournament.registeredPlayers.length >= tournament.maxPlayers) {
      return res.status(400).json({ message: 'Tournament is full' });
    }
    } else if (tournament.type === 'mixed') {
      const maxTotal = (tournament.maxTeams || 0) + (tournament.maxPlayers || 0);
      if (totalParticipants >= maxTotal) {
        return res.status(400).json({ message: 'Tournament is full' });
      }
    }

    next();
  } catch (error) {
    console.error('Error checking tournament capacity:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Prevent duplicate registrations
export const preventDuplicateRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    const userId = req.user?.id || '';

    // Check if user is already registered as solo player
    if (tournament.registeredPlayers && tournament.registeredPlayers.includes(userId as any)) {
      return res.status(400).json({ message: 'Already registered as solo player' });
    }

    // For team registration, check if team is already registered
    if (req.body.teamId && tournament.registeredTeams && tournament.registeredTeams.includes(req.body.teamId)) {
      return res.status(400).json({ message: 'Team already registered' });
    }

    // TODO: Check if user is already registered with another team
    // This would require checking team rosters

    next();
  } catch (error) {
    console.error('Error checking duplicate registration:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};