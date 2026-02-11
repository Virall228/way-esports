export interface RankingStats {
    currentRank: number;
    previousRank: number;
    rankChange: number;
    points: number;
    lastUpdated: Date;
}

export interface TeamRanking {
    id: string;
    rank: number;
    previousRank: number;
    name: string;
    tag: string;
    logo: string;
    totalPrize: number;
    tournamentWins: number;
    winRate: number;
    weeklyStats: {
        matchesPlayed: number;
        wins: number;
        losses: number;
        points: number;
    };
    rankingStats: RankingStats;
}

export interface PlayerRanking {
    id: string;
    rank: number;
    previousRank: number;
    name: string;
    avatar: string;
    team: string;
    rating: number;
    matches: number;
    winRate: number;
    weeklyStats: {
        kills: number;
        deaths: number;
        assists: number;
        mvps: number;
        points: number;
    };
    rankingStats: RankingStats;
}

export interface RankingPeriod {
    startDate: Date;
    endDate: Date;
    weekNumber: number;
}

export const getCurrentRankingPeriod = (): RankingPeriod => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
        startDate: startOfWeek,
        endDate: endOfWeek,
        weekNumber: getWeekNumber(now)
    };
};

export const getWeekNumber = (date: Date): number => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
};

export const calculateRankChange = (currentRank: number, previousRank: number): number => {
    if (previousRank === 0) return 0; // New entry
    return previousRank - currentRank;
};

export const formatRankChange = (change: number): string => {
    if (change > 0) return `\u2191${change}`;
    if (change < 0) return `\u2193${Math.abs(change)}`;
    return '-';
};
