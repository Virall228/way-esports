import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import TournamentBracket from './TournamentBracket';

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

    // Sample tournament bracket data
    const bracketData = {
        rounds: [
            {
                name: 'Round of 16',
                matches: [
                    {
                        id: '1',
                        team1: { name: 'Duo Alpha', score: 16, isWinner: true },
                        team2: { name: 'Duo Beta', score: 14 },
                        time: '20:00 MSK',
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
                        team1: { name: 'Duo Alpha', score: 0 },
                        team2: { name: 'TBD', score: 0 },
                        time: '21:00 MSK',
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
                        time: '22:00 MSK',
                        isCompleted: false
                    }
                ]
            }
        ]
    };

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
                <TournamentCard>
                    <TournamentHeader>
                        <TournamentTitle>Pistol King Tournament #1</TournamentTitle>
                        <DateTag>{new Date().toLocaleDateString()}</DateTag>
                    </TournamentHeader>

                    <InfoGrid>
                        <InfoItem>
                            <h4>Format</h4>
                            <p>2v2 Single Elimination</p>
                        </InfoItem>
                        <InfoItem>
                            <h4>Mode</h4>
                            <p>Pistol Only</p>
                        </InfoItem>
                        <InfoItem>
                            <h4>Entry Fee</h4>
                            <p>Free Entry</p>
                        </InfoItem>
                        <InfoItem>
                            <h4>Start Time</h4>
                            <p>20:00 MSK</p>
                        </InfoItem>
                    </InfoGrid>

                    <PrizePool>
                        <PrizeAmount>$100</PrizeAmount>
                        <PrizeText>Prize Pool</PrizeText>
                    </PrizePool>

                    <RegisterButton onClick={() => onRegister('pistol-king-1')}>
                        Register Team - Free Entry
                    </RegisterButton>
                </TournamentCard>
            )}

            {activeTab === 'bracket' && (
                <TournamentBracket rounds={bracketData.rounds} />
            )}
        </Container>
    );
};

export default PistolKing; 