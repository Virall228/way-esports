import Tournament from '../models/Tournament';
import Match from '../models/Match';
import PrizeDistributionService from './prizeDistribution';

const FIVE_MIN = 5 * 60 * 1000;

interface ScheduledJob {
  id: string;
  executeAt: Date;
  callback: () => Promise<void>;
}

const scheduledJobs = new Map<string, ScheduledJob>();

async function closeExpiredRegistrations() {
  const now = new Date();
  await Tournament.updateMany(
    { status: 'upcoming', startDate: { $lte: now } },
    { $set: { isRegistrationOpen: false, status: 'ongoing' } }
  );
}

async function completeFinishedTournaments() {
  const now = new Date();
  const tournaments = await Tournament.find(
    { status: 'ongoing', endDate: { $lte: now } }
  );

  for (const tournament of tournaments) {
    // Update tournament status
    tournament.status = 'completed';
    await tournament.save();

    // Schedule prize distribution for 48 hours from now
    if (tournament.prizePool > 0) {
      try {
        await PrizeDistributionService.schedulePrizeDistribution(tournament._id.toString());
      } catch (error) {
        console.error(`Failed to schedule prize distribution for tournament ${tournament._id}:`, error);
      }
    }
  }
}

async function closeStaleMatches() {
  const now = new Date();
  // Simple heuristic: matches still scheduled and startTime + 6h passed → mark completed
  const cutoff = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  await Match.updateMany(
    { status: { $in: ['scheduled', 'in_progress'] }, startTime: { $lte: cutoff } },
    { $set: { status: 'completed', endTime: now } }
  );
}

async function executeScheduledJobs() {
  const now = new Date();
  const jobsToExecute: ScheduledJob[] = [];

  // Find jobs that are ready to execute
  for (const [id, job] of scheduledJobs.entries()) {
    if (job.executeAt <= now) {
      jobsToExecute.push(job);
      scheduledJobs.delete(id);
    }
  }

  // Execute jobs
  for (const job of jobsToExecute) {
    try {
      await job.callback();
      console.log(`[scheduler] Executed scheduled job: ${job.id}`);
    } catch (error) {
      console.error(`[scheduler] Failed to execute job ${job.id}:`, error);
    }
  }
}

export function startSchedulers() {
  // Run immediately on boot, then on interval
  const run = async () => {
    try {
      await Promise.all([
        closeExpiredRegistrations(),
        completeFinishedTournaments(),
        closeStaleMatches(),
        executeScheduledJobs()
      ]);
    } catch (err) {
      console.error('[scheduler] error', err);
    }
  };
  void run();
  setInterval(run, FIVE_MIN);
}

export const scheduler = {
  /**
   * Schedule a job to run at a specific time
   */
  async scheduleJob(id: string, executeAt: Date, callback: () => Promise<void>): Promise<void> {
    scheduledJobs.set(id, {
      id,
      executeAt,
      callback
    });
    console.log(`[scheduler] Scheduled job ${id} for ${executeAt.toISOString()}`);
  },

  /**
   * Cancel a scheduled job
   */
  cancelJob(id: string): boolean {
    return scheduledJobs.delete(id);
  },

  /**
   * Get all scheduled jobs
   */
  getScheduledJobs(): ScheduledJob[] {
    return Array.from(scheduledJobs.values());
  }
};


