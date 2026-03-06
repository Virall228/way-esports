import Tournament from '../models/Tournament';
import Match from '../models/Match';
import PrizeDistributionService from './prizeDistribution';
import { prepareMatchRoom } from './matchRoomService';
import { refreshWeeklyTopProspects, scoutingUtils } from './scoutingEngine';
import { updateHallOfFameSnapshot } from './hallOfFameService';
import botPushService from './botPushService';

const FIVE_MIN = 5 * 60 * 1000;
const MATCH_INTERVAL_MIN = 30;
const ROOM_VISIBILITY_WINDOW_MIN = 5;
const SUPPORTED_MATCH_GAMES = new Set(['Critical Ops', 'CS2', 'PUBG Mobile', 'Dota 2', 'Standoff 2', 'Valorant Mobile']);

interface ScheduledJob {
  id: string;
  executeAt: Date;
  callback: () => Promise<void>;
}

const scheduledJobs = new Map<string, ScheduledJob>();
let lastScoutingWeekKey = '';
let lastHallOfFameDayKey = '';

const normalizeMatchGame = (game: string | undefined): 'Critical Ops' | 'CS2' | 'PUBG Mobile' | 'Dota 2' | 'Standoff 2' | 'Valorant Mobile' => {
  if (game && SUPPORTED_MATCH_GAMES.has(game)) {
    return game as 'Critical Ops' | 'CS2' | 'PUBG Mobile' | 'Dota 2' | 'Standoff 2' | 'Valorant Mobile';
  }
  const normalized = String(game || '').trim().toLowerCase().replace(/\s+/g, '');
  if (normalized === 'criticalops') return 'Critical Ops';
  if (normalized === 'cs2') return 'CS2';
  if (normalized === 'pubgmobile') return 'PUBG Mobile';
  if (normalized === 'dota2') return 'Dota 2';
  if (normalized === 'standoff2') return 'Standoff 2';
  if (normalized === 'valorantmobile' || normalized === 'valorant') return 'Valorant Mobile';
  return 'CS2';
};

async function generateInitialBracketMatches(tournament: any) {
  if (!tournament || tournament.type !== 'team') return;
  if (Array.isArray(tournament.matches) && tournament.matches.length > 0) return;

  const participants = Array.isArray(tournament.registeredTeams)
    ? tournament.registeredTeams.map((id: any) => id?.toString?.() || String(id)).filter(Boolean)
    : [];

  if (participants.length < 2) return;

  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  const createdMatchIds: any[] = [];
  const baseStart = tournament.startDate instanceof Date ? tournament.startDate : new Date();
  let slot = 0;

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    const team1 = shuffled[i];
    const team2 = shuffled[i + 1];
    const startTime = new Date(baseStart.getTime() + slot * MATCH_INTERVAL_MIN * 60 * 1000);
    slot += 1;

    const match = await Match.create({
      tournament: tournament._id,
      team1,
      team2,
      startTime,
      status: 'scheduled',
      game: normalizeMatchGame(tournament.game),
      round: 'Round 1',
      score: { team1: 0, team2: 0 }
    });

    createdMatchIds.push(match._id);
  }

  if (!createdMatchIds.length) return;

  tournament.matches = createdMatchIds;
  tournament.bracket = { matches: createdMatchIds };
  await tournament.save();
}

async function closeExpiredRegistrations() {
  const now = new Date();
  const tournaments = await Tournament.find({ status: 'upcoming', startDate: { $lte: now } });

  for (const tournament of tournaments) {
    tournament.isRegistrationOpen = false;
    tournament.status = 'ongoing';
    await tournament.save();
    await generateInitialBracketMatches(tournament);
  }
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
        await PrizeDistributionService.schedulePrizeDistribution((tournament as any)._id.toString());
      } catch (error) {
        console.error(`Failed to schedule prize distribution for tournament ${(tournament as any)._id}:`, error);
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

async function ensureUpcomingRoomCredentials() {
  const now = new Date();
  const threshold = new Date(now.getTime() + ROOM_VISIBILITY_WINDOW_MIN * 60 * 1000);

  const matches = await Match.find({
    status: { $in: ['scheduled', 'live'] },
    startTime: { $lte: threshold },
    $or: [
      { 'roomCredentials.roomId': { $exists: false } },
      { 'roomCredentials.roomId': null },
      { 'roomCredentials.roomId': '' }
    ]
  });

  for (const match of matches) {
    try {
      // Pre-generate rooms shortly before match start.
      // Credentials are still hidden until visibleAt.
      await prepareMatchRoom(match, {
        force: false,
        visibilityWindowMinutes: ROOM_VISIBILITY_WINDOW_MIN
      });
    } catch (error) {
      console.error('[scheduler] failed to prepare match room:', error);
    }
  }
}

async function notifyUpcomingMatchReminders() {
  const now = new Date();

  const ranges = [
    {
      type: 'match_start_60m',
      minutes: 60,
      from: new Date(now.getTime() + 55 * 60 * 1000),
      to: new Date(now.getTime() + 65 * 60 * 1000),
      field: 'reminder60SentAt' as const
    },
    {
      type: 'match_start_30m',
      minutes: 30,
      from: new Date(now.getTime() + 25 * 60 * 1000),
      to: new Date(now.getTime() + 35 * 60 * 1000),
      field: 'reminder30SentAt' as const
    }
  ];

  for (const range of ranges) {
    const matches: any[] = await Match.find({
      status: { $in: ['scheduled', 'live'] },
      startTime: { $gte: range.from, $lte: range.to },
      [range.field]: { $exists: false }
    })
      .populate('tournament', 'name')
      .select('_id tournament team1 team2 startTime')
      .lean();

    for (const match of matches) {
      try {
        const team1Members = await botPushService.getTeamMemberIds(match.team1);
        const team2Members = await botPushService.getTeamMemberIds(match.team2);
        const userIds = [...team1Members, ...team2Members];

        if (userIds.length) {
          await botPushService.notifyUsers({
            userIds,
            eventType: range.type,
            title: `Match starts in ${range.minutes} minutes`,
            message: `Your match starts soon (${range.minutes} min). Please prepare and check room access.`,
            payload: {
              matchId: String(match._id),
              tournamentId: match.tournament?._id?.toString?.() || '',
              tournamentName: match.tournament?.name || '',
              startTime: match.startTime
            }
          });
        }

        await Match.updateOne(
          { _id: match._id, [range.field]: { $exists: false } },
          { $set: { [range.field]: new Date() } }
        );
      } catch (error) {
        console.error('[scheduler] failed to send match reminder:', error);
      }
    }
  }
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

async function runWeeklyScoutingRefresh() {
  const weekKey = scoutingUtils.getWeekKey();
  if (weekKey === lastScoutingWeekKey) return;
  await refreshWeeklyTopProspects(10);
  lastScoutingWeekKey = weekKey;
}

async function runDailyHallOfFameRefresh() {
  const now = new Date();
  const dayKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  if (dayKey === lastHallOfFameDayKey) return;
  await updateHallOfFameSnapshot();
  lastHallOfFameDayKey = dayKey;
}

export function startSchedulers() {
  // Run immediately on boot, then on interval
  const run = async () => {
    try {
      await Promise.all([
        closeExpiredRegistrations(),
        completeFinishedTournaments(),
        closeStaleMatches(),
        ensureUpcomingRoomCredentials(),
        notifyUpcomingMatchReminders(),
        executeScheduledJobs(),
        runWeeklyScoutingRefresh(),
        runDailyHallOfFameRefresh()
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


