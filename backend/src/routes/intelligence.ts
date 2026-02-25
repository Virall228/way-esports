import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';
import { calculateElo } from '../services/eloEngine';
import {
  computeNormalizedScores,
  RawMatchStats
} from '../services/analyticsScoringEngine';
import {
  BracketTeam,
  generateDoubleElimination,
  generateSingleElimination
} from '../services/tournamentBracketEngine';
import { matchPlaystyle, StyleVector } from '../services/styleMatchingEngine';
import HallOfFame from '../models/HallOfFame';
import { rankRealtimeBus } from '../services/rankRealtimeBus';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import AuditLog from '../models/AuditLog';
import { updateHallOfFameSnapshot } from '../services/hallOfFameService';
import Team from '../models/Team';
import User from '../models/User';
import Tournament from '../models/Tournament';
import cacheService from '../services/cacheService';
import { createInMemoryLimiter } from '../middleware/rateLimiter';
import { getScoutProviderStatus } from '../services/aiScoutingProvider';
import { getSupportAiStatus } from '../services/supportAiService';
import SupportSettings from '../models/SupportSettings';

const router = express.Router();
const intelligencePublicLimiter = createInMemoryLimiter({
  keyPrefix: 'intelligence_public',
  max: 120,
  windowMs: 60_000,
  identity: 'ip'
});

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const handlePointsCalculate = (
  req: Request,
  res: Response
) => {
  const previousRating = toNumber(req.body.playerPoints ?? req.body.playerRating, 1000);
  const output = calculateElo({
    playerRating: previousRating,
    opponentRating: toNumber(req.body.opponentPoints ?? req.body.opponentRating, 1000),
    result: Number(req.body.result) as 0 | 0.5 | 1,
    kFactor: req.body.kFactor !== undefined ? toNumber(req.body.kFactor) : undefined
  });

  rankRealtimeBus.emitRankUpdate({
    userId: req.body.userId ? String(req.body.userId) : undefined,
    previousRating,
    newRating: output.newRating,
    delta: output.delta,
    previousPoints: previousRating,
    newPoints: output.newRating,
    pointsDelta: output.delta,
    at: new Date().toISOString()
  });

  return res.json({
    success: true,
    data: {
      ...output,
      previousPoints: previousRating,
      pointsDelta: output.delta,
      newPoints: output.newRating
    }
  });
};

const pointsCalculateValidation = [
  body().custom((payload: any) => {
    const left = payload?.playerPoints ?? payload?.playerRating;
    const right = payload?.opponentPoints ?? payload?.opponentRating;
    if (!Number.isFinite(Number(left))) {
      throw new Error('playerPoints or playerRating must be numeric');
    }
    if (!Number.isFinite(Number(right))) {
      throw new Error('opponentPoints or opponentRating must be numeric');
    }
    return true;
  }),
  body('result').isIn([0, 0.5, 1]),
  body('kFactor').optional().isNumeric()
];

router.post(
  '/elo/calculate',
  pointsCalculateValidation,
  validateRequest,
  handlePointsCalculate
);

router.post(
  '/points/calculate',
  pointsCalculateValidation,
  validateRequest,
  handlePointsCalculate
);

