import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import PaymentModal from './PaymentModal';
import TournamentBracket from './TournamentBracket';

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

    // Generate next 4 weekly tournaments
    const generateWeeklyTournaments = () => {
        const tournaments = [];
        const today = new Date();
        
        for (let i = 0; i < 4; i++) {
            const tournamentDate = new Date(today);
            tournamentDate.setDate(today.getDate() + (7 * i));
            
            tournaments.push({
                id: `weekly-${i + 1}`,
                title: `WAY Weekly Cup #${i + 1}`,
                date: tournamentDate.toISOString(),
                registeredTeams: Math.floor(Math.random() * 16),
                maxTeams: 16,
                prizeDistribution: [
                    { position: '1st', amount: 100 },
                    { position: '2nd', amount: 60 },
                    { position: '3rd', amount: 40 }
                ]
            });
        }
        return tournaments;
    };

    // Sample tournament bracket data
    const bracketData = {
        rounds: [
            {
                name: 'Round of 16',
                matches: [
                    {
                        id: '1',
                        team1: { name: 'Team Alpha', score: 13, isWinner: true },
                        team2: { name: 'Team Beta', score: 7 },
                        time: '19:00 MSK',
                        isCompleted: true
                    },
                    // Add more matches as needed
                ]
            },
            {
                name: 'Quarter Finals',
                matches: [
                    {
                        id: '5',
                        team1: { name: 'Team Alpha', score: 0 },
                        team2: { name: 'TBD', score: 0 },
                        time: '20:00 MSK',
                        isCompleted: false
                    }
                ]
            },
            {
                name: 'Semi Finals',
                matches: [
                    {
                        id: '9',
                        team1: { name: 'TBD', score: 0 },
                        team2: { name: 'TBD', score: 0 },
                        time: '21:00 MSK',
                        isCompleted: false
                    }
                ]
            },
            {
                name: 'Finals',
                matches: [
                    {
                        id: '11',
                        team1: { name: 'TBD', score: 0 },
                        team2: { name: 'TBD', score: 0 },
                        time: '22:00 MSK',
                        isCompleted: false
                    }
                ]
            }
        ]
    };

    const weeklyTournaments = generateWeeklyTournaments();

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
                    <PrizeAmount>$200 Prize Pool</PrizeAmount>
                    <EntryFee>$5 per player</EntryFee>
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
                    {weeklyTournaments.map(tournament => (
                        <TournamentCard key={tournament.id}>
                            <TournamentHeader>
                                <TournamentTitle>{tournament.title}</TournamentTitle>
                                <DateTag>
                                    {new Date(tournament.date).toLocaleDateString()}
                                </DateTag>
                            </TournamentHeader>

                            <InfoGrid>
                                <InfoItem>
                                    <h4>Format</h4>
                                    <p>5v5 Single Elimination</p>
                                </InfoItem>
                                <InfoItem>
                                    <h4>Teams</h4>
                                    <p>{tournament.registeredTeams}/{tournament.maxTeams}</p>
                                </InfoItem>
                                <InfoItem>
                                    <h4>Entry Fee</h4>
                                    <p>$5 × 5 players = $25 per team</p>
                                </InfoItem>
                                <InfoItem>
                                    <h4>Start Time</h4>
                                    <p>19:00 MSK</p>
                                </InfoItem>
                            </InfoGrid>

                            <PrizeDistribution>
                                <PrizeTitle>Prize Distribution</PrizeTitle>
                                <PrizeList>
                                    {tournament.prizeDistribution.map(prize => (
                                        <PrizeItem key={prize.position}>
                                            <span>{prize.position}</span>
                                            <span>${prize.amount}</span>
                                        </PrizeItem>
                                    ))}
                                </PrizeList>
                            </PrizeDistribution>

                            <RegisterButton onClick={() => handleRegisterClick(tournament.id)}>
                                Register Team - $25
                            </RegisterButton>
                        </TournamentCard>
                    ))}
                </>
            )}

            {activeTab === 'bracket' && (
                <TournamentBracket rounds={bracketData.rounds} />
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