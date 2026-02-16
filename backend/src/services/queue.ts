import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq';
import { config as dotenvConfig } from 'dotenv';
import Tournament from '../models/Tournament';
import User from '../models/User';

dotenvConfig();

const isRedisDisabled = (): boolean => {
  const value = (process.env.REDIS_DISABLED || process.env.NO_REDIS || '').toString().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
};

const redisDisabled = isRedisDisabled();
const connection = { url: process.env.REDIS_URL || 'redis://localhost:6379' };

export const tasksQueue = redisDisabled ? null : new Queue('tasks', { connection });
export const tasksEvents = redisDisabled ? null : new QueueEvents('tasks', { connection });

export async function addTask(name: string, data: any, opts?: JobsOptions) {
  if (!tasksQueue) {
    return { skipped: true, reason: 'redis_disabled' };
  }

  const defaultOptions: JobsOptions = {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 1000,
    removeOnFail: 1000
  };

  return tasksQueue.add(name, data, {
    ...defaultOptions,
    ...(opts || {})
  });
}

export async function getQueueStats() {
  if (!tasksQueue) {
    return {
      enabled: false,
      reason: 'redis_disabled'
    };
  }

  const counts = await tasksQueue.getJobCounts(
    'waiting',
    'active',
    'completed',
    'failed',
    'delayed',
    'paused'
  );

  return {
    enabled: true,
    queue: 'tasks',
    counts
  };
}

// Basic workers; for production consider moving to a separate worker process.
export function startWorkers() {
  if (!tasksQueue || !tasksEvents) {
    console.log('[queue] Redis disabled; workers are not started.');
    return;
  }

  new Worker(
    'tasks',
    async (job) => {
      switch (job.name) {
        case 'bulkRegisterTeams': {
          const { tournamentId, teamIds } = job.data as { tournamentId: string; teamIds: string[] };
          await Tournament.updateOne(
            { _id: tournamentId },
            { $addToSet: { registeredTeams: { $each: teamIds } } }
          );
          return { tournamentId, added: teamIds.length };
        }
        case 'sendNotification': {
          const { userIds, notification } = job.data as { userIds: string[]; notification: any };
          await User.updateMany(
            { _id: { $in: userIds } },
            { $push: { notifications: notification } }
          );
          return { sent: userIds.length };
        }
        default:
          return { skipped: true };
      }
    },
    { connection }
  );

  tasksEvents.on('failed', ({ jobId, failedReason }) => {
    console.error('[queue] job failed', jobId, failedReason);
  });
}


