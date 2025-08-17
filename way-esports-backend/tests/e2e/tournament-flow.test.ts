import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { Tournament } from '../../models/Tournament';
import { Team } from '../../models/Team';
import { User } from '../../models/User';
import tournamentRouter from '../../routes/tournaments';
import { auth } from '../../middleware/auth';

// Mock auth middleware for testing
jest.mock('../../middleware/auth', () => ({
  auth: (req: any, res: any, next: any) => {
    req.user = { id: req.headers['user-id'], role: 'admin' };
    next();
  }
}));

describe('Tournament End-to-End Flow', () => {
  let app: express.Application;
  let admin: any;
  let teams: any[] = [];
  let authToken: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/tournaments', tournamentRouter);
  });

  beforeEach(async () => {
    // Create admin user
    admin = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      telegramId: '123456789',
      role: 'admin'
    });
    await admin.save();
    authToken = 'mock-token';

    // Create test teams
    teams = [];
    for (let i = 1; i <= 16; i++) {
      const captain = new User({
        username: `captain${i}`,
        email: `captain${i}@example.com`,
        password: 'password123',
        telegramId: `12345678${i}`
      });
      await captain.save();

      const team = new Team({
        name: `Team ${i}`,
        tag: `T${i.toString().padStart(2, '0')}`,
        logo: 'https://example.com/logo.png',
        game: 'CS:GO',
        captain: captain._id,
        players: [{
          userId: captain._id,
          role: 'Captain',
          joinedAt: new Date(),
          isActive: true
        }]
      });
      await team.save();
      teams.push(team);
    }
  });

  afterEach(async () => {
    teams = [];
  });

  describe('Complete Tournament Flow', () => {
    it('should complete full tournament lifecycle', async () => {
      // Step 1: Create Tournament
      const tournamentData = {
        name: 'E2E Test Tournament',
        game: 'CS:GO',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxTeams: 8,
        prizePool: 5000,
        description: 'End-to-end test tournament',
        rules: 'Standard tournament rules',
        format: 'single_elimination'
      };

      const createResponse = await request(app)
        .post('/api/tournaments')
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', admin._id.toString())
        .send(tournamentData)
        .expect(201);

      const tournamentId = createResponse.body._id;
      expect(createResponse.body.name).toBe(tournamentData.name);
      expect(createResponse.body.status).toBe('registration');

      // Step 2: Register Teams
      for (let i = 0; i < 8; i++) {
        await request(app)
          .post(`/api/tournaments/${tournamentId}/register`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('user-id', admin._id.toString())
          .send({ teamId: teams[i]._id })
          .expect(200);
      }

      // Verify tournament is full
      const fullTournament = await request(app)
        .get(`/api/tournaments/${tournamentId}`)
        .expect(200);

      expect(fullTournament.body.participantCount).toBe(8);
      expect(fullTournament.body.spotsRemaining).toBe(0);

      // Step 3: Start Tournament
      const startResponse = await request(app)
        .post(`/api/tournaments/${tournamentId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', admin._id.toString())
        .expect(200);

      expect(startResponse.body.status).toBe('in_progress');
      expect(startResponse.body.bracket.matches).toHaveLength(7); // 8 teams = 7 matches
      expect(startResponse.body.bracket.rounds).toBe(3);

      // Step 4: Simulate Tournament Matches
      const tournament = await Tournament.findById(tournamentId);
      const matches = tournament!.bracket.matches;

      // Play first round (4 matches)
      const firstRoundMatches = matches.filter(m => m.round === 1);
      expect(firstRoundMatches).toHaveLength(4);

      for (let i = 0; i < firstRoundMatches.length; i++) {
        const match = firstRoundMatches[i];
        const winner = i % 2 === 0 ? match.team1 : match.team2;
        const score1 = i % 2 === 0 ? 16 : 12;
        const score2 = i % 2 === 0 ? 12 : 16;

        await request(app)
          .put(`/api/tournaments/${tournamentId}/matches/${match._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('user-id', admin._id.toString())
          .send({
            score1,
            score2,
            winner
          })
          .expect(200);
      }

      // Verify second round matches are ready
      const afterFirstRound = await Tournament.findById(tournamentId);
      const secondRoundMatches = afterFirstRound!.bracket.matches.filter(m => m.round === 2);
      expect(secondRoundMatches).toHaveLength(2);
      
      // Check that winners advanced
      secondRoundMatches.forEach(match => {
        expect(match.team1).toBeTruthy();
        expect(match.team2).toBeTruthy();
      });

      // Play second round (2 matches)
      for (let i = 0; i < secondRoundMatches.length; i++) {
        const match = secondRoundMatches[i];
        const winner = i === 0 ? match.team1 : match.team2;
        const score1 = i === 0 ? 16 : 8;
        const score2 = i === 0 ? 10 : 16;

        await request(app)
          .put(`/api/tournaments/${tournamentId}/matches/${match._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('user-id', admin._id.toString())
          .send({
            score1,
            score2,
            winner
          })
          .expect(200);
      }

      // Play final match
      const afterSecondRound = await Tournament.findById(tournamentId);
      const finalMatch = afterSecondRound!.bracket.matches.find(m => m.round === 3);
      expect(finalMatch).toBeTruthy();
      expect(finalMatch!.team1).toBeTruthy();
      expect(finalMatch!.team2).toBeTruthy();

      const finalResponse = await request(app)
        .put(`/api/tournaments/${tournamentId}/matches/${finalMatch!._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', admin._id.toString())
        .send({
          score1: 16,
          score2: 14,
          winner: finalMatch!.team1
        })
        .expect(200);

      // Verify tournament is completed
      expect(finalResponse.body.status).toBe('completed');

      // Step 5: Verify Final State
      const completedTournament = await request(app)
        .get(`/api/tournaments/${tournamentId}`)
        .expect(200);

      expect(completedTournament.body.status).toBe('completed');
      
      // All matches should be completed
      const allMatches = completedTournament.body.bracket.matches;
      const completedMatches = allMatches.filter((m: any) => m.status === 'completed');
      expect(completedMatches).toHaveLength(7);

      // Final match should have a winner
      const finalMatchResult = allMatches.find((m: any) => m.round === 3);
      expect(finalMatchResult.winner).toBeTruthy();
    }, 30000); // Increase timeout for long test

    it('should handle tournament with byes correctly', async () => {
      // Create tournament with 6 teams (requires byes)
      const tournamentData = {
        name: 'Bye Test Tournament',
        game: 'CS:GO',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxTeams: 8,
        prizePool: 3000,
        description: 'Tournament with byes',
        rules: 'Standard rules',
        format: 'single_elimination'
      };

      const createResponse = await request(app)
        .post('/api/tournaments')
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', admin._id.toString())
        .send(tournamentData)
        .expect(201);

      const tournamentId = createResponse.body._id;

      // Register only 6 teams
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post(`/api/tournaments/${tournamentId}/register`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('user-id', admin._id.toString())
          .send({ teamId: teams[i]._id })
          .expect(200);
      }

      // Start tournament
      await request(app)
        .post(`/api/tournaments/${tournamentId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', admin._id.toString())
        .expect(200);

      const tournament = await Tournament.findById(tournamentId);
      const matches = tournament!.bracket.matches;

      // Check that some first round matches are auto-completed (byes)
      const firstRoundMatches = matches.filter(m => m.round === 1);
      const completedFirstRound = firstRoundMatches.filter(m => m.status === 'completed');
      
      expect(completedFirstRound.length).toBeGreaterThan(0);
      expect(tournament!.bracket.rounds).toBe(3);
    });

    it('should prevent invalid tournament operations', async () => {
      // Create tournament
      const tournamentData = {
        name: 'Invalid Operations Test',
        game: 'CS:GO',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxTeams: 4,
        prizePool: 1000,
        description: 'Test tournament',
        rules: 'Test rules',
        format: 'single_elimination'
      };

      const createResponse = await request(app)
        .post('/api/tournaments')
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', admin._id.toString())
        .send(tournamentData)
        .expect(201);

      const tournamentId = createResponse.body._id;

      // Try to start tournament with insufficient teams
      await request(app)
        .post(`/api/tournaments/${tournamentId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', admin._id.toString())
        .expect(400);

      // Register teams
      for (let i = 0; i < 4; i++) {
        await request(app)
          .post(`/api/tournaments/${tournamentId}/register`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('user-id', admin._id.toString())
          .send({ teamId: teams[i]._id })
          .expect(200);
      }

      // Try to register when tournament is full
      await request(app)
        .post(`/api/tournaments/${tournamentId}/register`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', admin._id.toString())
        .send({ teamId: teams[4]._id })
        .expect(400);

      // Start tournament
      await request(app)
        .post(`/api/tournaments/${tournamentId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', admin._id.toString())
        .expect(200);

      // Try to register after tournament started
      await request(app)
        .post(`/api/tournaments/${tournamentId}/register`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', admin._id.toString())
        .send({ teamId: teams[5]._id })
        .expect(400);

      // Try to start already started tournament
      await request(app)
        .post(`/api/tournaments/${tournamentId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', admin._id.toString())
        .expect(400);
    });
  });

  describe('Tournament Query Performance', () => {
    beforeEach(async () => {
      // Create many tournaments for performance testing
      const tournaments = [];
      for (let i = 0; i < 100; i++) {
        tournaments.push({
          name: `Performance Tournament ${i}`,
          game: i % 3 === 0 ? 'CS:GO' : i % 3 === 1 ? 'Valorant' : 'Dota 2',
          startDate: new Date(Date.now() + (i * 60 * 60 * 1000)),
          endDate: new Date(Date.now() + ((i + 24) * 60 * 60 * 1000)),
          maxTeams: 16,
          prizePool: 1000 + (i * 100),
          description: `Performance test tournament ${i}`,
          rules: 'Standard rules',
          format: 'single_elimination',
          status: i % 4 === 0 ? 'completed' : 'registration',
          createdBy: admin._id,
          isActive: true,
          participantCount: Math.floor(Math.random() * 16)
        });
      }
      await Tournament.insertMany(tournaments);
    });

    it('should handle paginated tournament queries efficiently', async () => {
      const startTime = Date.now();

      // Test pagination
      const response = await request(app)
        .get('/api/tournaments?page=1&limit=10')
        .expect(200);

      const endTime = Date.now();

      expect(response.body.tournaments).toHaveLength(10);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalCount).toBeGreaterThan(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should be fast
    });

    it('should handle filtered queries efficiently', async () => {
      const startTime = Date.now();

      // Test filtering
      const response = await request(app)
        .get('/api/tournaments?game=CS:GO&status=registration&limit=5')
        .expect(200);

      const endTime = Date.now();

      expect(response.body.tournaments.length).toBeLessThanOrEqual(5);
      response.body.tournaments.forEach((tournament: any) => {
        expect(tournament.game).toBe('CS:GO');
        expect(tournament.status).toBe('registration');
      });
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle search queries efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/tournaments?search=Performance&limit=20')
        .expect(200);

      const endTime = Date.now();

      expect(response.body.tournaments.length).toBeLessThanOrEqual(20);
      response.body.tournaments.forEach((tournament: any) => {
        expect(tournament.name.toLowerCase()).toContain('performance');
      });
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Large Tournament Handling', () => {
    it('should handle 64-team tournament efficiently', async () => {
      // Create additional teams for large tournament
      const additionalTeams = [];
      for (let i = 17; i <= 64; i++) {
        const captain = new User({
          username: `captain${i}`,
          email: `captain${i}@example.com`,
          password: 'password123',
          telegramId: `12345678${i}`
        });
        await captain.save();

        const team = new Team({
          name: `Team ${i}`,
          tag: `T${i.toString().padStart(2, '0')}`,
          logo: 'https://example.com/logo.png',
          game: 'CS:GO',
          captain: captain._id,
          players: [{
            userId: captain._id,
            role: 'Captain',
            joinedAt: new Date(),
            isActive: true
          }]
        });
        await team.save();
        additionalTeams.push(team);
      }

      // Create large tournament
      const tournamentData = {
        name: 'Large Tournament Test',
        game: 'CS:GO',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        maxTeams: 64,
        prizePool: 50000,
        description: 'Large tournament test',
        rules: 'Standard rules',
        format: 'single_elimination'
      };

      const createResponse = await request(app)
        .post('/api/tournaments')
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', admin._id.toString())
        .send(tournamentData)
        .expect(201);

      const tournamentId = createResponse.body._id;

      // Register all 64 teams
      const startRegistration = Date.now();
      
      for (let i = 0; i < 16; i++) {
        await request(app)
          .post(`/api/tournaments/${tournamentId}/register`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('user-id', admin._id.toString())
          .send({ teamId: teams[i]._id })
          .expect(200);
      }

      for (const team of additionalTeams) {
        await request(app)
          .post(`/api/tournaments/${tournamentId}/register`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('user-id', admin._id.toString())
          .send({ teamId: team._id })
          .expect(200);
      }

      const endRegistration = Date.now();
      expect(endRegistration - startRegistration).toBeLessThan(30000); // Should complete in 30 seconds

      // Start tournament and measure bracket generation time
      const startBracket = Date.now();
      
      const startResponse = await request(app)
        .post(`/api/tournaments/${tournamentId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('user-id', admin._id.toString())
        .expect(200);

      const endBracket = Date.now();

      expect(startResponse.body.status).toBe('in_progress');
      expect(startResponse.body.bracket.matches).toHaveLength(63); // 64 teams = 63 matches
      expect(startResponse.body.bracket.rounds).toBe(6); // 64 teams = 6 rounds
      expect(endBracket - startBracket).toBeLessThan(5000); // Bracket generation should be fast
    }, 60000); // Increase timeout for large tournament test
  });
});