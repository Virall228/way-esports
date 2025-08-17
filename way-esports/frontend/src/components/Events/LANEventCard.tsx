import React from 'react';
import styled, { keyframes } from 'styled-components';

const glowAnimation = keyframes`
    0% { box-shadow: 0 0 10px rgba(255, 107, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.2); }
    50% { box-shadow: 0 0 20px rgba(255, 107, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3); }
    100% { box-shadow: 0 0 10px rgba(255, 107, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.2); }
`;

const Card = styled.div`
    background: linear-gradient(135deg, rgba(42, 42, 42, 0.95) 0%, rgba(26, 26, 26, 0.95) 100%);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255, 107, 0, 0.3);
    animation: ${glowAnimation} 3s infinite;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-5px);
        border-color: rgba(255, 107, 0, 0.6);
    }

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('/images/lan-pattern.png') center/cover;
        opacity: 0.05;
        z-index: 0;
    }
`;

const VenueTag = styled.div`
    position: absolute;
    top: 20px;
    left: 0;
    background: linear-gradient(90deg, #FF6B00 0%, #FFD700 100%);
    padding: 8px 16px 8px 24px;
    color: #000;
    font-weight: bold;
    font-size: 14px;
    clip-path: polygon(0 0, 100% 0, 90% 100%, 0 100%);
    z-index: 2;
`;

const Content = styled.div`
    position: relative;
    z-index: 1;
`;

const Title = styled.h3`
    color: #fff;
    font-size: 24px;
    margin: 0 0 16px;
    padding-top: 40px;
`;

const InfoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
`;

const InfoItem = styled.div`
    background: rgba(255, 107, 0, 0.1);
    padding: 16px;
    border-radius: 12px;
    border: 1px solid rgba(255, 107, 0, 0.2);

    h4 {
        color: #FF6B00;
        margin: 0 0 8px;
        font-size: 14px;
        text-transform: uppercase;
    }

    p {
        color: #fff;
        margin: 0;
        font-size: 16px;
        font-weight: bold;
    }
`;

const PrizePool = styled.div`
    background: linear-gradient(90deg, #FF6B00, #FFD700);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 24px;
    text-align: right;
`;

const ActionButton = styled.button`
    background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%);
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    color: #000;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    font-size: 16px;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(255, 107, 0, 0.4);
    }
`;

interface LANEventProps {
    event: {
        title: string;
        venue: string;
        date: string;
        teams: {
            registered: number;
            total: number;
        };
        prizePool: number;
        location: string;
        game: string;
        status: 'upcoming' | 'live' | 'completed';
    };
    onRegister: () => void;
}

const LANEventCard: React.FC<LANEventProps> = ({ event, onRegister }) => {
    return (
        <Card>
            <VenueTag>{event.venue}</VenueTag>
            <Content>
                <Title>{event.title}</Title>
                <InfoGrid>
                    <InfoItem>
                        <h4>Location</h4>
                        <p>{event.location}</p>
                    </InfoItem>
                    <InfoItem>
                        <h4>Date</h4>
                        <p>{new Date(event.date).toLocaleDateString()}</p>
                    </InfoItem>
                    <InfoItem>
                        <h4>Game</h4>
                        <p>{event.game}</p>
                    </InfoItem>
                    <InfoItem>
                        <h4>Teams</h4>
                        <p>{event.teams.registered}/{event.teams.total}</p>
                    </InfoItem>
                </InfoGrid>
                <PrizePool>${event.prizePool.toLocaleString()}</PrizePool>
                {event.status === 'upcoming' && (
                    <ActionButton onClick={onRegister}>
                        Register for LAN Event
                    </ActionButton>
                )}
            </Content>
        </Card>
    );
};

export default LANEventCard; 