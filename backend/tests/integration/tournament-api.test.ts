import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { Tournament } from '../../models/Tournament';
import { Team } from '../../models/Team';
import { User } from '../../models/User';
import tournamentRouter from '../../routes/tournaments';
import { TestDataFactory, PerformanceMonitor, expectPerformance } from '../utils/test-helpers';

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  auth: (req: any, res: any, next: any) => {
    req.user = { id: req.headers['user-id'], role: req.headers['user-role'] || 'user' };
    next();
  }
}));

describe('Tournament API Integration Tests', () => {
  let app: express.Application;
  let admin: any;
  let user: any;
  let teams: any[] = [];
  const performanceMonitor = new PerformanceMonitor();

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/tournaments', tournamentRouter);
  });

  beforeEach(async () => {
    // Create test users
    admin = await TestDataFactory.createUser({ role: 'admin' });
    user = await TestDataFactory.createUser({ role: 'user' });

    // Create test teams
    teams = await TestDataFactory.createMultipleTeams(16);
  });

  afterEach(async () => {
    teams = [];
  });

  describe('Tournament CRUD Operations', () => {
    it('should create tournament successfully', async () => {
      const tournamentData = {
        name: 'API Test Tournament',
        game: 'CS:GO',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxTeams: 16,
        prizePool: 5000,
        description: 'API test tournament',
        rules: 'Standard rules',
        format: 'single_elimination'
      };

      performanceMonitor.start();
      const response = await request(app)
        .post('/api/tournaments')
        .set('user-id', admin._id.toString())
        .set('user-role', 'admin')
        .send(tournamentData)
        .expect(201);

      const duration = performanceMonitor.end('create-tournament');
      expectPerformance(duration, 1000, 'Tournament creation');

      expect(response.body.name).toBe(tournamentData.name);
      expect(response.body.status).toBe('registration');
      expect(response.body.isActive).toBe(true);
      expect(response.body.participantCount).toBe(0);
    });

    it('should get tournaments with pagination', async () => {
      // Create multiple tournaments
      const tournaments = [];
      for (let i = 0; i < 25; i++) {
        const tournament = await TestDataFactory.createTournament(admin, {
          name: `Pagination Test Tournament ${i}`,
          game: i % 2 === 0 ? 'CS:GO' : 'Valorant'
        });
        tournaments.push(tournament);
      }

      performanceMonitor.start();
      const response = await request(app)
        .get('/api/tournaments?page=1&limit=10')
        .expect(200);

      const duration = performanceMonitor.end('get-tournaments-paginated');
      expectPerformance(duration, 500, 'Paginated tournament query');

      expect(response.body.tournaments).toHaveLength(10);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalCount).toBeGreaterThanOrEqual(25);
      expect(response.body.pagination.hasNext).toBe(true);
    });

    it('should filter tournaments by game', async () => {
      // Create tournaments with different games
      await TestDataFactory.createTournament(admin, { name: 'CS:GO Tournament', game: 'CS:GO' });
      await TestDataFactory.createTournament(admin, { name: 'Valorant Tournament', game: 'Valorant' });
      await TestDataFactory.createTournament(admin, { name: 'Dota Tournament', game: 'Dota 2' });

      const response = await request(app)
        .get('/api/tournaments?game=CS:GO')
        .expect(200);

      expect(response.body.tournaments.length).toBeGreaterThan(0);
      response.body.tournaments.forEach((tournament: any) => {
        expect(tournament.game).toBe('CS:GO');
      });
    });

    it('should search tournaments by name', async () => {
      await TestDataFactory.createTournament(admin, { name: 'Championship Series' });
      await TestDataFactory.createTournament(admin, { name: 'Weekly Cup' });
      await TestDataFactory.createTournament(admin, { name: 'Championship Finals' });

      const response = await request(app)
        .get('/api/tournaments?search=Championship')
        .expect(200);

      expect(response.body.tournaments.length).toBe(2);
      response.body.tournaments.forEach((tournament: any) => {
        expect(tournament.name.toLowerCase()).toContain('championship');
      });
    });

    it('should get tournament by ID with detailed information', async () => {
      const { tournament } = await TestDataFactory.createTournamentWithTeams(admin, 8);

      performanceMonitor.start();
      const response = await request(app)
        .get(`/api/tournaments/${tournament._id}`)
        .expect(200);

      const duration = performanceMonitor.end('get-tournament-by-id');
      expectPerformance(duration, 1000, 'Tournament detail query');

      expect(response.body._id).toBe(tournament._id.toString());
      expect(response.body.registeredTeams).toHaveLength(8);
      expect(response.body.participantCount).toBe(8);
      expect(response.body.spotsRemaining).toBe(tournament.maxTeams - 8);
    });

    it('should update tournament', async () => {
      const tournament = await TestDataFactory.createTournament(admin);

      const updateData = {
        name: 'Updated Tournament Name',
        prizePool: 10000
      };

      const response = await request(app)
        .put(`/api/tournaments/${tournament._id}`)
        .set('user-id', admin._id.toString())
        .set('user-role', 'admin')
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.prizePool).toBe(updateData.prizePool);
    });

    it('should not allow non-admin to create tournament', async () => {
      const tournamentData = {
        name: 'Unauthorized Tournament',
        game: 'CS:GO',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxTeams: 16,
        prizePool: 5000,
        description: 'Test',
        rules: 'Test',
        format: 'single_elimination'
      };

      await request(app)
        .post('/api/tournaments')
        .set('user-id', user._id.toString())
        .set('user-role', 'user')
        .send(tournamentData)
        .expect(401);
    });
  });

  describe('Tournament Registration', () => {
    let tournament: any;

    beforeEach(async () => {
      tournament = await TestDataFactory.createTournament(admin, { maxTeams: 8 });
    });

    it('should register team successfully', async () => {
      performanceMonitor.start();
      const response = await request(app)
        .post(`/api/tournaments/${tournament._id}/register`)
        .set('user-id', user._id.toString())
        .send({ teamId: teams[0]._id })
        .expect(200);

      const duration = performanceMonitor.end('team-registration');
      expectPerformance(duration, 500, 'Team registration');

      expect(response.body.registeredTeams).toContain(teams[0]._id.toString());
      expect(response.body.participantCount).toBe(1);
    });

    it('should not allow duplicate team registration', async () => {
      // Register team first time
      await request(app)
        .post(`/api/tournaments/${tournament._id}/register`)
        .set('user-id', user._id.toString())
        .send({ teamId: teams[0]._id })
        .expect(200);

      // Try to register same team again
      await request(app)
        .post(`/api/tournaments/${tournament._id}/register`)
        .set('user-id', user._id.toString())
        .send({ teamId: teams[0]._id })
        .expect(400);
    });

    it('should not allow registration when tournament is full', async () => {
      // Fill tournament to capacity
      for (let i = 0; i < 8; i++) {
        await request(app)
          .post(`/api/tournaments/${tournament._id}/register`)
          .set('user-id', user._id.toString())
          .send({ teamId: teams[i]._id })
          .expect(200);
      }

      // Try to register one more team
      await request(app)
        .post(`/api/tournaments/${tournament._id}/register`)
        .set('user-id', user._id.toString())
        .send({ teamId: teams[8]._id })
        .expect(400);
    });

    it('should handle concurrent registrations correctly', async () => {
      const registrationPromises = [];
      
      // Try to register 10 teams concurrently to an 8-team tournament
      for (let i = 0; i < 10; i++) {
        const promise = request(app)
          .post(`/api/tournaments/${tournament._id}/register`)
          .set('user-id', user._id.toString())
          .send({ teamId: teams[i]._id });
        registrationPromises.push(promise);
      }

      const results = await Promise.allSettled(registrationPromises);
      
      // Count successful registrations
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 200
      ).length;

      // Should have exactly 8 successful registrations
      expect(successful).toBe(8);

      // Verify tournament state
      const updatedTournament = await Tournament.findById(tournament._id);
      expect(updatedTournament!.registeredTeams).toHaveLength(8);
    });
  });

  describe('Tournament Lifecycle', () => {
    let tournament: any;

    beforeEach(async () => {
      const { tournament: t } = await TestDataFactory.createTournamentWithTeams(admin, 8, { maxTeams: 8 });
      tournament = t;
    });

    it('should start tournament and generate bracket', async () => {
      performanceMonitor.start();
      const response = await request(app)
        .post(`/api/tournaments/${tournament._id}/start`)
        .set('user-id', admin._id.toString())
        .set('user-role', 'admin')
        .expect(200);

      const duration = performanceMonitor.end('tournament-start');
      expectPerformance(duration, 2000, 'Tournament start and bracket generation');

      expect(response.body.status).toBe('in_progress');
      expect(response.body.bracket.matches).toHaveLength(7); // 8 teams = 7 matches
      expect(response.body.bracket.rounds).toBe(3);

      // Check first round matches
      const firstRoundMatches = response.body.bracket.matches.filter((m: any) => m.round === 1);
      expect(firstRoundMatches).toHaveLength(4);
      
      firstRoundMatches.forEach((match: any) => {
        expect(match.team1).toBeTruthy();
        expect(match.team2).toBeTruthy();
        expect(match.status).toBe('pending');
      });
    });

    it('should not start tournament with insufficient teams', async () => {
      const smallTournament = await TestDataFactory.createTournament(admin, { maxTeams: 8 });
      
      // Register only 1 team
      smallTournament.registeredTeams = [teams[0]._id];
      await smallTournament.save();

      await request(app)
        .post(`/api/tournaments/${smallTournament._id}/start`)
        .set('user-id', admin._id.toString())
        .set('user-role', 'admin')
        .expect(400);
    });

    it('should update match results', async () => {
      // Start tournament first
      await request(app)
        .post(`/api/tournaments/${tournament._id}/start`)
        .set('user-id', admin._id.toString())
        .set('user-role', 'admin')
        .expect(200);

      const updatedTournament = await Tournament.findById(tournament._id);
      const firstMatch = updatedTournament!.bracket.matches.find(m => m.round === 1);

      performanceMonitor.start();
      const response = await request(app)
        .put(`/api/tournaments/${tournament._id}/matches/${firstMatch!._id}`)
        .set('user-id', admin._id.toString())
        .set('user-role', 'admin')
        .send({
          score1: 16,
          score2: 12,
          winner: firstMatch!.team1
        })
        .expect(200);

      const duration = performanceMonitor.end('match-update');
      expectPerformance(duration, 1000, 'Match result update');

      // Find the updated match
      const updatedMatch = response.body.bracket.matches.find((m: any) => m._id === firstMatch!._id.toString());
      expect(updatedMatch.status).toBe('completed');
      expect(updatedMatch.score1).toBe(16);
      expect(updatedMatch.score2).toBe(12);
      expect(updatedMatch.winner).toBe(firstMatch!.team1.toString());
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle high load of tournament queries', async () => {
      // Create many tournaments
      const tournaments = [];
      for (let i = 0; i < 100; i++) {
        tournaments.push(await TestDataFactory.createTournament(admin, {
          name: `Load Test Tournament ${i}`,
          game: i % 3 === 0 ? 'CS:GO' : i % 3 === 1 ? 'Valorant' : 'Dota 2'
        }));
      }

      // Perform concurrent queries
      const queryPromises = [];
      for (let i = 0; i < 50; i++) {
        queryPromises.push(
          request(app).get('/api/tournaments?limit=10')
        );
      }

      performanceMonitor.start();
      const results = await Promise.all(queryPromises);
      const duration = performanceMonitor.end('concurrent-queries');

      expectPerformance(duration, 5000, '50 concurrent tournament queries');

      // All queries should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body.tournaments).toBeDefined();
      });
    });

    it('should handle bulk team registrations efficiently', async () => {
      const largeTournament = await TestDataFactory.createTournament(admin, { maxTeams: 64 });
      
      // Create additional teams
      const additionalTeams = await TestDataFactory.createMultipleTeams(48);
      const allTeams = [...teams, ...additionalTeams];

      performanceMonitor.start();
      
      // Register teams in batches to simulate real-world scenario
      const batchSize = 8;
      for (let i = 0; i < allTeams.length; i += batchSize) {
        const batch = allTeams.slice(i, i + batchSize);
        const batchPromises = batch.map(team =>
          request(app)
            .post(`/api/tournaments/${largeTournament._id}/register`)
            .set('user-id', user._id.toString())
            .send({ teamId: team._id })
        );
        
        await Promise.all(batchPromises);
      }

      const duration = performanceMonitor.end('bulk-registration');
      expectPerformance(duration, 10000, 'Bulk team registration (64 teams)');

      // Verify final state
      const finalTournament = await Tournament.findById(largeTournament._id);
      expect(finalTournament!.registeredTeams).toHaveLength(64);
      expect(finalTournament!.participantCount).toBe(64);
    });

    it('should generate large tournament brackets efficiently', async () => {
      const sizes = [16, 32, 64];

      for (const size of sizes) {
        const { tournament } = await TestDataFactory.createTournamentWithTeams(admin, size, { maxTeams: size });

        performanceMonitor.start();
        await request(app)
          .post(`/api/tournaments/${tournament._id}/start`)
          .set('user-id', admin._id.toString())
          .set('user-role', 'admin')
          .expect(200);

        const duration = performanceMonitor.end(`bracket-generation-${size}`);
        expectPerformance(duration, 3000, `${size}-team bracket generation`);

        // Verify bracket structure
        const updatedTournament = await Tournament.findById(tournament._id);
        expect(updatedTournament!.bracket.matches).toHaveLength(size - 1);
        expect(updatedTournament!.bracket.rounds).toBe(Math.ceil(Math.log2(size)));
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid tournament ID gracefully', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/tournaments/${invalidId}`)
        .expect(404);
    });

    it('should handle malformed tournament data', async () => {
      const invalidData = {
        name: '', // Empty name
        game: 'CS:GO',
        startDate: 'invalid-date',
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxTeams: -5, // Negative number
        prizePool: 'not-a-number'
      };

      await request(app)
        .post('/api/tournaments')
        .set('user-id', admin._id.toString())
        .set('user-role', 'admin')
        .send(invalidData)
        .expect(400);
    });

    it('should handle database connection issues gracefully', async () => {
      // Temporarily close database connection
      await mongoose.disconnect();

      await request(app)
        .get('/api/tournaments')
        .expect(500);

      // Reconnect for other tests
      // Note: In real tests, you'd reconnect to test database
    });

    it('should validate tournament date constraints', async () => {
      const invalidTournament = {
        name: 'Invalid Date Tournament',
        game: 'CS:GO',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Start date after end date
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        maxTeams: 16,
        prizePool: 1000,
        description: 'Test',
        rules: 'Test',
        format: 'single_elimination'
      };

      await request(app)
        .post('/api/tournaments')
        .set('user-id', admin._id.toString())
        .set('user-role', 'admin')
        .send(invalidTournament)
        .expect(400);
    });
  });

  afterAll(async () => {
    performanceMonitor.logStats('create-tournament');
    performanceMonitor.logStats('get-tournaments-paginated');
    performanceMonitor.logStats('get-tournament-by-id');
    performanceMonitor.logStats('team-registration');
    performanceMonitor.logStats('tournament-start');
    performanceMonitor.logStats('match-update');
    performanceMonitor.logStats('concurrent-queries');
    performanceMonitor.logStats('bulk-registration');
    
    console.log('\n=== Tournament API Performance Summary ===');
    ['16', '32', '64'].forEach(size => {
      performanceMonitor.logStats(`bracket-generation-${size}`);
    });
  });
});