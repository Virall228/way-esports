import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';
import {
    TeamRanking,
    PlayerRanking,
    getCurrentRankingPeriod,
    formatRankChange,
    calculateRankChange
} from '../../utils/rankings';
import { resolveMediaUrl, resolveTeamLogoUrl } from '../../utils/media';

const Container = styled.div`
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 20px;
`;

const Header = styled.div`
    text-align: center;
    margin-bottom: 40px;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
    font-size: 36px;
    margin: 0;
    text-transform: uppercase;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const UpdateInfo = styled.div`
    color: #999;
    font-size: 14px;
    margin-top: 8px;
`;

const TabContainer = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 30px;
    gap: 20px;
`;

const Tab = styled.button<{ active: boolean }>`
  background: ${props => props.active ? 'linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%)' : 'transparent'};
  color: ${props => props.active ? '#fff' : '#a3a3a3'};
  border: 1px solid #3a3a3a;
    padding: 12px 24px;
    border-radius: 30px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        background: ${props => !props.active && 'rgba(255,255,255,0.06)'};
    }
`;

const RankingCard = styled.div<{ rank: number }>`
    background: rgba(26, 26, 26, 0.9);
    border-radius: 12px;
    padding: 20px;
    margin: 10px 0;
    display: flex;
    align-items: center;
    border: 1px solid ${props => 
        props.rank === 1 ? '#FFD700' :
        props.rank === 2 ? '#C0C0C0' :
        props.rank === 3 ? '#CD7F32' : '#333'};
    transition: transform 0.2s ease;

    &:hover {
        transform: translateX(10px);
    }
`;

const RankInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 80px;
`;

const Rank = styled.div<{ rank: number }>`
    font-size: 24px;
    font-weight: bold;
    color: ${props => 
        props.rank === 1 ? '#FFD700' :
        props.rank === 2 ? '#C0C0C0' :
        props.rank === 3 ? '#CD7F32' : '#666'};
`;

const RankChange = styled.div<{ change: number }>`
    font-size: 14px;
    color: ${props => 
        props.change > 0 ? '#4CAF50' :
        props.change < 0 ? '#F44336' : '#999'};
`;

const Avatar = styled.div<{ imageUrl?: string }>`
    width: 50px;
    height: 50px;
    border-radius: 50%;
    margin: 0 20px;
    background: ${props => props.imageUrl ? `url(${props.imageUrl})` : '#333'};
    background-size: cover;
    background-position: center;
    border: 1px solid ${({ theme }) => theme.colors.border.medium};
`;

const Info = styled.div`
    flex: 1;
`;

const Name = styled.div`
    font-size: 18px;
    color: #fff;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const Tag = styled.span`
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 14px;
`;

const Stats = styled.div`
    display: flex;
    gap: 20px;
`;

const Stat = styled.div`
    color: #999;
    font-size: 14px;
    
    span {
    color: ${({ theme }) => theme.colors.text.secondary};
        font-weight: bold;
    }
`;

const WeeklyStats = styled.div`
  background: rgba(255,255,255,0.06);
    border-radius: 8px;
    padding: 12px;
    margin-top: 12px;
`;

const WeeklyTitle = styled.div`
  color: #e5e5e5;
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 8px;
`;

const WeeklyStatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
`;

const FilterContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
`;

const Select = styled.select`
    background: #333;
    color: #fff;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;

    option {
        background: #333;
    }
