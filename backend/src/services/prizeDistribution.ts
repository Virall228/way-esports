import mongoose from 'mongoose';
import Tournament from '../models/Tournament';
import Team from '../models/Team';
import User from '../models/User';
import { scheduler } from './scheduler';

/**
 * Prize Distribution Service
 * 
 * Handles automatic distribution of tournament prizes to top 3 teams/players
 * within 48 hours of tournament completion.
 */

export class PrizeDistributionService {
  /**
   * Schedule prize distribution for a completed tournament
   */
  static async schedulePrizeDistribution(tournamentId: string): Promise<void> {
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament || tournament.status !== 'completed') {
      throw new Error('Tournament not found or not completed');
    }

    if (tournament.prizeStatus !== 'pending') {
      throw new Error('Prizes already processed or in progress');
    }

    // Schedule distribution for 48 hours from now
    const distributionTime = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await scheduler.scheduleJob(
      `prize-distribution-${tournamentId}`,
      distributionTime,
      async () => {
        await this.distributePrizes(tournamentId);
      }
    );

    console.log(`Prize distribution scheduled for tournament ${tournamentId} at ${distributionTime}`);
  }

  /**
   * Immediately distribute prizes for a tournament
   */
  static async distributePrizes(tournamentId: string): Promise<void> {
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'completed') {
      throw new Error('Tournament not completed');
    }

    if (tournament.prizeStatus !== 'pending') {
      throw new Error('Prizes already processed or in progress');
    }

    tournament.prizeStatus = 'processing';
    await tournament.save();

    try {
      // Calculate prize distribution (50%, 30%, 20%)
      const totalPrize = tournament.prizePool;
      const firstPlacePrize = totalPrize * 0.5;
      const secondPlacePrize = totalPrize * 0.3;
      const thirdPlacePrize = totalPrize * 0.2;

      tournament.prizeDistribution = {
        firstPlace: firstPlacePrize,
        secondPlace: secondPlacePrize,
        thirdPlace: thirdPlacePrize
      };

      // Get top 3 teams/players from tournament results
      const winners = await this.getTournamentWinners(tournament);
      const prizes = [firstPlacePrize, secondPlacePrize, thirdPlacePrize];

      console.log(`Distributing prizes for tournament ${tournament.name}:`, {
        totalPrize,
        winners: winners.length,
        prizes
      });

      for (let i = 0; i < Math.min(winners.length, 3); i++) {
        const winner = winners[i];
        const prize = prizes[i];
        const position = i + 1;

        if (tournament.type === 'team') {
          await this.distributeTeamPrize(winner.teamId as string, prize, tournamentId, position);
        } else {
          await this.distributePlayerPrize(winner.playerId as string, prize, tournamentId, position);
        }
      }

      tournament.prizeStatus = 'distributed';
      await tournament.save();

      console.log(`Prize distribution completed for tournament ${tournamentId}`);
    } catch (error) {
      tournament.prizeStatus = 'pending';
      await tournament.save();
      console.error(`Prize distribution failed for tournament ${tournamentId}:`, error);
      throw error;
    }
  }

  /**
   * Get top 3 teams/players from tournament results
   */
  private static async getTournamentWinners(tournament: any): Promise<Array<{ teamId?: string, playerId?: string, position: number }>> {
    // This would typically be determined from tournament bracket/results
    // For now, we'll return placeholder data that should be replaced with actual tournament logic

    if (tournament.type === 'team') {
      // Get top 3 teams from tournament results
      const teams = await Team.find({ _id: { $in: tournament.registeredTeams } })
        .sort({ 'stats.wins': -1 })
        .limit(3)
        .select('_id name players');

      return teams.map((team, index) => ({
        teamId: (team as any)._id.toString(),
        position: index + 1
      }));
    } else {
      // Get top 3 players from tournament results
      const players = await User.find({ _id: { $in: tournament.registeredPlayers } })
        .sort({ 'stats.wins': -1 })
        .limit(3)
        .select('_id username stats');

      return players.map((player, index) => ({
        playerId: player._id.toString(),
        position: index + 1
      }));
    }
  }

  /**
   * Distribute prize to team members equally
   */
  private static async distributeTeamPrize(
    teamId: string,
    totalPrize: number,
    tournamentId: string,
    position: number
  ): Promise<void> {
    const team = await Team.findById(teamId).populate('players');

    if (!team || !team.players || team.players.length === 0) {
      console.warn(`No players found for team ${teamId}`);
      return;
    }

    const prizePerPlayer = totalPrize / team.players.length;

    for (const player of team.players) {
      await this.distributePlayerPrize(
        (player as any)._id,
        prizePerPlayer,
        tournamentId,
        position
      );
    }

    console.log(`Distributed $${totalPrize} to team ${team.name} (${team.players.length} players, $${prizePerPlayer.toFixed(2)} each)`);
  }

  /**
   * Distribute prize to individual player
   */
  private static async distributePlayerPrize(
    playerId: string,
    amount: number,
    tournamentId: string,
    position: number
  ): Promise<void> {
    const user = await User.findById(playerId);

    if (!user) {
      console.warn(`User not found: ${playerId}`);
      return;
    }

    // Add to wallet balance
    user.wallet.balance += amount;

    // Add transaction record
    user.wallet.transactions.push({
      type: 'prize' as any,
      amount: amount,
      description: `Prize for ${this.getPositionSuffix(position)} place in tournament`,
      date: new Date()
    });

    // Update stats
    if (position === 1) {
      user.stats.tournamentsWon += 1;
    }
    user.stats.tournamentsPlayed += 1;

    await user.save();

    console.log(`Distributed $${amount} to player ${user.username} for ${this.getPositionSuffix(position)} place`);
  }

  /**
   * Get position suffix (1st, 2nd, 3rd, etc.)
   */
  private static getPositionSuffix(position: number): string {
    const suffixes = ['st', 'nd', 'rd'];
    const suffix = position <= 3 ? suffixes[position - 1] : 'th';
    return `${position}${suffix}`;
  }

  /**
   * Get prize distribution status for a tournament
   */
  static async getPrizeStatus(tournamentId: string): Promise<any> {
    const tournament = await Tournament.findById(tournamentId)
      .select('name prizePool prizeDistribution prizeStatus status');

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    return {
      tournamentName: tournament.name,
      prizePool: tournament.prizePool,
      prizeDistribution: tournament.prizeDistribution,
      prizeStatus: tournament.prizeStatus,
      tournamentStatus: tournament.status
    };
  }

  /**
   * Get all tournaments with pending prize distributions
   */
  static async getPendingDistributions(): Promise<any[]> {
    const tournaments = await Tournament.find({
      status: 'completed',
      prizeStatus: 'pending'
    })
      .select('name prizePool endDate prizeStatus')
      .sort({ endDate: 1 });

    return tournaments;
  }

  /**
   * Manually trigger prize distribution (admin function)
   */
  static async manualDistribution(tournamentId: string): Promise<void> {
    console.log(`Manual prize distribution triggered for tournament ${tournamentId}`);
    await this.distributePrizes(tournamentId);
  }
}

export default PrizeDistributionService;
