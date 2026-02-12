import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import LANEventCard from './LANEventCard';
import { useQuery } from '@tanstack/react-query';
import { tournamentService } from '../../services/tournamentService';

const Container = styled.div`
    padding: 20px;
`;

const Header = styled.div`
    background: linear-gradient(135deg, rgba(255, 107, 0, 0.95) 0%, rgba(255, 215, 0, 0.95) 100%);
    padding: 30px;
    border-radius: 16px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('/images/lan-header-pattern.png') center/cover;
        opacity: 0.1;
        z-index: 0;
    }
`;

const HeaderContent = styled.div`
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
`;

const Title = styled.h1`
    color: #000;
    font-size: 32px;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const FilterSection = styled.div`
    display: flex;
    gap: 12px;
`;

const FilterButton = styled.button<{ active: boolean }>`
    background: ${props => props.active ? '#000' : 'rgba(0, 0, 0, 0.2)'};
    color: ${props => props.active ? '#FFD700' : '#000'};
    border: 2px solid #000;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        background: ${props => props.active ? '#000' : 'rgba(0, 0, 0, 0.3)'};
        transform: translateY(-2px);
    }
`;

const EventsGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
`;

const NoEvents = styled.div`
    text-align: center;
    padding: 40px;
    background: rgba(255, 107, 0, 0.1);
    border-radius: 12px;
    color: #FF6B00;
    font-size: 18px;
`;

interface LANEvent {
    id: string;
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
}

const mapStatus = (status?: string): 'upcoming' | 'live' | 'completed' => {
    if (!status) return 'upcoming';
    const normalized = status.toLowerCase();
    if (['live', 'ongoing', 'in_progress'].includes(normalized)) return 'live';
    if (['completed', 'finished'].includes(normalized)) return 'completed';
    return 'upcoming';
};

const LANEvents: React.FC = () => {
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');

    const { data: tournamentsRaw = [], isLoading, error } = useQuery({
        queryKey: ['tournaments', 'lan-events'],
        queryFn: async () => {
            const res: any = await tournamentService.list();
            return res?.tournaments || res?.data || res || [];
        },
        staleTime: 30000,
        refetchOnWindowFocus: false
    });

    const events: LANEvent[] = useMemo(() => {
        const items: any[] = Array.isArray(tournamentsRaw) ? tournamentsRaw : [];
        return items.map((t: any) => {
            const dateValue = t.startDate || t.date || new Date().toISOString();
            return {
                id: String(t.id || t._id || ''),
                title: String(t.name || t.title || 'Tournament'),
                venue: String(t.venue || t.location || 'TBD'),
                date: new Date(dateValue).toISOString(),
                teams: {
                    registered: Number(t.participants ?? 0),
                    total: Number(t.maxParticipants ?? t.maxTeams ?? 0)
                },
                prizePool: Number(t.prizePool || 0),
                location: String(t.location || 'TBD'),
                game: String(t.game || 'TBD'),
                status: mapStatus(t.status)
            };
        });
    }, [tournamentsRaw]);

    const filteredEvents = filter === 'all' 
        ? events 
        : events.filter(event => event.status === filter);

    const handleRegister = (eventId: string) => {
        // Handle registration logic
        console.log('Registering for event:', eventId);
    };

    return (
        <Container>
            <Header>
                <HeaderContent>
                    <Title>LAN Events</Title>
                    <FilterSection>
                        <FilterButton 
                            active={filter === 'all'} 
                            onClick={() => setFilter('all')}
                        >
                            All Events
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
                            Live Now
                        </FilterButton>
                        <FilterButton 
                            active={filter === 'completed'} 
                            onClick={() => setFilter('completed')}
                        >
                            Completed
                        </FilterButton>
                    </FilterSection>
                </HeaderContent>
            </Header>

            <EventsGrid>
                {isLoading && (
                    <NoEvents>Loading events...</NoEvents>
                )}
                {!isLoading && error && (
                    <NoEvents>Failed to load events</NoEvents>
                )}
                {!isLoading && !error && filteredEvents.length > 0 && (
                    filteredEvents.map(event => (
                        <LANEventCard
                            key={event.id}
                            event={event}
                            onRegister={() => handleRegister(event.id)}
                        />
                    ))
                )}
                {!isLoading && !error && filteredEvents.length === 0 && (
                    <NoEvents>
                        No {filter === 'all' ? '' : filter} LAN events found
                    </NoEvents>
                )}
            </EventsGrid>
        </Container>
    );
};

export default LANEvents; 
