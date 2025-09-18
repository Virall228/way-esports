import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { generateRoomCredentials, RoomCredentials, joinTournamentRoom } from '../../../utils/tournamentRoom';
import RoomCredentialsDisplay from './RoomCredentials';
import JoinTournamentRoom from './JoinTournamentRoom';

const Container = styled.div`
    background: rgba(26, 26, 26, 0.95);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 32px;
`;

const MatchHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
`;

const TeamSection = styled.div`
    flex: 1;
    text-align: center;
`;

const TeamName = styled.h3`
    color: #fff;
    font-size: 24px;
    margin: 0 0 8px;
`;

const TeamMembers = styled.div`
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
`;

const VS = styled.div`
    color: #FF6B00;
    font-size: 24px;
    font-weight: bold;
    margin: 0 32px;
`;

const MatchInfo = styled.div`
    background: linear-gradient(135deg, rgba(255, 107, 0, 0.1), rgba(255, 215, 0, 0.1));
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-around;
    align-items: center;
`;

const InfoItem = styled.div`
    text-align: center;
`;

const InfoLabel = styled.div`
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    margin-bottom: 4px;
`;

const InfoValue = styled.div`
    color: #FFD700;
    font-size: 18px;
    font-weight: bold;
`;

const StatusBadge = styled.div<{ status: 'upcoming' | 'live' | 'completed' }>`
    display: inline-block;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: bold;
    background: ${props => {
        switch (props.status) {
            case 'live':
                return 'rgba(255, 0, 0, 0.2)';
            case 'upcoming':
                return 'rgba(255, 215, 0, 0.2)';
            case 'completed':
                return 'rgba(128, 128, 128, 0.2)';
            default:
                return 'transparent';
        }
    }};
    color: ${props => {
        switch (props.status) {
            case 'live':
                return '#FF0000';
            case 'upcoming':
                return '#FFD700';
            case 'completed':
                return '#808080';
            default:
                return '#fff';
        }
    }};
    border: 1px solid currentColor;
`;

const JoinButton = styled.button`
    background: #FF6B00;
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 20px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    margin-top: 24px;
    margin-bottom: 24px;

    &:hover {
        background: #FF8B00;
    }
`;

interface Team {
    name: string;
    members: string[];
    tag: string;
}

interface TournamentMatchProps {
    team1: Team;
    team2: Team;
    startTime: Date;
    round: string;
    prizePool: string;
    status: 'upcoming' | 'live' | 'completed';
}

const TournamentMatch: React.FC<TournamentMatchProps> = ({
    team1,
    team2,
    startTime,
    round,
    prizePool,
    status
}) => {
    const [roomCredentials, setRoomCredentials] = useState<RoomCredentials | null>(null);
    const [showJoinRoom, setShowJoinRoom] = useState(false);

    useEffect(() => {
        // Generate room credentials when component mounts
        if (status === 'upcoming') {
            const credentials = generateRoomCredentials(
                team1.name,
                team2.name,
                startTime
            );
            setRoomCredentials(credentials);
        }
    }, [team1.name, team2.name, startTime, status]);

    const handleCredentialsReceived = () => {
        // You can implement notification logic here
        console.log('Room credentials are now available!');
    };

    const handleJoinRoom = async (roomId: string, password: string) => {
        await joinTournamentRoom(roomId, password);
        // After successful join, you might want to redirect to the game room
        // or update the UI to show the game interface
    };

    return (
        <Container>
            <MatchHeader>
                <TeamSection>
                    <TeamName>[{team1.tag}] {team1.name}</TeamName>
                    <TeamMembers>
                        {team1.members.join(' • ')}
                    </TeamMembers>
                </TeamSection>

                <VS>VS</VS>

                <TeamSection>
                    <TeamName>[{team2.tag}] {team2.name}</TeamName>
                    <TeamMembers>
                        {team2.members.join(' • ')}
                    </TeamMembers>
                </TeamSection>
            </MatchHeader>

            <MatchInfo>
                <InfoItem>
                    <InfoLabel>Round</InfoLabel>
                    <InfoValue>{round}</InfoValue>
                </InfoItem>

                <InfoItem>
                    <InfoLabel>Prize Pool</InfoLabel>
                    <InfoValue>{prizePool}</InfoValue>
                </InfoItem>

                <InfoItem>
                    <InfoLabel>Status</InfoLabel>
                    <StatusBadge status={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </StatusBadge>
                </InfoItem>
            </MatchInfo>

            {status === 'live' && !showJoinRoom && (
                <JoinButton onClick={() => setShowJoinRoom(true)}>
                    Join Match Room
                </JoinButton>
            )}

            {status === 'live' && showJoinRoom && (
                <JoinTournamentRoom onJoin={handleJoinRoom} />
            )}

            {status !== 'completed' && !showJoinRoom && (
                <RoomCredentialsDisplay
                    credentials={roomCredentials}
                    onCredentialsReceived={handleCredentialsReceived}
                />
            )}
        </Container>
    );
};

export default TournamentMatch; 