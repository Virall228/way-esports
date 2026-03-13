import React from 'react';
import type { HistorySort } from './types';

type Props = {
  game: string;
  status?: string;
  sort: HistorySort;
  onGameChange: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onSortChange: (value: HistorySort) => void;
};

const controlStyle: React.CSSProperties = {
  minHeight: 34,
  background: '#121418',
  color: '#fff',
  border: '1px solid #2b2f38',
  borderRadius: 8,
  padding: '0 10px'
};

const TournamentHistoryFilters: React.FC<Props> = ({
  game,
  status,
  sort,
  onGameChange,
  onStatusChange,
  onSortChange
}) => {
  return (
    <>
      <select value={game} onChange={(e) => onGameChange(e.target.value)} style={controlStyle}>
        <option value="all">All games</option>
        <option value="Critical Ops">Critical Ops</option>
        <option value="CS2">CS2</option>
        <option value="PUBG Mobile">PUBG Mobile</option>
        <option value="Standoff 2">Standoff 2</option>
        <option value="Dota 2">Dota 2</option>
        <option value="Valorant Mobile">Valorant Mobile</option>
      </select>

      {onStatusChange ? (
        <select value={status || 'all'} onChange={(e) => onStatusChange(e.target.value)} style={controlStyle}>
          <option value="all">All statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      ) : null}

      <select value={sort} onChange={(e) => onSortChange(e.target.value as HistorySort)} style={controlStyle}>
        <option value="recent">Recent first</option>
        <option value="oldest">Oldest first</option>
      </select>
    </>
  );
};

export default TournamentHistoryFilters;
