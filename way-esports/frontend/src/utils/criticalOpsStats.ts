export interface PlayerMatchStats {
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

export interface TeamMatchStats {
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

export interface CriticalOpsMatch {
    id: string;
    map: string;
    mode: 'Defuse' | 'TDM' | 'Custom';
    date: Date;
    duration: number; // in seconds
    status: 'live' | 'completed' | 'upcoming';
    tournament?: {
        id: string;
        name: string;
        round: string;
    };
    team1: {
        id: string;
        name: string;
        tag: string;
        stats: TeamMatchStats;
        players: Array<{
            id: string;
            name: string;
            stats: PlayerMatchStats;
        }>;
    };
    team2: {
        id: string;
        name: string;
        tag: string;
        stats: TeamMatchStats;
        players: Array<{
            id: string;
            name: string;
            stats: PlayerMatchStats;
        }>;
    };
    winner?: string; // team id of winner
    rounds: Array<{
        number: number;
        winner: string; // team id
        duration: number; // in seconds
        bombPlanted: boolean;
        bombDefused: boolean;
        plantSite?: 'A' | 'B';
        events: Array<{
            type: 'kill' | 'plant' | 'defuse' | 'teamkill' | 'suicide';
            playerId: string;
            targetId?: string;
            weapon?: string;
            isHeadshot?: boolean;
            timestamp: number; // seconds into round
        }>;
    }>;
}

export const calculateKDRatio = (kills: number, deaths: number): number => {
    return deaths === 0 ? kills : Number((kills / deaths).toFixed(2));
};

export const calculateHSPercentage = (headshots: number, totalKills: number): number => {
    return totalKills === 0 ? 0 : Number(((headshots / totalKills) * 100).toFixed(1));
};

export const calculateADR = (totalDamage: number, roundsPlayed: number): number => {
    return roundsPlayed === 0 ? 0 : Number((totalDamage / roundsPlayed).toFixed(1));
};

export const calculateClutchPercentage = (clutchesWon: number, clutchAttempts: number): number => {
    return clutchAttempts === 0 ? 0 : Number(((clutchesWon / clutchAttempts) * 100).toFixed(1));
};

export const calculateEconWinRate = (econWins: number, totalRounds: number): number => {
    return totalRounds === 0 ? 0 : Number(((econWins / totalRounds) * 100).toFixed(1));
};

export const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}; 