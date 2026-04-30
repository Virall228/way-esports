import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTournamentAccess } from '../../hooks/useTournamentAccess';
import TournamentRegistrationGuard from '../../components/Tournament/TournamentRegistrationGuard';
import navigationService from '../../services/NavigationService';
import { tournamentService } from '../../services/tournamentService';
import { teamsService } from '../../services/teamsService';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import {
  FilterGroup,
  FilterLabel,
  FilterRail,
  ModalActionRow,
  ModalCopy,
  ModalOverlay,
  ModalPanel,
  ModalTitle,
  NoticeBanner,
  PageEmptyState,
  PageFilterSection,
  PageHero,
  PageHeroContent,
  PageHeroLayout,
  PageShell,
  PageSubtitle,
  PageTitle
} from '../../components/UI/PageLayout';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { resolveMediaUrl } from '../../utils/media';
import { Seo } from '../../components/SEO';

const RulesButton = styled(Button).attrs({ variant: 'secondary', size: 'small' })`
  padding: 0.75rem 1.15rem;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  justify-content: center;
`;

const HeaderKicker = styled.div`
  margin-bottom: 0.75rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-family: ${({ theme }) => theme.fonts.accent};
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const FilterTab = styled(Button).attrs<{ $active: boolean }>((props) => ({
  variant: props.$active ? 'brand' : 'outline',
  size: 'small'
}))<{ $active: boolean }>`
  padding: 0.72rem 1.1rem;
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
  display: grid;
  gap: 0.95rem;
  background: ${({ theme }) =>
    theme.isLight
      ? 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(247, 239, 229, 0.9))'
      : 'linear-gradient(180deg, rgba(18, 22, 27, 0.9), rgba(8, 10, 13, 0.96))'};
  border-radius: 24px;
  padding: 22px;
  border: 1px solid ${({ theme, $status }) => {
    switch ($status) {
      case 'live': return theme.colors.success;
      case 'upcoming': return theme.colors.border.accent;
      case 'completed': return theme.colors.text.disabled;
      default: return theme.colors.border.light;
    }
  }};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: ${({ $status }) =>
      $status === 'live'
        ? 'linear-gradient(180deg, rgba(52, 211, 153, 0.95), rgba(52, 211, 153, 0.1))'
        : $status === 'upcoming'
          ? 'linear-gradient(180deg, rgba(245, 154, 74, 0.95), rgba(245, 154, 74, 0.1))'
          : 'linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0.04))'};
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-4px);
      box-shadow: ${({ theme }) => theme.shadows.lg};
    }
  }
`;

const TournamentCover = styled.div<{ $image?: string }>`
  position: relative;
  height: 168px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background:
    ${({ $image, theme }) =>
      $image
        ? `linear-gradient(180deg, rgba(0,0,0,${theme.isLight ? '0.08' : '0.18'}), rgba(0,0,0,${theme.isLight ? '0.26' : '0.48'})), url(${$image}) center/cover`
        : theme.isLight
          ? 'linear-gradient(135deg, rgba(255, 182, 116, 0.42), rgba(255,255,255,0.86))'
          : 'linear-gradient(135deg, rgba(245, 154, 74, 0.24), rgba(255,255,255,0.03))'};

  &::after {
    content: '';
    position: absolute;
    inset: auto 0 0 0;
    height: 42%;
    background: linear-gradient(180deg, transparent, rgba(7, 9, 12, 0.72));
  }
`;

const TournamentKicker = styled.div`
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-family: ${({ theme }) => theme.fonts.accent};
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const TournamentTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  font-size: 1.28rem;
  line-height: 1.22;
`;

const StatusBadge = styled.div<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 15px;
  background: ${({ theme, $status }) =>
    $status === 'live'
      ? 'rgba(52, 211, 153, 0.08)'
      : $status === 'upcoming'
        ? (theme.isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255, 255, 255, 0.04)')
        : 'rgba(255, 255, 255, 0.04)'};
  color: ${({ theme, $status }) =>
    $status === 'live'
      ? theme.colors.text.primary
      : $status === 'upcoming'
        ? theme.colors.text.primary
        : theme.colors.text.secondary};
  border: 1px solid
    ${({ theme, $status }) =>
      $status === 'live'
        ? 'rgba(52, 211, 153, 0.22)'
        : $status === 'upcoming'
          ? theme.colors.border.strong
          : theme.colors.border.light};
`;

const BadgeRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
`;

const TournamentInfoStack = styled.div`
  display: grid;
  gap: 0.6rem;
