import React from 'react';
import styled from 'styled-components';

const BracketContainer = styled.div`
    padding: 20px;
    overflow-x: auto;
    background: rgba(26, 26, 26, 0.95);
    border-radius: 12px;
    min-height: 600px;
`;

const RoundColumn = styled.div`
    display: inline-flex;
    flex-direction: column;
    min-width: 280px;
    margin-right: 40px;
    position: relative;

    &:not(:last-child)::after {
        content: '';
        position: absolute;
        right: -20px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: rgba(255, 107, 0, 0.2);
    }
`;

const RoundTitle = styled.h3`
    color: #FF6B00;
    text-align: center;
    margin-bottom: 20px;
    font-size: 18px;
`;

const MatchContainer = styled.div<{ isWinner?: boolean }>`
    margin: 10px 0;
    position: relative;
    opacity: ${props => props.isWinner ? 1 : 0.7};

    &::after {
        content: '';
        position: absolute;
        right: -40px;
        top: 50%;
        width: 40px;
        height: 2px;
        background: ${props => props.isWinner ? '#FF6B00' : 'rgba(255, 107, 0, 0.2)'};
        z-index: 1;
    }

    &:last-child::after {
        display: none;
    }
`;

const MatchCard = styled.div`
    background: rgba(255, 107, 0, 0.1);
    border: 1px solid rgba(255, 107, 0, 0.3);
    border-radius: 8px;
    padding: 12px;
`;

const Team = styled.div<{ isWinner?: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: ${props => props.isWinner ? 'rgba(255, 107, 0, 0.2)' : 'transparent'};
    border-radius: 4px;
    margin-bottom: 4px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const TeamName = styled.span<{ isWinner?: boolean }>`
    color: ${props => props.isWinner ? '#FFD700' : '#fff'};
    font-weight: ${props => props.isWinner ? 'bold' : 'normal'};
`;

const Score = styled.span<{ isWinner?: boolean }>`
    color: ${props => props.isWinner ? '#FFD700' : '#fff'};
    font-weight: bold;
`;

const MatchTime = styled.div`
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    text-align: center;
    margin-top: 8px;
`;

interface TeamData {
    name: string;
    score: number;
    isWinner?: boolean;
}

interface Match {
    id: string;
    team1: TeamData;
    team2: TeamData;
    time: string;
    isCompleted: boolean;
}

interface Round {
    name: string;
    matches: Match[];
}

interface TournamentBracketProps {
    rounds: Round[];
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ rounds }) => {
    return (
        <BracketContainer>
            {rounds.map((round, roundIndex) => (
                <RoundColumn key={roundIndex}>
                    <RoundTitle>{round.name}</RoundTitle>
                    {round.matches.map((match, matchIndex) => (
                        <MatchContainer 
                            key={match.id}
                            isWinner={match.isCompleted}
                        >
                            <MatchCard>
                                <Team isWinner={match.team1.isWinner}>
                                    <TeamName isWinner={match.team1.isWinner}>
                                        {match.team1.name}
                                    </TeamName>
                                    <Score isWinner={match.team1.isWinner}>
                                        {match.team1.score}
                                    </Score>
                                </Team>
                                <Team isWinner={match.team2.isWinner}>
                                    <TeamName isWinner={match.team2.isWinner}>
                                        {match.team2.name}
                                    </TeamName>
                                    <Score isWinner={match.team2.isWinner}>
                                        {match.team2.score}
                                    </Score>
                                </Team>
                                <MatchTime>{match.time}</MatchTime>
                            </MatchCard>
                        </MatchContainer>
                    ))}
                </RoundColumn>
            ))}
        </BracketContainer>
    );
};

export default TournamentBracket; 