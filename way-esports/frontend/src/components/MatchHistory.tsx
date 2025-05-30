import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
    padding-bottom: 80px;
`;

const FilterBar = styled.div`
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    overflow-x: auto;
    padding-bottom: 10px;

    &::-webkit-scrollbar {
        height: 4px;
    }

    &::-webkit-scrollbar-track {
        background: #2a2a2a;
    }

    &::-webkit-scrollbar-thumb {
        background: #FF6B00;
        border-radius: 2px;
    }
`;

const FilterButton = styled.button<{ active: boolean }>`
    background-color: ${props => props.active ? '#FF6B00' : '#2a2a2a'};
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.3s ease;

    &:hover {
        background-color: ${props => props.active ? '#ff8533' : '#3a3a3a'};
    }
`;

const MatchCard = styled.div`
    background-color: #2a2a2a;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
`;

const MatchHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
`;

const GameInfo = styled.div`
    color: #999;
    font-size: 14px;
`;

const Result = styled.div<{ result: 'win' | 'loss' }>`
    color: ${props => props.result === 'win' ? '#4CAF50' : '#F44336'};
    font-weight: bold;
`;

const TeamsContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 15px 0;
`;

const Team = styled.div<{ isWinner: boolean }>`
    flex: 1;
    text-align: center;
    padding: 10px;
    background-color: ${props => props.isWinner ? '#2d5a27' : '#4a1f1f'};
    border-radius: 8px;
    margin: 0 5px;

    h3 {
        margin: 0;
        color: ${props => props.isWinner ? '#4CAF50' : '#F44336'};
    }

    p {
        margin: 5px 0 0;
        color: #999;
        font-size: 14px;
    }
`;

const Score = styled.div`
    font-size: 24px;
    font-weight: bold;
    color: #FF6B00;
    margin: 0 15px;
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #333;
`;

const StatItem = styled.div`
    text-align: center;

    h4 {
        margin: 0;
        color: #999;
        font-size: 12px;
    }

    p {
        margin: 5px 0 0;
        color: #FF6B00;
        font-size: 16px;
    }
`;

interface MatchStats {
    kills: number;
    deaths: number;
    assists: number;
    damage: number;
    score: number;
    mvp?: boolean;
}

interface Match {
    id: string;
    date: string;
    game: string;
    tournament?: string;
    team1: {
        name: string;
        score: number;
        players: { name: string; stats: MatchStats }[];
    };
    team2: {
        name: string;
        score: number;
        players: { name: string; stats: MatchStats }[];
    };
    winner: string;
    playerStats: MatchStats;
}

interface MatchHistoryProps {
    matches: Match[];
    username: string;
}

const MatchHistory: React.FC<MatchHistoryProps> = ({ matches, username }) => {
    const [filter, setFilter] = useState<'all' | 'tournament' | 'casual'>('all');

    const filteredMatches = matches.filter(match => {
        if (filter === 'all') return true;
        if (filter === 'tournament') return !!match.tournament;
        return !match.tournament;
    });

    const getUserTeam = (match: Match) => {
        const team1Player = match.team1.players.find(p => p.name === username);
        return team1Player ? match.team1 : match.team2;
    };

    const getOpponentTeam = (match: Match) => {
        const team1Player = match.team1.players.find(p => p.name === username);
        return team1Player ? match.team2 : match.team1;
    };

    return (
        <Container>
            <FilterBar>
                <FilterButton 
                    active={filter === 'all'} 
                    onClick={() => setFilter('all')}
                >
                    All Matches
                </FilterButton>
                <FilterButton 
                    active={filter === 'tournament'} 
                    onClick={() => setFilter('tournament')}
                >
                    Tournament Matches
                </FilterButton>
                <FilterButton 
                    active={filter === 'casual'} 
                    onClick={() => setFilter('casual')}
                >
                    Casual Matches
                </FilterButton>
            </FilterBar>

            {filteredMatches.map(match => {
                const userTeam = getUserTeam(match);
                const opponentTeam = getOpponentTeam(match);
                const isWin = match.winner === userTeam.name;

                return (
                    <MatchCard key={match.id}>
                        <MatchHeader>
                            <GameInfo>
                                {match.game}
                                {match.tournament && ` • ${match.tournament}`}
                                <br />
                                {new Date(match.date).toLocaleDateString()}
                            </GameInfo>
                            <Result result={isWin ? 'win' : 'loss'}>
                                {isWin ? 'VICTORY' : 'DEFEAT'}
                            </Result>
                        </MatchHeader>

                        <TeamsContainer>
                            <Team isWinner={userTeam.name === match.winner}>
                                <h3>{userTeam.name}</h3>
                                <p>{userTeam.players.length} players</p>
                            </Team>
                            <Score>{userTeam.score} - {opponentTeam.score}</Score>
                            <Team isWinner={opponentTeam.name === match.winner}>
                                <h3>{opponentTeam.name}</h3>
                                <p>{opponentTeam.players.length} players</p>
                            </Team>
                        </TeamsContainer>

                        <StatsGrid>
                            <StatItem>
                                <h4>K/D/A</h4>
                                <p>{match.playerStats.kills}/{match.playerStats.deaths}/{match.playerStats.assists}</p>
                            </StatItem>
                            <StatItem>
                                <h4>Damage</h4>
                                <p>{match.playerStats.damage}</p>
                            </StatItem>
                            <StatItem>
                                <h4>Score</h4>
                                <p>{match.playerStats.score}</p>
                            </StatItem>
                        </StatsGrid>
                    </MatchCard>
                );
            })}
        </Container>
    );
};

export default MatchHistory; 