router.get('/readiness', async (_req: Request, res: Response) => {
  try {
    const mongoState = Number((User as any)?.db?.readyState ?? 0);
    const mongoConnected = mongoState === 1;
    const cacheStats = await cacheService.getStats().catch(() => ({ connected: false }));
    const redisConnected = Boolean((cacheStats as any)?.connected);

    const supportSettings = await SupportSettings.findOneAndUpdate(
      { key: 'global' },
      { $setOnInsert: { key: 'global', aiEnabled: false } },
      { new: true, upsert: true }
    ).lean();

    const scouting = getScoutProviderStatus();
    const support = {
      ...getSupportAiStatus(),
      aiEnabled: Boolean(supportSettings?.aiEnabled)
    };
    const telegramConfigured = Boolean(String(process.env.TELEGRAM_BOT_USERNAME || '').trim());
    const telegramTokenConfigured = Boolean(String(process.env.TELEGRAM_BOT_TOKEN || '').trim());
    const botWebhookEnabled = ['1', 'true', 'yes'].includes(String(process.env.BOT_USE_WEBHOOK || '').toLowerCase().trim());
    const botWebhookPublicUrlConfigured = Boolean(String(process.env.BOT_WEBHOOK_PUBLIC_URL || '').trim());
    const botWebhookPathConfigured = Boolean(String(process.env.BOT_WEBHOOK_PATH || '').trim());
    const botWebhookSecretConfigured = Boolean(String(process.env.BOT_WEBHOOK_SECRET || '').trim());
    const cronConfigured = Boolean(String(process.env.HALL_OF_FAME_CRON_TOKEN || '').trim());

    const checks = [
      {
        key: 'mongo_connection',
        ok: mongoConnected,
        message: mongoConnected ? 'Mongo connected' : `Mongo state=${mongoState}`
      },
      {
        key: 'redis_connection',
        ok: redisConnected,
        message: redisConnected ? 'Redis connected' : 'Redis disconnected or disabled'
      },
      {
        key: 'scouting_provider_key',
        ok: Boolean(scouting.geminiEnabled || scouting.openAiEnabled),
        message: 'Set GEMINI_API_KEY or OPENAI_API_KEY for scouting'
      },
      {
        key: 'support_provider_key',
        ok: Boolean(support.geminiEnabled || support.openAiEnabled),
        message: 'Set GEMINI_API_KEY or OPENAI_API_KEY for support replies'
      },
      {
        key: 'support_runtime_enabled',
        ok: Boolean(support.aiEnabled),
        message: 'Support AI runtime is disabled in admin settings'
      },
      {
        key: 'telegram_bot_username',
        ok: telegramConfigured,
        message: 'Set TELEGRAM_BOT_USERNAME in .env'
      },
      {
        key: 'telegram_bot_token',
        ok: telegramTokenConfigured,
        message: 'Set TELEGRAM_BOT_TOKEN in .env'
      },
      {
        key: 'telegram_bot_webhook_url',
        ok: !botWebhookEnabled || botWebhookPublicUrlConfigured,
        message: botWebhookEnabled
          ? 'Set BOT_WEBHOOK_PUBLIC_URL when BOT_USE_WEBHOOK=true'
          : 'Webhook is optional while BOT_USE_WEBHOOK=false'
      },
      {
        key: 'telegram_bot_webhook_path',
        ok: !botWebhookEnabled || botWebhookPathConfigured,
        message: botWebhookEnabled
          ? 'Set BOT_WEBHOOK_PATH when BOT_USE_WEBHOOK=true'
          : 'Webhook path not required in polling mode'
      },
      {
        key: 'telegram_bot_webhook_secret',
        ok: !botWebhookEnabled || botWebhookSecretConfigured,
        message: botWebhookEnabled
          ? 'Set BOT_WEBHOOK_SECRET in production for webhook validation'
          : 'Webhook secret not required in polling mode'
      },
      {
        key: 'hall_of_fame_cron_token',
        ok: cronConfigured,
        message: 'Set HALL_OF_FAME_CRON_TOKEN in .env'
      }
    ];

    const failedChecks = checks.filter((c) => !c.ok);
    const score = Math.round(((checks.length - failedChecks.length) / checks.length) * 100);

    return res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        providers: {
          scouting,
          support
        },
        integrations: {
          telegramBotUsernameConfigured: telegramConfigured,
          telegramBotTokenConfigured: telegramTokenConfigured,
          botWebhookEnabled,
          botWebhookPublicUrlConfigured,
          botWebhookPathConfigured,
          botWebhookSecretConfigured,
          hallOfFameCronTokenConfigured: cronConfigured
        },
        infrastructure: {
          mongoConnected,
          redisConnected,
          mongoState
        },
        realtime: {
          rankUpdatesSse: '/api/intelligence/stream/rank-updates',
          opsSse: '/api/admin/ops/stream'
        },
        checks,
        readinessScore: score
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load readiness' });
  }
});

