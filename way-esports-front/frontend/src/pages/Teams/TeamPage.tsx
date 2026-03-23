import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { teamsService } from '../../services/teamsService';
import { historyService } from '../../services/historyService';
import { resolveMediaUrl, resolveTeamLogoUrl } from '../../utils/media';
import SupportChat from '../../components/Support/SupportChat';
import FlameAuraAvatar from '../../components/UI/FlameAuraAvatar';
import {
  TournamentHistoryFilters,
  HistoryPagination,
  TournamentHistoryRow,
  TournamentHistorySection
} from '../../components/History';
import { getTeamPoints, getTierByPoints, getIntensityByPointsAndRank } from '../../utils/flameRank';

const Container = styled.div`
  padding: 2rem 1rem;
  width: 100%;
  max-width: 100%;
  margin: 0;
  color: #fff;
`;

const TeamHeader = styled(Card)`
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.bg.secondary}, ${({ theme }) => theme.colors.bg.tertiary});
  min-width: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem;
  }
`;

const Logo = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 16px;
  border: 2px solid #ff6b00;
  object-fit: cover;
`;

const LogoPlaceholder = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ff6b00, #ff9500);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
  color: white;
`;

const TeamTitle = styled.h1`
  font-size: 2.5rem;
  margin: 0;
  color: #ff6b00;
  word-break: break-word;
  overflow-wrap: anywhere;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 1.6rem;
    line-height: 1.2;
  }
`;

const TeamHeaderMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
`;

const TeamTag = styled.span`
  background: #ff6b00;
  color: #fff;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 1rem;
  margin-left: 1rem;
  vertical-align: middle;
  word-break: break-word;
  overflow-wrap: anywhere;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin-left: 0;
    margin-top: 0.35rem;
    display: inline-flex;
  }
`;

const TeamLogoActions = styled.div`
  margin-top: 0.25rem;
  padding: 10px;
  border-radius: 10px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
`;

const ShareRow = styled.div`
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const UploadLogoButton = styled(Button).attrs({ variant: 'outline', size: 'small' })`
  min-height: 40px;
`;

const Section = styled.div`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  border-bottom: 2px solid #ff6b00;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(Card) <{ $color: string }>`
  padding: 1.5rem;
  text-align: center;
  background: ${({ $color }) => `rgba(${$color}, 0.1)`};
  border-left: 4px solid ${({ $color }) => `rgb(${$color})`};
`;

const StatValue = styled.h3<{ $color: string }>`
  color: ${({ $color }) => `rgb(${$color})`};
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
`;

const StatLabel = styled.p`
  margin: 0;
  opacity: 0.8;
  font-size: 0.9rem;
`;

const MemberList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const MemberCard = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255,255,255,0.05);
  border-radius:12px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  min-width: 0;

  &:hover {
    border-color: #ff6b00;
    background: rgba(255,107,0,0.1);
    transform: translateY(-3px);
  }
`;

const MemberAvatar = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
`;

const AvatarPlaceholder = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
`;

const MemberText = styled.div`
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
`;

const AchievementCard = styled(Card)`
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.1);
  
  &:hover {
    border-color: #ff6b00;
    background: rgba(255,107,0,0.05);
  }
`;

const JoinRequestsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const JoinRequestCard = styled(Card).attrs({ variant: 'outlined' })`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
`;

