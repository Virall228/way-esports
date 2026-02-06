import { Request, Response, NextFunction } from 'express';
import Tournament from '../models/Tournament';
import User from '../models/User';

/**
 * Middleware to handle concurrent tournament registrations
 * Prevents overbooking when multiple users try to register simultaneously
 */
export const handleTournamentConcurrency = async (req: Request, res: Response, next: NextFunction) => {
  const tournamentId = req.params.id;
  const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;

  if (!tournamentId || !userId) {
    return res.status(400).json({
      error: 'Tournament ID and User ID required'
    });
  }

  try {
    // Use atomic operations to prevent race conditions
    const session = await Tournament.startSession();
    session.startTransaction();

    try {
      // Get tournament with lock
      const tournament = await Tournament.findById(tournamentId)
        .session(session)
        .select('maxParticipants currentParticipants status registeredTeams');

      if (!tournament) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ error: 'Tournament not found' });
      }

      // Check tournament status
      if (tournament.status !== 'upcoming') {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          error: 'Tournament is not accepting registrations',
          status: tournament.status
        });
      }

      // Check if tournament is full
      const currentParticipants = tournament.currentParticipants || 0;
      const maxParticipants = tournament.maxParticipants || 100;

      if (currentParticipants >= maxParticipants) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({
          error: 'Tournament is full',
          currentParticipants,
          maxParticipants,
          isFull: true
        });
      }

      // Check if user is already registered
      const user = await User.findById(userId).session(session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ error: 'User not found' });
      }

      const isAlreadyRegistered = tournament.registeredTeams?.some(
        (teamId: any) => teamId.toString() === userId
      ) || user.teams?.some(teamId =>
        tournament.registeredTeams?.includes(teamId)
      );

      if (isAlreadyRegistered) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({
          error: 'Already registered for this tournament'
        });
      }

      // Atomic increment of participants
      const updatedTournament = await Tournament.findByIdAndUpdate(
        tournamentId,
        {
          $inc: { currentParticipants: 1 },
          $addToSet: { registeredTeams: userId }
        },
        {
          new: true,
          session: session,
          runValidators: true
        }
      ).select('maxParticipants currentParticipants status registeredTeams');

      // Double-check after increment
      if (updatedTournament && (updatedTournament.currentParticipants || 0) > (updatedTournament.maxParticipants || 100)) {
        // Rollback if overbooked
        await Tournament.findByIdAndUpdate(
          tournamentId,
          {
            $inc: { currentParticipants: -1 },
            $pull: { registeredTeams: userId }
          },
          { session: session }
        );

        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({
          error: 'Tournament became full during registration',
          currentParticipants: updatedTournament.currentParticipants,
          maxParticipants: updatedTournament.maxParticipants,
          isFull: true
        });
      }

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      // Add tournament data to request for downstream use
      (req as any).tournamentData = {
        tournament: updatedTournament,
        user,
        registrationSuccessful: true
      };

      next();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Concurrency error during tournament registration:', error);
    return res.status(500).json({
      error: 'Registration failed due to server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Rate limiting for tournament registrations
 * Prevents spam registrations
 */
const registrationAttempts = new Map<string, { count: number; lastAttempt: number }>();

export const rateLimitRegistration = (maxAttempts: number = 5, windowMs: number = 60000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
    const tournamentId = req.params.id;
    const key = `${userId}-${tournamentId}`;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const now = Date.now();
    const attempts = registrationAttempts.get(key);

    if (!attempts) {
      registrationAttempts.set(key, { count: 1, lastAttempt: now });
      return next();
    }

    // Reset if window expired
    if (now - attempts.lastAttempt > windowMs) {
      registrationAttempts.set(key, { count: 1, lastAttempt: now });
      return next();
    }

    // Check limit
    if (attempts.count >= maxAttempts) {
      return res.status(429).json({
        error: 'Too many registration attempts',
        retryAfter: Math.ceil((windowMs - (now - attempts.lastAttempt)) / 1000)
      });
    }

    // Increment counter
    attempts.count++;
    attempts.lastAttempt = now;

    next();
  };
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, attempts] of registrationAttempts.entries()) {
    if (now - attempts.lastAttempt > 60000) {
      registrationAttempts.delete(key);
    }
  }
}, 60000);