`;

const RankingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');
    const [timeFrame, setTimeFrame] = useState('week');
    const [game, setGame] = useState('all');
    const [teamRankings, setTeamRankings] = useState<TeamRanking[]>([]);
    const [playerRankings, setPlayerRankings] = useState<PlayerRanking[]>([]);
    const [currentPeriod] = useState(getCurrentRankingPeriod());

    useEffect(() => {
        fetchRankings();
        const interval = setInterval(fetchRankings, 5 * 60 * 1000); // Refresh every 5 minutes
        return () => clearInterval(interval);
    }, [activeTab, timeFrame, game]);

    const toNumber = (value: any, fallback = 0) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    const buildRankingStats = (rank: number, previousRank: number, points: number) => ({
        currentRank: rank,
        previousRank,
        rankChange: calculateRankChange(rank, previousRank),
        points,
        lastUpdated: new Date()
    });

    const normalizeTeamRanking = (team: any, index: number): TeamRanking => {
        const rank = toNumber(team?.rank, index + 1);
        const previousRank = toNumber(team?.previousRank, rank);
        const wins = toNumber(team?.wins, 0);
        const losses = toNumber(team?.losses, 0);
        const matches = toNumber(team?.matches ?? team?.totalMatches, wins + losses);
        const weeklyStats = {
            matchesPlayed: toNumber(team?.weeklyStats?.matchesPlayed, matches),
            wins: toNumber(team?.weeklyStats?.wins, wins),
            losses: toNumber(team?.weeklyStats?.losses, losses),
            points: toNumber(team?.weeklyStats?.points, wins * 3)
        };

        return {
            id: String(team?.id || team?._id || ''),
            rank,
            previousRank,
            name: team?.name || 'Team',
            tag: team?.tag || '',
            logo: resolveTeamLogoUrl(team?.logo || ''),
            totalPrize: toNumber(team?.totalPrize, 0),
            tournamentWins: toNumber(team?.tournamentWins, 0),
            winRate: toNumber(team?.winRate, 0),
            weeklyStats,
            rankingStats: team?.rankingStats
                ? {
                    ...team.rankingStats,
                    currentRank: rank,
                    previousRank,
                    rankChange: calculateRankChange(rank, previousRank)
                }
                : buildRankingStats(rank, previousRank, weeklyStats.points)
        };
    };

    const normalizePlayerRanking = (player: any, index: number): PlayerRanking => {
        const rank = toNumber(player?.rank, index + 1);
        const previousRank = toNumber(player?.previousRank, rank);
        const matches = toNumber(player?.matches ?? player?.totalMatches, 0);
        const winRate = toNumber(player?.winRate, 0);
        const rating = toNumber(player?.rating, Math.round(winRate));
        const teams = Array.isArray(player?.teams) ? player.teams : [];
        const teamName = player?.team || teams[0]?.name || teams[0]?.tag || '-';
        const fullName = [player?.firstName, player?.lastName].filter(Boolean).join(' ').trim();

        const weeklyStats = {
            kills: toNumber(player?.weeklyStats?.kills, 0),
            deaths: toNumber(player?.weeklyStats?.deaths, 0),
            assists: toNumber(player?.weeklyStats?.assists, 0),
            mvps: toNumber(player?.weeklyStats?.mvps, 0),
            points: toNumber(player?.weeklyStats?.points, rating)
        };

        return {
            id: String(player?.id || player?._id || ''),
            rank,
            previousRank,
            name: player?.name || fullName || player?.username || 'Player',
            avatar: resolveMediaUrl(player?.avatar || player?.profileLogo || ''),
            team: teamName,
            rating,
            matches,
            winRate,
            weeklyStats,
            rankingStats: player?.rankingStats
                ? {
                    ...player.rankingStats,
                    currentRank: rank,
                    previousRank,
                    rankChange: calculateRankChange(rank, previousRank)
                }
                : buildRankingStats(rank, previousRank, weeklyStats.points)
        };
    };

    const fetchRankings = async () => {
        try {
            const endpoint = activeTab === 'teams' ? 'teams/rankings' : 'players/rankings';
            const raw: any = await api.get(`/api/${endpoint}?timeFrame=${timeFrame}&game=${game}`, true);
            const list = Array.isArray(raw) ? raw : (raw?.data || []);

            if (activeTab === 'teams') {
                setTeamRankings(list.map(normalizeTeamRanking));
            } else {
                setPlayerRankings(list.map(normalizePlayerRanking));
            }
        } catch (error) {
            console.error('Error fetching rankings:', error);
        }
    };

    return (
        <Container>
            <Header>
                <Title>Rankings</Title>
                <UpdateInfo>
                    Week {currentPeriod.weekNumber} {'\u2022'} Updated {new Date().toLocaleDateString()}
                </UpdateInfo>
            </Header>

            <TabContainer>
                <Tab 
                    active={activeTab === 'teams'} 
                    onClick={() => setActiveTab('teams')}
                >
                    Teams
                </Tab>
                <Tab 
                    active={activeTab === 'players'} 
                    onClick={() => setActiveTab('players')}
                >
                    Players
                </Tab>
            </TabContainer>

            <FilterContainer>
                <Select value={game} onChange={(e) => setGame(e.target.value)}>
                    <option value="all">All Games</option>
                    <option value="critical-ops">Critical Ops</option>
                    <option value="pubg-mobile">PUBG Mobile</option>
                    <option value="cs2">CS2</option>
                </Select>

                <Select value={timeFrame} onChange={(e) => setTimeFrame(e.target.value)}>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">All Time</option>
                </Select>
            </FilterContainer>

            {activeTab === 'teams' ? (
                teamRankings.map(team => (
                    <RankingCard key={team.id} rank={team.rank}>
                        <RankInfo>
                            <Rank rank={team.rank}>#{team.rank}</Rank>
                            <RankChange change={team.rankingStats.rankChange}>
                                {formatRankChange(team.rankingStats.rankChange)}
                            </RankChange>
                        </RankInfo>
                        <Avatar imageUrl={team.logo} />
                        <Info>
                            <Name>
                                {team.name}
                                <Tag>[{team.tag}]</Tag>
                            </Name>
                            <Stats>
                                <Stat>Prize Pool: <span>${team.totalPrize.toLocaleString()}</span></Stat>
                                <Stat>Tournaments Won: <span>{team.tournamentWins}</span></Stat>
                                <Stat>Win Rate: <span>{team.winRate}%</span></Stat>
                            </Stats>
                            <WeeklyStats>
                                <WeeklyTitle>This Week's Performance</WeeklyTitle>
                                <WeeklyStatsGrid>
                                    <Stat>Matches: <span>{team.weeklyStats.matchesPlayed}</span></Stat>
                                    <Stat>Wins: <span>{team.weeklyStats.wins}</span></Stat>
                                    <Stat>Losses: <span>{team.weeklyStats.losses}</span></Stat>
                                    <Stat>Points: <span>{team.weeklyStats.points}</span></Stat>
                                </WeeklyStatsGrid>
                            </WeeklyStats>
                        </Info>
                    </RankingCard>
                ))
            ) : (
                playerRankings.map(player => (
                    <RankingCard key={player.id} rank={player.rank}>
                        <RankInfo>
                            <Rank rank={player.rank}>#{player.rank}</Rank>
                            <RankChange change={player.rankingStats.rankChange}>
                                {formatRankChange(player.rankingStats.rankChange)}
                            </RankChange>
                        </RankInfo>
                        <Avatar imageUrl={player.avatar} />
                        <Info>
                            <Name>{player.name}</Name>
                            <Stats>
                                <Stat>Team: <span>{player.team}</span></Stat>
                                <Stat>Rating: <span>{player.rating}</span></Stat>
                                <Stat>Matches: <span>{player.matches}</span></Stat>
                                <Stat>Win Rate: <span>{player.winRate}%</span></Stat>
                            </Stats>
                            <WeeklyStats>
                                <WeeklyTitle>This Week's Performance</WeeklyTitle>
                                <WeeklyStatsGrid>
                                    <Stat>K/D/A: <span>{player.weeklyStats.kills}/{player.weeklyStats.deaths}/{player.weeklyStats.assists}</span></Stat>
                                    <Stat>MVPs: <span>{player.weeklyStats.mvps}</span></Stat>
                                    <Stat>Points: <span>{player.weeklyStats.points}</span></Stat>
                                </WeeklyStatsGrid>
                            </WeeklyStats>
                        </Info>
                    </RankingCard>
                ))
            )}
        </Container>
    );
};

export default RankingsPage; 
