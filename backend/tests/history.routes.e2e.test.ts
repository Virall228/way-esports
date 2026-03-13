import express from 'express';
import request from 'supertest';

jest.mock('../src/middleware/auth', () => ({
  authenticateJWT: (req: any, res: any, next: any) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'No token provided' });
    }
    req.user = {
      _id: req.headers['x-user-id'] || '507f1f77bcf86cd799439011',
      id: req.headers['x-user-id'] || '507f1f77bcf86cd799439011',
      role: req.headers['x-user-role'] || 'user'
    };
    next();
  }
}));

jest.mock('../src/models/Match', () => ({
  __esModule: true,
  default: { find: jest.fn() }
}));

jest.mock('../src/models/Team', () => ({
  __esModule: true,
  default: { find: jest.fn(), findById: jest.fn() }
}));

jest.mock('../src/models/User', () => ({
  __esModule: true,
  default: { findById: jest.fn() }
}));

import historyRouter from '../src/routes/history';
import Match from '../src/models/Match';
import Team from '../src/models/Team';
import User from '../src/models/User';

const makeQueryChain = (payload: any) => {
  const chain: any = {
    select: jest.fn(() => chain),
    populate: jest.fn(() => chain),
    sort: jest.fn(() => chain),
    lean: jest.fn().mockResolvedValue(payload)
  };
  return chain;
};

const makeFindByIdChain = (payload: any) => {
  const chain: any = {
    select: jest.fn(() => chain),
    lean: jest.fn().mockResolvedValue(payload)
  };
  return chain;
};

