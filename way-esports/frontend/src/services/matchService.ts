import ApiService from './api';
import { 
  Match, 
  TournamentBracket, 
  SwissStanding, 
  MatchResult, 
  MatchReport,
  MatchDispute,
  GAME_MAPS,
  SWISS_SYSTEM_CONFIG,
  Team,
  Player
} from '../types/match';

class MatchService {
  // Создание турнирной сетки
  async createTournamentBracket(tournamentId: string, participants: (Team | Player)[]): Promise<TournamentBracket> {
    try {
      const bracket: TournamentBracket = {
        id: `bracket_${tournamentId}`,
        tournamentId,
        type: 'swiss',
        swissRounds: this.calculateSwissRounds(participants.length),
        currentSwissRound: 1,
        swissStandings: this.initializeSwissStandings(participants),
        playoffMatches: [],
        playoffStarted: false,
        matches: [],
        maxRounds: SWISS_SYSTEM_CONFIG.MAX_ROUNDS,
        qualificationSpots: SWISS_SYSTEM_CONFIG.PLAYOFF_SPOTS,
        eliminationThreshold: SWISS_SYSTEM_CONFIG.ELIMINATION_LOSSES
      };

      // Создаем первый раунд матчей
      bracket.matches = this.generateSwissRound(bracket, 1);

      return await ApiService.request('/api/matches/bracket', {
        method: 'POST',
        body: JSON.stringify(bracket)
      });
    } catch (error) {
      console.error('Error creating tournament bracket:', error);
      throw error;
    }
  }

  // Расчет количества раундов швейцарской системы
  private calculateSwissRounds(participantCount: number): number {
    if (participantCount <= 8) return 3;
    if (participantCount <= 16) return 4;
    if (participantCount <= 32) return 5;
    if (participantCount <= 64) return 6;
    return 7;
  }

  // Инициализация таблицы швейцарской системы
  private initializeSwissStandings(participants: (Team | Player)[]): SwissStanding[] {
    return participants.map(participant => ({
      participantId: participant.id,
      participant,
      wins: 0,
      losses: 0,
      buchholz: 0,
      matchHistory: [],
      isEliminated: false,
      isQualified: false
    }));
  }

  // Генерация раунда швейцарской системы
  private generateSwissRound(bracket: TournamentBracket, round: number): Match[] {
    const availableParticipants = bracket.swissStandings
      .filter(standing => !standing.isEliminated && !standing.isQualified)
      .sort((a, b) => {
        // Сортируем по количеству побед, затем по Buchholz
        if (a.wins !== b.wins) return b.wins - a.wins;
        return b.buchholz - a.buchholz;
      });

    const matches: Match[] = [];
    const paired = new Set<string>();

    for (let i = 0; i < availableParticipants.length; i++) {
      if (paired.has(availableParticipants[i].participantId)) continue;

      const participant1 = availableParticipants[i];
      let opponent: SwissStanding | null = null;

      // Ищем подходящего соперника
      for (let j = i + 1; j < availableParticipants.length; j++) {
        const candidate = availableParticipants[j];
        
        if (paired.has(candidate.participantId)) continue;
        if (participant1.matchHistory.includes(candidate.participantId)) continue;

        opponent = candidate;
        break;
      }

      if (opponent) {
        const match = this.createMatch(
          bracket.tournamentId,
          round,
          matches.length + 1,
          participant1.participant,
          opponent.participant,
          round >= bracket.swissRounds ? 'bo3' : 'bo1'
        );

        matches.push(match);
        paired.add(participant1.participantId);
        paired.add(opponent.participantId);
      }
    }

    return matches;
  }

  // Создание отдельного матча
  private createMatch(
    tournamentId: string,
    round: number,
    matchNumber: number,
    participant1: Team | Player,
    participant2: Team | Player,
    format: 'bo1' | 'bo3'
  ): Match {
    const isTeamMatch = 'players' in participant1;
    
    return {
      id: `match_${tournamentId}_${round}_${matchNumber}`,
      tournamentId,
      round,
      matchNumber,
      ...(isTeamMatch ? {
        team1: participant1 as Team,
        team2: participant2 as Team
      } : {
        player1: participant1 as Player,
        player2: participant2 as Player
      }),
      format,
      maps: this.selectMapsForMatch(format, 'CS2'), // TODO: получать игру из турнира
      status: 'scheduled',
      results: [],
      scheduledTime: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      swissRound: round,
      team1Wins: 0,
      team1Losses: 0,
      team2Wins: 0,
      team2Losses: 0
    };
  }

