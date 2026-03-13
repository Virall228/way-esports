import express from 'express';
import request from 'supertest';
import { Tournament } from '../../models/Tournament';
import { Team } from '../../models/Team';
import { User } from '../../models/User';
import tournamentRouter from '../../routes/tournaments';

jest.mock('../../middleware/auth', () => ({
  auth: (req: any, _res: any, next: any) => {
    req.user = {
      id: req.headers['user-id'],
      _id: req.headers['user-id'],
      role: req.headers['user-role'] || 'user'
    };
    next();
  }
}));

const makeTelegramId = () => Number(`9${Date.now().toString().slice(-9)}`);
const makeTag = (n: number) => `T${String(n).padStart(4, '0')}`.slice(0, 5);

describe('Tournament API Integration', () => {
  let app: express.Application;
  let admin: any;
  let user: any;
  let teams: any[] = [];

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/tournaments', tournamentRouter);
  });

  beforeEach(async () => {
    admin = await new User({
      username: `admin_${Date.now()}`,
      email: `admin_${Date.now()}@test.dev`,
      password: 'password123',
      telegramId: makeTelegramId(),
      role: 'admin'
    }).save();

    user = await new User({
      username: `user_${Date.now()}`,
      email: `user_${Date.now()}@test.dev`,
      password: 'password123',
      telegramId: makeTelegramId(),
      role: 'user'
    }).save();

    teams = [];
    for (let i = 1; i <= 4; i += 1) {
      const captain = await new User({
        username: `captain_${i}_${Date.now()}`,
        email: `captain_${i}_${Date.now()}@test.dev`,
        password: 'password123',
        telegramId: makeTelegramId(),
        role: 'user'
      }).save();

      const team = await new Team({
        name: `Team_${i}_${Date.now()}`,
        tag: makeTag(i),
        logo: 'https://example.com/logo.png',
        game: 'CS:GO',
        captain: captain._id,
        players: [{ userId: captain._id, role: 'Captain', joinedAt: new Date(), isActive: true }]
      }).save();

      teams.push(team);
    }
  });

  test('create tournament, list, register team, start', async () => {
    const createRes = await request(app)
      .post('/api/tournaments')
      .set('user-id', String(admin._id))
      .set('user-role', 'admin')
      .send({
        name: `Cup_${Date.now()}`,
        game: 'CS:GO',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxTeams: 8,
        prizePool: 1000,
        description: 'Test',
        rules: 'Rules',
        format: 'single_elimination',
        type: 'team'
      })
      .expect(201);

    const tournamentId = createRes.body._id;
    expect(tournamentId).toBeTruthy();

    const listRes = await request(app).get('/api/tournaments?page=1&limit=10').expect(200);
    expect(Array.isArray(listRes.body.tournaments)).toBe(true);
    expect(listRes.body.pagination.currentPage).toBe(1);

    const tournament = await Tournament.findById(tournamentId);
    expect(tournament).toBeTruthy();
    tournament!.registeredTeams = [teams[0]._id, teams[1]._id];
    tournament!.startDate = new Date(Date.now() - 1000);
    await tournament!.save();

    const startRes = await request(app)
      .post(`/api/tournaments/${tournamentId}/start`)
      .set('user-id', String(admin._id))
      .set('user-role', 'admin')
      .expect(200);

    expect(startRes.body.status).toBe('in_progress');
    expect(Array.isArray(startRes.body.bracket.matches)).toBe(true);
  });
});
