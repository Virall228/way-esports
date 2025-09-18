import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
    background: rgba(26, 26, 26, 0.95);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
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

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const Label = styled.label`
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
`;

const Input = styled.input`
    background: rgba(255, 107, 0, 0.1);
    border: 1px solid #FF6B00;
    border-radius: 8px;
    padding: 12px;
    color: #FFD700;
    font-family: 'Orbitron', monospace;
    font-size: 16px;
    width: 100%;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: #FFD700;
    }

    &::placeholder {
        color: rgba(255, 215, 0, 0.3);
    }
`;

const JoinButton = styled.button`
    background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%);
    color: #000;
    border: none;
    padding: 12px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
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

const ErrorMessage = styled.div`
    color: #FF4444;
    font-size: 14px;
    margin-top: 8px;
`;

interface JoinTournamentRoomProps {
    onJoin: (roomId: string, password: string) => Promise<void>;
}

const JoinTournamentRoom: React.FC<JoinTournamentRoomProps> = ({ onJoin }) => {
    const [roomId, setRoomId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsJoining(true);

        try {
            await onJoin(roomId.toUpperCase(), password);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to join room');
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <Container>
            <Title>
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
                Join Tournament Room
            </Title>

            <Form onSubmit={handleSubmit}>
                <InputGroup>
                    <Label htmlFor="roomId">Room ID</Label>
                    <Input
                        id="roomId"
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Enter room ID"
                        maxLength={6}
                        pattern="[A-Za-z0-9]+"
                        required
                    />
                </InputGroup>

                <InputGroup>
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter room password"
                        maxLength={8}
                        required
                    />
                </InputGroup>

                {error && <ErrorMessage>{error}</ErrorMessage>}

                <JoinButton type="submit" disabled={isJoining}>
                    {isJoining ? 'Joining...' : 'Join Room'}
                </JoinButton>
            </Form>
        </Container>
    );
};

export default JoinTournamentRoom; 