  // Выбор карт для матча
  private selectMapsForMatch(format: 'bo1' | 'bo3', game: string) {
    const availableMaps = GAME_MAPS[game] || GAME_MAPS['CS2'];
    const mapCount = format === 'bo1' ? 1 : 3;
    
    // Случайный выбор карт
    const selectedMaps = [];
    const usedIndices = new Set<number>();
    
    while (selectedMaps.length < mapCount && usedIndices.size < availableMaps.length) {
      const randomIndex = Math.floor(Math.random() * availableMaps.length);
      if (!usedIndices.has(randomIndex)) {
        selectedMaps.push(availableMaps[randomIndex]);
        usedIndices.add(randomIndex);
      }
    }
    
    return selectedMaps;
  }

  // Получение турнирной сетки
  async getTournamentBracket(tournamentId: string): Promise<TournamentBracket> {
    try {
      return await ApiService.request(`/api/matches/bracket/${tournamentId}`);
    } catch (error) {
      console.error('Error fetching tournament bracket:', error);
      throw error;
    }
  }

  // Получение матча
  async getMatch(matchId: string): Promise<Match> {
    try {
      return await ApiService.request(`/api/matches/${matchId}`);
    } catch (error) {
      console.error('Error fetching match:', error);
      throw error;
    }
  }

  // Отправка результата матча
  async submitMatchResult(matchId: string, results: MatchResult[], screenshots: string[]): Promise<MatchReport> {
    try {
      const report: Omit<MatchReport, 'id' | 'submittedAt'> = {
        matchId,
        reportedBy: 'current_user', // TODO: получать из контекста пользователя
        results,
        screenshots,
        status: 'pending'
      };

      return await ApiService.request('/api/matches/report', {
        method: 'POST',
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.error('Error submitting match result:', error);
      throw error;
    }
  }

  // Подтверждение результата матча (админ)
  async approveMatchResult(reportId: string): Promise<void> {
    try {
      await ApiService.request(`/api/matches/report/${reportId}/approve`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error approving match result:', error);
      throw error;
    }
  }

  // Обновление турнирной сетки после матча
  async updateBracketAfterMatch(matchId: string, winnerId: string): Promise<TournamentBracket> {
    try {
      return await ApiService.request(`/api/matches/bracket/update`, {
        method: 'POST',
        body: JSON.stringify({ matchId, winnerId })
      });
    } catch (error) {
      console.error('Error updating bracket:', error);
      throw error;
    }
  }

  // Генерация следующего раунда
  async generateNextRound(tournamentId: string): Promise<Match[]> {
    try {
      return await ApiService.request(`/api/matches/bracket/${tournamentId}/next-round`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error generating next round:', error);
      throw error;
    }
  }

  // Создание спора по матчу
  async createMatchDispute(
    matchId: string, 
    reason: string, 
    description: string, 
    evidence: string[]
  ): Promise<MatchDispute> {
    try {
      const dispute: Omit<MatchDispute, 'id' | 'createdAt'> = {
        matchId,
        reportedBy: 'current_user',
        reason,
        description,
        evidence,
        status: 'pending'
      };

      return await ApiService.request('/api/matches/dispute', {
        method: 'POST',
        body: JSON.stringify(dispute)
      });
    } catch (error) {
      console.error('Error creating match dispute:', error);
      throw error;
    }
  }

  // Получение споров по матчу
  async getMatchDisputes(matchId: string): Promise<MatchDispute[]> {
    try {
      return await ApiService.request(`/api/matches/${matchId}/disputes`);
    } catch (error) {
      console.error('Error fetching match disputes:', error);
      throw error;
    }
  }

  // Начало плейофф
  async startPlayoffs(tournamentId: string): Promise<TournamentBracket> {
    try {
      return await ApiService.request(`/api/matches/bracket/${tournamentId}/playoffs`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error starting playoffs:', error);
      throw error;
    }
  }

  // Получение статистики матчей
  async getMatchStatistics(tournamentId: string): Promise<any> {
    try {
      return await ApiService.request(`/api/matches/statistics/${tournamentId}`);
    } catch (error) {
      console.error('Error fetching match statistics:', error);
      throw error;
    }
  }

  // Получение расписания матчей
  async getMatchSchedule(tournamentId: string, date?: string): Promise<Match[]> {
    try {
      const params = date ? `?date=${date}` : '';
      return await ApiService.request(`/api/matches/schedule/${tournamentId}${params}`);
    } catch (error) {
      console.error('Error fetching match schedule:', error);
      throw error;
    }
  }

  // Обновление времени матча
  async updateMatchTime(matchId: string, scheduledTime: string): Promise<Match> {
    try {
      return await ApiService.request(`/api/matches/${matchId}/schedule`, {
        method: 'PUT',
        body: JSON.stringify({ scheduledTime })
      });
    } catch (error) {
      console.error('Error updating match time:', error);
      throw error;
    }
  }

  // Отмена матча
  async cancelMatch(matchId: string, reason: string): Promise<Match> {
    try {
      return await ApiService.request(`/api/matches/${matchId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
    } catch (error) {
      console.error('Error cancelling match:', error);
      throw error;
    }
  }
}

export const matchService = new MatchService();
export default matchService;