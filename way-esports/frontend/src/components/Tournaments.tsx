import React, { useState } from 'react';
import styled from 'styled-components';

const TournamentsContainer = styled.div`
    padding-bottom: 80px;
`;

const TournamentCard = styled.div`
    background-color: #2a2a2a;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    cursor: pointer;
    transition: transform 0.2s ease;
    position: relative;

    &:hover {
        transform: translateY(-2px);
    }
`;

const TournamentHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
`;

const TournamentTitle = styled.h3`
    margin: 0;
    color: #FF6B00;
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

const TournamentInfo = styled.div`
    margin: 10px 0;
    color: #999;
    font-size: 14px;
    
    p {
        margin: 5px 0;
    }
`;

const TeamsList = styled.div`
    margin: 15px 0;
    padding: 10px;
    background-color: #333;
    border-radius: 8px;
`;

const Team = styled.div`
    padding: 8px;
    border-bottom: 1px solid #444;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:last-child {
        border-bottom: none;
    }
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
    background-color: ${props => props.variant === 'secondary' ? '#333' : '#FF6B00'};
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s ease;

    &:hover {
        background-color: ${props => props.variant === 'secondary' ? '#444' : '#ff8533'};
    }

    &:disabled {
        background-color: #555;
        cursor: not-allowed;
    }
`;

const StatusIndicator = styled.div<{ status: 'upcoming' | 'live' | 'completed' }>`
    position: absolute;
    top: 16px;
    right: 16px;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
    z-index: 1;
    background: ${props => 
        props.status === 'live' ? '#FF0000' :
        props.status === 'upcoming' ? '#FFD700' : '#666'};
    color: ${props => props.status === 'upcoming' ? '#000' : '#fff'};
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
    cursor: default;

    &:hover {
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 4px 12px ${props => 
            props.status === 'live' ? 'rgba(255, 0, 0, 0.4)' :
            props.status === 'upcoming' ? 'rgba(255, 215, 0, 0.4)' : 
            'rgba(102, 102, 102, 0.4)'};
    }

    ${props => props.status === 'live' && `
        animation: pulse 2s infinite;
        
        @keyframes pulse {
            0% { box-shadow: 0 2px 8px rgba(255, 0, 0, 0.3); }
            50% { box-shadow: 0 2px 12px rgba(255, 0, 0, 0.5); }
            100% { box-shadow: 0 2px 8px rgba(255, 0, 0, 0.3); }
        }
    `}

    ${props => props.status === 'upcoming' && `
        animation: shimmer 3s infinite;
        
        @keyframes shimmer {
            0% { background: #FFD700; }
            50% { background: #FFC500; }
            100% { background: #FFD700; }
        }
    `}
`;

interface Tournament {
    id: string;
    name: string;
    game: string;
    status: 'upcoming' | 'in_progress' | 'completed' | 'live';
    startDate: string;
    maxTeams: number;
    registeredTeams: Array<{
        name: string;
        players: string[];
    }>;
    prizePool?: number;
}

interface TournamentsProps {
    tournaments: Tournament[];
    onRegister: (tournamentId: string) => void;
    onViewDetails: (tournamentId: string) => void;
}

const Tournaments: React.FC<TournamentsProps> = ({ tournaments, onRegister, onViewDetails }) => {
    return (
        <TournamentsContainer>
            {tournaments.map(tournament => (
                <TournamentCard key={tournament.id} onClick={() => onViewDetails(tournament.id)}>
                    <StatusIndicator status={tournament.status}>
                        {tournament.status}
                    </StatusIndicator>
                    <TournamentHeader>
                        <TournamentTitle>{tournament.name}</TournamentTitle>
                        <Status status={tournament.status}>
                            {tournament.status.replace('_', ' ')}
                        </Status>
                    </TournamentHeader>

                    <TournamentInfo>
                        <p>Game: {tournament.game}</p>
                        <p>Teams: {tournament.registeredTeams.length}/{tournament.maxTeams}</p>
                        <p>Start: {new Date(tournament.startDate).toLocaleString()}</p>
                        {tournament.prizePool && (
                            <p>Prize Pool: ${tournament.prizePool}</p>
                        )}
                    </TournamentInfo>

                    {tournament.status === 'upcoming' && (
                        <ActionButton 
                            onClick={(e) => {
                                e.stopPropagation();
                                onRegister(tournament.id);
                            }}
                            disabled={tournament.registeredTeams.length >= tournament.maxTeams}
                        >
                            Register Team
                        </ActionButton>
                    )}

                    {tournament.registeredTeams.length > 0 && (
                        <TeamsList>
                            {tournament.registeredTeams.map((team, index) => (
                                <Team key={index}>
                                    <span>{team.name}</span>
                                    <span>{team.players.length} players</span>
                                </Team>
                            ))}
                        </TeamsList>
                    )}
                </TournamentCard>
            ))}
        </TournamentsContainer>
    );
};

export default Tournaments; 