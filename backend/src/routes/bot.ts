import express from 'express';
import BotSubscriber from '../models/BotSubscriber';
import BotInviteEvent from '../models/BotInviteEvent';
import BotNotification from '../models/BotNotification';
import News from '../models/News';
import User from '../models/User';

const router = express.Router();

const BOT_REMINDER_INTERVAL_DAYS = Math.max(1, Number(process.env.BOT_REMINDER_INTERVAL_DAYS || 5));
const BOT_VIRAL_TARGET = Math.max(1, Number(process.env.BOT_VIRAL_TARGET || 10));
const BOT_VIRAL_REWARD_FREE_ENTRIES = Math.max(1, Number(process.env.BOT_VIRAL_REWARD_FREE_ENTRIES || 3));

const requireBotToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const configured = String(process.env.BOT_INTERNAL_TOKEN || '').trim();
  if (!configured) {
    return res.status(503).json({ success: false, error: 'BOT_INTERNAL_TOKEN is not configured' });
  }
  const provided = String(req.header('x-bot-token') || '').trim();
  if (!provided || provided !== configured) {
    return res.status(401).json({ success: false, error: 'Unauthorized bot token' });
  }
  next();
};

const parseInvitePayload = (payloadRaw: unknown): number | null => {
  const payload = String(payloadRaw || '').trim();
  const match = payload.match(/^invite_user_(\d+)$/);
  if (!match) return null;
  const inviterId = Number(match[1]);
  if (!Number.isFinite(inviterId)) return null;
  return inviterId;
};

const getProgress = (row: any) => {
  const count = Number(row?.viralInvitesCount || 0);
  const remaining = Math.max(0, BOT_VIRAL_TARGET - count);
  return {
    invitesCount: count,
    target: BOT_VIRAL_TARGET,
    remaining,
    rewardIssued: Boolean(row?.viralRewardIssuedAt),
    rewardIssuedAt: row?.viralRewardIssuedAt || null
  };
};

