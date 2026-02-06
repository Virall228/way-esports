export interface User {
  id: string;
  username: string;
  telegramId: number;
  email?: string;
  role: 'user' | 'admin' | 'developer';
  avatar?: string;
  teamId?: string;
  createdAt: Date;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  currentParticipants: number;
  prizePool: number;
  status: 'upcoming' | 'active' | 'completed';
}

export interface Match {
  id: string;
  tournamentId: string;
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
  status: 'pending' | 'active' | 'completed';
  scheduledAt: Date;
}

export interface News {
  id: string;
  title: string;
  content: string;
  author: string;
  publishedAt: Date;
  imageUrl?: string;
}

export type Language = 'en' | 'ru';

export interface Translation {
  [key: string]: {
    [key: string]: string;
  };
}