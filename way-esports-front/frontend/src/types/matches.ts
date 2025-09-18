export type EventType = 'kill' | 'plant' | 'defuse' | 'teamkill' | 'suicide';
export type PlantSite = 'A' | 'B';

export interface MatchEvent {
  type: EventType;
  playerId: string;
  targetId?: string;
  weapon?: string;
  isHeadshot?: boolean;
  timestamp: number;
}

export interface PlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  accuracy: number;
  score: number;
  mvp: boolean;
  defuses: number;
  plants: number;
  utilityDamage: number;
  roundsWon: number;
  clutches: number;
  tradeKills: number;
  firstBloods: number;
}

export interface TeamStats {
  score: number;
  roundsWon: number;
  roundsLost: number;
  plantedBombs: number;
  defusedBombs: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  totalHeadshots: number;
  averageAccuracy: number;
  clutchRounds: number;
  econRoundsWon: number;
}

export interface Player {
  id: string;
  name: string;
  stats: PlayerStats;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  stats: TeamStats;
  players: Player[];
}

export interface Round {
  number: number;
  winner: string;
  duration: number;
  bombPlanted: boolean;
  bombDefused: boolean;
  plantSite?: PlantSite;
  events: MatchEvent[];
}

export interface CriticalOpsMatch {
  id: string;
  map: string;
  mode: 'Defuse' | 'TDM' | 'Custom';
  date: Date;
  duration: number;
  status: 'live' | 'completed' | 'upcoming' | 'in_progress';
  tournament?: {
    id: string;
    name: string;
    round: string;
  };
  team1: Team;
  team2: Team;
  winner?: string;
  rounds: Round[];
}
