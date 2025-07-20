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
    status: 'upcoming' | 'in_progress' | 'completed';
    startDate: string;
    endDate: string;
    prizePool?: number;
    maxTeams: number;
    registeredTeams: Team[];
    bracket: Round[];
}

export interface Team {
    name: string;
    players: string[];
}

export interface Round {
    name: string;
    matches: Match[];
}

export interface Match {
    id: string;
    team1: {
        name: string;
        score: number;
    };
    team2: {
        name: string;
        score: number;
    };
    winner?: string;
    isLive?: boolean;
    startTime?: string;
}

// Language Types
export type Language = 'en' | 'ru';

export interface Translation {
    [key: string]: {
        en: string;
        ru: string;
    };
} 