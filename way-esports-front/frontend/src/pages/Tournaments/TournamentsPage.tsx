import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTournamentAccess } from '../../hooks/useTournamentAccess';
import TournamentRegistrationGuard from '../../components/Tournament/TournamentRegistrationGuard';
import navigationService from '../../services/NavigationService';
import { tournamentService } from '../../services/tournamentService';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { useLanguage } from '../../contexts/LanguageContext';

const Container = styled.div`
  padding: 1rem;
  width: 100%;
  max-width: 100%;
  margin: 0;
  color: #ffffff;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 1.5rem;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    padding: 2.5rem;
  }
`;

const Header = styled(Card).attrs({ variant: 'elevated' })`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    flex-direction: column;
    align-items: stretch;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 2rem;
    margin-bottom: 2rem;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    padding: 2.5rem;
    margin-bottom: 2.5rem;
    flex-direction: row;
    align-items: center;
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: clamp(2rem, 8vw, 3.5rem);
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 15px;
  line-height: 1.1;
`;

const Subtitle = styled.p`
  color: #cccccc;
  font-size: 1.2rem;
`;

const RulesButton = styled(Button).attrs({ variant: 'secondary', size: 'small' })`
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  justify-content: center;
`;

const FilterSection = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
  flex-wrap: wrap;
`;

const FilterTab = styled(Button).attrs<{ $active: boolean }>((props) => ({
  variant: props.$active ? 'brand' : 'outline',
  size: 'small'
}))<{ $active: boolean }>`
  padding: 0.75rem 1.25rem;
  min-height: 44px;
  white-space: nowrap;
`;

const TournamentsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
  }
`;

const TournamentCard = styled(Card).attrs({ clickable: true })<{ $status: string }>`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 25px;
  border: 1px solid ${({ theme, $status }) => {
    switch ($status) {
      case 'live': return theme.colors.success;
      case 'upcoming': return theme.colors.accent;
      case 'completed': return theme.colors.text.disabled;
      default: return theme.colors.border.light;
    }
  }};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
`;

const GameIcon = styled.img`
  width: 48px;
  height: 48px;
  margin-bottom: 15px;
  border-radius: 8px;
`;

const TournamentTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 10px;
  font-size: 1.3rem;
`;

const StatusBadge = styled.div<{ $status: string }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 15px;
  background: ${({ $status }) =>
    $status === 'live' ? 'rgba(76, 175, 80, 0.2)' :
      $status === 'upcoming' ? 'rgba(33, 150, 243, 0.2)' :
        'rgba(255, 107, 0, 0.2)'};
  color: ${({ $status }) =>
    $status === 'live' ? '#4CAF50' :
      $status === 'upcoming' ? '#2196F3' :
        '#ff6b00'};
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
`;

const InfoLabel = styled.span`
  color: #cccccc;
`;

const InfoValue = styled.span`
  color: #ffffff;
  font-weight: 500;
`;

const PrizePool = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ff6b00;
  text-align: center;
  margin: 15px 0;
`;

const ActionButton = styled(Button).attrs<{ $variant?: 'brand' | 'outline' }>((props) => ({
  variant: props.$variant === 'outline' ? 'outline' : 'brand',
  size: 'small'
})) <{ $variant?: 'brand' | 'outline' }>`
  width: 100%;
  padding: 0.75rem;
  min-height: 44px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #999;
