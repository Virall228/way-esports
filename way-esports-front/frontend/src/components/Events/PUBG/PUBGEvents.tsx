import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
    padding: 20px;
`;

const Header = styled.div`
    background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%);
    padding: 30px;
    border-radius: 12px;
    margin-bottom: 24px;
    box-shadow: 0 4px 20px rgba(255, 107, 0, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
`;

const Title = styled.h1`
    color: #000;
    font-size: 28px;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 1px;
`;

const FilterButtons = styled.div`
    display: flex;
    gap: 12px;
`;

const FilterButton = styled.button<{ active: boolean }>`
    padding: 8px 16px;
    background: ${props => props.active ? '#000' : 'transparent'};
    border: 2px solid #000;
    border-radius: 20px;
    color: ${props => props.active ? '#FFD700' : '#000'};
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        background: ${props => !props.active && 'rgba(0, 0, 0, 0.1)'};
    }
`;

const EventGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
`;

const EventCard = styled.div`
    background: rgba(26, 26, 26, 0.9);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s ease;
    border: 1px solid #333;
    position: relative;

    &:hover {
        transform: translateY(-10px);
        box-shadow: 0 10px 20px rgba(255, 107, 0, 0.2);
    }
`;

const EventImage = styled.div<{ imageUrl: string }>`
    height: 200px;
    background: url(${props => props.imageUrl}) center/cover;
    position: relative;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 70%;
        background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
    }
`;

const EventStatus = styled.div<{ status: 'upcoming' | 'live' | 'completed' }>`
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
`;

const EventContent = styled.div`
    padding: 24px;
`;

const EventTitle = styled.h3`
    color: #fff;
    margin: 0 0 12px;
    font-size: 20px;
    line-height: 1.4;
`;

const EventInfo = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 20px;
`;

const InfoItem = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    color: #999;
    font-size: 14px;

    svg {
        width: 16px;
        height: 16px;
        color: #FF6B00;
    }
`;

const PrizeDistribution = styled.div`
    background: rgba(255, 107, 0, 0.1);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 20px;
`;

const PrizeTitle = styled.div`
    color: #FF6B00;
    font-weight: bold;
    margin-bottom: 8px;
`;

const PrizeList = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    font-size: 12px;
    color: #fff;
`;

const PrizeItem = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
`;

const ActionButton = styled.button`
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%);
    border: none;
    border-radius: 8px;
    color: #000;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
    }
`;

interface Event {
    id: string;
    title: string;
    imageUrl: string;
    status: 'upcoming' | 'live' | 'completed';
    date: string;
    mode: string;
    teams: number;
    matches: number;
    prizePool: number;
    prizeDistribution: {
        position: string;
        amount: number;
    }[];
}

type EventFilter = 'all' | 'upcoming' | 'live' | 'completed';

const PUBGEvents: React.FC = () => {
    const [filter, setFilter] = useState<EventFilter>('all');

    const events: Event[] = [
        {
            id: '1',
            title: 'PUBG Mobile Championship Series',
            imageUrl: '/images/events/pubg-championship.jpg',
            status: 'upcoming',
            date: '2024-03-20',
            mode: 'Squad TPP',
            teams: 24,
            matches: 18,
            prizePool: 15000,
            prizeDistribution: [
                { position: '1st', amount: 7000 },
                { position: '2nd', amount: 4000 },
                { position: '3rd', amount: 2000 },
                { position: '4th', amount: 1000 },
                { position: '5th', amount: 600 },
                { position: '6th', amount: 400 }
            ]
        },
        // Add more events here
    ];

    const filteredEvents = filter === 'all' 
        ? events 
        : events.filter(event => event.status === filter);

    return (
        <Container>
            <Header>
                <Title>PUBG Mobile Events</Title>
                <FilterButtons>
                    <FilterButton 
                        active={filter === 'all'} 
                        onClick={() => setFilter('all')}
                    >
                        All
                    </FilterButton>
                    <FilterButton 
                        active={filter === 'upcoming'} 
                        onClick={() => setFilter('upcoming')}
                    >
                        Upcoming
                    </FilterButton>
                    <FilterButton 
                        active={filter === 'live'} 
                        onClick={() => setFilter('live')}
                    >
                        Live
                    </FilterButton>
                    <FilterButton 
                        active={filter === 'completed'} 
                        onClick={() => setFilter('completed')}
                    >
                        Completed
                    </FilterButton>
                </FilterButtons>
            </Header>
            <EventGrid>
                {filteredEvents.map(event => (
                    <EventCard key={event.id}>
                        <EventImage imageUrl={event.imageUrl}>
                            <EventStatus status={event.status}>
                                {event.status}
                            </EventStatus>
                        </EventImage>
                        <EventContent>
                            <EventTitle>{event.title}</EventTitle>
                            <EventInfo>
                                <InfoItem>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
                                    </svg>
                                    {new Date(event.date).toLocaleDateString()}
                                </InfoItem>
                                <InfoItem>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                    </svg>
                                    {event.teams} Teams
                                </InfoItem>
                                <InfoItem>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                                        <path d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/>
                                    </svg>
                                    {event.matches} Matches
                                </InfoItem>
                                <InfoItem>
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                    </svg>
                                    {event.mode}
                                </InfoItem>
                            </EventInfo>
                            <PrizeDistribution>
                                <PrizeTitle>Prize Pool: ${event.prizePool.toLocaleString()}</PrizeTitle>
                                <PrizeList>
                                    {event.prizeDistribution.map(prize => (
                                        <PrizeItem key={prize.position}>
                                            <span>{prize.position}</span>
                                            <span>${prize.amount}</span>
                                        </PrizeItem>
                                    ))}
                                </PrizeList>
                            </PrizeDistribution>
                            <ActionButton>
                                {event.status === 'upcoming' ? 'Register Squad' :
                                 event.status === 'live' ? 'Watch Live' :
                                 'View Results'}
                            </ActionButton>
                        </EventContent>
                    </EventCard>
                ))}
            </EventGrid>
        </Container>
    );
};

export default PUBGEvents; 