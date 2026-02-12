import React, { useMemo, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import PaymentModal from './PaymentModal';
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

const WeeklyHeader = styled.div`
    background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%);
    padding: 24px;
    border-radius: 16px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
`;

const Title = styled.h2`
    color: #000;
    margin: 0;
    font-size: 24px;
    text-transform: uppercase;
`;

const PrizeInfo = styled.div`
    background: rgba(0, 0, 0, 0.2);
    padding: 12px 24px;
    border-radius: 30px;
    display: flex;
    align-items: center;
    gap: 16px;
`;

const PrizeAmount = styled.div`
    font-weight: bold;
    font-size: 20px;
    color: #000;
`;

const EntryFee = styled.div`
    font-size: 16px;
    color: #000;
    opacity: 0.8;
`;

const TournamentCard = styled.div`
    background: rgba(26, 26, 26, 0.95);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    border: 1px solid rgba(255, 107, 0, 0.3);
    animation: ${glowAnimation} 3s infinite;
    position: relative;
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

const PrizeDistribution = styled.div`
    background: rgba(0, 0, 0, 0.3);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
`;

const PrizeTitle = styled.h4`
    color: #FF6B00;
    margin: 0 0 12px;
    font-size: 16px;
`;

const PrizeList = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 8px;
`;

const PrizeItem = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 8px;
    background: rgba(255, 107, 0, 0.1);
    border-radius: 4px;
    color: #fff;
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

interface WeeklyCupProps {
    onRegister: (tournamentId: string) => void;
}

const WeeklyCups: React.FC<WeeklyCupProps> = ({ onRegister }) => {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'bracket'>('upcoming');
    const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const { data: tournamentsRaw = [], isLoading, error } = useQuery({
        queryKey: ['tournaments', 'weekly-cups'],
        queryFn: async () => {
            const res: any = await tournamentService.list();
            return res?.tournaments || res?.data || res || [];
        },
        staleTime: 30000,
        refetchOnWindowFocus: false
    });

    const weeklyTournaments = useMemo(() => {
        const items: any[] = Array.isArray(tournamentsRaw) ? tournamentsRaw : [];
        return items
            .filter((t: any) => {
                const name = (t.name || t.title || '').toString().toLowerCase();
                const game = (t.game || '').toString().toLowerCase();
                return name.includes('weekly') || game.includes('critical');
            })
            .map((t: any) => ({
                id: String(t.id || t._id || ''),
                title: String(t.name || t.title || 'Weekly Cup'),
                date: String(t.startDate || t.date || new Date().toISOString()),
                registeredTeams: Number(t.participants ?? 0),
                maxTeams: Number(t.maxParticipants ?? t.maxTeams ?? 0),
                prizePool: Number(t.prizePool || 0),
                game: String(t.game || 'TBD'),
                status: String(t.status || 'upcoming')
            }));
    }, [tournamentsRaw]);

    const bracketTournamentId = selectedTournament || weeklyTournaments[0]?.id;
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

    const highestPrizePool = weeklyTournaments.reduce((max, t) => Math.max(max, t.prizePool || 0), 0);

    const handleRegisterClick = (tournamentId: string) => {
        setSelectedTournament(tournamentId);
        setShowPaymentModal(true);
    };

    const handlePaymentComplete = () => {
        setShowPaymentModal(false);
        if (selectedTournament) {
            onRegister(selectedTournament);
        }
    };

    return (
        <Container>
            <WeeklyHeader>
                <Title>Critical Ops Weekly Cups</Title>
                <PrizeInfo>
                    <PrizeAmount>
                        {highestPrizePool > 0 ? `$${highestPrizePool.toLocaleString()} Prize Pool` : 'Prize Pool TBD'}
                    </PrizeAmount>
                    <EntryFee>Entry fee: see rules</EntryFee>
                </PrizeInfo>
            </WeeklyHeader>

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
                    {!isLoading && !error && weeklyTournaments.length === 0 && (
                        <TournamentCard>No weekly cups available yet</TournamentCard>
                    )}
                    {!isLoading && !error && weeklyTournaments.map(tournament => {
                        const prizeDistribution = tournament.prizePool > 0 ? [
                            { position: '1st', amount: Math.round(tournament.prizePool * 0.5) },
                            { position: '2nd', amount: Math.round(tournament.prizePool * 0.3) },
                            { position: '3rd', amount: Math.round(tournament.prizePool * 0.2) }
                        ] : [];

                        return (
                            <TournamentCard key={tournament.id}>
                                <TournamentHeader>
                                    <TournamentTitle>{tournament.title}</TournamentTitle>
                                    <DateTag>
                                        {new Date(tournament.date).toLocaleDateString()}
                                    </DateTag>
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
                                        <p>{tournament.registeredTeams}/{tournament.maxTeams || 'TBD'}</p>
                                    </InfoItem>
                                    <InfoItem>
                                        <h4>Start Time</h4>
                                        <p>{new Date(tournament.date).toLocaleTimeString()}</p>
                                    </InfoItem>
                                </InfoGrid>

                                <PrizeDistribution>
                                    <PrizeTitle>Prize Distribution</PrizeTitle>
                                    {prizeDistribution.length > 0 ? (
                                        <PrizeList>
                                            {prizeDistribution.map(prize => (
                                                <PrizeItem key={prize.position}>
                                                    <span>{prize.position}</span>
                                                    <span>${prize.amount}</span>
                                                </PrizeItem>
                                            ))}
                                        </PrizeList>
                                    ) : (
                                        <PrizeItem>
                                            <span>Prize pool</span>
                                            <span>TBD</span>
                                        </PrizeItem>
                                    )}
                                </PrizeDistribution>

                                <RegisterButton onClick={() => handleRegisterClick(tournament.id)}>
                                    Register Team
                                </RegisterButton>
                            </TournamentCard>
                        );
                    })}
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

            {showPaymentModal && (
                <PaymentModal
                    tournamentTitle={weeklyTournaments.find(t => t.id === selectedTournament)?.title || ''}
                    onClose={() => setShowPaymentModal(false)}
                    onPaymentComplete={handlePaymentComplete}
                />
            )}
        </Container>
    );
};

export default WeeklyCups; 
