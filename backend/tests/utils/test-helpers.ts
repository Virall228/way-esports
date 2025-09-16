import { User } from '../../models/User';
import { Team } from '../../models/Team';
import { Tournament } from '../../models/Tournament';

export class TestDataFactory {
  static async createUser(overrides: any = {}) {
    const defaultUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
      telegramId: `${Date.now()}`,
      role: 'user'
    };

    const user = new User({ ...defaultUser, ...overrides });
    return await user.save();
  }

  static async createTeam(captain: any, overrides: any = {}) {
    const defaultTeam = {
      name: `Test Team ${Date.now()}`,
      tag: `T${Date.now().toString().slice(-3)}`,
      logo: 'https://example.com/logo.png',
      game: 'CS:GO',
      captain: captain._id,
      players: [{
        userId: captain._id,
        role: 'Captain',
        joinedAt: new Date(),
        isActive: true
      }]
    };

    const team = new Team({ ...defaultTeam, ...overrides });
    return await team.save();
  }

  static async createTournament(creator: any, overrides: any = {}) {
    const defaultTournament = {
      name: `Test Tournament ${Date.now()}`,
      game: 'CS:GO',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxTeams: 16,
      prizePool: 1000,
      description: 'Test tournament description',
      rules: 'Test tournament rules',
      format: 'single_elimination',
      createdBy: creator._id
    };

    const tournament = new Tournament({ ...defaultTournament, ...overrides });
    return await tournament.save();
  }

  static async createMultipleTeams(count: number, captain?: any) {
    const teams = [];
    const createdCaptain = captain || await this.createUser({ role: 'user' });

    for (let i = 0; i < count; i++) {
      const teamCaptain = i === 0 ? createdCaptain : await this.createUser();
      const team = await this.createTeam(teamCaptain, {
        name: `Team ${i + 1}`,
        tag: `T${(i + 1).toString().padStart(2, '0')}`
      });
      teams.push(team);
    }

    return teams;
  }

  static async createTournamentWithTeams(creator: any, teamCount: number, tournamentOverrides: any = {}) {
    const tournament = await this.createTournament(creator, tournamentOverrides);
    const teams = await this.createMultipleTeams(teamCount);

    // Register teams
    tournament.registeredTeams = teams.map(team => team._id);
    await tournament.save();

    return { tournament, teams };
  }
}

export class PerformanceMonitor {
  private startTime: number = 0;
  private measurements: { [key: string]: number[] } = {};

  start() {
    this.startTime = Date.now();
  }

  end(label: string = 'default') {
    const duration = Date.now() - this.startTime;
    
    if (!this.measurements[label]) {
      this.measurements[label] = [];
    }
    
    this.measurements[label].push(duration);
    return duration;
  }

  getStats(label: string = 'default') {
    const measurements = this.measurements[label] || [];
    if (measurements.length === 0) return null;

    const sum = measurements.reduce((a, b) => a + b, 0);
    const avg = sum / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return { avg, min, max, count: measurements.length, total: sum };
  }

  reset() {
    this.measurements = {};
  }

  logStats(label: string = 'default') {
    const stats = this.getStats(label);
    if (stats) {
      console.log(`Performance Stats for "${label}":`, stats);
    }
  }
}

export class DatabaseCleaner {
  static async cleanAll() {
    await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      Tournament.deleteMany({})
    ]);
  }

  static async cleanUsers() {
    await User.deleteMany({});
  }

  static async cleanTeams() {
    await Team.deleteMany({});
  }

  static async cleanTournaments() {
    await Tournament.deleteMany({});
  }
}

export class MockDataGenerator {
  static generateTournamentData(count: number, creator: any) {
    const tournaments = [];
    const games = ['CS:GO', 'Valorant', 'Dota 2', 'League of Legends'];
    const formats = ['single_elimination', 'double_elimination', 'round_robin'];
    const statuses = ['registration', 'in_progress', 'completed'];

    for (let i = 0; i < count; i++) {
      tournaments.push({
        name: `Generated Tournament ${i + 1}`,
        game: games[i % games.length],
        startDate: new Date(Date.now() + (i * 60 * 60 * 1000)),
        endDate: new Date(Date.now() + ((i + 24) * 60 * 60 * 1000)),
        maxTeams: [8, 16, 32, 64][i % 4],
        prizePool: 1000 + (i * 100),
        description: `Generated tournament ${i + 1} description`,
        rules: 'Standard tournament rules',
        format: formats[i % formats.length],
        status: statuses[i % statuses.length],
        createdBy: creator._id,
        isActive: i % 10 !== 0, // 10% inactive
        participantCount: Math.floor(Math.random() * 16)
      });
    }

    return tournaments;
  }

  static generateTeamData(count: number, captains: any[]) {
    const teams = [];
    const games = ['CS:GO', 'Valorant', 'Dota 2', 'League of Legends'];

    for (let i = 0; i < count; i++) {
      const captain = captains[i % captains.length];
      teams.push({
        name: `Generated Team ${i + 1}`,
        tag: `GT${(i + 1).toString().padStart(2, '0')}`,
        logo: 'https://example.com/logo.png',
        game: games[i % games.length],
        captain: captain._id,
        players: [{
          userId: captain._id,
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
    }

    return teams;
  }
}

export function expectPerformance(duration: number, maxExpected: number, operation: string) {
  console.log(`${operation} completed in ${duration}ms`);
  expect(duration).toBeLessThan(maxExpected);
}

export function expectMemoryUsage(beforeMemory: NodeJS.MemoryUsage, afterMemory: NodeJS.MemoryUsage, maxIncreasePercent: number = 50) {
  const memoryIncrease = afterMemory.heapUsed - beforeMemory.heapUsed;
  const memoryIncreasePercent = (memoryIncrease / beforeMemory.heapUsed) * 100;
  
  console.log(`Memory increase: ${memoryIncrease} bytes (${memoryIncreasePercent.toFixed(2)}%)`);
  expect(memoryIncreasePercent).toBeLessThan(maxIncreasePercent);
}

export async function measureAsyncOperation<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await operation();
  const duration = Date.now() - startTime;
  
  return { result, duration };
}

export function createMockRequest(overrides: any = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  };
}

export function createMockResponse() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis()
  };
  return res;
}