import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Tournament from '../models/Tournament';

/**
 * Middleware to check if user can access/register for tournaments
 * This is the main paywall logic
 */
export const checkTournamentAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        redirectTo: '/auth'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        redirectTo: '/auth'
      });
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({ 
        error: 'Account banned',
        redirectTo: '/banned'
      });
    }

    // Main access control logic
    const canJoinTournament = user.canJoinTournament();
    
    if (!canJoinTournament) {
      return res.status(402).json({ 
        error: 'Subscription required',
        message: 'You need an active subscription or free entries to join tournaments',
        redirectTo: '/billing',
        requiresSubscription: true,
        freeEntriesCount: user.freeEntriesCount,
        isSubscribed: user.isSubscribed,
        subscriptionExpiresAt: user.subscriptionExpiresAt
      });
    }

    // Add user info to request for downstream use
    (req as any).tournamentUser = user;
    
    next();
  } catch (error) {
    console.error('Tournament access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user can register for a specific tournament
 * (includes tournament-specific checks like capacity, registration status, etc.)
 */
export const checkTournamentRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tournamentId } = req.params;
    const user = (req as any).tournamentUser;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Check if registration is open
    if (!tournament.isRegistrationOpen) {
      return res.status(400).json({ 
        error: 'Registration is closed for this tournament' 
      });
    }

    // Check if tournament hasn't started yet
    if (tournament.startDate <= new Date()) {
      return res.status(400).json({ 
        error: 'Tournament has already started' 
      });
    }

    // Check if user is already registered
    const isAlreadyRegistered = tournament.registeredPlayers.some(
      (id: mongoose.Types.ObjectId) => id.toString() === user._id.toString()
    );

    if (isAlreadyRegistered) {
      return res.status(400).json({ 
        error: 'Already registered for this tournament' 
      });
    }

    // Check tournament capacity
    if (tournament.registeredPlayers.length >= tournament.maxPlayers) {
      return res.status(400).json({ 
        error: 'Tournament is full' 
      });
    }

    // Add tournament to request for downstream use
    (req as any).tournament = tournament;
    
    next();
  } catch (error) {
    console.error('Tournament registration check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to consume free entry if user doesn't have subscription
 */
export const consumeFreeEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).tournamentUser;

    if (!user.hasActiveSubscription() && user.freeEntriesCount > 0) {
      // Use free entry
      const success = await user.useFreeEntry();
      
      if (!success) {
        return res.status(402).json({ 
          error: 'No free entries available',
          redirectTo: '/billing'
        });
      }

      // Add info to request for response
      (req as any).usedFreeEntry = true;
    }

    next();
  } catch (error) {
    console.error('Free entry consumption error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
