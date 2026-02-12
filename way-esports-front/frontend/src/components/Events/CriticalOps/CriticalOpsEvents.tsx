import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { tournamentService } from '../../../services/tournamentService';

const Container = styled.div`
    padding: 20px;
`;

const Header = styled.div`
    background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%);
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 24px;
    box-shadow: 0 4px 20px rgba(255, 107, 0, 0.2);
`;

const Title = styled.h1`
    color: #000;
    font-size: 28px;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 1px;
`;

const EventGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
`;

const EventCard = styled.div`
    background: rgba(26, 26, 26, 0.9);
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.3s ease;
    border: 1px solid #333;

    &:hover {
        transform: translateY(-5px);
    }
`;

const EventImage = styled.div<{ imageUrl: string }>`
    height: 160px;
    background: url(${props => props.imageUrl}) center/cover;
    position: relative;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60%;
        background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
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
`;

const EventContent = styled.div`
    padding: 16px;
`;

const EventTitle = styled.h3`
    color: #fff;
    margin: 0 0 8px;
    font-size: 18px;
`;

const EventInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
`;

const InfoItem = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    color: #999;
    font-size: 14px;

    svg {
        width: 16px;
        height: 16px;
        color: #FF6B00;
    }
`;

const PrizePool = styled.div`
    background: linear-gradient(90deg, #FF6B00, #FFD700);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: bold;
    font-size: 20px;
    margin-bottom: 12px;
`;

const ActionButton = styled.button`
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%);
    border: none;
    border-radius: 6px;
    color: #000;
    font-weight: bold;
    cursor: pointer;
    transition: opacity 0.3s ease;

    &:hover {
        opacity: 0.9;
    }
`;

interface Event {
    id: string;
    title: string;
    imageUrl: string;
    status: 'upcoming' | 'live' | 'completed';
    date: string;
    teams: number;
    prizePool: number;
}

const CriticalOpsEvents: React.FC = () => {
    const { data: tournamentsRaw = [], isLoading, error } = useQuery({
        queryKey: ['tournaments', 'critical-ops'],
        queryFn: async () => {
            const res: any = await tournamentService.list();
            return res?.tournaments || res?.data || res || [];
        },
        staleTime: 30000,
        refetchOnWindowFocus: false
    });

    const events: Event[] = useMemo(() => {
        const items: any[] = Array.isArray(tournamentsRaw) ? tournamentsRaw : [];
        return items
            .filter((t: any) => (t.game || '').toString().toLowerCase().includes('critical'))
            .map((t: any) => ({
                id: String(t.id || t._id || ''),
                title: String(t.name || t.title || 'Critical Ops Tournament'),
                imageUrl: String(t.coverImage || t.image || '/images/events/cops-championship.jpg'),
                status: (['ongoing', 'live', 'in_progress'].includes(String(t.status || '').toLowerCase()) ? 'live' :
                    (String(t.status || '').toLowerCase() === 'completed' ? 'completed' : 'upcoming')),
                date: String(t.startDate || t.date || new Date().toISOString()),
                teams: Number(t.maxParticipants ?? t.maxTeams ?? 0),
                prizePool: Number(t.prizePool || 0)
            }));
    }, [tournamentsRaw]);

    return (
        <Container>
            <Header>
                <Title>Critical Ops Events</Title>
            </Header>
            <EventGrid>
                {isLoading && (
                    <EventCard>
                        <EventContent>Loading events...</EventContent>
                    </EventCard>
                )}
                {!isLoading && error && (
                    <EventCard>
                        <EventContent>Failed to load events</EventContent>
                    </EventCard>
                )}
                {!isLoading && !error && events.length === 0 && (
                    <EventCard>
                        <EventContent>No Critical Ops events yet</EventContent>
                    </EventCard>
                )}
                {!isLoading && !error && events.map(event => (
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
                            </EventInfo>
                            <PrizePool>${event.prizePool.toLocaleString()}</PrizePool>
                            <ActionButton>
                                {event.status === 'upcoming' ? 'Register Now' :
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

export default CriticalOpsEvents; 
