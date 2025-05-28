import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
    padding-bottom: 80px;
`;

const Header = styled.div`
    background-color: #2a2a2a;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
`;

const Title = styled.h2`
    color: #FF6B00;
    margin: 0 0 10px 0;
`;

const Status = styled.span<{ status: 'upcoming' | 'in_progress' | 'completed' }>`
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 14px;
    background-color: ${props => {
        switch (props.status) {
            case 'upcoming': return '#2d5a27';
            case 'in_progress': return '#614a1f';
            case 'completed': return '#4a1f1f';
            default: return '#333';
        }
    }};
    color: ${props => {
        switch (props.status) {
            case 'upcoming': return '#4CAF50';
            case 'in_progress': return '#FFC107';
            case 'completed': return '#F44336';
            default: return '#fff';
        }
    }};
`;

const InfoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-top: 20px;
`;

const InfoItem = styled.div`
    background-color: #333;
    padding: 15px;
    border-radius: 8px;
    
    h4 {
        margin: 0;
        color: #999;
        font-size: 14px;
    }
    
    p {
        margin: 5px 0 0;
        color: #fff;
        font-size: 16px;
    }
`;

const BracketContainer = styled.div`
    overflow-x: auto;
    padding: 20px 0;
    margin-top: 20px;
`;

const BracketWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    min-width: max-content;
    gap: 40px;
`;

const Round = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 250px;
`;

const RoundTitle = styled.h3`
    color: #FF6B00;
    margin: 0 0 15px 0;
    text-align: center;
`;

const Match = styled.div<{ isLive?: boolean }>`
    background-color: ${props => props.isLive ? '#2d3b27' : '#2a2a2a'};
    border: 1px solid ${props => props.isLive ? '#4CAF50' : '#333'};
    border-radius: 8px;
    padding: 15px;
    position: relative;

    &::after {
        content: '';
        position: absolute;
        right: -40px;
        top: 50%;
        width: 40px;
        height: 2px;
        background-color: #333;
    }

    &:last-child::after {
        display: none;
    }
`;

const Team = styled.div<{ isWinner?: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background-color: ${props => props.isWinner ? '#2d5a27' : 'transparent'};
    border-radius: 4px;
    margin: 5px 0;

    span {
        color: ${props => props.isWinner ? '#4CAF50' : '#fff'};
    }
`;

const Score = styled.span<{ isWinner?: boolean }>`
    font-weight: ${props => props.isWinner ? 'bold' : 'normal'};
    color: ${props => props.isWinner ? '#4CAF50' : '#fff'};
`;

const LiveBadge = styled.div`
    position: absolute;
    top: -10px;
    right: -10px;
    background-color: #4CAF50;
    color: white;
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 12px;
    animation: pulse 2s infinite;

    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;

interface MatchType {
    id: string;
    team1: { name: string; score: number };
    team2: { name: string; score: number };
    winner?: string;
    isLive?: boolean;
    startTime?: string;
}

interface RoundType {
    name: string;
    matches: MatchType[];
}

interface TournamentDetailsProps {
    tournament: {
        id: string;
        name: string;
        game: string;
        status: 'upcoming' | 'in_progress' | 'completed';
        startDate: string;
        endDate: string;
        prizePool?: number;
        maxTeams: number;
        registeredTeams: Array<{ name: string; players: string[] }>;
        bracket: RoundType[];
    };
}

const TournamentDetails: React.FC<TournamentDetailsProps> = ({ tournament }) => {
    return (
        <Container>
            <Header>
                <Title>{tournament.name}</Title>
                <Status status={tournament.status}>
                    {tournament.status.replace('_', ' ')}
                </Status>
                <InfoGrid>
                    <InfoItem>
                        <h4>Game</h4>
                        <p>{tournament.game}</p>
                    </InfoItem>
                    <InfoItem>
                        <h4>Teams</h4>
                        <p>{tournament.registeredTeams.length}/{tournament.maxTeams}</p>
                    </InfoItem>
                    <InfoItem>
                        <h4>Start Date</h4>
                        <p>{new Date(tournament.startDate).toLocaleDateString()}</p>
                    </InfoItem>
                    {tournament.prizePool && (
                        <InfoItem>
                            <h4>Prize Pool</h4>
                            <p>${tournament.prizePool}</p>
                        </InfoItem>
                    )}
                </InfoGrid>
            </Header>

            <BracketContainer>
                <BracketWrapper>
                    {tournament.bracket.map((round, roundIndex) => (
                        <Round key={roundIndex}>
                            <RoundTitle>{round.name}</RoundTitle>
                            {round.matches.map((match, matchIndex) => (
                                <Match key={matchIndex} isLive={match.isLive}>
                                    {match.isLive && <LiveBadge>LIVE</LiveBadge>}
                                    <Team isWinner={match.winner === match.team1.name}>
                                        <span>{match.team1.name}</span>
                                        <Score isWinner={match.winner === match.team1.name}>
                                            {match.team1.score}
                                        </Score>
                                    </Team>
                                    <Team isWinner={match.winner === match.team2.name}>
                                        <span>{match.team2.name}</span>
                                        <Score isWinner={match.winner === match.team2.name}>
                                            {match.team2.score}
                                        </Score>
                                    </Team>
                                </Match>
                            ))}
                        </Round>
                    ))}
                </BracketWrapper>
            </BracketContainer>
        </Container>
    );
};

export default TournamentDetails; 