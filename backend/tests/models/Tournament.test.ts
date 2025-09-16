import mongoose from 'mongoose';
import { Tournament } from '../../models/Tournament';
import { Team } from '../../models/Team';
import { User } from '../../models/User';

describe('Tournament Model', () => {
  let user: any;
  let teams: any[] = [];

  beforeEach(async () => {
    // Create test user
    user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      telegramId: '123456789',
      role: 'admin'
    });
    await user.save();

    // Create test teams
    for (let i = 1; i <= 8; i++) {
      const team = new Team({
        name: `Team ${i}`,
        tag: `T${i}`,
        logo: 'https://example.com/logo.png',
        game: 'CS:GO',
        captain: user._id,
        players: [{
          userId: user._id,
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

  describe('Tournament Creation', () => {
    it('should create a tournament with valid data', async () => {
      const tournamentData = {
        name: 'Test Tournament',
        game: 'CS:GO',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        maxTeams: 16,
        prizePool: 1000,
        description: 'Test tournament description',
        rules: 'Test tournament rules',
        format: 'single_elimination',
        createdBy: user._id
      };

      const tournament = new Tournament(tournamentData);
      await tournament.save();

      expect(tournament.name).toBe(tournamentData.name);
      expect(tournament.status).toBe('registration');
      expect(tournament.isActive).toBe(true);
      expect(tournament.participantCount).toBe(0);
    });

    it('should fail to create tournament with end date before start date', async () => {
      const tournamentData = {
        name: 'Invalid Tournament',
        game: 'CS:GO',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        maxTeams: 16,
        prizePool: 1000,
        description: 'Test tournament description',
        rules: 'Test tournament rules',
        format: 'single_elimination',
        createdBy: user._id
      };

      const tournament = new Tournament(tournamentData);
      
      await expect(tournament.save()).rejects.toThrow('End date must be after start date');
    });
  });

  describe('Tournament Registration', () => {
    let tournament: any;

    beforeEach(async () => {
      tournament = new Tournament({
        name: 'Registration Test Tournament',
        game: 'CS:GO',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxTeams: 8,
        prizePool: 1000,
        description: 'Test tournament description',
        rules: 'Test tournament rules',
        format: 'single_elimination',
        createdBy: user._id
      });
      await tournament.save();
    });

    it('should allow team registration when registration is open', () => {
      expect(tournament.isRegistrationOpen()).toBe(true);
    });

    it('should update participant count when teams are registered', async () => {
      tournament.registeredTeams.push(teams[0]._id, teams[1]._id);
      await tournament.save();

      expect(tournament.participantCount).toBe(2);
    });

    it('should not allow registration when tournament is full', async () => {
      // Fill tournament to capacity
      for (let i = 0; i < 8; i++) {
        tournament.registeredTeams.push(teams[i]._id);
      }
      await tournament.save();

      expect(tournament.isRegistrationOpen()).toBe(false);
    });

    it('should not allow registration when tournament has started', async () => {
      tournament.status = 'in_progress';
      await tournament.save();

      expect(tournament.isRegistrationOpen()).toBe(false);
    });
  });

  describe('Tournament Bracket Generation', () => {
    let tournament: any;

    beforeEach(async () => {
      tournament = new Tournament({
        name: 'Bracket Test Tournament',
        game: 'CS:GO',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxTeams: 16,
        prizePool: 1000,
        description: 'Test tournament description',
        rules: 'Test tournament rules',
        format: 'single_elimination',
        createdBy: user._id
      });
      await tournament.save();
    });

    it('should generate bracket for 8 teams', async () => {
      // Register 8 teams
      for (let i = 0; i < 8; i++) {
        tournament.registeredTeams.push(teams[i]._id);
      }
      await tournament.save();

      tournament.generateBracket();

      expect(tournament.bracket.rounds).toBe(3); // 8 teams = 3 rounds
      expect(tournament.bracket.matches).toHaveLength(7); // 8 teams = 7 matches total
      
      // Check first round has 4 matches
      const firstRoundMatches = tournament.bracket.matches.filter((m: any) => m.round === 1);
      expect(firstRoundMatches).toHaveLength(4);
    });

    it('should generate bracket for 6 teams with byes', async () => {
      // Register 6 teams
      for (let i = 0; i < 6; i++) {
        tournament.registeredTeams.push(teams[i]._id);
      }
      await tournament.save();

      tournament.generateBracket();

      expect(tournament.bracket.rounds).toBe(3); // 6 teams = 3 rounds
      
      // Check that some matches are auto-completed (byes)
      const firstRoundMatches = tournament.bracket.matches.filter((m: any) => m.round === 1);
      const completedMatches = firstRoundMatches.filter((m: any) => m.status === 'completed');
      expect(completedMatches.length).toBeGreaterThan(0);
    });

    it('should fail to generate bracket with less than 2 teams', async () => {
      tournament.registeredTeams.push(teams[0]._id);
      await tournament.save();

      expect(() => tournament.generateBracket()).toThrow('At least 2 teams required for tournament');
    });

    it('should handle large tournaments (64 teams)', async () => {
      // Create additional teams for large tournament test
      const additionalTeams = [];
      for (let i = 9; i <= 64; i++) {
        const team = new Team({
          name: `Team ${i}`,
          tag: `T${i}`,
          logo: 'https://example.com/logo.png',
          game: 'CS:GO',
          captain: user._id,
          players: [{
            userId: user._id,
            role: 'Captain',
            joinedAt: new Date(),
            isActive: true
          }]
        });
        await team.save();
        additionalTeams.push(team);
      }

      // Register all 64 teams
      for (let i = 0; i < 8; i++) {
        tournament.registeredTeams.push(teams[i]._id);
      }
      for (const team of additionalTeams) {
        tournament.registeredTeams.push(team._id);
      }
      await tournament.save();

      const startTime = Date.now();
      tournament.generateBracket();
      const endTime = Date.now();

      expect(tournament.bracket.rounds).toBe(6); // 64 teams = 6 rounds
      expect(tournament.bracket.matches).toHaveLength(63); // 64 teams = 63 matches total
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });

  describe('Tournament Status Management', () => {
    let tournament: any;

    beforeEach(async () => {
      tournament = new Tournament({
        name: 'Status Test Tournament',
        game: 'CS:GO',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxTeams: 8,
        prizePool: 1000,
        description: 'Test tournament description',
        rules: 'Test tournament rules',
        format: 'single_elimination',
        createdBy: user._id
      });
      await tournament.save();
    });

    it('should allow tournament to start with enough teams', async () => {
      // Register 4 teams
      for (let i = 0; i < 4; i++) {
        tournament.registeredTeams.push(teams[i]._id);
      }
      tournament.startDate = new Date(Date.now() - 1000); // Set start date to past
      await tournament.save();

      expect(tournament.canStart()).toBe(true);
    });

    it('should not allow tournament to start with insufficient teams', async () => {
      tournament.registeredTeams.push(teams[0]._id); // Only 1 team
      tournament.startDate = new Date(Date.now() - 1000);
      await tournament.save();

      expect(tournament.canStart()).toBe(false);
    });

    it('should not allow tournament to start before start date', async () => {
      // Register enough teams
      for (let i = 0; i < 4; i++) {
        tournament.registeredTeams.push(teams[i]._id);
      }
      await tournament.save();

      expect(tournament.canStart()).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    it('should handle tournament creation efficiently', async () => {
      const startTime = Date.now();
      
      const tournaments = [];
      for (let i = 0; i < 100; i++) {
        const tournament = new Tournament({
          name: `Performance Test Tournament ${i}`,
          game: 'CS:GO',
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          maxTeams: 16,
          prizePool: 1000,
          description: 'Performance test tournament',
          rules: 'Performance test rules',
          format: 'single_elimination',
          createdBy: user._id
        });
        tournaments.push(tournament);
      }

      await Tournament.insertMany(tournaments);
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in less than 5 seconds
    });

    it('should query tournaments efficiently with indexes', async () => {
      // Create test tournaments
      const tournaments = [];
      for (let i = 0; i < 1000; i++) {
        tournaments.push({
          name: `Query Test Tournament ${i}`,
          game: i % 2 === 0 ? 'CS:GO' : 'Valorant',
          startDate: new Date(Date.now() + (i * 60 * 60 * 1000)),
          endDate: new Date(Date.now() + ((i + 24) * 60 * 60 * 1000)),
          maxTeams: 16,
          prizePool: 1000,
          description: 'Query test tournament',
          rules: 'Query test rules',
          format: 'single_elimination',
          status: i % 3 === 0 ? 'completed' : 'registration',
          createdBy: user._id,
          isActive: true
        });
      }
      await Tournament.insertMany(tournaments);

      const startTime = Date.now();
      
      // Test various queries that should use indexes
      await Tournament.find({ game: 'CS:GO', status: 'registration' }).limit(10);
      await Tournament.find({ isActive: true, status: 'registration' }).sort({ startDate: -1 }).limit(10);
      await Tournament.find({ createdBy: user._id }).sort({ createdAt: -1 }).limit(10);
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });
});