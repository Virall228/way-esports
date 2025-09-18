import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../../styles/theme';
import HLTVStyleStats from '../HLTVStyleStats';
import { CriticalOpsMatch } from '../../../../types/matches';

const mockMatch: CriticalOpsMatch = {
  id: "test-match",
  map: "Bureau",
  mode: "Defuse",
  date: new Date("2024-03-15"),
  duration: 1800,
  status: "completed",
  tournament: {
    id: "t1",
    name: "Test Tournament",
    round: "Finals"
  },
  team1: {
    id: "team1",
    name: "WAY Tigers",
    tag: "WAY",
    stats: {
      score: 13,
      roundsWon: 13,
      roundsLost: 7,
      plantedBombs: 8,
      defusedBombs: 2,
      totalKills: 65,
      totalDeaths: 35,
      totalAssists: 15,
      totalHeadshots: 30,
      averageAccuracy: 68,
      clutchRounds: 3,
      econRoundsWon: 2
    },
    players: []
  },
  team2: {
    id: "team2",
    name: "Test Team",
    tag: "TEST",
    stats: {
      score: 7,
      roundsWon: 7,
      roundsLost: 13,
      plantedBombs: 5,
      defusedBombs: 1,
      totalKills: 35,
      totalDeaths: 65,
      totalAssists: 10,
      totalHeadshots: 20,
      averageAccuracy: 62,
      clutchRounds: 1,
      econRoundsWon: 1
    },
    players: []
  },
  winner: "team1",
  rounds: []
};

const renderWithTheme = (component: React.ReactNode) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('HLTVStyleStats', () => {
  it('renders team names and scores', () => {
    renderWithTheme(<HLTVStyleStats match={mockMatch} />);
    
    expect(screen.getByText('WAY Tigers')).toBeInTheDocument();
    expect(screen.getByText('Test Team')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders tournament information', () => {
    renderWithTheme(<HLTVStyleStats match={mockMatch} />);
    
    expect(screen.getByText('Test Tournament - Finals')).toBeInTheDocument();
    expect(screen.getByText('Bureau')).toBeInTheDocument();
  });

  it('renders team statistics', () => {
    renderWithTheme(<HLTVStyleStats match={mockMatch} />);
    
    expect(screen.getByText('Team Statistics')).toBeInTheDocument();
    expect(screen.getByText('Total Kills')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
    expect(screen.getByText('Headshots')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
  });

  it('renders round statistics', () => {
    renderWithTheme(<HLTVStyleStats match={mockMatch} />);
    
    expect(screen.getByText('Round Statistics')).toBeInTheDocument();
    expect(screen.getByText('Rounds Won')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText('Plants')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Defuses')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('highlights winner team', () => {
    renderWithTheme(<HLTVStyleStats match={mockMatch} />);
    
    const winnerTeam = screen.getByText('WAY Tigers');
    const loserTeam = screen.getByText('Test Team');
    
    expect(winnerTeam).toHaveStyle({ color: theme.colors.primary });
    expect(loserTeam).not.toHaveStyle({ color: theme.colors.primary });
  });
}); 