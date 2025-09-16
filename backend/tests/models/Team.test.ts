import mongoose from 'mongoose';
import { Team } from '../../models/Team';
import { User } from '../../models/User';

describe('Team Model', () => {
  let captain: any;
  let players: any[] = [];

  beforeEach(async () => {
    // Create test captain
    captain = new User({
      username: 'captain',
      email: 'captain@example.com',
      password: 'password123',
      telegramId: '123456789'
    });
    await captain.save();

    // Create test players
    for (let i = 1; i <= 6; i++) {
      const player = new User({
        username: `player${i}`,
        email: `player${i}@example.com`,
        password: 'password123',
        telegramId: `12345678${i}`
      });
      await player.save();
      players.push(player);
    }
  });

  afterEach(async () => {
    players = [];
  });

  describe('Team Creation', () => {
    it('should create a team with valid data', async () => {
      const teamData = {
        name: 'Test Team',
        tag: 'TEST',
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

      const team = new Team(teamData);
      await team.save();

      expect(team.name).toBe(teamData.name);
      expect(team.tag).toBe(teamData.tag);
      expect(team.stats.wins).toBe(0);
      expect(team.stats.losses).toBe(0);
      expect(team.players).toHaveLength(1);
    });

    it('should enforce unique team name', async () => {
      const teamData = {
        name: 'Unique Team',
        tag: 'UNQ1',
        logo: 'https://example.com/logo.png',
        game: 'CS:GO',
        captain: captain._id,
        players: []
      };

      const team1 = new Team(teamData);
      await team1.save();

      const team2 = new Team({ ...teamData, tag: 'UNQ2' });
      await expect(team2.save()).rejects.toThrow();
    });

    it('should enforce unique team tag', async () => {
      const teamData = {
        name: 'Team One',
        tag: 'SAME',
        logo: 'https://example.com/logo.png',
        game: 'CS:GO',
        captain: captain._id,
        players: []
      };

      const team1 = new Team(teamData);
      await team1.save();

      const team2 = new Team({ ...teamData, name: 'Team Two' });
      await expect(team2.save()).rejects.toThrow();
    });

    it('should validate team name length', async () => {
      const teamData = {
        name: 'AB', // Too short
        tag: 'TEST',
        logo: 'https://example.com/logo.png',
        game: 'CS:GO',
        captain: captain._id,
        players: []
      };

      const team = new Team(teamData);
      await expect(team.save()).rejects.toThrow();
    });

    it('should validate team tag length', async () => {
      const teamData = {
        name: 'Valid Team Name',
        tag: 'A', // Too short
        logo: 'https://example.com/logo.png',
        game: 'CS:GO',
        captain: captain._id,
        players: []
      };

      const team = new Team(teamData);
      await expect(team.save()).rejects.toThrow();
    });
  });

  describe('Player Management', () => {
    let team: any;

    beforeEach(async () => {
      team = new Team({
        name: 'Player Management Team',
        tag: 'PMT',
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
    });

    it('should add player to team', async () => {
      await team.addPlayer(players[0]._id, 'Rifler');
      
      expect(team.players).toHaveLength(2);
      expect(team.players[1].userId.toString()).toBe(players[0]._id.toString());
      expect(team.players[1].role).toBe('Rifler');
      expect(team.players[1].isActive).toBe(true);
    });

    it('should not add duplicate player', async () => {
      await team.addPlayer(players[0]._id, 'Rifler');
      
      await expect(team.addPlayer(players[0]._id, 'AWPer')).rejects.toThrow('Player already in team');
    });

    it('should remove player from team', async () => {
      await team.addPlayer(players[0]._id, 'Rifler');
      expect(team.players).toHaveLength(2);

      await team.removePlayer(players[0]._id);
      expect(team.players).toHaveLength(1);
    });

    it('should not remove team captain', async () => {
      await expect(team.removePlayer(captain._id)).rejects.toThrow('Cannot remove team captain');
    });

    it('should not remove non-existent player', async () => {
      await expect(team.removePlayer(players[0]._id)).rejects.toThrow('Player not found in team');
    });

    it('should enforce maximum player limit', async () => {
      // Add 6 players (plus captain = 7 total)
      for (let i = 0; i < 6; i++) {
        await team.addPlayer(players[i]._id, `Player${i + 1}`);
      }

      // Try to add 8th player
      const extraPlayer = new User({
        username: 'extraplayer',
        email: 'extra@example.com',
        password: 'password123',
        telegramId: '999999999'
      });
      await extraPlayer.save();

      team.players.push({
        userId: extraPlayer._id,
        role: 'Extra',
        joinedAt: new Date(),
        isActive: true
      });

      await expect(team.save()).rejects.toThrow('Team cannot have more than 7 players');
    });
  });

  describe('Team Statistics', () => {
    let team: any;

    beforeEach(async () => {
      team = new Team({
        name: 'Stats Team',
        tag: 'STAT',
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
    });

    it('should update stats after winning a match', async () => {
      await team.updateStats(true, false);
      
      expect(team.stats.wins).toBe(1);
      expect(team.stats.losses).toBe(0);
      expect(team.stats.tournamentsPlayed).toBe(0);
      expect(team.stats.tournamentsWon).toBe(0);
    });

    it('should update stats after losing a match', async () => {
      await team.updateStats(false, false);
      
      expect(team.stats.wins).toBe(0);
      expect(team.stats.losses).toBe(1);
      expect(team.stats.tournamentsPlayed).toBe(0);
      expect(team.stats.tournamentsWon).toBe(0);
    });

    it('should update tournament stats after winning tournament', async () => {
      await team.updateStats(true, true);
      
      expect(team.stats.wins).toBe(1);
      expect(team.stats.losses).toBe(0);
      expect(team.stats.tournamentsPlayed).toBe(1);
      expect(team.stats.tournamentsWon).toBe(1);
    });

    it('should update tournament stats after losing tournament', async () => {
      await team.updateStats(false, true);
      
      expect(team.stats.wins).toBe(0);
      expect(team.stats.losses).toBe(1);
      expect(team.stats.tournamentsPlayed).toBe(1);
      expect(team.stats.tournamentsWon).toBe(0);
    });

    it('should calculate win rate correctly', async () => {
      // No games played
      expect(team.winRate).toBe(0);

      // Win 3, lose 2
      team.stats.wins = 3;
      team.stats.losses = 2;
      await team.save();

      expect(team.winRate).toBe(60); // 3/5 * 100 = 60%
    });

    it('should handle multiple stat updates', async () => {
      await team.updateStats(true, false);  // Win match
      await team.updateStats(true, false);  // Win match
      await team.updateStats(false, false); // Lose match
      await team.updateStats(true, true);   // Win tournament

      expect(team.stats.wins).toBe(3);
      expect(team.stats.losses).toBe(1);
      expect(team.stats.tournamentsPlayed).toBe(1);
      expect(team.stats.tournamentsWon).toBe(1);
      expect(team.winRate).toBe(75); // 3/4 * 100 = 75%
    });
  });

  describe('Performance Tests', () => {
    it('should handle team creation efficiently', async () => {
      const startTime = Date.now();
      
      const teams = [];
      for (let i = 0; i < 100; i++) {
        teams.push({
          name: `Performance Team ${i}`,
          tag: `PT${i}`,
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
      }

      await Team.insertMany(teams);
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(3000); // Should complete in less than 3 seconds
    });

    it('should query teams efficiently', async () => {
      // Create test teams
      const teams = [];
      for (let i = 0; i < 500; i++) {
        teams.push({
          name: `Query Team ${i}`,
          tag: `QT${i}`,
          logo: 'https://example.com/logo.png',
          game: i % 2 === 0 ? 'CS:GO' : 'Valorant',
          captain: captain._id,
          players: [{
            userId: captain._id,
            role: 'Captain',
            joinedAt: new Date(),
            isActive: true
          }],
          stats: {
            wins: Math.floor(Math.random() * 50),
            losses: Math.floor(Math.random() * 50),
            tournamentsPlayed: Math.floor(Math.random() * 10),
            tournamentsWon: Math.floor(Math.random() * 5)
          }
        });
      }
      await Team.insertMany(teams);

      const startTime = Date.now();
      
      // Test various queries
      await Team.find({ game: 'CS:GO' }).limit(10);
      await Team.find({ captain: captain._id });
      await Team.find({ 'stats.wins': { $gte: 25 } }).limit(10);
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle large team rosters efficiently', async () => {
      const team = new Team({
        name: 'Large Roster Team',
        tag: 'LRT',
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

      const startTime = Date.now();
      
      // Add maximum players
      for (let i = 0; i < 6; i++) {
        await team.addPlayer(players[i]._id, `Player${i + 1}`);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in less than 2 seconds
      expect(team.players).toHaveLength(7);
    });
  });
});