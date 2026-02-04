import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import navigationService from '../../services/NavigationService';
import { api } from '../../services/api';
import { useTournamentAccess } from '../../hooks/useTournamentAccess';
import TournamentRegistrationGuard from '../../components/Tournament/TournamentRegistrationGuard';

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.h5.fontSize};
  max-width: 800px;
  margin: 0 auto;
`;

const GameTabs = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`;

const GameTab = styled(Button)<{ active?: boolean }>`
  min-width: 150px;
  background: ${({ theme, active }) =>
    active ? theme.colors.accent : `${theme.colors.primary}99`};
  color: ${({ theme }) => theme.colors.text.primary};
  
  &:hover {
    background: ${({ theme, active }) =>
      active ? theme.colors.accent : `${theme.colors.primary}cc`};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
`;

const TournamentCard = styled(Card)<{ status: 'upcoming' | 'live' | 'completed' | 'comingSoon' }>`
  padding: ${({ theme }) => theme.spacing.xl};
  background: linear-gradient(
    135deg,
    ${({ theme }) => `${theme.colors.primary}99`} 0%,
    ${({ theme }) => `${theme.colors.surface}99`} 100%
  );
  backdrop-filter: blur(10px);
  border: 1px solid ${({ theme, status }) => {
    switch (status) {
      case 'live':
        return theme.colors.success;
      case 'upcoming':
        return theme.colors.accent;
      case 'completed':
        return theme.colors.text.disabled;
      case 'comingSoon':
        return theme.colors.warning;
      default:
        return theme.colors.border;
    }
  }};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-4px);
  }
`;

const GameIcon = styled.img`
  width: 48px;
  height: 48px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.small};
`;

const TournamentTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const TournamentInfo = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const StatusBadge = styled.span<{ status: 'upcoming' | 'live' | 'completed' | 'comingSoon' }>`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  font-weight: 500;
  background: ${({ theme, status }) => {
    switch (status) {
      case 'live':
        return `${theme.colors.success}22`;
      case 'upcoming':
        return `${theme.colors.accent}22`;
      case 'completed':
        return `${theme.colors.text.disabled}22`;
      case 'comingSoon':
        return `${theme.colors.warning}22`;
      default:
        return theme.colors.surface;
    }
  }};
  color: ${({ theme, status }) => {
    switch (status) {
      case 'live':
        return theme.colors.success;
      case 'upcoming':
        return theme.colors.accent;
      case 'completed':
        return theme.colors.text.disabled;
      case 'comingSoon':
        return theme.colors.warning;
      default:
        return theme.colors.text.primary;
    }
  }};
`;

