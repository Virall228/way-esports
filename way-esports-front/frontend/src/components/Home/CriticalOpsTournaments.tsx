import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
    padding: 20px;
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    border-radius: 16px;
    margin: 20px 0;
    border: 1px solid #FF6B00;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
`;

const Title = styled.h2`
    color: #FF6B00;
    font-size: 28px;
    margin: 0;
    text-transform: uppercase;
    font-weight: bold;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    
    span {
        color: #FFD700;
    }
`;

const TournamentGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
`;

const TournamentCard = styled.div`
    background: rgba(26, 26, 26, 0.9);
    border-radius: 12px;
    padding: 20px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border: 1px solid #333;
    cursor: pointer;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(255, 107, 0, 0.2);
        border-color: #FF6B00;
    }
`;

const TournamentTitle = styled.h3`
    color: #FFD700;
    margin: 0 0 10px 0;
    font-size: 20px;
`;

const PrizePool = styled.div`
    color: #FF6B00;
    font-size: 24px;
    font-weight: bold;
    margin: 10px 0;
`;

const InfoGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 15px 0;
`;

const InfoItem = styled.div`
    background: rgba(255, 107, 0, 0.1);
    padding: 8px;
    border-radius: 6px;
    
    label {
        color: #999;
        font-size: 12px;
        display: block;
    }
    
    span {
        color: #fff;
        font-size: 14px;
    }
`;

const Status = styled.div<{ status: 'upcoming' | 'live' | 'completed' }>`
    display: inline-block;
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 14px;
    background-color: ${props => {
        switch (props.status) {
            case 'upcoming': return 'rgba(255, 215, 0, 0.2)';
            case 'live': return 'rgba(255, 107, 0, 0.2)';
            case 'completed': return 'rgba(153, 153, 153, 0.2)';
            default: return 'rgba(255, 107, 0, 0.2)';
        }
    }};
    color: ${props => {
        switch (props.status) {
            case 'upcoming': return '#FFD700';
            case 'live': return '#FF6B00';
            case 'completed': return '#999';
            default: return '#FF6B00';
        }
    }};
    border: 1px solid currentColor;
`;

const JoinButton = styled.button`
    background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%);
    color: #000;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    width: 100%;
    margin-top: 15px;
    transition: opacity 0.2s ease;

    &:hover {
        opacity: 0.9;
    }

    &:disabled {
        background: #333;
        color: #666;
        cursor: not-allowed;
    }
`;

interface Tournament {
    id: string;
    title: string;
    prizePool: number;
    startDate: string;
    maxTeams: number;
    registeredTeams: number;
    status: 'upcoming' | 'live' | 'completed';
}

interface CriticalOpsTournamentsProps {
    tournaments: Tournament[];
    onJoinTournament: (tournamentId: string) => void;
}

const CriticalOpsTournaments: React.FC<CriticalOpsTournamentsProps> = ({ tournaments, onJoinTournament }) => {
    return (
        <Container>
            <Header>
                <Title>Critical <span>Ops</span> Tournaments</Title>
            </Header>
            <TournamentGrid>
                {tournaments.map(tournament => (
                    <TournamentCard key={tournament.id}>
                        <Status status={tournament.status}>
                            {tournament.status.toUpperCase()}
                        </Status>
                        <TournamentTitle>{tournament.title}</TournamentTitle>
                        <PrizePool>${tournament.prizePool.toLocaleString()}</PrizePool>
                        <InfoGrid>
                            <InfoItem>
                                <label>Start Date</label>
                                <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                            </InfoItem>
                            <InfoItem>
                                <label>Teams</label>
                                <span>{tournament.registeredTeams}/{tournament.maxTeams}</span>
                            </InfoItem>
                        </InfoGrid>
                        <JoinButton 
                            onClick={() => onJoinTournament(tournament.id)}
                            disabled={tournament.status !== 'upcoming' || tournament.registeredTeams >= tournament.maxTeams}
                        >
                            {tournament.status === 'upcoming' 
                                ? tournament.registeredTeams >= tournament.maxTeams 
                                    ? 'Tournament Full' 
                                    : 'Join Tournament'
                                : tournament.status === 'live'
                                    ? 'Watch Live'
                                    : 'View Results'
                            }
                        </JoinButton>
                    </TournamentCard>
                ))}
            </TournamentGrid>
        </Container>
    );
};

export default CriticalOpsTournaments; 