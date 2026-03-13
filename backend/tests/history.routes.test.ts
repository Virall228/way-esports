import express from 'express';
import request from 'supertest';
import historyRouter, { historyTestUtils } from '../src/routes/history';

describe('history route helpers', () => {
  test('paginate returns correct slice and pagination', () => {
    const input = [1, 2, 3, 4, 5];
    const result = historyTestUtils.paginate(input, 2, 2);
    expect(result.items).toEqual([3, 4]);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 2,
      total: 5,
      totalPages: 3
    });
  });

  test('recalcTotals calculates totals and winRate', () => {
    const rows = [
      {
        tournamentId: 't1',
        tournamentName: 'T1',
        game: 'CS2',
        status: 'completed',
        startDate: null,
        endDate: null,
        image: null,
        matches: 2,
        wins: 1,
        losses: 1,
        winRate: 50,
        lastMatchAt: null
      },
      {
        tournamentId: 't2',
        tournamentName: 'T2',
        game: 'CS2',
        status: 'completed',
        startDate: null,
        endDate: null,
        image: null,
        matches: 3,
        wins: 2,
        losses: 1,
        winRate: 66.7,
        lastMatchAt: null
      }
    ];

    const totals = historyTestUtils.recalcTotals(rows as any);
    expect(totals.tournaments).toBe(2);
    expect(totals.matches).toBe(5);
    expect(totals.wins).toBe(3);
    expect(totals.losses).toBe(2);
    expect(totals.winRate).toBe(60);
  });

  test('buildHistoryCsv emits header and rows', () => {
    const rows = [
      {
        tournamentId: 't1',
        tournamentName: 'My Cup',
        game: 'CS2',
        status: 'completed',
        startDate: null,
        endDate: null,
        image: null,
        matches: 2,
        wins: 1,
        losses: 1,
        winRate: 50,
        lastMatchAt: new Date('2026-03-13T00:00:00.000Z')
      }
    ];
    const csv = historyTestUtils.buildHistoryCsv(rows as any);
    expect(csv).toContain('tournamentId,tournamentName,game,matches,wins,losses,winRate,lastMatchAt');
    expect(csv).toContain('"t1","My Cup","CS2",2,1,1,50,"2026-03-13T00:00:00.000Z"');
  });
});

describe('history premium endpoints auth', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/history', historyRouter);

  test('GET /api/history/player/:id/matches requires auth', async () => {
    const res = await request(app).get('/api/history/player/507f1f77bcf86cd799439011/matches');
    expect(res.status).toBe(401);
  });

  test('GET /api/history/team/:id/matches requires auth', async () => {
    const res = await request(app).get('/api/history/team/507f1f77bcf86cd799439012/matches');
    expect(res.status).toBe(401);
  });
});

