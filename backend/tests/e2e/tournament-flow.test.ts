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

const makeTelegramId = () => Number(`8${Date.now().toString().slice(-9)}`);
const makeTag = (n: number) => `E${String(n).padStart(4, '0')}`.slice(0, 5);

describe('Tournament E2E Flow', () => {
  let app: express.Application;
  let admin: any;
  let teams: any[] = [];

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/tournaments', tournamentRouter);
  });

  beforeEach(async () => {
    admin = await new User({
      username: `admin_e2e_${Date.now()}`,
      email: `admin_e2e_${Date.now()}@test.dev`,
      password: 'password123',
      telegramId: makeTelegramId(),
      role: 'admin'
    }).save();

    teams = [];
    for (let i = 1; i <= 4; i += 1) {
      const captain = await new User({
        username: `cap_e2e_${i}_${Date.now()}`,
        email: `cap_e2e_${i}_${Date.now()}@test.dev`,
        password: 'password123',
        telegramId: makeTelegramId(),
        role: 'user'
      }).save();

      const team = await new Team({
        name: `E2E_Team_${i}_${Date.now()}`,
        tag: makeTag(i),
        logo: 'https://example.com/logo.png',
        game: 'CS:GO',
        captain: captain._id,
        players: [{ userId: captain._id, role: 'Captain', joinedAt: new Date(), isActive: true }]
      }).save();

      teams.push(team);
    }
  });

  test('full flow: create -> register -> start -> complete one match', async () => {
    const created = await request(app)
      .post('/api/tournaments')
      .set('user-id', String(admin._id))
      .set('user-role', 'admin')
      .send({
        name: `Flow_${Date.now()}`,
        game: 'CS:GO',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxTeams: 4,
        prizePool: 2500,
        description: 'Flow test',
        rules: 'Rules',
        format: 'single_elimination',
        type: 'team'
      })
      .expect(201);

    const tournamentId = created.body._id;
    expect(tournamentId).toBeTruthy();

    const tournament = await Tournament.findById(tournamentId);
    expect(tournament).toBeTruthy();
    tournament!.registeredTeams = teams.map((t) => t._id);
    tournament!.startDate = new Date(Date.now() - 2000);
    await tournament!.save();

    const started = await request(app)
      .post(`/api/tournaments/${tournamentId}/start`)
      .set('user-id', String(admin._id))
      .set('user-role', 'admin')
      .expect(200);

    expect(started.body.status).toBe('in_progress');
    const firstMatch = started.body.bracket.matches.find((m: any) => m.round === 1);
    expect(firstMatch).toBeTruthy();

    const updated = await request(app)
      .put(`/api/tournaments/${tournamentId}/matches/${firstMatch._id}`)
      .set('user-id', String(admin._id))
      .set('user-role', 'admin')
      .send({
        score1: 13,
        score2: 11,
        winner: firstMatch.team1,
        winnerType: 'team'
      })
      .expect(200);

    const justUpdated = updated.body.bracket.matches.find((m: any) => m._id === firstMatch._id);
    expect(justUpdated.status).toBe('completed');
    expect(justUpdated.winner).toBe(firstMatch.team1);
  });
});