describe('history routes e2e full-flow', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/history', historyRouter);

  const userId = '507f1f77bcf86cd799439011';
  const teamId = '507f1f77bcf86cd799439012';
  const opponentTeamId = '507f1f77bcf86cd799439013';
  const tournamentId = '507f1f77bcf86cd799439014';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/history/player/:userId returns summary + rows', async () => {
    (Team.find as any).mockReturnValue(
      makeQueryChain([{ _id: teamId }])
    );

    (Match.find as any).mockReturnValue(
      makeQueryChain([
        {
          _id: '507f1f77bcf86cd799439111',
          team1: teamId,
          team2: opponentTeamId,
          winner: teamId,
          game: 'valorant_mobile',
          endTime: new Date('2026-03-01T12:00:00.000Z'),
          tournament: {
            _id: tournamentId,
            name: 'Main Cup',
            game: 'valorant_mobile',
            status: 'completed',
            image: '/img/t.jpg'
          }
        },
        {
          _id: '507f1f77bcf86cd799439112',
          team1: teamId,
          team2: opponentTeamId,
          winner: opponentTeamId,
          game: 'valorant_mobile',
          endTime: new Date('2026-03-02T12:00:00.000Z'),
          tournament: {
            _id: tournamentId,
            name: 'Main Cup',
            game: 'valorant_mobile',
            status: 'completed',
            image: '/img/t.jpg'
          }
        }
      ])
    );

    const res = await request(app).get(`/api/history/player/${userId}?page=1&limit=20`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.matches).toBe(2);
    expect(res.body.data.summary.wins).toBe(1);
    expect(res.body.data.summary.losses).toBe(1);
    expect(res.body.data.items[0].tournamentName).toBe('Main Cup');
  });

  test('GET /api/history/player/:userId/matches returns premium details', async () => {
    (User.findById as any).mockReturnValue(
      makeFindByIdChain({
        _id: userId,
        isSubscribed: true,
        subscriptionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })
    );

    (Team.find as any).mockReturnValue(
      makeQueryChain([{ _id: teamId }])
    );

    (Match.find as any).mockReturnValue(
      makeQueryChain([
        {
          _id: '507f1f77bcf86cd799439113',
          team1: { _id: teamId, name: 'Team A', tag: 'TA' },
          team2: { _id: opponentTeamId, name: 'Team B', tag: 'TB' },
          winner: teamId,
          game: 'dota2',
          score: { team1: 2, team2: 1 },
          round: 'semi',
          map: 'Ascent',
          endTime: new Date('2026-03-03T12:00:00.000Z'),
          tournament: { _id: tournamentId, name: 'Main Cup', game: 'dota2' }
        }
      ])
    );

    const res = await request(app)
      .get(`/api/history/player/${userId}/matches`)
      .set('Authorization', 'Bearer test')
      .set('x-user-id', userId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].result).toBe('win');
    expect(res.body.data.items[0].score).toBe('2-1');
  });

  test('GET /api/history/player/:userId/export.csv returns CSV', async () => {
    (User.findById as any).mockReturnValue(
      makeFindByIdChain({
        _id: userId,
        isSubscribed: true,
        subscriptionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })
    );

    (Team.find as any).mockReturnValue(
      makeQueryChain([{ _id: teamId }])
    );

    (Match.find as any).mockReturnValue(
      makeQueryChain([
        {
          team1: teamId,
          team2: opponentTeamId,
          winner: teamId,
          endTime: new Date('2026-03-04T12:00:00.000Z'),
          tournament: {
            _id: tournamentId,
            name: 'Main Cup',
            game: 'valorant_mobile',
            status: 'completed'
          }
        }
      ])
    );

    const res = await request(app)
      .get(`/api/history/player/${userId}/export.csv`)
      .set('Authorization', 'Bearer test')
      .set('x-user-id', userId);

    expect(res.status).toBe(200);
    expect(String(res.headers['content-type'])).toContain('text/csv');
    expect(res.text).toContain('tournamentId,tournamentName,game,matches,wins,losses,winRate,lastMatchAt');
    expect(res.text).toContain('"Main Cup"');
  });

  test('GET /api/history/team/:teamId/matches returns 403 for non-member', async () => {
    (Team.findById as any).mockReturnValue(
      makeFindByIdChain({
        _id: teamId,
        captain: '507f1f77bcf86cd799439099',
        members: ['507f1f77bcf86cd799439098']
      })
    );

    const res = await request(app)
      .get(`/api/history/team/${teamId}/matches`)
      .set('Authorization', 'Bearer test')
      .set('x-user-id', userId);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/history/team/:teamId/export.csv returns CSV for subscribed member', async () => {
    (Team.findById as any).mockReturnValue(
      makeFindByIdChain({
        _id: teamId,
        captain: userId,
        members: [userId]
      })
    );

    (User.findById as any).mockReturnValue(
      makeFindByIdChain({
        _id: userId,
        isSubscribed: true,
        subscriptionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })
    );

    (Match.find as any).mockReturnValue(
      makeQueryChain([
        {
          team1: teamId,
          team2: opponentTeamId,
          winner: teamId,
          endTime: new Date('2026-03-05T12:00:00.000Z'),
          tournament: {
            _id: tournamentId,
            name: 'Team Cup',
            game: 'standoff2',
            status: 'completed'
          }
        }
      ])
    );

    const res = await request(app)
      .get(`/api/history/team/${teamId}/export.csv`)
      .set('Authorization', 'Bearer test')
      .set('x-user-id', userId);

    expect(res.status).toBe(200);
    expect(String(res.headers['content-type'])).toContain('text/csv');
    expect(res.text).toContain('tournamentId,tournamentName,game,matches,wins,losses,winRate,lastMatchAt');
    expect(res.text).toContain('"Team Cup"');
  });

  test('GET /api/history/player/:userId supports pagination edge-cases', async () => {
    (Team.find as any).mockReturnValue(
      makeQueryChain([{ _id: teamId }])
    );

    (Match.find as any).mockReturnValue(
      makeQueryChain([
        {
          team1: teamId,
          team2: opponentTeamId,
          winner: teamId,
          endTime: new Date('2026-03-06T12:00:00.000Z'),
          tournament: {
            _id: '507f1f77bcf86cd799439201',
            name: 'Cup 1',
            game: 'standoff2',
            status: 'completed'
          }
        },
        {
          team1: teamId,
          team2: opponentTeamId,
          winner: teamId,
          endTime: new Date('2026-03-07T12:00:00.000Z'),
          tournament: {
            _id: '507f1f77bcf86cd799439202',
            name: 'Cup 2',
            game: 'standoff2',
            status: 'completed'
          }
        },
        {
          team1: teamId,
          team2: opponentTeamId,
          winner: opponentTeamId,
          endTime: new Date('2026-03-08T12:00:00.000Z'),
          tournament: {
            _id: '507f1f77bcf86cd799439203',
            name: 'Cup 3',
            game: 'standoff2',
            status: 'completed'
          }
        }
      ])
    );

    const page1 = await request(app).get(`/api/history/player/${userId}?page=1&limit=2`);
    expect(page1.status).toBe(200);
    expect(page1.body.data.pagination.page).toBe(1);
    expect(page1.body.data.pagination.limit).toBe(2);
    expect(page1.body.data.pagination.total).toBe(3);
    expect(page1.body.data.pagination.totalPages).toBe(2);
    expect(page1.body.data.items).toHaveLength(2);

    const page2 = await request(app).get(`/api/history/player/${userId}?page=2&limit=2`);
    expect(page2.status).toBe(200);
    expect(page2.body.data.items).toHaveLength(1);
  });

  test('GET /api/history/player/:userId applies game/status filters', async () => {
    (Team.find as any).mockReturnValue(
      makeQueryChain([{ _id: teamId }])
    );

    (Match.find as any).mockReturnValue(
      makeQueryChain([
        {
          team1: teamId,
          team2: opponentTeamId,
          winner: teamId,
          endTime: new Date('2026-03-09T12:00:00.000Z'),
          tournament: {
            _id: '507f1f77bcf86cd799439301',
            name: 'Completed Standoff',
            game: 'standoff2',
            status: 'completed'
          }
        },
        {
          team1: teamId,
          team2: opponentTeamId,
          winner: teamId,
          endTime: new Date('2026-03-10T12:00:00.000Z'),
          tournament: {
            _id: '507f1f77bcf86cd799439302',
            name: 'Registration Standoff',
            game: 'standoff2',
            status: 'registration'
          }
        }
      ])
    );

    const filtered = await request(app).get(
      `/api/history/player/${userId}?game=standoff2&status=completed&page=1&limit=20`
    );
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.items).toHaveLength(1);
    expect(filtered.body.data.items[0].tournamentName).toBe('Completed Standoff');
    expect(filtered.body.data.summary.tournaments).toBe(1);
  });

  test('GET /api/history/player/:userId applies from/to date filters', async () => {
    (Team.find as any).mockReturnValue(
      makeQueryChain([{ _id: teamId }])
    );

    (Match.find as any).mockReturnValue(
      makeQueryChain([
        {
          team1: teamId,
          team2: opponentTeamId,
          winner: teamId,
          endTime: new Date('2026-03-12T12:00:00.000Z'),
          tournament: {
            _id: '507f1f77bcf86cd799439401',
            name: 'Old Cup',
            game: 'standoff2',
            status: 'completed'
          }
        },
        {
          team1: teamId,
          team2: opponentTeamId,
          winner: teamId,
          endTime: new Date('2026-03-15T12:00:00.000Z'),
          tournament: {
            _id: '507f1f77bcf86cd799439402',
            name: 'New Cup',
            game: 'standoff2',
            status: 'completed'
          }
        }
      ])
    );

    const filtered = await request(app).get(
      `/api/history/player/${userId}?from=2026-03-14T00:00:00.000Z&to=2026-03-16T00:00:00.000Z`
    );

    expect(filtered.status).toBe(200);
    expect(filtered.body.success).toBe(true);
    // Route passes from/to to query; mocked DB payload remains static in tests.
    expect((Match.find as any).mock.calls[0][0].startTime.$gte).toEqual(new Date('2026-03-14T00:00:00.000Z'));
    expect((Match.find as any).mock.calls[0][0].startTime.$lte).toEqual(new Date('2026-03-16T00:00:00.000Z'));
  });

  test('GET /api/history/player/:userId/matches supports sort=oldest', async () => {
    (User.findById as any).mockReturnValue(
      makeFindByIdChain({
        _id: userId,
        isSubscribed: true,
        subscriptionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })
    );

    (Team.find as any).mockReturnValue(
      makeQueryChain([{ _id: teamId }])
    );

    const chain = makeQueryChain([
      {
        _id: '507f1f77bcf86cd799439501',
        team1: { _id: teamId, name: 'Team A', tag: 'TA' },
        team2: { _id: opponentTeamId, name: 'Team B', tag: 'TB' },
        winner: teamId,
        game: 'dota2',
        score: { team1: 2, team2: 0 },
        endTime: new Date('2026-03-01T12:00:00.000Z'),
        tournament: { _id: tournamentId, name: 'Cup A', game: 'dota2' }
      }
    ]);
    (Match.find as any).mockReturnValue(
      chain
    );

    const res = await request(app)
      .get(`/api/history/player/${userId}/matches?sort=oldest`)
      .set('Authorization', 'Bearer test')
      .set('x-user-id', userId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(chain.sort).toHaveBeenCalledWith({
      endTime: 1,
      startTime: 1,
      createdAt: 1
    });
  });
});
