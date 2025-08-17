import mongoose from 'mongoose';
import { Tournament } from '../../models/Tournament';
import { Team } from '../../models/Team';
import { User } from '../../models/User';

describe('Tournament Performance Tests', () => {
  let admin: any;
  let teams: any[] = [];

  beforeAll(async () => {
    // Create admin user
    admin = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      telegramId: '123456789',
      role: 'admin'
    });
    await admin.save();

    // Create large number of teams for performance testing
    console.log('Creating teams for performance testing...');
    const teamPromises = [];
    
    for (let i = 1; i <= 1000; i++) {
      const captain = new User({
        username: `captain${i}`,
        email: `captain${i}@example.com`,
        password: 'password123',
        telegramId: `12345678${i.toString().padStart(4, '0')}`
      });
      
      teamPromises.push(captain.save().then(async (savedCaptain) => {
        const team = new Team({
          name: `Performance Team ${i}`,
          tag: `PT${i.toString().padStart(3, '0')}`,
          logo: 'https://example.com/logo.png',
          game: i % 3 === 0 ? 'CS:GO' : i % 3 === 1 ? 'Valorant' : 'Dota 2',
          captain: savedCaptain._id,
          players: [{
            userId: savedCaptain._id,
            role: 'Captain',
            joinedAt: new Date(),
            isActive: true
          }],
          stats: {
            wins: Math.floor(Math.random() * 100),
            losses: Math.floor(Math.random() * 100),
            tournamentsPlayed: Math.floor(Math.random() * 20),
            tournamentsWon: Math.floor(Math.random() * 5)
          }
        });
        return team.save();
      }));
    }

    teams = await Promise.all(teamPromises);
    console.log(`Created ${teams.length} teams for performance testing`);
  }, 120000); // 2 minutes timeout for setup

  afterAll(async () => {
    console.log('Cleaning up performance test data...');
  });

  describe('Tournament Creation Performance', () => {
    it('should create tournaments efficiently in bulk', async () => {
      const tournamentCount = 100;
      const startTime = Date.now();

      const tournaments = [];
      for (let i = 1; i <= tournamentCount; i++) {
        tournaments.push({
          name: `Bulk Tournament ${i}`,
          game: i % 3 === 0 ? 'CS:GO' : i % 3 === 1 ? 'Valorant' : 'Dota 2',
          startDate: new Date(Date.now() + (i * 60 * 60 * 1000)),
          endDate: new Date(Date.now() + ((i + 24) * 60 * 60 * 1000)),
          maxTeams: 16,
          prizePool: 1000 + (i * 100),
          description: `Bulk tournament ${i} description`,
          rules: 'Standard tournament rules',
          format: 'single_elimination',
          createdBy: admin._id,
          isActive: true
        });
      }

      await Tournament.insertMany(tournaments);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Created ${tournamentCount} tournaments in ${duration}ms`);
      expect(duration).toBeLessThan(10000); // Should complete in less than 10 seconds
      expect(duration / tournamentCount).toBeLessThan(100); // Less than 100ms per tournament
    });

    it('should handle concurrent tournament creation', async () => {
      const concurrentCount = 20;
      const startTime = Date.now();

      const promises = [];
      for (let i = 1; i <= concurrentCount; i++) {
        const tournamentPromise = new Tournament({
          name: `Concurrent Tournament ${i}`,
          game: 'CS:GO',
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          maxTeams: 16,
          prizePool: 5000,
          description: `Concurrent tournament ${i}`,
          rules: 'Standard rules',
          format: 'single_elimination',
          createdBy: admin._id
        }).save();
        
        promises.push(tournamentPromise);
      }

      const results = await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Created ${concurrentCount} tournaments concurrently in ${duration}ms`);
      expect(results).toHaveLength(concurrentCount);
      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
    });
  });

  describe('Tournament Query Performance', () => {
    beforeAll(async () => {
      // Create tournaments for query testing
      const tournaments = [];
      for (let i = 1; i <= 1000; i++) {
        tournaments.push({
          name: `Query Tournament ${i}`,
          game: i % 4 === 0 ? 'CS:GO' : i % 4 === 1 ? 'Valorant' : i % 4 === 2 ? 'Dota 2' : 'LoL',
          startDate: new Date(Date.now() + (i * 60 * 60 * 1000)),
          endDate: new Date(Date.now() + ((i + 24) * 60 * 60 * 1000)),
          maxTeams: [8, 16, 32, 64][i % 4],
          prizePool: 1000 + (i * 50),
          description: `Query tournament ${i}`,
          rules: 'Standard rules',
          format: ['single_elimination', 'double_elimination', 'round_robin'][i % 3],
          status: ['registration', 'in_progress', 'completed'][i % 3],
          createdBy: admin._id,
          isActive: i % 10 !== 0, // 10% inactive
          participantCount: Math.floor(Math.random() * 16),
          registeredTeams: teams.slice(0, Math.floor(Math.random() * 16)).map(t => t._id)
        });
      }
      await Tournament.insertMany(tournaments);
    });

    it('should perform basic queries efficiently', async () => {
      const queries = [
        () => Tournament.find({ isActive: true }).limit(10),
        () => Tournament.find({ game: 'CS:GO' }).limit(10),
        () => Tournament.find({ status: 'registration' }).limit(10),
        () => Tournament.find({ prizePool: { $gte: 5000 } }).limit(10),
        () => Tournament.find({ maxTeams: 16 }).limit(10)
      ];

      for (const query of queries) {
        const startTime = Date.now();
        const results = await query();
        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`Query completed in ${duration}ms, returned ${results.length} results`);
        expect(duration).toBeLessThan(500); // Should complete in less than 500ms
        expect(results.length).toBeLessThanOrEqual(10);
      }
    });

    it('should perform complex queries efficiently', async () => {
      const complexQueries = [
        () => Tournament.find({
          game: 'CS:GO',
          status: 'registration',
          prizePool: { $gte: 2000 },
          isActive: true
        }).sort({ startDate: -1 }).limit(20),
        
        () => Tournament.find({
          $or: [
            { game: 'CS:GO' },
            { game: 'Valorant' }
          ],
          status: { $in: ['registration', 'in_progress'] },
          maxTeams: { $gte: 16 }
        }).sort({ prizePool: -1 }).limit(15),
        
        () => Tournament.find({
          createdBy: admin._id,
          startDate: { $gte: new Date() }
        }).sort({ createdAt: -1 }).limit(25)
      ];

      for (const query of complexQueries) {
        const startTime = Date.now();
        const results = await query();
        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`Complex query completed in ${duration}ms, returned ${results.length} results`);
        expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
      }
    });

    it('should perform aggregation queries efficiently', async () => {
      const aggregationQueries = [
        () => Tournament.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: '$game', count: { $sum: 1 }, avgPrize: { $avg: '$prizePool' } } },
          { $sort: { count: -1 } }
        ]),
        
        () => Tournament.aggregate([
          { $match: { status: 'registration' } },
          { $lookup: { from: 'teams', localField: 'registeredTeams', foreignField: '_id', as: 'teams' } },
          { $addFields: { teamCount: { $size: '$teams' } } },
          { $match: { teamCount: { $gte: 5 } } },
          { $limit: 10 }
        ]),
        
        () => Tournament.aggregate([
          { $match: { prizePool: { $gte: 3000 } } },
          { $group: { _id: '$format', tournaments: { $push: '$$ROOT' } } },
          { $project: { _id: 1, count: { $size: '$tournaments' } } }
        ])
      ];

      for (const query of aggregationQueries) {
        const startTime = Date.now();
        const results = await query();
        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`Aggregation query completed in ${duration}ms, returned ${results.length} results`);
        expect(duration).toBeLessThan(2000); // Should complete in less than 2 seconds
      }
    });
  });

  describe('Tournament Registration Performance', () => {
    let tournament: any;

    beforeEach(async () => {
      tournament = new Tournament({
        name: 'Registration Performance Test',
        game: 'CS:GO',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxTeams: 64,
        prizePool: 10000,
        description: 'Performance test tournament',
        rules: 'Standard rules',
        format: 'single_elimination',
        createdBy: admin._id
      });
      await tournament.save();
    });

    it('should handle bulk team registration efficiently', async () => {
      const teamsToRegister = teams.slice(0, 64);
      const startTime = Date.now();

      // Simulate bulk registration
      tournament.registeredTeams = teamsToRegister.map(t => t._id);
      await tournament.save();

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Registered ${teamsToRegister.length} teams in ${duration}ms`);
      expect(duration).toBeLessThan(2000); // Should complete in less than 2 seconds
      expect(tournament.participantCount).toBe(64);
    });

    it('should handle concurrent team registrations', async () => {
      const concurrentRegistrations = 20;
      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < concurrentRegistrations; i++) {
        const promise = Tournament.findByIdAndUpdate(
          tournament._id,
          { $addToSet: { registeredTeams: teams[i]._id } },
          { new: true }
        );
        promises.push(promise);
      }

      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Processed ${concurrentRegistrations} concurrent registrations in ${duration}ms`);
      expect(duration).toBeLessThan(3000); // Should complete in less than 3 seconds

      // Verify final state
      const updatedTournament = await Tournament.findById(tournament._id);
      expect(updatedTournament!.registeredTeams.length).toBeLessThanOrEqual(concurrentRegistrations);
    });
  });

  describe('Bracket Generation Performance', () => {
    const testSizes = [8, 16, 32, 64, 128];

    testSizes.forEach(size => {
      it(`should generate ${size}-team bracket efficiently`, async () => {
        const tournament = new Tournament({
          name: `${size}-Team Bracket Test`,
          game: 'CS:GO',
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          maxTeams: size,
          prizePool: size * 100,
          description: `${size}-team bracket performance test`,
          rules: 'Standard rules',
          format: 'single_elimination',
          createdBy: admin._id,
          registeredTeams: teams.slice(0, size).map(t => t._id)
        });
        await tournament.save();

        const startTime = Date.now();
        tournament.generateBracket();
        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`Generated ${size}-team bracket in ${duration}ms`);
        expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
        expect(tournament.bracket.matches).toHaveLength(size - 1);
        expect(tournament.bracket.rounds).toBe(Math.ceil(Math.log2(size)));
      });
    });

    it('should handle multiple concurrent bracket generations', async () => {
      const tournaments = [];
      for (let i = 0; i < 10; i++) {
        const tournament = new Tournament({
          name: `Concurrent Bracket Test ${i}`,
          game: 'CS:GO',
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          maxTeams: 16,
          prizePool: 5000,
          description: `Concurrent bracket test ${i}`,
          rules: 'Standard rules',
          format: 'single_elimination',
          createdBy: admin._id,
          registeredTeams: teams.slice(i * 16, (i + 1) * 16).map(t => t._id)
        });
        await tournament.save();
        tournaments.push(tournament);
      }

      const startTime = Date.now();
      
      const promises = tournaments.map(tournament => {
        return new Promise<void>((resolve) => {
          tournament.generateBracket();
          resolve();
        });
      });

      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Generated 10 brackets concurrently in ${duration}ms`);
      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds

      // Verify all brackets were generated correctly
      tournaments.forEach(tournament => {
        expect(tournament.bracket.matches).toHaveLength(15); // 16 teams = 15 matches
        expect(tournament.bracket.rounds).toBe(4);
      });
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks during intensive operations', async () => {
      const initialMemory = process.memoryUsage();
      console.log('Initial memory usage:', initialMemory);

      // Perform intensive operations
      for (let iteration = 0; iteration < 10; iteration++) {
        // Create tournaments
        const tournaments = [];
        for (let i = 0; i < 50; i++) {
          tournaments.push({
            name: `Memory Test Tournament ${iteration}-${i}`,
            game: 'CS:GO',
            startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            maxTeams: 16,
            prizePool: 1000,
            description: 'Memory test tournament',
            rules: 'Standard rules',
            format: 'single_elimination',
            createdBy: admin._id,
            registeredTeams: teams.slice(0, 16).map(t => t._id)
          });
        }
        
        const createdTournaments = await Tournament.insertMany(tournaments);
        
        // Generate brackets
        for (const tournament of createdTournaments) {
          tournament.generateBracket();
        }
        
        // Query tournaments
        await Tournament.find({ game: 'CS:GO' }).limit(100);
        
        // Clean up
        await Tournament.deleteMany({ _id: { $in: createdTournaments.map(t => t._id) } });
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      console.log('Final memory usage:', finalMemory);

      // Memory usage should not increase dramatically
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;
      
      console.log(`Memory increase: ${memoryIncrease} bytes (${memoryIncreasePercent.toFixed(2)}%)`);
      expect(memoryIncreasePercent).toBeLessThan(50); // Less than 50% increase
    }, 60000);
  });

  describe('Database Connection Performance', () => {
    it('should handle high connection load', async () => {
      const connectionCount = 50;
      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < connectionCount; i++) {
        const promise = Tournament.findOne({ isActive: true });
        promises.push(promise);
      }

      const results = await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Handled ${connectionCount} concurrent queries in ${duration}ms`);
      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
      expect(results.filter(r => r !== null).length).toBeGreaterThan(0);
    });

    it('should maintain performance under sustained load', async () => {
      const iterations = 20;
      const queriesPerIteration = 10;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const promises = [];
        for (let j = 0; j < queriesPerIteration; j++) {
          promises.push(Tournament.find({ isActive: true }).limit(5));
        }
        
        await Promise.all(promises);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        durations.push(duration);
        
        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      
      console.log(`Average duration: ${avgDuration.toFixed(2)}ms, Max duration: ${maxDuration}ms`);
      expect(avgDuration).toBeLessThan(1000); // Average should be less than 1 second
      expect(maxDuration).toBeLessThan(3000); // Max should be less than 3 seconds
    });
  });
});