`;

interface Tournament {
  id: string;
  title: string;
  game: string;
  status: 'live' | 'upcoming' | 'completed' | 'comingSoon';
  prizePool: string;
  participants: number;
  maxParticipants: number;
  date: string;
  format: string;
}

const TournamentsPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeGame] = useState('all');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [showGuard, setShowGuard] = useState(false);
  const [pendingTournamentId, setPendingTournamentId] = useState<string | null>(null);

  const { joinTournament } = useTournamentAccess();
  const queryClient = useQueryClient();

  const { data: tournamentsRaw = [], isLoading: loading, error } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const res: any = await tournamentService.list();
      return (res && (res.data || res.tournaments)) || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const errorMessage = error
    ? (error instanceof Error ? error.message : (error as any)?.message || 'Failed to load tournaments')
    : null;

  const tournaments = useMemo(() => {
    const items: any[] = Array.isArray(tournamentsRaw) ? tournamentsRaw : [];
    return items.map((t: any) => {
      const rawStatus = (t.status || '').toString();
      let status: Tournament['status'] = 'upcoming';
      if (rawStatus === 'completed') status = 'completed';
      else if (['in_progress', 'ongoing', 'live'].includes(rawStatus)) status = 'live';
      else if (!rawStatus) status = 'comingSoon';

      const prize = Number(t.prizePool || 0);

      return {
        id: (t.id || t._id || '').toString(),
        title: t.title || t.name || '',
        game: t.game || 'Unknown',
        status,
        prizePool: prize ? `$${prize.toLocaleString()}` : 'TBD',
        participants: Number(t.participants ?? t.currentParticipants ?? 0),
        maxParticipants: Number(t.maxParticipants ?? t.maxTeams ?? 0),
        date: t.startDate ? new Date(t.startDate).toLocaleDateString() : 'TBD',
        format: t.format || 'Standard'
      } as Tournament;
    });
  }, [tournamentsRaw]);

  const filteredTournaments = useMemo(() => {
    return tournaments.filter(t => {
      const matchStatus = activeFilter === 'all' || t.status === activeFilter;
      const matchGame = activeGame === 'all' || t.game.toLowerCase().includes(activeGame.toLowerCase());
      return matchStatus && matchGame;
    });
  }, [tournaments, activeFilter, activeGame]);

  const getStatusLabel = (status: Tournament['status']) => {
    if (status === 'live') return t('live');
    if (status === 'completed') return t('completed');
    if (status === 'comingSoon') return t('comingSoon');
    return t('upcoming');
  };

  const handleTournamentClick = async (t: Tournament) => {
    if (t.status === 'comingSoon') {
      navigationService.goToGameHub(t.game);
      return;
    }

    if (t.status === 'upcoming') {
      // Trigger guard/logic for joining
      setPendingTournamentId(t.id);
      setShowGuard(true);
      return;
    }

    navigationService.goToTournamentDetails(t.id, t.title);
  };

  const onRegistrationConfirm = async () => {
    if (!pendingTournamentId) return;
    try {
      await joinTournament(pendingTournamentId);
      await queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    } catch (e) {
      console.error('Join failed', e);
    } finally {
      setShowGuard(false);
      setPendingTournamentId(null);
    }
  };

  return (
    <Container>
      <Header>
        <HeaderContent>
          <Title>{t('tournamentsTitle')}</Title>
          <Subtitle>{t('tournamentsSubtitle')}</Subtitle>
        </HeaderContent>
        <RulesButton onClick={() => setIsRulesModalOpen(true)}>
          {'\u{1F4CB}'} {t('rules')}
        </RulesButton>
      </Header>

      <FilterSection>
        <FilterTabs>
          {['all', 'upcoming', 'live', 'completed'].map(f => (
            <FilterTab key={f} $active={activeFilter === f} onClick={() => setActiveFilter(f)}>
              {f === 'all' ? t('allFilter') : f === 'upcoming' ? t('upcoming') : f === 'completed' ? t('completed') : t('live')}
            </FilterTab>
          ))}
        </FilterTabs>
      </FilterSection>

      {loading ? (
        <EmptyState>{t('loading')}</EmptyState>
      ) : errorMessage ? (
        <EmptyState>{errorMessage}</EmptyState>
      ) : (
        <TournamentsGrid>
          {filteredTournaments.map(t => (
            <TournamentCard key={t.id} $status={t.status} onClick={() => handleTournamentClick(t)}>
              <GameIcon src={`/images/games/${t.game.toLowerCase().replace(/\s/g, '')}.png`} alt={t.game} />
              <StatusBadge $status={t.status}>{getStatusLabel(t.status)}</StatusBadge>
              <TournamentTitle>{t.title}</TournamentTitle>

              <PrizePool>{t.prizePool}</PrizePool>

              <InfoRow>
                <InfoLabel>{t('participantsLabel')}</InfoLabel>
                <InfoValue>{t.participants}/{t.maxParticipants}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>{t('dateLabel')}</InfoLabel>
                <InfoValue>{t.date}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>{t('formatLabel')}</InfoLabel>
                <InfoValue>{t.format}</InfoValue>
              </InfoRow>

              <ActionButton $variant={t.status === 'upcoming' ? 'brand' : 'outline'} style={{ marginTop: '15px' }}>
                {t.status === 'upcoming' ? t('joinNow') : t.status === 'live' ? t('viewDetails') : t('results')}
              </ActionButton>
            </TournamentCard>
          ))}
        </TournamentsGrid>
      )}

      {filteredTournaments.length === 0 && !loading && <EmptyState>{t('noTournamentsFound')}</EmptyState>}

      {showGuard && (
        <TournamentRegistrationGuard onAccessDenied={() => setShowGuard(false)}>
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '16px', maxWidth: '400px', textAlign: 'center' }}>
              <h2>{t('confirmEntry')}</h2>
              <p>{t('confirmEntryText')}</p>
              <ActionButton onClick={onRegistrationConfirm}>{t('confirmJoin')}</ActionButton>
              <ActionButton $variant="outline" onClick={() => setShowGuard(false)} style={{ marginTop: '10px' }}>{t('cancel')}</ActionButton>
            </div>
          </div>
        </TournamentRegistrationGuard>
      )}

      {isRulesModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setIsRulesModalOpen(false)}>
          <div style={{
            background: '#1a1a1a', padding: '30px', borderRadius: '16px',
            maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#ff6b00' }}>{t('rules')}</h2>
            <div style={{ color: '#ccc', marginTop: '20px' }}>
              <h3>{t('rulesGeneral')}</h3>
              <ul>
                <li>{t('rulesItem1')}</li>
                <li>{t('rulesItem2')}</li>
                <li>{t('rulesItem3')}</li>
              </ul>
            </div>
            <ActionButton onClick={() => setIsRulesModalOpen(false)}>{t('close')}</ActionButton>
          </div>
        </div>
      )}
    </Container>
  );
};

export default TournamentsPage;
