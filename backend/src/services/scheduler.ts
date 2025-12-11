import Tournament from '../models/Tournament';
import Match from '../models/Match';

const FIVE_MIN = 5 * 60 * 1000;

async function closeExpiredRegistrations() {
  const now = new Date();
  await Tournament.updateMany(
    { status: 'upcoming', startDate: { $lte: now } },
    { $set: { isRegistrationOpen: false, status: 'ongoing' } }
  );
}

async function completeFinishedTournaments() {
  const now = new Date();
  await Tournament.updateMany(
    { status: 'ongoing', endDate: { $lte: now } },
    { $set: { status: 'completed' } }
  );
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

export function startSchedulers() {
  // Run immediately on boot, then on interval
  const run = async () => {
    try {
      await Promise.all([
        closeExpiredRegistrations(),
        completeFinishedTournaments(),
        closeStaleMatches()
      ]);
    } catch (err) {
      console.error('[scheduler] error', err);
    }
  };
  void run();
  setInterval(run, FIVE_MIN);
}