`;

const TeamModeBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
`;

const InfoLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const InfoValue = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
`;

const PrizePool = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.accent};
  text-align: left;
  margin: 0;
`;

const ActionButton = styled(Button).attrs<{ $variant?: 'brand' | 'outline' }>((props) => ({
  variant: props.$variant === 'outline' ? 'outline' : 'brand',
  size: 'small'
})) <{ $variant?: 'brand' | 'outline' }>`
  width: 100%;
  padding: 0.75rem;
  min-height: 44px;
  margin-top: 0.3rem;
`;

const FormFieldGrid = styled.div`
  display: grid;
  gap: 0.85rem;
  margin-top: 1rem;
`;

const RulesContent = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  display: grid;
  gap: 1rem;

  h3 {
    margin: 0;
    font-size: 1rem;
  }

  ul {
    padding-left: 1.15rem;
    display: grid;
    gap: 0.5rem;
  }
`;

interface Tournament {
  id: string;
  title: string;
  image?: string;
  game: string;
  cadence?: 'daily' | 'weekly' | 'custom';
  teamMode?: '2v2' | '5v5' | 'custom';
  teamSize?: number;
  type?: 'team' | 'solo';
  status: 'live' | 'upcoming' | 'completed' | 'comingSoon';
  prizePool: string;
  participants: number;
  maxParticipants: number;
  date: string;
  format: string;
}

const TournamentsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeGame, setActiveGame] = useState('all');
  const [activeCadence, setActiveCadence] = useState<'all' | 'daily' | 'weekly'>('all');
  const [activeTeamMode, setActiveTeamMode] = useState<'all' | '2v2' | '5v5'>('all');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [showGuard, setShowGuard] = useState(false);
  const [pendingTournamentId, setPendingTournamentId] = useState<string | null>(null);
  const [joinFeedback, setJoinFeedback] = useState<string | null>(null);
  const [ingameNickname, setIngameNickname] = useState('');
  const [ingameId, setIngameId] = useState('');

  const { joinTournament } = useTournamentAccess();
  const queryClient = useQueryClient();

  const { data: tournamentsRaw = [], isLoading: loading, error } = useQuery({
    queryKey: ['tournaments', activeGame, activeCadence, activeTeamMode],
    queryFn: async () => {
      const res: any = await tournamentService.list({
        game: activeGame,
        cadence: activeCadence,
        teamMode: activeTeamMode
      });
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
        image: resolveMediaUrl(t.image || t.coverImage || ''),
        game: t.game || 'Unknown',
        cadence: t.cadence || 'custom',
        teamMode: t.teamMode || 'custom',
        teamSize: Number(t.teamSize || 0) || undefined,
        type: (t.type || 'team') as 'team' | 'solo',
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
    const normalizeGame = (value: string) => value.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    return tournaments.filter(t => {
      const matchStatus = activeFilter === 'all' || t.status === activeFilter;
      const matchGame = activeGame === 'all' || normalizeGame(t.game) === normalizeGame(activeGame);
      const matchCadence = activeCadence === 'all' || (t.cadence || 'custom') === activeCadence;
      const matchTeamMode = activeTeamMode === 'all' || (t.teamMode || 'custom') === activeTeamMode;
      return matchStatus && matchGame && matchCadence && matchTeamMode;
    });
  }, [tournaments, activeFilter, activeGame, activeCadence, activeTeamMode]);

  const getGameIcon = (game: string) => {
    const normalized = (game || '').toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
    const map: Record<string, string> = {
      criticalops: '/images/main.png',
      pubgmobile: '/images/main.png',
      cs2: '/images/main.png',
      valorantmobile: '/images/main.png',
      dota2: '/images/main.png',
      standoff2: '/images/main.png'
    };
    return map[normalized] || '/images/main.png';
  };

  const getTournamentCardImage = (tournament: Tournament) => {
    return tournament.image || getGameIcon(tournament.game);
  };

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
    const normalizedNick = ingameNickname.trim();
    const normalizedId = ingameId.trim();
    if (!normalizedNick || !normalizedId) {
      setJoinFeedback('Enter in-game nickname and in-game ID before registration.');
      return;
    }
    try {
      const selectedTournament = tournaments.find((item) => item.id === pendingTournamentId);
      let teamId: string | undefined;

      if (selectedTournament?.type === 'team') {
        const teamsResponse: any = await teamsService.list();
        const teamItems: any[] = Array.isArray(teamsResponse?.data)
          ? teamsResponse.data
          : (Array.isArray(teamsResponse) ? teamsResponse : []);
        const currentUserId = user?.id || '';

        const ownedOrMemberTeam = teamItems.find((team: any) => {
          const teamTournamentId = String(team?.tournamentId || '');
          if (!teamTournamentId || teamTournamentId !== pendingTournamentId) return false;

          const captainId = String(team?.captain?.id || team?.captain?._id || team?.captain || '');
          const memberIds = Array.isArray(team?.members)
            ? team.members.map((member: any) => String(member?.id || member?._id || member))
            : [];

          return !!currentUserId && (captainId === currentUserId || memberIds.includes(currentUserId));
        });

        teamId = ownedOrMemberTeam?.id || ownedOrMemberTeam?._id;
        if (!teamId) {
          setJoinFeedback('Create or join a team for this tournament first, then request tournament entry.');
          setShowGuard(false);
          setPendingTournamentId(null);
          return;
        }
      }

      const result: any = await joinTournament(
        pendingTournamentId,
        teamId,
        normalizedNick,
        normalizedId
      );
      if (result?.pendingApproval) {
        setJoinFeedback('Team request sent. Waiting for admin approval.');
      } else {
        setJoinFeedback('Tournament registration completed.');
      }
      await queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    } catch (e) {
      console.error('Join failed', e);
      setJoinFeedback((e as any)?.message || 'Failed to register for tournament');
    } finally {
      setShowGuard(false);
      setPendingTournamentId(null);
      setIngameNickname('');
      setIngameId('');
    }
  };

  return (
    <PageShell>
      <Seo
        title="Esports Tournaments | WAY Esports"
        description="Browse active, upcoming and completed esports tournaments on WAY Esports across mobile and PC titles."
        canonicalPath="/tournaments"
        type="website"
        keywords={['esports tournaments', 'mobile esports', 'WAY Esports tournaments', 'competitive gaming']}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'WAY Esports Tournaments',
          description: 'Browse upcoming, live and completed esports tournaments on WAY Esports.'
        }}
      />
      <PageHero>
        <PageHeroLayout>
          <PageHeroContent>
            <HeaderKicker>Competitive calendar</HeaderKicker>
            <PageTitle>{t('tournamentsTitle')}</PageTitle>
            <PageSubtitle>{t('tournamentsSubtitle')}</PageSubtitle>
          </PageHeroContent>
          <RulesButton onClick={() => setIsRulesModalOpen(true)}>
            {'\u{1F4CB}'} {t('rules')}
          </RulesButton>
        </PageHeroLayout>
      </PageHero>

      <PageFilterSection>
        <FilterRail>
          <FilterGroup>
            <FilterLabel>Status</FilterLabel>
          {['all', 'upcoming', 'live', 'completed'].map(f => (
            <FilterTab key={f} $active={activeFilter === f} onClick={() => setActiveFilter(f)}>
              {f === 'all' ? t('allFilter') : f === 'upcoming' ? t('upcoming') : f === 'completed' ? t('completed') : t('live')}
            </FilterTab>
          ))}
          </FilterGroup>
        </FilterRail>
        <FilterRail>
          <FilterGroup>
            <FilterLabel>Games</FilterLabel>
          {[
            { key: 'all', label: 'All Games' },
            { key: 'Critical Ops', label: 'Critical Ops' },
            { key: 'CS2', label: 'CS2' },
            { key: 'PUBG Mobile', label: 'PUBG Mobile' },
            { key: 'Valorant Mobile', label: 'Valorant Mobile' },
            { key: 'Dota 2', label: 'Dota 2' },
            { key: 'Standoff 2', label: 'Standoff 2' }
          ].map((g) => (
            <FilterTab key={g.key} $active={activeGame === g.key} onClick={() => setActiveGame(g.key)}>
              {g.label}
            </FilterTab>
          ))}
          </FilterGroup>
        </FilterRail>
        <FilterRail>
          <FilterGroup>
            <FilterLabel>Cadence</FilterLabel>
          {([
            { key: 'all', label: 'All Cycles' },
            { key: 'daily', label: 'Daily' },
            { key: 'weekly', label: 'Weekly' }
          ] as Array<{ key: 'all' | 'daily' | 'weekly'; label: string }>).map((c) => (
            <FilterTab key={c.key} $active={activeCadence === c.key} onClick={() => setActiveCadence(c.key)}>
              {c.label}
            </FilterTab>
          ))}
          </FilterGroup>
          <FilterGroup>
            <FilterLabel>Mode</FilterLabel>
          {([
            { key: 'all', label: 'All Modes' },
            { key: '2v2', label: '2v2' },
            { key: '5v5', label: '5v5' }
          ] as Array<{ key: 'all' | '2v2' | '5v5'; label: string }>).map((m) => (
            <FilterTab key={m.key} $active={activeTeamMode === m.key} onClick={() => setActiveTeamMode(m.key)}>
              {m.label}
            </FilterTab>
          ))}
          </FilterGroup>
        </FilterRail>
      </PageFilterSection>

      {joinFeedback && (
        <NoticeBanner $tone="warning">
          {joinFeedback}
        </NoticeBanner>
      )}

      {loading ? (
        <PageEmptyState>{t('loading')}</PageEmptyState>
      ) : errorMessage ? (
        <PageEmptyState>{errorMessage}</PageEmptyState>
      ) : (
        <TournamentsGrid>
          {filteredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} $status={tournament.status} onClick={() => handleTournamentClick(tournament)}>
              <TournamentCover $image={getTournamentCardImage(tournament)} />
              <BadgeRow>
                <StatusBadge $status={tournament.status}>{getStatusLabel(tournament.status)}</StatusBadge>
                {tournament.teamMode && tournament.teamMode !== 'custom' && (
                  <TeamModeBadge>{tournament.teamMode.toUpperCase()}</TeamModeBadge>
                )}
              </BadgeRow>
              <TournamentKicker>{tournament.game}</TournamentKicker>
              <TournamentTitle>{tournament.title}</TournamentTitle>

              <PrizePool>{tournament.prizePool}</PrizePool>

              <TournamentInfoStack>
                <InfoRow>
                  <InfoLabel>{t('participantsLabel')}</InfoLabel>
                  <InfoValue>{tournament.participants}/{tournament.maxParticipants}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>{t('dateLabel')}</InfoLabel>
                  <InfoValue>{tournament.date}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>{t('formatLabel')}</InfoLabel>
                  <InfoValue>{tournament.format}</InfoValue>
                </InfoRow>
              </TournamentInfoStack>

              <ActionButton $variant={tournament.status === 'upcoming' ? 'brand' : 'outline'}>
                {tournament.status === 'upcoming' ? t('joinNow') : tournament.status === 'live' ? t('viewDetails') : t('results')}
              </ActionButton>
            </TournamentCard>
          ))}
        </TournamentsGrid>
      )}

      {filteredTournaments.length === 0 && !loading && <PageEmptyState>{t('noTournamentsFound')}</PageEmptyState>}

      {showGuard && (
        <TournamentRegistrationGuard onAccessDenied={() => setShowGuard(false)}>
          <ModalOverlay>
            <ModalPanel style={{ maxWidth: '420px' }}>
              <ModalTitle>{t('confirmEntry')}</ModalTitle>
              <ModalCopy>{t('confirmEntryText')}</ModalCopy>
              <FormFieldGrid>
                <Input
                  fullWidth
                  placeholder="In-game nickname"
                  value={ingameNickname}
                  onChange={(e) => setIngameNickname(e.target.value)}
                />
                <Input
                  fullWidth
                  placeholder="In-game ID"
                  value={ingameId}
                  onChange={(e) => setIngameId(e.target.value)}
                />
              </FormFieldGrid>
              <ModalActionRow>
                <ActionButton onClick={onRegistrationConfirm}>{t('confirmJoin')}</ActionButton>
                <ActionButton $variant="outline" onClick={() => setShowGuard(false)}>{t('cancel')}</ActionButton>
              </ModalActionRow>
            </ModalPanel>
          </ModalOverlay>
        </TournamentRegistrationGuard>
      )}

      {isRulesModalOpen && (
        <ModalOverlay onClick={() => setIsRulesModalOpen(false)}>
          <ModalPanel
            style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <ModalTitle>{t('rules')}</ModalTitle>
            <RulesContent>
              <h3>{t('rulesGeneral')}</h3>
              <ul>
                <li>{t('rulesItem1')}</li>
                <li>{t('rulesItem2')}</li>
                <li>{t('rulesItem3')}</li>
              </ul>
            </RulesContent>
            <ModalActionRow>
              <ActionButton onClick={() => setIsRulesModalOpen(false)}>{t('close')}</ActionButton>
            </ModalActionRow>
          </ModalPanel>
        </ModalOverlay>
      )}
    </PageShell>
  );
};

export default TournamentsPage;
