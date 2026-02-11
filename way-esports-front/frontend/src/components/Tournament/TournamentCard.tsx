import React from 'react';
import { Tournament } from '../../types';

interface TournamentCardProps {
  tournament: Tournament;
  onJoin?: (tournamentId: string) => void;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, onJoin }) => {
  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'upcoming': return '#ffa500';
      case 'active': return '#00ff00';
      case 'completed': return '#888';
      default: return '#fff';
    }
  };

  return (
    <div style={{
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '1rem',
      margin: '1rem 0',
      backgroundColor: '#2a2a2a'
    }}>
      <h3>{tournament.name}</h3>
      <p>{tournament.description}</p>
      <div style={{ margin: '0.5rem 0' }}>
        <span style={{ color: getStatusColor(tournament.status) }}>
          {tournament.status.toUpperCase()}
        </span>
      </div>
      <div>
        <p>Participants: {tournament.currentParticipants}/{tournament.maxParticipants}</p>
        <p>Prize Pool: ${tournament.prizePool}</p>
      </div>
      {onJoin && tournament.status === 'upcoming' && (
        <button 
          onClick={() => onJoin(tournament.id)}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            marginTop: '1rem',
            cursor: 'pointer'
          }}
        >
          Join
        </button>
      )}
    </div>
  );
};

export default TournamentCard;