router.post('/readiness/smoke', authenticateJWT, isAdmin, async (_req: Request, res: Response) => {
  try {
    const startedAt = Date.now();
    const mongoState = Number((User as any)?.db?.readyState ?? 0);
    const mongoOk = mongoState === 1;

    const [usersCount, teamsCount, tournamentsCount, cacheStats] = await Promise.all([
      User.countDocuments({}),
      Team.countDocuments({}),
      Tournament.countDocuments({}).catch(() => 0),
      cacheService.getStats().catch(() => ({ connected: false }))
    ]);

    const redisOk = Boolean((cacheStats as any)?.connected);
    const durationMs = Date.now() - startedAt;

    const checks = [
      { key: 'mongo_connection', ok: mongoOk, message: mongoOk ? 'Mongo connected' : `Mongo state=${mongoState}` },
      { key: 'redis_connection', ok: redisOk, message: redisOk ? 'Redis connected' : 'Redis disconnected or disabled' },
      { key: 'users_collection', ok: usersCount >= 0, message: `users=${usersCount}` },
      { key: 'teams_collection', ok: teamsCount >= 0, message: `teams=${teamsCount}` },
      { key: 'tournaments_collection', ok: tournamentsCount >= 0, message: `tournaments=${tournamentsCount}` }
    ];

    const payload = {
      timestamp: new Date().toISOString(),
      durationMs,
      checks,
      summary: {
        mongoOk,
        redisOk,
        usersCount,
        teamsCount,
        tournamentsCount
      }
    };

    await AuditLog.create({
      actorId: (_req as any).user?._id || undefined,
      actorRole: String((_req as any).user?.role || 'admin'),
      actorTelegramId: Number((_req as any).user?.telegramId || 0) || undefined,
      action: 'custom',
      entity: 'readiness_smoke',
      entityId: 'system',
      method: _req.method,
      path: _req.originalUrl || _req.path || '/api/intelligence/readiness/smoke',
      statusCode: 200,
      ip: _req.ip,
      userAgent: String(_req.headers?.['user-agent'] || ''),
      payload
    });

    return res.json({
      success: true,
      data: payload
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Smoke test failed' });
  }
});

router.post(
  '/analytics/normalize',
  [
    body('kills').isNumeric(),
    body('deaths').isNumeric(),
    body('assists').isNumeric(),
    body('survivalSeconds').isNumeric(),
    body('utilityUses').isNumeric(),
    body('objectiveActions').isNumeric(),
    body('clutchRoundsWon').isNumeric(),
    body('roundsPlayed').isNumeric()
  ],
  validateRequest,
  (req: Request, res: Response) => {
    const payload: RawMatchStats = {
      kills: toNumber(req.body.kills),
      deaths: toNumber(req.body.deaths),
      assists: toNumber(req.body.assists),
      survivalSeconds: toNumber(req.body.survivalSeconds),
      utilityUses: toNumber(req.body.utilityUses),
      objectiveActions: toNumber(req.body.objectiveActions),
      clutchRoundsWon: toNumber(req.body.clutchRoundsWon),
      roundsPlayed: toNumber(req.body.roundsPlayed)
    };

    const scores = computeNormalizedScores(payload);
    return res.json({ success: true, data: scores });
  }
);

router.post(
  '/analytics/style-match',
  [
    body('aiming').isNumeric(),
    body('positioning').isNumeric(),
    body('utility').isNumeric(),
    body('clutchFactor').isNumeric(),
    body('teamplay').isNumeric()
  ],
  validateRequest,
  (req: Request, res: Response) => {
    const vector: StyleVector = {
      aiming: toNumber(req.body.aiming),
      positioning: toNumber(req.body.positioning),
      utility: toNumber(req.body.utility),
      clutchFactor: toNumber(req.body.clutchFactor),
      teamplay: toNumber(req.body.teamplay)
    };
    const matches = matchPlaystyle(vector);
    return res.json({ success: true, data: matches });
  }
);

router.post(
  '/tournaments/bracket/generate',
  [
    body('type').isIn(['single', 'double']),
    body('teams').isArray({ min: 2 }),
    body('teams.*.id').isString(),
    body('teams.*.seed').optional().isNumeric(),
    body('teams.*.name').optional().isString()
  ],
  validateRequest,
  (req: Request, res: Response) => {
    const type = String(req.body.type) as 'single' | 'double';
    const teams = (req.body.teams as Array<Record<string, unknown>>).map((team): BracketTeam => ({
      id: String(team.id),
      seed: team.seed !== undefined ? toNumber(team.seed) : undefined,
      name: team.name ? String(team.name) : undefined
    }));

    const generated = type === 'double'
      ? generateDoubleElimination(teams)
      : generateSingleElimination(teams);

    return res.json({ success: true, data: generated });
  }
);

router.get('/hall-of-fame', async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'intelligence:hall-of-fame:top100';
    const rows = await cacheService.getOrSet(
      cacheKey,
      async () => HallOfFame.find({})
        .sort({ consecutiveDaysRank1: -1, updatedAt: -1 })
        .limit(100)
        .lean(),
      { key: cacheKey, ttl: 60 }
    ) || [];
    return res.json({ success: true, data: rows });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load hall of fame' });
  }
});

