import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { RoomCredentials, shouldDistributeCredentials } from '../../../utils/tournamentRoom';

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
    background: rgba(26, 26, 26, 0.95);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    animation: ${fadeIn} 0.3s ease-out;
`;

const Title = styled.h3`
    color: #FF6B00;
    margin: 0 0 16px;
    font-size: 20px;
    display: flex;
    align-items: center;
    gap: 8px;

    svg {
        width: 24px;
        height: 24px;
    }
`;

const CredentialsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
`;

const CredentialItem = styled.div`
    background: rgba(255, 107, 0, 0.1);
    border: 1px solid #FF6B00;
    border-radius: 8px;
    padding: 12px;
`;

const Label = styled.div`
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    margin-bottom: 4px;
`;

const Value = styled.div`
    color: #FFD700;
    font-family: 'Orbitron', monospace;
    font-size: 18px;
    font-weight: bold;
`;

const MapInfo = styled.div`
    background: linear-gradient(135deg, rgba(255, 107, 0, 0.2), rgba(255, 215, 0, 0.2));
    border-radius: 8px;
    padding: 16px;
    text-align: center;
`;

const MapName = styled.div`
    color: #FFD700;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
`;

const MapLabel = styled.div`
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
`;

const Timer = styled.div`
    text-align: center;
    margin-top: 16px;
    color: ${props => props.color || '#FF6B00'};
    font-size: 16px;
`;

const CopyButton = styled.button`
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    padding: 4px;
    margin-left: 4px;
    transition: color 0.3s ease;

    &:hover {
        color: #FFD700;
    }

    svg {
        width: 16px;
        height: 16px;
    }
`;

interface RoomCredentialsDisplayProps {
    credentials: RoomCredentials | null;
    onCredentialsReceived?: () => void;
}

const RoomCredentialsDisplay: React.FC<RoomCredentialsDisplayProps> = ({
    credentials,
    onCredentialsReceived
}) => {
    const [timeUntilStart, setTimeUntilStart] = useState<string>('');
    const [showCredentials, setShowCredentials] = useState(false);

    useEffect(() => {
        if (!credentials) return;

        const updateTimer = () => {
            const now = new Date();
            const diff = credentials.startTime.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeUntilStart('Tournament has started');
                return;
            }

            const minutes = Math.floor(diff / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeUntilStart(`Match starts in ${minutes}m ${seconds}s`);

            // Show credentials 5 minutes before start
            if (shouldDistributeCredentials(credentials.startTime)) {
                setShowCredentials(true);
                onCredentialsReceived?.();
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [credentials, onCredentialsReceived]);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (!credentials || !showCredentials) {
        return (
            <Container>
                <Title>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                        <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                    </svg>
                    Room Credentials
                </Title>
                <Timer>{timeUntilStart}</Timer>
            </Container>
        );
    }

    return (
        <Container>
            <Title>
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
                Room Credentials
            </Title>

            <CredentialsGrid>
                <CredentialItem>
                    <Label>Room ID</Label>
                    <Value>
                        {credentials.roomId}
                        <CopyButton onClick={() => copyToClipboard(credentials.roomId)} title="Copy Room ID">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                            </svg>
                        </CopyButton>
                    </Value>
                </CredentialItem>

                <CredentialItem>
                    <Label>Password</Label>
                    <Value>
                        {credentials.password}
                        <CopyButton onClick={() => copyToClipboard(credentials.password)} title="Copy Password">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                            </svg>
                        </CopyButton>
                    </Value>
                </CredentialItem>
            </CredentialsGrid>

            <MapInfo>
                <MapLabel>Selected Map</MapLabel>
                <MapName>{credentials.map}</MapName>
            </MapInfo>

            <Timer color="#4CAF50">{timeUntilStart}</Timer>
        </Container>
    );
};

export default RoomCredentialsDisplay; 