router.post('/subscribers/register', requireBotToken, async (req, res) => {
  try {
    const telegramId = Number(req.body?.telegramId);
    const chatId = Number(req.body?.chatId);
    if (!Number.isFinite(telegramId) || !Number.isFinite(chatId)) {
      return res.status(400).json({ success: false, error: 'telegramId and chatId are required numbers' });
    }

    const now = new Date();
    const existing: any = await BotSubscriber.findOne({ telegramId }).lean();
    const inviterTelegramId = parseInvitePayload(req.body?.payload);

    const update: any = {
      chatId,
      username: req.body?.username ? String(req.body.username).trim() : undefined,
      firstName: req.body?.firstName ? String(req.body.firstName).trim() : undefined,
      lastName: req.body?.lastName ? String(req.body.lastName).trim() : undefined,
      languageCode: req.body?.languageCode ? String(req.body.languageCode).slice(0, 8).toLowerCase() : 'en',
      lastSeenAt: now,
      isActive: true
    };

    if (!existing) {
      update.startedAt = now;
    }

    if (!existing?.invitedByTelegramId && inviterTelegramId && inviterTelegramId !== telegramId) {
      update.invitedByTelegramId = inviterTelegramId;
    }

    const subscriber = await BotSubscriber.findOneAndUpdate(
      { telegramId },
      { $set: update, $setOnInsert: { telegramId, startedAt: now, viralInvitesCount: 0 } },
      { upsert: true, new: true }
    );

    let inviterProgress: any = null;
    let rewardIssuedNow = false;

    // Count viral invite only once per (inviter -> invitee) pair.
    if (inviterTelegramId && inviterTelegramId !== telegramId) {
      let inserted = false;
      try {
        await BotInviteEvent.create({ inviterTelegramId, inviteeTelegramId: telegramId });
        inserted = true;
      } catch (error: any) {
        const duplicate = Number(error?.code || 0) === 11000;
        if (!duplicate) {
          throw error;
        }
      }

      if (inserted) {
        const inviter = await BotSubscriber.findOneAndUpdate(
          { telegramId: inviterTelegramId },
          { $inc: { viralInvitesCount: 1 }, $setOnInsert: { telegramId: inviterTelegramId, chatId: inviterTelegramId, startedAt: now, lastSeenAt: now, isActive: true } },
          { upsert: true, new: true }
        );

        if (inviter && !inviter.viralRewardIssuedAt && Number(inviter.viralInvitesCount || 0) >= BOT_VIRAL_TARGET) {
          inviter.viralRewardIssuedAt = now;
          await inviter.save();
          rewardIssuedNow = true;

          const inviterUser: any = await User.findOne({ telegramId: inviterTelegramId });
          if (inviterUser && typeof inviterUser.addFreeEntry === 'function') {
            await inviterUser.addFreeEntry(BOT_VIRAL_REWARD_FREE_ENTRIES);
            inviterUser.wallet.transactions.push({
              type: 'referral',
              amount: 0,
              description: `Viral invite reward: ${BOT_VIRAL_TARGET} invited users via Telegram bot`,
              date: now
            });
            await inviterUser.save();
          }
        }
        inviterProgress = getProgress(inviter);
      } else {
        const inviter = await BotSubscriber.findOne({ telegramId: inviterTelegramId }).lean();
        inviterProgress = getProgress(inviter);
      }
    }

    return res.json({
      success: true,
      data: {
        subscriber: {
          telegramId: subscriber?.telegramId,
          chatId: subscriber?.chatId,
          languageCode: subscriber?.languageCode || 'en',
          startedAt: subscriber?.startedAt,
          lastSeenAt: subscriber?.lastSeenAt
        },
        progress: getProgress(subscriber),
        inviterProgress,
        rewardIssuedNow
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to register bot subscriber' });
  }
});

router.get('/subscribers/due-reminders', requireBotToken, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(300, Number(req.query?.limit || 100)));
    const cutoff = new Date(Date.now() - BOT_REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
    const subscribers = await BotSubscriber.find({
      isActive: true,
      $or: [{ lastReminderAt: { $exists: false } }, { lastReminderAt: { $lte: cutoff } }]
    })
      .sort({ lastReminderAt: 1, startedAt: 1 })
      .limit(limit)
      .select('telegramId chatId username languageCode')
      .lean();

    const newsSince = new Date(Date.now() - BOT_REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
    const news = await News.find({
      status: 'published',
      $or: [{ publishDate: { $gte: newsSince } }, { createdAt: { $gte: newsSince } }]
    })
      .sort({ publishDate: -1, createdAt: -1 })
      .limit(3)
      .select('title summary publishDate')
      .lean();

    return res.json({
      success: true,
      data: {
        intervalDays: BOT_REMINDER_INTERVAL_DAYS,
        subscribers: subscribers.map((s: any) => ({
          telegramId: Number(s.telegramId),
          chatId: Number(s.chatId),
          username: s.username || '',
          languageCode: s.languageCode || 'en'
        })),
        news: news.map((n: any) => ({
          id: String(n._id),
          title: String(n.title || ''),
          summary: String(n.summary || ''),
          publishDate: n.publishDate || n.createdAt || null
        }))
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load due reminders' });
  }
});

router.post('/subscribers/mark-reminded', requireBotToken, async (req, res) => {
  try {
    const telegramIds = Array.isArray(req.body?.telegramIds)
      ? req.body.telegramIds.map((v: any) => Number(v)).filter((v: number) => Number.isFinite(v))
      : [];

    if (!telegramIds.length) {
      return res.status(400).json({ success: false, error: 'telegramIds[] is required' });
    }

    const result = await BotSubscriber.updateMany(
      { telegramId: { $in: telegramIds } },
      { $set: { lastReminderAt: new Date(), isActive: true } }
    );

    return res.json({
      success: true,
      data: {
        matched: Number((result as any)?.matchedCount || 0),
        modified: Number((result as any)?.modifiedCount || 0)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to mark reminders' });
  }
});

router.get('/subscribers/viral-progress/:telegramId', requireBotToken, async (req, res) => {
  try {
    const telegramId = Number(req.params.telegramId);
    if (!Number.isFinite(telegramId)) {
      return res.status(400).json({ success: false, error: 'Invalid telegramId' });
    }

    const row = await BotSubscriber.findOne({ telegramId }).lean();
    return res.json({
      success: true,
      data: getProgress(row)
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load viral progress' });
  }
});

router.get('/outbox/due', requireBotToken, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(300, Number(req.query?.limit || 100)));
    const now = new Date();
    const rows = await BotNotification.find({
      status: 'pending',
      sendAt: { $lte: now }
    })
      .sort({ sendAt: 1, createdAt: 1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      data: rows.map((row: any) => ({
        id: String(row._id),
        telegramId: Number(row.telegramId),
        chatId: Number(row.chatId),
        eventType: String(row.eventType || 'system'),
        title: String(row.title || ''),
        message: String(row.message || ''),
        payload: row.payload || {}
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load due outbox messages' });
  }
});

router.post('/outbox/mark-sent', requireBotToken, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((v: any) => String(v)) : [];
    if (!ids.length) {
      return res.status(400).json({ success: false, error: 'ids[] is required' });
    }
    const result = await BotNotification.updateMany(
      { _id: { $in: ids } },
      { $set: { status: 'sent', sentAt: new Date() }, $inc: { attempts: 1 }, $unset: { lastError: 1 } }
    );
    return res.json({
      success: true,
      data: {
        matched: Number((result as any)?.matchedCount || 0),
        modified: Number((result as any)?.modifiedCount || 0)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to mark outbox messages as sent' });
  }
});

router.post('/outbox/mark-failed', requireBotToken, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((v: any) => String(v)) : [];
    const reason = String(req.body?.reason || '').trim().slice(0, 500);
    if (!ids.length) {
      return res.status(400).json({ success: false, error: 'ids[] is required' });
    }
    const result = await BotNotification.updateMany(
      { _id: { $in: ids } },
      { $set: { status: 'failed', lastError: reason || 'delivery_failed' }, $inc: { attempts: 1 } }
    );
    return res.json({
      success: true,
      data: {
        matched: Number((result as any)?.matchedCount || 0),
        modified: Number((result as any)?.modifiedCount || 0)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to mark outbox messages as failed' });
  }
});

export default router;
