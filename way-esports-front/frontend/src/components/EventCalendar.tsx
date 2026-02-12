import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../services/api';

const CalendarContainer = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 2rem;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const MonthSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const MonthButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #333;
  border-radius: 8px;
  overflow: hidden;
`;

const CalendarDay = styled.div<{ isToday?: boolean; hasEvents?: boolean }>`
  background: ${props => props.isToday ? '#007bff' : '#1a1a1a'};
  color: white;
  padding: 1rem;
  min-height: 100px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #333;
  }
`;

const DayNumber = styled.div`
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const EventItem = styled.div`
  background: #007bff;
  color: white;
  padding: 0.25rem 0.5rem;
  margin: 0.25rem 0;
  border-radius: 4px;
  font-size: 0.8rem;
`;

const EventModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #1a1a1a;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 100%;
`;

interface TournamentEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  game: string;
  prize: string;
  participants: number;
  maxParticipants: number;
}

export const EventCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TournamentEvent | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/api/tournaments/upcoming');
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<CalendarDay key={`empty-${i}`} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <CalendarDay 
          key={day} 
          isToday={isToday}
          onClick={() => dayEvents.length > 0 && setSelectedEvent(dayEvents[0])}
        >
          <DayNumber>{day}</DayNumber>
          {dayEvents.map(event => (
            <EventItem key={event.id}>{event.title}</EventItem>
          ))}
        </CalendarDay>
      );
    }

    return days;
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  return (
    <CalendarContainer>
      <CalendarHeader>
        <h2>Event Calendar</h2>
        <MonthSelector>
          <MonthButton onClick={() => navigateMonth(-1)}>Previous</MonthButton>
          <span>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          <MonthButton onClick={() => navigateMonth(1)}>Next</MonthButton>
        </MonthSelector>
      </CalendarHeader>

      <CalendarGrid>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <CalendarDay key={day} style={{ fontWeight: 'bold', background: '#333' }}>
            {day}
          </CalendarDay>
        ))}
        {renderCalendar()}
      </CalendarGrid>

      {selectedEvent && (
        <EventModal onClick={() => setSelectedEvent(null)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <h3>{selectedEvent.title}</h3>
            <p>Date: {new Date(selectedEvent.date).toLocaleDateString()}</p>
            <p>Time: {selectedEvent.time}</p>
            <p>Game: {selectedEvent.game}</p>
            <p>Prize: {selectedEvent.prize}</p>
            <p>Participants: {selectedEvent.participants}/{selectedEvent.maxParticipants}</p>
            <button onClick={() => setSelectedEvent(null)}>Close</button>
          </ModalContent>
        </EventModal>
      )}
    </CalendarContainer>
  );
};