router.post('/hall-of-fame/update', authenticateJWT, isAdmin, async (_req: Request, res: Response) => {
  try {
    const data = await updateHallOfFameSnapshot();
    await cacheService.invalidate('intelligence:hall-of-fame:top100');
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to update hall of fame' });
  }
});

router.post('/hall-of-fame/cron', async (req: Request, res: Response) => {
  try {
    const expectedToken = String(process.env.HALL_OF_FAME_CRON_TOKEN || '').trim();
    if (!expectedToken) {
      return res.status(503).json({ success: false, error: 'Cron token is not configured' });
    }

    const token = String(req.header('x-cron-token') || '').trim();
    if (!token || token !== expectedToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized cron token' });
    }

    const data = await updateHallOfFameSnapshot();
    await cacheService.invalidate('intelligence:hall-of-fame:top100');

    await AuditLog.create({
      actorRole: 'system',
      action: 'custom',
      entity: 'hall_of_fame',
      entityId: data && (data as any).userId ? String((data as any).userId) : undefined,
      method: req.method,
      path: req.path,
      statusCode: 200,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'cron',
      payload: {
        trigger: 'cron',
        updated: Boolean((data as any)?.updated),
        reason: (data as any)?.reason || null
      }
    });

    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to process cron hall of fame update' });
  }
});

