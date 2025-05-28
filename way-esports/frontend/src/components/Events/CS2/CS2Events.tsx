import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
    padding: 20px;
`;

const Header = styled.div`
    background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%);
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 24px;
    box-shadow: 0 4px 20px rgba(255, 107, 0, 0.2);
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('/images/cs2-pattern.png') center/cover;
        opacity: 0.1;
    }
`;

const Title = styled.h1`
    color: #000;
    font-size: 28px;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 1px;
    position: relative;
`;

const EventList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const EventCard = styled.div`
    background: rgba(26, 26, 26, 0.9);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    transition: transform 0.3s ease;
    border: 1px solid #333;

    &:hover {
        transform: translateX(10px);
    }

    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

const EventImage = styled.div<{ imageUrl: string }>`
    width: 300px;
    background: url(${props => props.imageUrl}) center/cover;
    position: relative;

    @media (max-width: 768px) {
        width: 100%;
        height: 200px;
    }
`;

const EventStatus = styled.div<{ status: 'upcoming' | 'live' | 'completed' }>`
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
    z-index: 1;
    background: ${props => 
        props.status === 'live' ? '#FF0000' :
        props.status === 'upcoming' ? '#FFD700' : '#666'};
    color: ${props => props.status === 'upcoming' ? '#000' : '#fff'};
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
`;

const EventContent = styled.div`
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
`;

const EventTitle = styled.h3`
    color: #fff;
    margin: 0 0 12px;
    font-size: 22px;
`;

const EventDescription = styled.p`
    color: #999;
    margin: 0 0 16px;
    font-size: 14px;
    line-height: 1.6;
`;

const EventDetails = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
`;

const DetailItem = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    color: #fff;
    font-size: 14px;

    svg {
        width: 18px;
        height: 18px;
        color: #FF6B00;
    }
`;

const PrizePool = styled.div`
    background: linear-gradient(90deg, #FF6B00, #FFD700);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: bold;
    font-size: 24px;
    margin-bottom: 20px;
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 12px;
    margin-top: auto;
`;

const Button = styled.button<{ primary?: boolean }>`
    padding: 12px 24px;
    background: ${props => props.primary ? 
        'linear-gradient(135deg, #FF6B00 0%, #FFD700 100%)' : 
        'transparent'};
    border: ${props => props.primary ? 'none' : '2px solid #FF6B00'};
    border-radius: 6px;
    color: ${props => props.primary ? '#000' : '#FF6B00'};
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: ${props => props.primary ? 
            '0 4px 12px rgba(255, 107, 0, 0.3)' : 
            'none'};
        background: ${props => !props.primary && 'rgba(255, 107, 0, 0.1)'};
    }
`;

interface Event {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    status: 'upcoming' | 'live' | 'completed';
    date: string;
    location: string;
    format: string;
    teams: number;
    prizePool: number;
}

const CS2Events: React.FC = () => {
    const events: Event[] = [
        {
            id: '1',
            title: 'CS2 Pro League Season 1',
            description: 'Join the inaugural season of our CS2 Pro League featuring top teams from around the world competing for glory and prizes.',
            imageUrl: '/images/events/cs2-league.jpg',
            status: 'upcoming',
            date: '2024-04-01',
            location: 'Online',
            format: '5v5 Double Elimination',
            teams: 32,
            prizePool: 25000
        },
        // Add more events here
    ];

    return (
        <Container>
            <Header>
                <Title>CS2 Events</Title>
            </Header>
            <EventList>
                {events.map(event => (
                    <EventCard key={event.id}>
                        <EventImage imageUrl={event.imageUrl}>
                            <EventStatus status={event.status}>
                                {event.status}
                            </EventStatus>
                        </EventImage>
                        <EventContent>
                            <EventTitle>{event.title}</EventTitle>
                            <EventDescription>{event.description}</EventDescription>
                            <EventDetails>
                                <DetailItem>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
                                    </svg>
                                    {new Date(event.date).toLocaleDateString()}
                                </DetailItem>
                                <DetailItem>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
                                    </svg>
                                    {event.location}
                                </DetailItem>
                                <DetailItem>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                    </svg>
                                    {event.teams} Teams
                                </DetailItem>
                                <DetailItem>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                                        <path d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/>
                                    </svg>
                                    {event.format}
                                </DetailItem>
                            </EventDetails>
                            <PrizePool>${event.prizePool.toLocaleString()}</PrizePool>
                            <ActionButtons>
                                <Button primary>
                                    {event.status === 'upcoming' ? 'Register Team' :
                                     event.status === 'live' ? 'Watch Live' :
                                     'View Results'}
                                </Button>
                                <Button>More Info</Button>
                            </ActionButtons>
                        </EventContent>
                    </EventCard>
                ))}
            </EventList>
        </Container>
    );
};

export default CS2Events; 