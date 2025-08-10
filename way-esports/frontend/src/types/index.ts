// News Types
export interface NewsItem {
    id: string;
    title: string;
    date: string;
    category: string;
    preview: string;
    imageUrl?: string;
    content: string;
}

// User Types
export interface User {
    id: string;
    username: string;
    photoUrl?: string;
    profileLogo?: string;
    stats: {
        wins: number;
        losses: number;
        tournaments: number;
    };
    achievements: string[];
}

// Tournament Types
export interface Tournament {
    id: string;
    name: string;
    game: string;
    type: 'team' | 'solo' | 'mixed';
    status: 'registration' | 'in_progress' | 'completed' | 'cancelled';
    startDate: string;
    endDate: string;
    prizePool?: number;
    maxTeams?: number;
    maxPlayers?: number;
    participantCount: number;
    spotsRemaining: number;
    registeredTeams: Team[];
    registeredPlayers: Player[];
    bracket: Round[];
    description: string;
    rules: string;
    format: 'single_elimination' | 'double_elimination' | 'round_robin';
    createdAt: string;
    updatedAt: string;
}

export interface Team {
    _id: string;
    name: string;
    tag: string;
    logo?: string;
    players: string[];
}

export interface Player {
    _id: string;
    username: string;
    avatar?: string;
}

export interface Round {
    name: string;
    matches: Match[];
}

export interface Match {
    _id: string;
    team1?: string;
    team2?: string;
    player1?: string;
    player2?: string;
    score1: number;
    score2: number;
    winner?: string;
    winnerType?: 'team' | 'player';
    status: 'pending' | 'in_progress' | 'completed';
    round: number;
    matchNumber: number;
    scheduledTime?: string;
    actualStartTime?: string;
    actualEndTime?: string;
}

export interface RegistrationStatus {
    isRegistered: boolean;
    registrationType: 'player' | 'team' | null;
    canRegisterAsPlayer: boolean;
    canRegisterWithTeam: boolean;
}

// Language Types
export type Language = 'en' | 'ru';

export interface Translation {
    [key: string]: {
        en: string;
        ru: string;
    };
} 