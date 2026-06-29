import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { Seo } from '../../components/SEO';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  CareerHubAction,
  CareerHubDashboard,
  CareerHubMatch,
  CareerHubMission,
  CareerHubTeam,
  CareerHubTournamentRecommendation,
  careerHubService
} from '../../services/careerHubService';

const Page = styled.div`
  display: grid;
  gap: 1.25rem;
`;

const Hero = styled(Card).attrs({ variant: 'elevated' })`
  padding: clamp(1.4rem, 3.2vw, 2rem);
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.08), transparent 34%),
    radial-gradient(circle at bottom right, rgba(245, 158, 11, 0.1), transparent 26%),
    linear-gradient(145deg, rgba(18, 21, 27, 0.98), rgba(8, 10, 13, 1));
`;

const HeroLayout = styled.div`
  display: grid;
  gap: 1rem;

  @media (min-width: 980px) {
    grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
    align-items: stretch;
  }
`;

const HeroBody = styled.div`
  display: grid;
  gap: 1rem;
  align-content: start;
`;

const Eyebrow = styled.span`
  display: inline-flex;
  width: fit-content;
  min-height: 34px;
  align-items: center;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: ${({ theme }) => theme.fonts.accent};
  font-size: 0.72rem;
`;

const HeroTitle = styled.h1`
  margin: 0;
  font-size: clamp(2.2rem, 5vw, 4rem);
  line-height: 0.92;
  font-family: ${({ theme }) => theme.fonts.brand || theme.fonts.title};
  letter-spacing: 0.04em;
`;

const HeroSubtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.7;
  max-width: 720px;
`;

const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;

  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: 1fr;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
`;

const MetricCard = styled(Card).attrs({ variant: 'outlined' })`
  padding: 1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
`;

const MetricValue = styled.div`
  font-size: 1.6rem;
  font-weight: 800;
`;

const MetricLabel = styled.div`
  margin-top: 0.3rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.82rem;
  line-height: 1.45;
`;

const Spotlight = styled(Card).attrs({ variant: 'outlined' })`
  padding: 1.1rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.05);
  display: grid;
  gap: 0.85rem;
  align-content: start;
`;

const SpotlightTone = styled.span<{ $tone: string }>`
  display: inline-flex;
  width: fit-content;
  min-height: 30px;
  align-items: center;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: ${({ $tone }) =>
    $tone === 'positive'
      ? 'rgba(52, 211, 153, 0.12)'
      : $tone === 'urgent'
        ? 'rgba(245, 158, 11, 0.14)'
        : 'rgba(255, 255, 255, 0.08)'};
  border: 1px solid ${({ $tone }) =>
    $tone === 'positive'
      ? 'rgba(52, 211, 153, 0.22)'
      : $tone === 'urgent'
        ? 'rgba(245, 158, 11, 0.28)'
        : 'rgba(255, 255, 255, 0.12)'};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.76rem;
  font-weight: 700;
`;

const SpotlightTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
`;

const SpotlightCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.65;
`;

const Section = styled.section`
  display: grid;
  gap: 0.9rem;
`;

const SectionHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
`;

const SectionCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ActionGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
`;

const ActionCard = styled(Card).attrs({ variant: 'outlined' })`
  padding: 1rem;
  border-radius: 20px;
  display: grid;
  gap: 0.85rem;
`;

const Tag = styled.span`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  min-height: 28px;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const ActionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const ActionDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
`;

const MissionGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
`;

const MissionCard = styled(Card).attrs({ variant: 'outlined' })`
  padding: 1rem;
  border-radius: 22px;
  display: grid;
  gap: 0.8rem;
`;

const MissionTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: start;
`;

const MissionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const MissionStatus = styled.span<{ $done: boolean; $claimed: boolean }>`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  min-height: 28px;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ $done, $claimed }) =>
    $claimed ? 'rgba(96, 165, 250, 0.16)' : $done ? 'rgba(52, 211, 153, 0.14)' : 'rgba(255, 255, 255, 0.06)'};
  border: 1px solid ${({ $done, $claimed }) =>
    $claimed ? 'rgba(96, 165, 250, 0.28)' : $done ? 'rgba(52, 211, 153, 0.24)' : 'rgba(255, 255, 255, 0.1)'};
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
`;

const ProgressFill = styled.div<{ $value: number }>`
  width: ${({ $value }) => `${$value}%`};
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #f59e0b, #f97316);
`;

const MetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.82rem;
`;

const TwoColumn = styled.div`
  display: grid;
  gap: 1rem;

  @media (min-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Panel = styled(Card).attrs({ variant: 'outlined' })`
  padding: 1rem;
  border-radius: 22px;
  display: grid;
  gap: 0.85rem;
`;

const List = styled.div`
  display: grid;
  gap: 0.8rem;
`;

const ListRow = styled.div`
  display: grid;
  gap: 0.75rem;
  padding: 0.9rem 0.95rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);

  @media (min-width: 680px) {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }
`;

const ItemTitle = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 700;
  line-height: 1.4;
`;

const ItemMeta = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.84rem;
  line-height: 1.55;
`;

const EmptyState = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.65;
`;

const ReadinessBand = styled.div`
  display: grid;
  gap: 0.35rem;
`;

const ReadinessLabel = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.82rem;
`;

const formatDate = (value?: string) => {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatPrize = (value: number) => `$${Number(value || 0).toLocaleString()}`;

const CareerHubPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const { fetchProfile } = useAuth();

  const { data, isLoading, error } = useQuery<CareerHubDashboard>({
    queryKey: ['career-hub'],
    queryFn: () => careerHubService.getDashboard(),
    staleTime: 20_000
  });

  const refreshMutation = useMutation({
    mutationFn: () => careerHubService.refresh(),
    onSuccess: (nextDashboard) => {
      queryClient.setQueryData(['career-hub'], nextDashboard);
      addNotification({
        type: 'success',
        title: 'Career Hub refreshed',
        message: 'The latest missions, recommendations and squad state are loaded.'
      });
    }
  });

  const claimMutation = useMutation({
    mutationFn: (missionId: string) => careerHubService.claimMission(missionId),
    onSuccess: async (nextDashboard, missionId) => {
      queryClient.setQueryData(['career-hub'], nextDashboard);
      await fetchProfile();
      const mission = nextDashboard.weeklyMissions.find((item) => item.id === missionId);
      addNotification({
        type: 'success',
        title: 'Reward claimed',
        message: mission ? `${mission.title} reward added to your account.` : 'Mission reward added to your account.'
      });
    }
  });

  const claimAllMutation = useMutation({
    mutationFn: () => careerHubService.claimAllMissions(),
    onSuccess: async (payload) => {
      queryClient.setQueryData(['career-hub'], payload.dashboard);
      await fetchProfile();
      const claimedCount = Array.isArray(payload?.claimedMissionIds) ? payload.claimedMissionIds.length : 0;
      addNotification({
        type: 'success',
        title: 'Rewards claimed',
        message: claimedCount > 0
          ? `${claimedCount} mission reward${claimedCount > 1 ? 's were' : ' was'} added to your account.`
          : 'No new rewards were available to claim.'
      });
    }
  });

  const openRoute = (route: string) => {
    if (!route) return;
    navigate(route);
  };

  if (isLoading) {
    return <Page>Loading Career Hub...</Page>;
  }

  if (error || !data) {
    return <Page>Failed to load Career Hub: {(error as Error)?.message || 'Unknown error'}</Page>;
  }

  const dashboard = data;
  const busyMissionId = claimMutation.isPending ? (claimMutation.variables as string | undefined) : undefined;

  return (
    <Page>
      <Seo
        title="Career Hub | WAY Esports"
        description="Mission Control for your player progression: readiness score, next best actions, weekly missions and tournament opportunities."
        canonicalPath="/career-hub"
      />

      <Hero>
        <HeroLayout>
          <HeroBody>
            <Eyebrow>Mission Control</Eyebrow>
            <HeroTitle>Career Hub</HeroTitle>
            <HeroSubtitle>
              One place to run your player progression: readiness, missions, next steps, squad state and the next tournament window.
            </HeroSubtitle>

            <ReadinessBand>
              <ReadinessLabel>
                <span>{dashboard.overview.readinessLabel}</span>
                <span>{dashboard.overview.readinessScore}/100</span>
              </ReadinessLabel>
              <ProgressTrack>
                <ProgressFill $value={dashboard.overview.progressToNextTier} />
              </ProgressTrack>
              <ReadinessLabel>
                <span>Next tier</span>
                <span>{dashboard.overview.nextTierLabel}</span>
              </ReadinessLabel>
            </ReadinessBand>

            <HeroActions>
              <Button variant="brand" size="large" onClick={() => openRoute(dashboard.spotlight.ctaRoute)}>
                {dashboard.spotlight.ctaLabel}
              </Button>
              <Button
                variant="outline"
                size="large"
                onClick={() => refreshMutation.mutate()}
                isLoading={refreshMutation.isPending}
              >
                Refresh board
              </Button>
            </HeroActions>

            <MetricsGrid>
              <MetricCard>
                <MetricValue>{dashboard.meta.claimableCount}</MetricValue>
                <MetricLabel>Rewards ready to claim this week.</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{dashboard.overview.entriesAvailable}</MetricValue>
                <MetricLabel>Available tournament entries across free and bonus slots.</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{dashboard.overview.activeTournaments}</MetricValue>
                <MetricLabel>Active tournament flows already tied to your account.</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{dashboard.overview.walletBalance}</MetricValue>
                <MetricLabel>Wallet credits currently visible on your account.</MetricLabel>
              </MetricCard>
            </MetricsGrid>
          </HeroBody>

          <Spotlight>
            <SpotlightTone $tone={dashboard.spotlight.tone}>{dashboard.spotlight.tone}</SpotlightTone>
            <SpotlightTitle>{dashboard.spotlight.title}</SpotlightTitle>
            <SpotlightCopy>{dashboard.spotlight.summary}</SpotlightCopy>
            <MetricCard>
              <MetricValue>{dashboard.overview.currentTeams}</MetricValue>
              <MetricLabel>Current squads connected to your profile.</MetricLabel>
            </MetricCard>
            <MetricCard>
              <MetricValue>{dashboard.overview.unreadNotifications}</MetricValue>
              <MetricLabel>Unread in-app notifications still waiting for you.</MetricLabel>
            </MetricCard>
          </Spotlight>
        </HeroLayout>
      </Hero>

      <Section>
        <SectionHead>
          <div>
            <SectionTitle>Next Best Actions</SectionTitle>
            <SectionCopy>High-impact steps ordered by the fastest lift for your current state.</SectionCopy>
          </div>
        </SectionHead>
        <ActionGrid>
          {dashboard.nextActions.map((action: CareerHubAction) => (
            <ActionCard key={action.id}>
              <Tag>{action.tag}</Tag>
              <ActionTitle>{action.title}</ActionTitle>
              <ActionDescription>{action.description}</ActionDescription>
              <Button variant="primary" onClick={() => openRoute(action.ctaRoute)}>
                {action.ctaLabel}
              </Button>
            </ActionCard>
          ))}
        </ActionGrid>
      </Section>

      <Section id="missions">
        <SectionHead>
          <div>
            <SectionTitle>Weekly Missions</SectionTitle>
            <SectionCopy>Repeatable objectives that keep your profile, team and bracket momentum moving.</SectionCopy>
          </div>
          {dashboard.meta.claimableCount > 1 ? (
            <Button
              variant="brand"
              onClick={() => claimAllMutation.mutate()}
              isLoading={claimAllMutation.isPending}
              disabled={claimMutation.isPending}
            >
              Claim all rewards
            </Button>
          ) : null}
        </SectionHead>
        <MissionGrid>
          {dashboard.weeklyMissions.map((mission: CareerHubMission) => (
            <MissionCard key={mission.id}>
              <MissionTitleRow>
                <MissionTitle>{mission.title}</MissionTitle>
                <MissionStatus $done={mission.completed} $claimed={mission.claimed}>
                  {mission.claimed ? 'CLAIMED' : mission.completed ? 'READY' : 'IN PROGRESS'}
                </MissionStatus>
              </MissionTitleRow>
              <ActionDescription>{mission.description}</ActionDescription>
              <ProgressTrack>
                <ProgressFill $value={mission.progressPercent} />
              </ProgressTrack>
              <MetaRow>
                <span>{mission.current}/{mission.target} complete</span>
                <span>{mission.rewardLabel}</span>
              </MetaRow>
              <HeroActions>
                <Button variant="secondary" onClick={() => openRoute(mission.ctaRoute)}>
                  {mission.ctaLabel}
                </Button>
                <Button
                  variant={mission.claimed ? 'success' : 'brand'}
                  disabled={!mission.completed || mission.claimed || claimMutation.isPending || claimAllMutation.isPending}
                  isLoading={busyMissionId === mission.id}
                  onClick={() => claimMutation.mutate(mission.id)}
                >
                  {mission.claimed ? 'Claimed' : 'Claim reward'}
                </Button>
              </HeroActions>
            </MissionCard>
          ))}
        </MissionGrid>
      </Section>

      <TwoColumn>
        <Panel>
          <SectionHead>
            <div>
              <SectionTitle>Recommended Tournaments</SectionTitle>
              <SectionCopy>Best-fit brackets based on your current game focus and squad state.</SectionCopy>
            </div>
          </SectionHead>
          <List>
            {dashboard.recommendations.tournaments.length === 0 ? (
              <EmptyState>No tournament recommendations yet. Add more game profile data or open registration later.</EmptyState>
            ) : (
              dashboard.recommendations.tournaments.map((item: CareerHubTournamentRecommendation) => (
                <ListRow key={item.id}>
                  <div>
                    <ItemTitle>{item.name}</ItemTitle>
                    <ItemMeta>
                      {item.game} - {item.type} - {formatDate(item.startDate)} - {formatPrize(item.prizePool)} prize pool
                    </ItemMeta>
                    <ItemMeta>{item.fitReason}</ItemMeta>
                  </div>
                  <div style={{ display: 'grid', gap: '0.55rem', justifyItems: 'end' }}>
                    <Tag>{item.fitScore} fit</Tag>
                    <Button size="small" onClick={() => openRoute(item.route)}>
                      View event
                    </Button>
                  </div>
                </ListRow>
              ))
            )}
          </List>
        </Panel>

        <Panel>
          <SectionHead>
            <div>
              <SectionTitle>Upcoming Matches</SectionTitle>
              <SectionCopy>Your immediate competitive schedule and next prep windows.</SectionCopy>
            </div>
          </SectionHead>
          <List>
            {dashboard.schedule.upcomingMatches.length === 0 ? (
              <EmptyState>No scheduled matches yet. Join a bracket or sync a team to fill this schedule.</EmptyState>
            ) : (
              dashboard.schedule.upcomingMatches.map((item: CareerHubMatch) => (
                <ListRow key={item.id}>
                  <div>
                    <ItemTitle>{item.ourTeam.name} vs {item.opponent.name}</ItemTitle>
                    <ItemMeta>{item.tournamentName} - {item.game} - {item.round}</ItemMeta>
                    <ItemMeta>{formatDate(item.startTime)} - {item.status.toUpperCase()}</ItemMeta>
                  </div>
                  <Button size="small" onClick={() => openRoute(item.route)}>
                    Open matches
                  </Button>
                </ListRow>
              ))
            )}
          </List>
        </Panel>
      </TwoColumn>

      <TwoColumn>
        <Panel>
          <SectionHead>
            <div>
              <SectionTitle>Squad Snapshot</SectionTitle>
              <SectionCopy>Connected teams, roster health and whether you are holding captain responsibility.</SectionCopy>
            </div>
          </SectionHead>
          <List>
            {dashboard.roster.teams.length === 0 ? (
              <EmptyState>No teams connected yet. Create or join one to unlock more structured progression.</EmptyState>
            ) : (
              dashboard.roster.teams.map((team: CareerHubTeam) => (
                <ListRow key={team.id}>
                  <div>
                    <ItemTitle>{team.name} {team.tag ? `(${team.tag})` : ''}</ItemTitle>
                    <ItemMeta>
                      {team.game} - {team.memberCount} members - {team.totalMatches} matches - {team.winRate.toFixed(1)}% win rate
                    </ItemMeta>
                    <ItemMeta>
                      {team.isCaptain ? 'You are captain.' : 'You are a team member.'}
                      {team.pendingJoinRequests > 0 ? ` ${team.pendingJoinRequests} join request(s) pending.` : ''}
                    </ItemMeta>
                  </div>
                  <Button size="small" onClick={() => openRoute(`/teams/${team.id}`)}>
                    Open team
                  </Button>
                </ListRow>
              ))
            )}
          </List>
        </Panel>

        <Panel>
          <SectionHead>
            <div>
              <SectionTitle>Scout Positioning</SectionTitle>
              <SectionCopy>Visibility state for scouts, owners and public discovery.</SectionCopy>
            </div>
          </SectionHead>
          <List>
            <ListRow>
              <div>
                <ItemTitle>
                  {dashboard.scout.hasAccess
                    ? dashboard.scout.enabled
                      ? 'Scout Hub is active'
                      : 'Scout Hub is unlocked but inactive'
                    : 'Scout Hub access is locked'}
                </ItemTitle>
                <ItemMeta>
                  {dashboard.scout.hasAccess
                    ? `Visibility: ${dashboard.scout.visibility}. Best role: ${dashboard.scout.bestRole}. Best game: ${dashboard.scout.bestGame || 'Not set yet'}.`
                    : 'Upgrade your billing plan to publish a scout-facing profile and discovery page.'}
                </ItemMeta>
                {dashboard.scout.headline ? <ItemMeta>{dashboard.scout.headline}</ItemMeta> : null}
              </div>
              <Button size="small" onClick={() => openRoute(dashboard.scout.ctaRoute)}>
                {dashboard.scout.hasAccess ? 'Open Scout Hub' : 'Open Billing'}
              </Button>
            </ListRow>
            {dashboard.scout.publicUrl ? (
              <ListRow>
                <div>
                  <ItemTitle>Public scout page</ItemTitle>
                  <ItemMeta>{dashboard.scout.publicUrl}</ItemMeta>
                  <ItemMeta>Leaderboard score: {dashboard.scout.leaderboardScore}/100</ItemMeta>
                </div>
                <Button size="small" onClick={() => openRoute(dashboard.scout.publicUrl)}>
                  Open page
                </Button>
              </ListRow>
            ) : null}
          </List>
        </Panel>
      </TwoColumn>
    </Page>
  );
};

export default CareerHubPage;
