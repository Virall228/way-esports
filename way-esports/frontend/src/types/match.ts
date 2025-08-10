export interface Player {
  id: string;
  username: string;
  avatar?: string;
  rating: number;
  wins: number;
  losses: number;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  players: Player[];
  rating: number;
  wins: number;
  losses: number;
}

export interface Map {
  id: string;
  name: string;
  image: string;
  game: string;
}

export interface MatchResult {
  mapId: string;
  mapName: string;
  team1Score: number;
  team2Score: number;
  winner: 'team1' | 'team2';
  duration: number; // в минутах
  screenshot?: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  
  // Участники
  team1?: Team;
  team2?: Team;
  player1?: Player;
  player2?: Player;
  
  // Настройки матча
  format: 'bo1' | 'bo3'; // Best of 1 или Best of 3
  maps: Map[];
  
  // Статус и результаты
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  results: MatchResult[];
  winner?: 'team1' | 'team2' | 'player1' | 'player2';
  
  // Время
  scheduledTime: string;
  startTime?: string;
  endTime?: string;
  
  // Дополнительная информация
  streamUrl?: string;
  adminNotes?: string;
  
  // Швейцарская система
  swissRound: number;
  team1Wins: number; // количество побед в турнире
  team1Losses: number; // количество поражений в турнире
  team2Wins: number;
  team2Losses: number;
}

export interface SwissStanding {
  participantId: string;
  participant: Team | Player;
  wins: number;
  losses: number;
  buchholz: number; // сумма очков соперников
  matchHistory: string[]; // ID матчей
  isEliminated: boolean;
  isQualified: boolean;
}

export interface TournamentBracket {
  id: string;
  tournamentId: string;
  type: 'swiss' | 'single_elimination' | 'double_elimination';
  
  // Швейцарская система
  swissRounds: number;
  currentSwissRound: number;
  swissStandings: SwissStanding[];
  
  // Плейофф
  playoffMatches: Match[];
  playoffStarted: boolean;
  
  // Все матчи
  matches: Match[];
  
  // Настройки
  maxRounds: number;
  qualificationSpots: number; // сколько проходят в плейофф
  eliminationThreshold: number; // сколько поражений для исключения
}

export interface MatchDispute {
  id: string;
  matchId: string;
  reportedBy: string;
  reason: string;
  description: string;
  evidence: string[]; // URLs скриншотов/видео
  status: 'pending' | 'resolved' | 'rejected';
  adminResponse?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface MatchReport {
  id: string;
  matchId: string;
  reportedBy: string;
  results: MatchResult[];
  screenshots: string[];
  notes?: string;
  status: 'pending' | 'approved' | 'disputed';
  submittedAt: string;
  approvedAt?: string;
}

// Константы для игр и карт
export const GAME_MAPS: Record<string, Map[]> = {
  'CS2': [
    { id: 'mirage', name: 'Mirage', image: '/maps/cs2/mirage.jpg', game: 'CS2' },
    { id: 'inferno', name: 'Inferno', image: '/maps/cs2/inferno.jpg', game: 'CS2' },
    { id: 'dust2', name: 'Dust2', image: '/maps/cs2/dust2.jpg', game: 'CS2' },
    { id: 'cache', name: 'Cache', image: '/maps/cs2/cache.jpg', game: 'CS2' },
    { id: 'overpass', name: 'Overpass', image: '/maps/cs2/overpass.jpg', game: 'CS2' },
    { id: 'vertigo', name: 'Vertigo', image: '/maps/cs2/vertigo.jpg', game: 'CS2' },
    { id: 'ancient', name: 'Ancient', image: '/maps/cs2/ancient.jpg', game: 'CS2' }
  ],
  'Valorant': [
    { id: 'bind', name: 'Bind', image: '/maps/valorant/bind.jpg', game: 'Valorant' },
    { id: 'haven', name: 'Haven', image: '/maps/valorant/haven.jpg', game: 'Valorant' },
    { id: 'split', name: 'Split', image: '/maps/valorant/split.jpg', game: 'Valorant' },
    { id: 'ascent', name: 'Ascent', image: '/maps/valorant/ascent.jpg', game: 'Valorant' },
    { id: 'icebox', name: 'Icebox', image: '/maps/valorant/icebox.jpg', game: 'Valorant' },
    { id: 'breeze', name: 'Breeze', image: '/maps/valorant/breeze.jpg', game: 'Valorant' },
    { id: 'fracture', name: 'Fracture', image: '/maps/valorant/fracture.jpg', game: 'Valorant' }
  ],
  'Dota 2': [
    { id: 'default', name: 'Summoner\'s Rift', image: '/maps/dota2/default.jpg', game: 'Dota 2' }
  ],
  'Mobile Legends': [
    { id: 'default', name: 'Land of Dawn', image: '/maps/ml/default.jpg', game: 'Mobile Legends' }
  ]
};

export const SWISS_SYSTEM_CONFIG = {
  MAX_ROUNDS: 7, // максимум раундов в швейцарской системе
  QUALIFICATION_WINS: 3, // побед для прохода в плейофф
  ELIMINATION_LOSSES: 3, // поражений для исключения
  MIN_PARTICIPANTS: 8, // минимум участников для швейцарской системы
  PLAYOFF_SPOTS: 8 // количество мест в плейофф
};