import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
`;

const Header = styled.div`
    text-align: center;
    margin-bottom: 40px;
`;

const Title = styled.h1`
    color: #FF6B00;
    font-size: 36px;
    margin: 0;
    text-transform: uppercase;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const TabContainer = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 30px;
    gap: 20px;
`;

const Tab = styled.button<{ active: boolean }>`
    background: ${props => props.active ? 'linear-gradient(135deg, #FF6B00 0%, #FFD700 100%)' : 'transparent'};
    color: ${props => props.active ? '#000' : '#FF6B00'};
    border: 2px solid #FF6B00;
    padding: 12px 24px;
    border-radius: 30px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        background: ${props => !props.active && 'rgba(255, 107, 0, 0.1)'};
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

const Rank = styled.div<{ rank: number }>`
    font-size: 24px;
    font-weight: bold;
    width: 40px;
    color: ${props => 
        props.rank === 1 ? '#FFD700' :
        props.rank === 2 ? '#C0C0C0' :
        props.rank === 3 ? '#CD7F32' : '#666'};
`;

const Avatar = styled.div<{ imageUrl?: string }>`
    width: 50px;
    height: 50px;
    border-radius: 50%;
    margin: 0 20px;
    background: ${props => props.imageUrl ? `url(${props.imageUrl})` : '#333'};
    background-size: cover;
    background-position: center;
    border: 2px solid #FF6B00;
`;

const Info = styled.div`
    flex: 1;
`;

const Name = styled.div`
    font-size: 18px;
    color: #fff;
    margin-bottom: 5px;
`;

const Stats = styled.div`
    display: flex;
    gap: 20px;
`;

const Stat = styled.div`
    color: #999;
    font-size: 14px;
    
    span {
        color: #FF6B00;
        font-weight: bold;
    }
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
    border: 1px solid #FF6B00;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;

    option {
        background: #333;
    }
`;

interface TeamRanking {
    id: string;
    rank: number;
    name: string;
    logo: string;
    totalPrize: number;
    tournamentWins: number;
    winRate: number;
}

interface PlayerRanking {
    id: string;
    rank: number;
    name: string;
    avatar: string;
    team: string;
    rating: number;
    matches: number;
    winRate: number;
}

const RankingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');
    const [timeFrame, setTimeFrame] = useState('all');
    const [game, setGame] = useState('all');
    const [teamRankings, setTeamRankings] = useState<TeamRanking[]>([]);
    const [playerRankings, setPlayerRankings] = useState<PlayerRanking[]>([]);

    useEffect(() => {
        fetchRankings();
    }, [activeTab, timeFrame, game]);

    const fetchRankings = async () => {
        try {
            const endpoint = activeTab === 'teams' ? 'teams/rankings' : 'players/rankings';
            const response = await fetch(`/api/${endpoint}?timeFrame=${timeFrame}&game=${game}`, {
                headers: {
                    'X-Telegram-Init-Data': window.Telegram.WebApp.initData
                }
            });
            const data = await response.json();
            
            if (activeTab === 'teams') {
                setTeamRankings(data);
            } else {
                setPlayerRankings(data);
            }
        } catch (error) {
            console.error('Error fetching rankings:', error);
        }
    };

    return (
        <Container>
            <Header>
                <Title>Rankings</Title>
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
                    <option value="cod-mobile">COD Mobile</option>
                </Select>

                <Select value={timeFrame} onChange={(e) => setTimeFrame(e.target.value)}>
                    <option value="all">All Time</option>
                    <option value="month">This Month</option>
                    <option value="week">This Week</option>
                </Select>
            </FilterContainer>

            {activeTab === 'teams' ? (
                teamRankings.map(team => (
                    <RankingCard key={team.id} rank={team.rank}>
                        <Rank rank={team.rank}>#{team.rank}</Rank>
                        <Avatar imageUrl={team.logo} />
                        <Info>
                            <Name>{team.name}</Name>
                            <Stats>
                                <Stat>Prize Pool: <span>${team.totalPrize.toLocaleString()}</span></Stat>
                                <Stat>Tournaments Won: <span>{team.tournamentWins}</span></Stat>
                                <Stat>Win Rate: <span>{team.winRate}%</span></Stat>
                            </Stats>
                        </Info>
                    </RankingCard>
                ))
            ) : (
                playerRankings.map(player => (
                    <RankingCard key={player.id} rank={player.rank}>
                        <Rank rank={player.rank}>#{player.rank}</Rank>
                        <Avatar imageUrl={player.avatar} />
                        <Info>
                            <Name>{player.name}</Name>
                            <Stats>
                                <Stat>Team: <span>{player.team}</span></Stat>
                                <Stat>Rating: <span>{player.rating}</span></Stat>
                                <Stat>Matches: <span>{player.matches}</span></Stat>
                                <Stat>Win Rate: <span>{player.winRate}%</span></Stat>
                            </Stats>
                        </Info>
                    </RankingCard>
                ))
            )}
        </Container>
    );
};

export default RankingsPage; 