const PrizePool = styled.div`
  font-size: ${({ theme }) => theme.typography.h6.fontSize};
  color: ${({ theme }) => theme.colors.accent};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

interface Tournament {
  id: string;
  title: string;
  game: 'CS2' | 'CriticalOps' | 'PUBG' | 'ValorantMobile';
  status: 'upcoming' | 'live' | 'completed' | 'comingSoon';
  date: string;
  prizePool: string;
  participants: number;
  maxParticipants: number;
  skillLevel: string;
}

const games = [
  { id: 'all', name: 'All Games' },
  { id: 'CS2', name: 'CS2' },
  { id: 'CriticalOps', name: 'Critical Ops' },
  { id: 'PUBG', name: 'PUBG' },
  { id: 'ValorantMobile', name: 'Valorant Mobile' }
];

const AllTournaments: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState('all');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const { joinTournament } = useTournamentAccess();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res: any = await api.get('/api/tournaments');
        const items: any[] = (res && (res.data || res.tournaments)) || [];

        const mapped: Tournament[] = items.map((t: any) => {
          const rawGame = (t.game || '').toString();
          const game: Tournament['game'] =
            rawGame === 'CS2' ? 'CS2'
            : rawGame === 'Critical Ops' || rawGame === 'CriticalOps' ? 'CriticalOps'
            : rawGame === 'PUBG Mobile' || rawGame === 'PUBG' ? 'PUBG'
            : rawGame === 'ValorantMobile' || rawGame === 'Valorant Mobile' ? 'ValorantMobile'
            : 'CS2';

          const rawStatus = (t.status || '').toString();
          const status: Tournament['status'] =
            rawStatus === 'completed' ? 'completed'
            : rawStatus === 'in_progress' || rawStatus === 'ongoing' || rawStatus === 'live'
              ? 'live'
              : rawStatus ? 'upcoming' : 'comingSoon';

          const startDate = t.startDate || t.date || '';
          const dateText = startDate ? new Date(startDate).toLocaleDateString() : 'TBD';

          const prize = Number(t.prizePool || 0);

          return {
            id: (t.id || t._id || '').toString(),
            title: t.title || t.name || '',
            game,
            status,
            date: dateText,
            prizePool: prize ? `$${prize.toLocaleString()}` : '—',
            participants: Number(t.participants ?? t.currentParticipants ?? 0),
            maxParticipants: Number(t.maxParticipants ?? t.maxTeams ?? 0),
            skillLevel: t.skillLevel || 'All Levels'
          };
        });

        if (!mounted) return;
        setTournaments(mapped);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load tournaments');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredTournaments = useMemo(
    () => tournaments.filter((t) => selectedGame === 'all' || t.game === selectedGame),
    [tournaments, selectedGame]
  );

  const handleGameChange = (gameId: string) => {
    setSelectedGame(gameId);
  };

  const handleJoinTournament = async (tournament: Tournament) => {
    try {
      await joinTournament(tournament.id);
      // Refresh tournaments to update participant count
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to join tournament:', error);
      // Error is handled by the hook, which may redirect to billing
    }
  };

  const handleTournamentClick = (tournament: Tournament) => {
    if (tournament.status === 'comingSoon') {
      navigationService.goToGameHub(tournament.game);
    } else if (tournament.status === 'upcoming') {
      // For upcoming tournaments, try to join directly
      handleJoinTournament(tournament);
    } else {
      navigationService.goToTournamentDetails(tournament.id, tournament.title);
    }
  };

  return (
    <Container>
      <Header>
        <Title>Tournaments</Title>
        <Subtitle>
          Compete in tournaments across multiple games, win prizes, and climb the
          rankings. From amateur to professional levels, find the perfect
          competition for you.
        </Subtitle>
      </Header>

      <GameTabs>
        {games.map(game => (
          <GameTab
            key={game.id}
            active={selectedGame === game.id}
            onClick={() => handleGameChange(game.id)}
            variant={selectedGame === game.id ? 'primary' : 'outline'}
          >
            {game.name}
          </GameTab>
        ))}
      </GameTabs>

      {error && (
        <div style={{ color: '#ff4757', marginBottom: '16px' }}>{error}</div>
      )}

      {loading && !error && (
        <div style={{ color: '#cccccc', marginBottom: '16px' }}>Loading...</div>
      )}

      <Grid>
        {!loading && !error && filteredTournaments.map(tournament => (
          <TournamentCard
            key={tournament.id}
            status={tournament.status}
            onClick={() => handleTournamentClick(tournament)}
          >
            <GameIcon src={`/images/games/${tournament.game.toLowerCase()}.png`} alt={tournament.game} />
            <TournamentTitle>{tournament.title}</TournamentTitle>
            <StatusBadge status={tournament.status}>
              {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
            </StatusBadge>
            <TournamentInfo>
              <InfoRow>
                <span>Date:</span>
                <span>{tournament.date}</span>
              </InfoRow>
              <InfoRow>
                <span>Participants:</span>
                <span>{tournament.participants}/{tournament.maxParticipants}</span>
              </InfoRow>
              <InfoRow>
                <span>Skill Level:</span>
                <span>{tournament.skillLevel}</span>
              </InfoRow>
            </TournamentInfo>
            <PrizePool>{tournament.prizePool}</PrizePool>
            <Button
              variant={tournament.status === 'comingSoon' ? 'outline' : 'primary'}
              fullWidth
            >
              {tournament.status === 'comingSoon'
                ? 'Learn More'
                : tournament.status === 'completed'
                ? 'View Results'
                : 'Join Tournament'}
            </Button>
          </TournamentCard>
        ))}
      </Grid>
    </Container>
  );
};

export default AllTournaments;