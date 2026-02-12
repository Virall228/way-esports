import React, { useMemo, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import TournamentBracket from './TournamentBracket';
import { useQuery } from '@tanstack/react-query';
import { tournamentService } from '../../../services/tournamentService';

const glowAnimation = keyframes`
    0% { box-shadow: 0 0 10px rgba(255, 107, 0, 0.3); }
    50% { box-shadow: 0 0 20px rgba(255, 107, 0, 0.5); }
    100% { box-shadow: 0 0 10px rgba(255, 107, 0, 0.3); }
`;

const Container = styled.div`
    padding: 20px;
`;

const Header = styled.div`
    background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%);
    padding: 24px;
    border-radius: 16px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    overflow: hidden;
`;

const HeaderContent = styled.div`
    flex: 1;
    z-index: 2;
`;

const Title = styled.h2`
    color: #000;
    margin: 0 0 8px;
    font-size: 28px;
    text-transform: uppercase;
`;

const Subtitle = styled.div`
    color: rgba(0, 0, 0, 0.8);
    font-size: 16px;
    font-weight: 500;
`;

const EdwardImage = styled.div`
    position: absolute;
    right: 0;
    bottom: 0;
    width: 180px;
    height: 180px;
    background-image: url('/images/edward-navi.png');
    background-size: cover;
    background-position: center;
    opacity: 0.9;
    z-index: 1;
`;

const TabContainer = styled.div`
    margin-bottom: 24px;
`;

const TabButtons = styled.div`
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
`;

const TabButton = styled.button<{ active: boolean }>`
    background: ${props => props.active ? 'linear-gradient(135deg, #FF6B00 0%, #FFD700 100%)' : 'transparent'};
    border: 1px solid ${props => props.active ? 'transparent' : 'rgba(255, 107, 0, 0.3)'};
    color: ${props => props.active ? '#000' : '#fff'};
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s ease;

    &:hover {
        background: ${props => props.active ? 'linear-gradient(135deg, #FF6B00 0%, #FFD700 100%)' : 'rgba(255, 107, 0, 0.1)'};
    }
`;

const TournamentCard = styled.div`
    background: rgba(26, 26, 26, 0.95);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    border: 1px solid rgba(255, 107, 0, 0.3);
    animation: ${glowAnimation} 3s infinite;
`;

const TournamentHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
`;

const TournamentTitle = styled.h3`
    color: #fff;
    margin: 0;
    font-size: 20px;
`;

const DateTag = styled.div`
    background: linear-gradient(90deg, #FF6B00, #FFD700);
    padding: 6px 12px;
    border-radius: 20px;
    color: #000;
    font-weight: bold;
    font-size: 14px;
`;

const InfoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
`;

const InfoItem = styled.div`
    background: rgba(255, 107, 0, 0.1);
    padding: 16px;
    border-radius: 8px;

    h4 {
        color: #FF6B00;
        margin: 0 0 8px;
        font-size: 14px;
    }

    p {
        color: #fff;
        margin: 0;
        font-size: 16px;
    }
`;

const PrizePool = styled.div`
    background: rgba(0, 0, 0, 0.3);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    text-align: center;
`;

const PrizeAmount = styled.div`
    font-size: 32px;
    font-weight: bold;
    color: #FFD700;
    margin-bottom: 8px;
`;

const PrizeText = styled.div`
    color: #fff;
    font-size: 16px;
`;

const RegisterButton = styled.button`
    width: 100%;
    background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%);
    border: none;
    padding: 12px;
    border-radius: 8px;
    color: #000;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(255, 107, 0, 0.4);
    }
`;

interface PistolKingProps {
    onRegister: (tournamentId: string) => void;
}

const PistolKing: React.FC<PistolKingProps> = ({ onRegister }) => {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'bracket'>('upcoming');
    const { data: tournamentsRaw = [], isLoading, error } = useQuery({
        queryKey: ['tournaments', 'pistol-king'],
        queryFn: async () => {
            const res: any = await tournamentService.list();
            return res?.tournaments || res?.data || res || [];
        },
        staleTime: 30000,
        refetchOnWindowFocus: false
    });

    const tournaments = useMemo(() => {
        const items: any[] = Array.isArray(tournamentsRaw) ? tournamentsRaw : [];
        return items
            .filter((t: any) => {
                const name = (t.name || t.title || '').toString().toLowerCase();
                const game = (t.game || '').toString().toLowerCase();
                return name.includes('pistol') || game.includes('critical');
            })
            .map((t: any) => ({
                id: String(t.id || t._id || ''),
                title: String(t.name || t.title || 'Tournament'),
                startDate: String(t.startDate || t.date || new Date().toISOString()),
                game: String(t.game || 'TBD'),
                status: String(t.status || 'upcoming'),
                prizePool: Number(t.prizePool || 0),
                participants: Number(t.participants ?? 0),
                maxParticipants: Number(t.maxParticipants ?? t.maxTeams ?? 0)
            }));
    }, [tournamentsRaw]);

    const bracketTournamentId = tournaments[0]?.id;
    const { data: matchesRaw = [], isLoading: matchesLoading } = useQuery({
        queryKey: ['tournament', bracketTournamentId, 'matches'],
        queryFn: async () => {
            if (!bracketTournamentId) return [];
            const res: any = await tournamentService.getMatches(bracketTournamentId);
            return res?.data || res || [];
        },
        enabled: Boolean(bracketTournamentId),
        staleTime: 15000,
        refetchOnWindowFocus: false
    });

    const rounds = useMemo(() => {
        const list: any[] = Array.isArray(matchesRaw) ? matchesRaw : [];
        const grouped: Record<string, any[]> = {};

        const normalizeTeam = (team: any) => {
            if (!team) return { id: '', name: 'TBD' };
            if (typeof team === 'string') return { id: team, name: team };
            const id = team.id || team._id || '';
            const name = team.name || team.tag || team.username || id || 'TBD';
            return { id: String(id), name: String(name) };
        };

        list.forEach((m) => {
            const roundName = (m.round || 'Round').toString();
            const team1 = normalizeTeam(m.team1);
            const team2 = normalizeTeam(m.team2);
            const score1 = Number(m.score?.team1 ?? 0);
            const score2 = Number(m.score?.team2 ?? 0);
            const status = (m.status || '').toString().toLowerCase();
            const isCompleted = status === 'completed' || status === 'finished';
            const winnerId = m.winner?.id || m.winner?._id || (typeof m.winner === 'string' ? m.winner : '');
            const team1IsWinner = winnerId
                ? String(winnerId) === team1.id
                : (isCompleted && score1 > score2);
            const team2IsWinner = winnerId
                ? String(winnerId) === team2.id
                : (isCompleted && score2 > score1);

            grouped[roundName] = grouped[roundName] || [];
            grouped[roundName].push({
                id: String(m.id || m._id || `${roundName}-${grouped[roundName].length}`),
                team1: { name: team1.name, score: score1, isWinner: team1IsWinner },
                team2: { name: team2.name, score: score2, isWinner: team2IsWinner },
                time: m.startTime ? new Date(m.startTime).toLocaleString() : 'TBD',
                isCompleted
            });
        });

        return Object.entries(grouped).map(([name, matches]) => ({
            name,
            matches
        }));
    }, [matchesRaw]);

    return (
        <Container>
            <Header>
                <HeaderContent>
                    <Title>2v2 Pistol King</Title>
                    <Subtitle>Hosted by Edward from NAVI</Subtitle>
                </HeaderContent>
                <EdwardImage />
            </Header>

            <TabContainer>
                <TabButtons>
                    <TabButton 
                        active={activeTab === 'upcoming'} 
                        onClick={() => setActiveTab('upcoming')}
                    >
                        Upcoming Tournaments
                    </TabButton>
                    <TabButton 
                        active={activeTab === 'bracket'} 
                        onClick={() => setActiveTab('bracket')}
                    >
                        Tournament Bracket
                    </TabButton>
                </TabButtons>
            </TabContainer>

            {activeTab === 'upcoming' && (
                <>
                    {isLoading && (
                        <TournamentCard>Loading tournaments...</TournamentCard>
                    )}
                    {!isLoading && error && (
                        <TournamentCard>Failed to load tournaments</TournamentCard>
                    )}
                    {!isLoading && !error && tournaments.length === 0 && (
                        <TournamentCard>No tournaments available yet</TournamentCard>
                    )}
                    {!isLoading && !error && tournaments.map((tournament) => (
                        <TournamentCard key={tournament.id}>
                            <TournamentHeader>
                                <TournamentTitle>{tournament.title}</TournamentTitle>
                                <DateTag>{new Date(tournament.startDate).toLocaleDateString()}</DateTag>
                            </TournamentHeader>

                            <InfoGrid>
                                <InfoItem>
                                    <h4>Game</h4>
                                    <p>{tournament.game}</p>
                                </InfoItem>
                                <InfoItem>
                                    <h4>Status</h4>
                                    <p>{tournament.status}</p>
                                </InfoItem>
                                <InfoItem>
                                    <h4>Teams</h4>
                                    <p>{tournament.participants}/{tournament.maxParticipants || 'TBD'}</p>
                                </InfoItem>
                                <InfoItem>
                                    <h4>Start Time</h4>
                                    <p>{new Date(tournament.startDate).toLocaleTimeString()}</p>
                                </InfoItem>
                            </InfoGrid>

                            <PrizePool>
                                <PrizeAmount>${tournament.prizePool.toLocaleString()}</PrizeAmount>
                                <PrizeText>Prize Pool</PrizeText>
                            </PrizePool>

                            <RegisterButton onClick={() => onRegister(tournament.id)}>
                                Register Team
                            </RegisterButton>
                        </TournamentCard>
                    ))}
                </>
            )}

            {activeTab === 'bracket' && (
                <>
                    {matchesLoading && (
                        <TournamentCard>Loading bracket...</TournamentCard>
                    )}
                    {!matchesLoading && rounds.length === 0 && (
                        <TournamentCard>No bracket data yet</TournamentCard>
                    )}
                    {!matchesLoading && rounds.length > 0 && (
                        <TournamentBracket rounds={rounds} />
                    )}
                </>
            )}
        </Container>
    );
};

export default PistolKing; 