const JoinRequestUser = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const JoinRequestActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const RequestAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const RequestAvatarFallback = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TeamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string>('');
  const [historyGameFilter, setHistoryGameFilter] = useState<string>('all');
  const [historyFromFilter, setHistoryFromFilter] = useState<string>('');
  const [historyToFilter, setHistoryToFilter] = useState<string>('');
  const [historyBaseStatusFilter, setHistoryBaseStatusFilter] = useState<string>('all');
  const [historyBaseSort, setHistoryBaseSort] = useState<'recent' | 'oldest'>('recent');
  const [historyBaseGameFilter, setHistoryBaseGameFilter] = useState<string>('all');
  const [historyBasePage, setHistoryBasePage] = useState<number>(1);
  const [historySort, setHistorySort] = useState<'recent' | 'oldest'>('recent');
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [isExportingHistory, setIsExportingHistory] = useState(false);
  const { data: team, isLoading, error, refetch } = useQuery({
    queryKey: ['team', id],
    queryFn: async () => {
      if (!id) return null;
      const res: any = await teamsService.getById(id);
      if (res?.success === false) {
        throw new Error(res?.error || 'Team not found');
      }
      return res?.data || res;
    },
    enabled: Boolean(id),
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
  const currentUserId = user?.id || '';
  const currentUserRole = user?.role || 'user';
  const isPrivilegedViewer = currentUserRole === 'admin' || currentUserRole === 'developer';
  const isTeamCaptain = Boolean(team?.captain?.id && currentUserId && currentUserId === team.captain.id);
  const isTeamMember = Boolean(
    currentUserId &&
    Array.isArray(team?.members) &&
    team.members.some((member: any) => String(member?.id || '') === String(currentUserId))
  );
  const canAccessTeamSupport = isPrivilegedViewer || isTeamCaptain || isTeamMember;
  const canManageLogo = Boolean(
    team && currentUserId && (
      currentUserId === team.captain?.id ||
      isPrivilegedViewer
    )
  );

  const { data: joinRequests = [], isLoading: isJoinRequestsLoading } = useQuery({
    queryKey: ['team', id, 'join-requests'],
    queryFn: async () => {
      if (!id) return [];
      const response: any = await teamsService.getJoinRequests(id);
      return response?.data || response || [];
    },
    enabled: Boolean(id && canManageLogo),
    staleTime: 10000,
    refetchOnWindowFocus: false
  });

  const { data: teamHistory, isLoading: isTeamHistoryLoading } = useQuery({
    queryKey: ['history', 'team', id, 'base', historyBasePage, historyBaseStatusFilter, historyBaseSort, historyBaseGameFilter],
    queryFn: async () => {
      if (!id) return null;
      return historyService.getTeamHistory(id, historyBasePage, 6, {
        status: historyBaseStatusFilter === 'all' ? '' : historyBaseStatusFilter,
        sort: historyBaseSort,
        game: historyBaseGameFilter === 'all' ? '' : historyBaseGameFilter
      });
    },
    enabled: Boolean(id),
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const hasActiveSubscription = (() => {
    const subscribed = Boolean((user as any)?.isSubscribed);
    if (!subscribed) return false;
    const expiresRaw = (user as any)?.subscriptionExpiresAt;
    if (!expiresRaw) return true;
    const expiresTs = new Date(expiresRaw).getTime();
    return Number.isFinite(expiresTs) && expiresTs > Date.now();
  })();

  const { data: teamDetailedHistory, isLoading: isTeamDetailedHistoryLoading, refetch: refetchTeamDetailedHistory } = useQuery({
    queryKey: ['history', 'team', id, 'matches', historyGameFilter, historyFromFilter, historyToFilter, historySort, historyPage],
    queryFn: async () => {
      if (!id) return null;
      return historyService.getTeamMatches(id, {
        page: historyPage,
        limit: 20,
        game: historyGameFilter === 'all' ? '' : historyGameFilter,
        from: historyFromFilter || '',
        to: historyToFilter || '',
        sort: historySort
      });
    },
    enabled: Boolean(id && hasActiveSubscription && canManageLogo),
    staleTime: 20000,
    refetchOnWindowFocus: false
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!id) throw new Error('Team id missing');
      return teamsService.approveJoinRequest(id, targetUserId);
    },
    onSuccess: async () => {
      setRequestError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['team', id] }),
        queryClient.invalidateQueries({ queryKey: ['team', id, 'join-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['teams'] }),
        queryClient.invalidateQueries({ queryKey: ['tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['rankings'] })
      ]);
    },
    onError: (error: any) => {
      setRequestError(error?.message || 'Failed to approve join request');
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!id) throw new Error('Team id missing');
      return teamsService.rejectJoinRequest(id, targetUserId);
    },
    onSuccess: async () => {
      setRequestError(null);
      await queryClient.invalidateQueries({ queryKey: ['team', id, 'join-requests'] });
    },
    onError: (error: any) => {
      setRequestError(error?.message || 'Failed to reject join request');
    }
  });

  const handleTeamLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadTeamLogo(file);
    e.target.value = '';
  };

  const uploadTeamLogo = async (file?: File | null) => {
    if (!file || !id) return;

    try {
      setIsUploadingLogo(true);
      setLogoError(null);
      const uploaded = await api.uploadImage(file);
      await teamsService.updateLogo(id, uploaded.url);
      await refetch();
    } catch (uploadError: any) {
      setLogoError(uploadError?.message || 'Failed to update team logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const openTeamLogoPicker = () => {
    if (isUploadingLogo) return;
    logoInputRef.current?.click();
  };

  const loadInviteLink = async () => {
    if (!id) return;
    try {
      const res: any = await api.get(`/api/intelligence/telegram/deep-link/team/${id}`);
      const payload = res?.data || res;
      setInviteLink(String(payload?.deepLink || ''));
    } catch {
      setInviteLink('');
    }
  };

  useEffect(() => {
    if (!id) return;
    loadInviteLink().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyGameFilter, historyFromFilter, historyToFilter, historySort]);

  useEffect(() => {
    setHistoryBasePage(1);
  }, [historyBaseStatusFilter, historyBaseSort, historyBaseGameFilter]);

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      // ignore clipboard error
    }
  };

  const handleDropTeamLogo = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isUploadingLogo) return;
    const file = event.dataTransfer?.files?.[0];
    await uploadTeamLogo(file);
  };

  const handleDragOverTeamLogo = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  if (isLoading) return <Container><div style={{ textAlign: 'center', padding: '3rem' }}>Loading team details...</div></Container>;
  if (error || !team) {
    const message = (error as Error | undefined)?.message || 'Team not found';
    return <Container><div style={{ textAlign: 'center', padding: '3rem', color: '#ff6b6b' }}>{message}</div></Container>;
  }

  const totalPrizeMoney = team.stats?.totalPrizeMoney || 0;
  const wins = team.stats?.wins || 0;
  const losses = team.stats?.losses || 0;
  const winRate = team.stats?.winRate || 0;
  const teamLogo = resolveTeamLogoUrl(team.logo);
  const historySummary = teamHistory?.summary || { tournaments: 0, matches: 0, wins: 0, losses: 0, winRate: 0 };
  const historyItems = Array.isArray(teamHistory?.items) ? teamHistory.items : [];
  const historyBasePagination = teamHistory?.pagination || { page: 1, limit: 6, total: 0, totalPages: 0 };
  const teamDetailedItems = Array.isArray(teamDetailedHistory?.items) ? teamDetailedHistory.items : [];
  const teamDetailedPagination = teamDetailedHistory?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  const exportTeamHistoryCsv = async () => {
    if (!id) return;
    try {
      setIsExportingHistory(true);
      const blob = await historyService.exportTeamHistoryCsv(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `team-${id}-tournament-history.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // noop
    } finally {
      setIsExportingHistory(false);
    }
  };

  return (
    <Container>
      <TeamHeader>
        <div>
          <FlameAuraAvatar
            imageUrl={teamLogo || undefined}
            fallbackText={team.tag?.replace('#', '') || team.name?.charAt(0) || '?'}
            size={120}
            tier={getTierByPoints(getTeamPoints(wins, losses, winRate, Number(team?.achievements?.length || 0)))}
            intensity={getIntensityByPointsAndRank(getTeamPoints(wins, losses, winRate, Number(team?.achievements?.length || 0)))}
            rounded={false}
          />
        </div>
        <TeamHeaderMeta>
          <TeamTitle>
            {team.name}
            <TeamTag>{team.tag}</TeamTag>
          </TeamTitle>
          <p style={{ margin: '0.5rem 0', opacity: 0.8 }}>{team.game}</p>
          {canManageLogo && (
            <TeamLogoActions onDrop={handleDropTeamLogo} onDragOver={handleDragOverTeamLogo}>
              <UploadLogoButton type="button" disabled={isUploadingLogo} onClick={openTeamLogoPicker}>
                {isUploadingLogo ? 'Uploading...' : teamLogo ? 'Change Team Logo' : 'Upload Team Logo'}
              </UploadLogoButton>
              <HiddenFileInput
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleTeamLogoUpload}
                disabled={isUploadingLogo}
              />
              <div style={{ marginTop: '8px', color: '#c9c9c9', fontSize: '0.8rem' }}>or drag & drop image here</div>
              {logoError && (
                <div style={{ marginTop: '8px', color: '#ff6b6b', fontSize: '0.9rem' }}>
                  {logoError}
                </div>
              )}
            </TeamLogoActions>
          )}
          <ShareRow>
            <Button variant="outline" size="small" onClick={loadInviteLink}>
              Generate Telegram Invite
            </Button>
            {!!inviteLink && (
              <>
                <Button variant="primary" size="small" onClick={copyInviteLink}>
                  Copy Link
                </Button>
                <a href={inviteLink} target="_blank" rel="noreferrer" style={{ color: '#ffb680', fontSize: 13 }}>
                  Open
                </a>
              </>
            )}
          </ShareRow>
        </TeamHeaderMeta>
      </TeamHeader>

      {/* Stats Section */}
      <Section>
        <SectionTitle>Team Statistics</SectionTitle>
        <StatsGrid>
          <StatCard $color="76, 175, 80">
            <StatValue $color="76, 175, 80">{wins}</StatValue>
            <StatLabel>Wins</StatLabel>
          </StatCard>
          <StatCard $color="244, 67, 54">
            <StatValue $color="244, 67, 54">{losses}</StatValue>
            <StatLabel>Losses</StatLabel>
          </StatCard>
          <StatCard $color="255, 152, 0">
            <StatValue $color="255, 152, 0">{winRate.toFixed(1)}%</StatValue>
            <StatLabel>Win Rate</StatLabel>
          </StatCard>
          <StatCard $color="255, 215, 0">
            <StatValue $color="255, 215, 0">${totalPrizeMoney.toLocaleString()}</StatValue>
            <StatLabel>Total Prize Money</StatLabel>
          </StatCard>
        </StatsGrid>
      </Section>

      <Section>
        <SectionTitle>Tournament History</SectionTitle>
        <TournamentHistorySection
          loading={isTeamHistoryLoading}
          emptyText="No tournament history yet."
          controls={
            <TournamentHistoryFilters
              game={historyBaseGameFilter}
              status={historyBaseStatusFilter}
              sort={historyBaseSort}
              onGameChange={setHistoryBaseGameFilter}
              onStatusChange={setHistoryBaseStatusFilter}
              onSortChange={setHistoryBaseSort}
            />
          }
          items={historyItems.map((item: any) => ({
            key: item.tournamentId,
            to: `/tournament/${item.tournamentId}`,
            title: item.tournamentName,
            subtitle: `${item.game} • ${item.matches} matches • ${item.wins}W/${item.losses}L`,
            rightText: `${Number(item.winRate || 0).toFixed(1)}%`
          }))}
          summaryText={`Summary: ${historySummary.tournaments} tournaments • ${historySummary.matches} matches • ${historySummary.wins}W/${historySummary.losses}L`}
          pagination={{
            page: historyBasePagination.page,
            totalPages: historyBasePagination.totalPages,
            loading: isTeamHistoryLoading,
            onPrev: () => setHistoryBasePage((p) => Math.max(1, p - 1)),
            onNext: () => setHistoryBasePage((p) => Math.min(historyBasePagination.totalPages, p + 1))
          }}
        />
      </Section>

      <Section>
        <SectionTitle>Premium Match History <span style={{ fontSize: '0.75rem', color: '#ffb074' }}>PRO</span></SectionTitle>
        {!canManageLogo ? (
          <div style={{ opacity: 0.75 }}>Only team owner can access this section.</div>
        ) : !hasActiveSubscription ? (
          <div style={{ opacity: 0.75 }}>Active subscription required for detailed history, filters and CSV export.</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <select
                value={historyGameFilter}
                onChange={(e) => setHistoryGameFilter(e.target.value)}
                style={{ minHeight: 36, background: '#121418', color: '#fff', border: '1px solid #2b2f38', borderRadius: 8, padding: '0 10px' }}
              >
                <option value="all">All games</option>
                <option value="Critical Ops">Critical Ops</option>
                <option value="CS2">CS2</option>
                <option value="PUBG Mobile">PUBG Mobile</option>
                <option value="Standoff 2">Standoff 2</option>
                <option value="Dota 2">Dota 2</option>
                <option value="Valorant Mobile">Valorant Mobile</option>
              </select>
              <select
                value={historySort}
                onChange={(e) => setHistorySort(e.target.value as 'recent' | 'oldest')}
                style={{ minHeight: 36, background: '#121418', color: '#fff', border: '1px solid #2b2f38', borderRadius: 8, padding: '0 10px' }}
              >
                <option value="recent">Recent first</option>
                <option value="oldest">Oldest first</option>
              </select>
              <input
                type="date"
                value={historyFromFilter}
                onChange={(e) => setHistoryFromFilter(e.target.value)}
                style={{ minHeight: 36, background: '#121418', color: '#fff', border: '1px solid #2b2f38', borderRadius: 8, padding: '0 10px' }}
              />
              <input
                type="date"
                value={historyToFilter}
                onChange={(e) => setHistoryToFilter(e.target.value)}
                style={{ minHeight: 36, background: '#121418', color: '#fff', border: '1px solid #2b2f38', borderRadius: 8, padding: '0 10px' }}
              />
              <Button variant="outline" size="small" onClick={() => refetchTeamDetailedHistory()} disabled={isTeamDetailedHistoryLoading}>
                {isTeamDetailedHistoryLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button variant="outline" size="small" onClick={exportTeamHistoryCsv} disabled={isExportingHistory}>
                {isExportingHistory ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>

            {isTeamDetailedHistoryLoading ? (
              <div style={{ opacity: 0.8 }}>Loading detailed matches...</div>
            ) : !teamDetailedItems.length ? (
              <div style={{ opacity: 0.75 }}>No matches for selected filters.</div>
            ) : (
              <HistoryList>
                {teamDetailedItems.map((row: any) => (
                  <TournamentHistoryRow
                    key={row.matchId}
                    to={`/tournament/${row.tournamentId}`}
                    title={row.tournamentName}
                    subtitle={`${row.game} • vs ${row.opponentTeam?.name || 'Team'} • ${row.score}`}
                    rightText={row.result === 'win' ? 'W' : 'L'}
                    rightColor={row.result === 'win' ? '#79d888' : '#ff8a80'}
                  />
                ))}
              </HistoryList>
            )}
            <HistoryPagination
              page={teamDetailedPagination.page}
              totalPages={teamDetailedPagination.totalPages}
              loading={isTeamDetailedHistoryLoading}
              onPrev={() => setHistoryPage((p) => Math.max(1, p - 1))}
              onNext={() => setHistoryPage((p) => Math.min(teamDetailedPagination.totalPages, p + 1))}
            />
          </>
        )}
      </Section>

      {canManageLogo && (
        <Section>
          <SectionTitle>Join Requests</SectionTitle>
          {requestError && (
            <div style={{ color: '#ff6b6b', marginBottom: '10px' }}>{requestError}</div>
          )}
          {isJoinRequestsLoading ? (
            <div style={{ opacity: 0.8 }}>Loading requests...</div>
          ) : (
            <JoinRequestsList>
              {(Array.isArray(joinRequests) ? joinRequests : []).map((request: any) => {
                const username = request?.user?.username || request?.user?.firstName || request?.user?.lastName || 'User';
                const avatar = resolveMediaUrl(request?.user?.profileLogo);
                const userId = request?.user?.id || '';
                return (
                  <JoinRequestCard key={request?.id || userId}>
                    <JoinRequestUser>
                      {avatar ? (
                        <RequestAvatar src={avatar} alt={username} />
                      ) : (
                        <RequestAvatarFallback>{username.slice(0, 1).toUpperCase()}</RequestAvatarFallback>
                      )}
                      <div>
                        <div style={{ fontWeight: 700 }}>{username}</div>
                        <div style={{ opacity: 0.75, fontSize: '0.85rem' }}>
                          Requested: {request?.requestedAt ? new Date(request.requestedAt).toLocaleString() : '—'}
                        </div>
                      </div>
                    </JoinRequestUser>
                    <JoinRequestActions>
                      <Button
                        variant="success"
                        size="small"
                        disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending || !userId}
                        onClick={() => approveRequestMutation.mutate(userId)}
                      >
                        {approveRequestMutation.isPending ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending || !userId}
                        onClick={() => rejectRequestMutation.mutate(userId)}
                      >
                        {rejectRequestMutation.isPending ? 'Rejecting...' : 'Reject'}
                      </Button>
                    </JoinRequestActions>
                  </JoinRequestCard>
                );
              })}
              {!joinRequests?.length && (
                <div style={{ opacity: 0.75 }}>No pending requests.</div>
              )}
            </JoinRequestsList>
          )}
        </Section>
      )}

      {/* Team Members */}
      <Section>
        <SectionTitle>Team Roster ({team.members?.length || 0}/5)</SectionTitle>
        <MemberList>
          {(team.members || []).map((member: any, index: number) => (
            <MemberCard key={index} to={`/profile/${member.id}`}>
              {member.profileLogo ? (
                <MemberAvatar src={resolveMediaUrl(member.profileLogo)} alt={member.username} />
              ) : (
                <AvatarPlaceholder>
                  {member.username?.charAt(0)?.toUpperCase() || '?'}
                </AvatarPlaceholder>
              )}
              <MemberText>
                <h4 style={{ margin: '0 0 4px 0' }}>{member.username || 'Unknown'}</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>
                  {member.id === team.captain?.id ? '\u{1F451} Captain' : 'Player'}
                </p>
              </MemberText>
            </MemberCard>
          ))}
        </MemberList>
      </Section>

      {/* Achievements / Tournaments */}
      {team.achievements && team.achievements.length > 0 && (
        <Section>
          <SectionTitle>Tournament Achievements</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {team.achievements.map((ach: any, index: number) => (
              <AchievementCard key={index}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#ff6b00' }}>{ach.tournamentName || 'Tournament'}</h4>
                  <p style={{ margin: 0, opacity: 0.8 }}>
                    Position: {ach.position} {'\u2022'} Prize: ${ach.prize?.toLocaleString() || 0}
                  </p>
                </div>
                <div style={{ fontSize: '2rem' }}>
                  {ach.position === 1
                    ? '\u{1F947}'
                    : ach.position === 2
                      ? '\u{1F948}'
                      : ach.position === 3
                        ? '\u{1F949}'
                        : '\u{1F3C6}'}
                </div>
              </AchievementCard>
            ))}
          </div>
        </Section>
      )}

      <Section>
        <SectionTitle>Team Support</SectionTitle>
        <Card>
          {canAccessTeamSupport ? (
            <SupportChat teamId={team.id || team._id} source="team" subject={`Team Support: ${team.name || 'Team'}`} />
          ) : (
            <SupportChat source="profile" subject={`General Support: ${team.name || 'Team'}`} />
          )}
        </Card>
      </Section>
    </Container>
  );
};

export default TeamPage;