router.get('/stream/rank-updates', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const onUpdate = (event: any) => {
    res.write(`event: rank_update\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const heartbeat = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 15000);

  rankRealtimeBus.on('rank_update', onUpdate);

  req.on('close', () => {
    clearInterval(heartbeat);
    rankRealtimeBus.off('rank_update', onUpdate);
    res.end();
  });
});

router.post(
  '/compare/win-probability',
  intelligencePublicLimiter,
  [
    body('left').custom((value) => {
      const metric = value?.points ?? value?.rating;
      if (!Number.isFinite(Number(metric))) {
        throw new Error('left.points or left.rating must be numeric');
      }
      return true;
    }),
    body('right').custom((value) => {
      const metric = value?.points ?? value?.rating;
      if (!Number.isFinite(Number(metric))) {
        throw new Error('right.points or right.rating must be numeric');
      }
      return true;
    }),
    body('left.winRate').optional().isNumeric(),
    body('right.winRate').optional().isNumeric()
  ],
  validateRequest,
  (req: Request, res: Response) => {
    const leftRating = toNumber(req.body?.left?.points ?? req.body?.left?.rating, 1000);
    const rightRating = toNumber(req.body?.right?.points ?? req.body?.right?.rating, 1000);
    const leftExpected = 1 / (1 + Math.pow(10, (rightRating - leftRating) / 400));
    const rightExpected = 1 - leftExpected;

    const leftWinRate = toNumber(req.body?.left?.winRate, 50) / 100;
    const rightWinRate = toNumber(req.body?.right?.winRate, 50) / 100;

    const leftProbability = Math.min(
      0.95,
      Math.max(0.05, leftExpected * 0.7 + leftWinRate * 0.3)
    );
    const rightProbability = Math.min(
      0.95,
      Math.max(0.05, rightExpected * 0.7 + rightWinRate * 0.3)
    );

    const normalization = leftProbability + rightProbability;

    return res.json({
      success: true,
      data: {
        leftPoints: Number(leftRating.toFixed(1)),
        rightPoints: Number(rightRating.toFixed(1)),
        leftProbability: Number((leftProbability / normalization).toFixed(4)),
        rightProbability: Number((rightProbability / normalization).toFixed(4))
      }
    });
  }
);

router.post(
  '/compare/team-vs-team',
  intelligencePublicLimiter,
  [
    body('left.teamId').optional().isString(),
    body('right.teamId').optional().isString(),
    body('left.rating').optional().isNumeric(),
    body('right.rating').optional().isNumeric(),
    body('left.points').optional().isNumeric(),
    body('right.points').optional().isNumeric()
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const leftTeamId = req.body?.left?.teamId ? String(req.body.left.teamId) : '';
      const rightTeamId = req.body?.right?.teamId ? String(req.body.right.teamId) : '';

      const [leftTeam, rightTeam] = await Promise.all([
        leftTeamId ? Team.findById(leftTeamId).lean() : null,
        rightTeamId ? Team.findById(rightTeamId).lean() : null
      ]);

      const resolveTeamRating = (team: any, fallback: number) => {
        if (!team) return fallback;
        const wins = Number(team?.stats?.wins || 0);
        const losses = Number(team?.stats?.losses || 0);
        const totalMatches = Math.max(1, Number(team?.stats?.totalMatches || wins + losses || 1));
        const winRate = Number(team?.stats?.winRate || ((wins / totalMatches) * 100));
        const core = 1000 + winRate * 4 + (wins - losses) * 3;
        return Math.max(600, Math.min(2400, core));
      };

      const leftRating = resolveTeamRating(leftTeam, toNumber(req.body?.left?.points ?? req.body?.left?.rating, 1000));
      const rightRating = resolveTeamRating(rightTeam, toNumber(req.body?.right?.points ?? req.body?.right?.rating, 1000));

      const leftExpected = 1 / (1 + Math.pow(10, (rightRating - leftRating) / 400));
      const rightExpected = 1 - leftExpected;

      const leftSynergy = Math.max(0.9, Math.min(1.15, 1 + (Number(leftTeam?.members?.length || 0) - 3) * 0.02));
      const rightSynergy = Math.max(0.9, Math.min(1.15, 1 + (Number(rightTeam?.members?.length || 0) - 3) * 0.02));

      const leftScore = leftExpected * leftSynergy;
      const rightScore = rightExpected * rightSynergy;
      const normalization = leftScore + rightScore || 1;

      return res.json({
        success: true,
        data: {
          left: {
            teamId: leftTeamId || null,
            name: (leftTeam as any)?.name || 'Left',
            rating: Number(leftRating.toFixed(1)),
            points: Number(leftRating.toFixed(1)),
            probability: Number((leftScore / normalization).toFixed(4))
          },
          right: {
            teamId: rightTeamId || null,
            name: (rightTeam as any)?.name || 'Right',
            rating: Number((rightRating).toFixed(1)),
            points: Number((rightRating).toFixed(1)),
            probability: Number((rightScore / normalization).toFixed(4))
          }
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to compare teams' });
    }
  }
);

router.get('/telegram/deep-link/team/:teamId', intelligencePublicLimiter, async (req: Request, res: Response) => {
  try {
    const teamId = String(req.params.teamId || '').trim();
    if (!teamId) {
      return res.status(400).json({ success: false, error: 'teamId is required' });
    }

    const botUsername = String(process.env.TELEGRAM_BOT_USERNAME || '').replace('@', '').trim();
    if (!botUsername) {
      return res.status(503).json({ success: false, error: 'TELEGRAM_BOT_USERNAME is not configured' });
    }

    const payload = `invite_team_${teamId}`;
    const deepLink = `https://t.me/${botUsername}?start=${encodeURIComponent(payload)}`;
    return res.json({ success: true, data: { payload, deepLink } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to build deep link' });
  }
});

router.get('/telegram/player-card/:userId', intelligencePublicLimiter, async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.userId || '').trim();
    const user: any = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const wins = Number(user?.stats?.wins || 0);
    const losses = Number(user?.stats?.losses || 0);
    const total = Math.max(1, wins + losses);
    const winRate = (wins / total) * 100;
    const points = 1000 + wins * 8 - losses * 4;
    const streakIntensity = Math.min(1, Math.max(0.1, wins / Math.max(1, total)));
    const rankColor = points >= 1600 ? '#8a2be2' : points >= 1450 ? '#ff4fa0' : points >= 1300 ? '#ff3b30' : '#ff6b00';

    const botUsername = String(process.env.TELEGRAM_BOT_USERNAME || '').replace('@', '').trim();
    const sharePayload = `player_${userId}`;
    const shareLink = botUsername ? `https://t.me/${botUsername}?start=${encodeURIComponent(sharePayload)}` : null;

    return res.json({
      success: true,
      data: {
        userId,
        username: user.username || 'Player',
        role: user.primaryRole || 'Flex',
        points: Number(points.toFixed(1)),
        wins,
        losses,
        winRate: Number(winRate.toFixed(1)),
        rankColor,
        flameIntensity: Number(streakIntensity.toFixed(2)),
        sharePayload,
        shareLink
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load player card data' });
  }
});

router.get('/telegram/player-card/:userId.svg', intelligencePublicLimiter, async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.userId || '').trim();
    const user: any = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).send('User not found');
    }

    const wins = Number(user?.stats?.wins || 0);
    const losses = Number(user?.stats?.losses || 0);
    const total = Math.max(1, wins + losses);
    const winRate = (wins / total) * 100;
    const points = 1000 + wins * 8 - losses * 4;
    const rankColor = points >= 1600 ? '#8a2be2' : points >= 1450 ? '#ff4fa0' : points >= 1300 ? '#ff3b30' : '#ff6b00';
    const username = String(user.username || 'Player').replace(/[<>&"]/g, '');
    const role = String(user.primaryRole || 'Flex').replace(/[<>&"]/g, '');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050505"/>
      <stop offset="100%" stop-color="#111111"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="${rankColor}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${rankColor}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="1200" height="630" fill="url(#bg)"/>
  <circle cx="930" cy="130" r="220" fill="url(#glow)"/>
  <rect x="56" y="56" rx="24" ry="24" width="1088" height="518" fill="rgba(255,255,255,0.03)" stroke="${rankColor}" stroke-opacity="0.55" stroke-width="3"/>
  <text x="100" y="150" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="#ffffff">${username}</text>
  <text x="100" y="205" font-family="Arial, sans-serif" font-size="30" fill="#b9b9b9">Role: ${role}</text>
  <text x="100" y="290" font-family="Arial, sans-serif" font-size="72" font-weight="700" fill="${rankColor}">POINTS ${Math.round(points)}</text>
  <text x="100" y="365" font-family="Arial, sans-serif" font-size="34" fill="#ffffff">Win Rate ${winRate.toFixed(1)}%</text>
  <text x="100" y="420" font-family="Arial, sans-serif" font-size="28" fill="#cfcfcf">W ${wins} / L ${losses}</text>
  <text x="100" y="520" font-family="Arial, sans-serif" font-size="26" fill="#ff6b00">WAY ESPORTS - PLAYER STATUS CARD</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).send(svg);
  } catch (error: any) {
    return res.status(500).send(error.message || 'Failed to render player card');
  }
});

export default router;
