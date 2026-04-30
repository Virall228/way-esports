import React, { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CreateTeamModal from '../../components/Teams/CreateTeamModal';
import RankingsPage from '../../components/Rankings/RankingsPage';
import { teamsService } from '../../services/teamsService';
import { tournamentService } from '../../services/tournamentService';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import {
  FilterGroup,
  FilterLabel,
  FilterRail,
  ModalActionRow,
  ModalCopy,
  NoticeBanner,
  PageEmptyState,
  PageHero,
  PageHeroContent,
  PageHeroLayout,
  PageShell,
  PageSubtitle,
  PageTitle,
  SelectField
} from '../../components/UI/PageLayout';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { resolveTeamLogoUrl } from '../../utils/media';
import FlameAuraAvatar from '../../components/UI/FlameAuraAvatar';
import { getTeamPoints, getTierByPoints, getIntensityByPointsAndRank } from '../../utils/flameRank';
import { Seo } from '../../components/SEO';

const HeaderKicker = styled.div`
  margin-bottom: 0.75rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-family: ${({ theme }) => theme.fonts.accent};
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const CreateTeamButton = styled(Button).attrs({ variant: 'brand', size: 'small' })`
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
  min-height: 44px;
  width: 100%;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: auto;
  }

`;

const FilterSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 0.75rem;
  flex-wrap: wrap;

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    flex-wrap: nowrap;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 0.3rem;
  width: fit-content;
  max-width: 100%;
  padding: 0.28rem;
  border-radius: 999px;
  background: ${({ theme }) =>
    theme.isLight
      ? 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(243, 236, 226, 0.88))'
      : 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))'};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 10px 24px rgba(0, 0, 0, 0.16);
`;

const FilterTab = styled(Button).attrs<{ $active: boolean }>({
  variant: 'ghost',
  size: 'small'
})<{ $active: boolean }>`
  padding: 0.7rem 1.1rem;
  min-height: 40px;
  border-radius: 999px;
  white-space: nowrap;
  border-color: ${({ theme, $active }) => ($active ? theme.colors.border.medium : 'transparent')};
  background: ${({ theme, $active }) =>
    $active
      ? theme.isLight
        ? 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248, 241, 231, 0.94))'
        : 'linear-gradient(180deg, rgba(48, 53, 62, 0.96), rgba(20, 23, 28, 0.98))'
      : 'transparent'};
  color: ${({ theme, $active }) => ($active ? theme.colors.text.primary : theme.colors.text.secondary)};
  box-shadow: ${({ $active }) => ($active ? '0 12px 26px rgba(0, 0, 0, 0.22)' : 'none')};

  &:hover:not(:disabled) {
    transform: translateY(0);
    border-color: ${({ theme, $active }) => ($active ? theme.colors.border.strong : theme.colors.border.light)};
    background: ${({ theme, $active }) =>
      $active
        ? theme.isLight
          ? 'linear-gradient(180deg, rgba(255,255,255,1), rgba(248, 241, 231, 0.96))'
          : 'linear-gradient(180deg, rgba(52, 57, 66, 0.98), rgba(24, 27, 32, 1))'
        : theme.isLight
          ? 'rgba(255,255,255,0.74)'
          : 'rgba(255,255,255,0.05)'};
    box-shadow: ${({ $active }) => ($active ? '0 16px 28px rgba(0, 0, 0, 0.24)' : 'none')};
  }
`;

const FilterDropdown = styled(SelectField)`
  font-size: 14px;
  width: 100%;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: auto;
    min-width: 180px;
  }
`;

const TeamsGrid = styled.div`
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

  @media (min-width: ${({ theme }) => theme.breakpoints.wide}) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const TeamCard = styled(Card).attrs({ variant: 'outlined' })`
  display: grid;
  gap: 1rem;
  background: ${({ theme }) =>
    theme.isLight
      ? 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(247,239,229,0.9))'
      : 'linear-gradient(180deg, rgba(18, 22, 27, 0.9), rgba(8, 10, 13, 0.96))'};
  border-radius: 24px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: transform ${({ theme }) => theme.transitions.fast}, box-shadow ${({ theme }) => theme.transitions.fast}, border-color ${({ theme }) => theme.transitions.fast};

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${({ theme }) => theme.colors.gray[700]}, ${({ theme }) => theme.colors.gray[900]});
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-4px);
      box-shadow: ${({ theme }) => theme.shadows.lg};
      border-color: ${({ theme }) => theme.colors.border.accent};
    }
  }
`;

const TeamHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 15px;
`;

const TeamInfo = styled.div`
  flex: 1;
`;

const TeamName = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 5px;
  font-size: 1.3rem;
  line-height: 1.2;
`;

const TeamTag = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: 700;
  font-size: 0.9rem;
`;

const TeamDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  min-height: 4.5em;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TeamStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
`;

const StatItem = styled.div`
  background: ${({ theme }) => (theme.isLight ? 'rgba(255, 255, 255, 0.76)' : 'rgba(255, 255, 255, 0.04)')};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 16px;
  text-align: center;
  padding: 0.85rem 0.5rem;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const StatLabel = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.8rem;
  margin-top: 2px;
`;

const MembersList = styled.div`
  display: grid;
  gap: 0.65rem;
`;

const MembersTitle = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
  font-size: 0.9rem;
`;

const Members = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MemberTag = styled.span<{ $role: 'captain' | 'player' }>`
  background: ${({ theme, $role }) =>
    $role === 'captain'
      ? (theme.isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255, 255, 255, 0.05)')
      : 'rgba(255, 255, 255, 0.05)'};
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid ${({ theme, $role }) => ($role === 'captain' ? theme.colors.border.strong : theme.colors.border.light)};
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ActionButton = styled(Button).attrs<{ $variant: 'brand' | 'secondary' | 'danger' }>((props) => ({
  variant: props.$variant,
  size: 'small'
})) <{ $variant: 'brand' | 'secondary' | 'danger' }>`
  flex: 1;
  padding: 0.75rem;
  min-height: 44px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 16px;
`;

const ModalCard = styled(Card).attrs({ variant: 'elevated' })`
  width: min(640px, 100%);
  background: ${({ theme }) => theme.colors.bg.secondary};
  border-radius: 24px;
  padding: 1rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 1.25rem;
  }
`;

const ModalTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #fff;
`;

const ModalField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
`;

const ModalLabel = styled.label`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.85rem;
`;

const ModalInput = styled.input`
  min-height: 42px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: ${({ theme }) => theme.colors.bg.primary};
  color: #fff;
  padding: 0 12px;
`;

const ModalTextarea = styled.textarea`
  min-height: 96px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: ${({ theme }) => theme.colors.bg.primary};
  color: #fff;
  padding: 10px 12px;
  resize: vertical;
`;

const MetaBlock = styled.div`
  margin-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 10px;
`;

const MetaLine = styled.div<{ $tone?: 'warning' | 'default' }>`
  color: ${({ $tone = 'default' }) => ($tone === 'warning' ? '#ffc8c8' : '#cfd8dc')};
  font-size: 12px;
  margin-bottom: 8px;
`;

const InlineCheckbox = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const UploadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px;
  border-radius: 10px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
`;

const LogoPreview = styled.div<{ $imageUrl?: string }>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${({ $imageUrl, theme }) => (
    $imageUrl
      ? `url(${$imageUrl}) center/cover no-repeat`
      : `linear-gradient(135deg, ${theme.colors.gray[700]}, ${theme.colors.gray[900]})`
  )};
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

interface Team {
  id: string;
  name: string;
  tag: string;
  logo?: string;
  captainProfileLogo?: string;
  game: string;
  tournamentId?: string | null;
  description: string;
  captainId?: string;
  isPrivate?: boolean;
  requiresApproval?: boolean;
  members: Array<{ id?: string; name: string; role: 'captain' | 'player' }>;
  tournaments: number;
  wins: number;
  winRate: number;
  isOwner?: boolean;
}

type MatchmakingSuggestion = {
  roleCounts?: Record<string, number>;
  teamMetrics?: {
    avgConflict: number;
    avgChill: number;
    avgLeadership: number;
  };
  warnings?: string[];
  recommendations?: string[];
};

type EditTeamFormState = {
  id: string;
  name: string;
  tag: string;
  game: string;
  description: string;
  logo: string;
  isPrivate: boolean;
  requiresApproval: boolean;
};

const TeamsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const editLogoInputRef = useRef<HTMLInputElement | null>(null);
  const [activeFilter, setActiveFilter] = useState('teams');
  const [selectedGame, setSelectedGame] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTeamForm, setEditTeamForm] = useState<EditTeamFormState | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [matchmakingByTeam, setMatchmakingByTeam] = useState<Record<string, MatchmakingSuggestion>>({});
  const [matchmakingLoadingTeamId, setMatchmakingLoadingTeamId] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionInfo, setActionInfo] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const normalizeGame = (value: string) =>
    (value || '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

  const { data: teamsRaw = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res: any = await teamsService.list();
      return (res && (res.data || res.teams)) || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const { data: tournamentsRaw = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const res: any = await tournamentService.list();
      return (res && (res.tournaments || res.data || [])) || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const teams = useMemo(() => {
    const items: any[] = Array.isArray(teamsRaw) ? teamsRaw : [];
    return items.map((t: any) => {
      const captainId = t.captain?.id?.toString?.() || t.captain?.toString?.() || '';
      const membersRaw: any[] = Array.isArray(t.members) ? t.members : [];

      const members: Array<{ id?: string; name: string; role: 'captain' | 'player' }> = membersRaw.map((m: any) => {
        const id = (m?.id || m?._id || '').toString();
        const label = (m?.username || m?.firstName || m?.lastName || id || 'Member').toString();
        const role: 'captain' | 'player' = captainId && id === captainId ? 'captain' : 'player';
        return { id, name: label, role };
      });

      if (t.captain && captainId && !members.some((m: any) => m.role === 'captain')) {
        const captainName = (t.captain.username || t.captain.firstName || t.captain.lastName || 'Captain').toString();
        members.unshift({ id: captainId, name: captainName, role: 'captain' });
      }

      return {
        id: (t.id || t._id || '').toString(),
        name: t.name || '',
        tag: t.tag || '',
        logo: resolveTeamLogoUrl(t.logo || ''),
        captainProfileLogo: resolveTeamLogoUrl(t.captain?.profileLogo || ''),
        game: t.game || '',
        tournamentId: t.tournamentId || null,
        description: t.description || '',
        captainId,
        isPrivate: Boolean(t.isPrivate),
        requiresApproval: Boolean(t.requiresApproval),
        members,
        tournaments: Number(t.tournaments) || 0,
        wins: Number(t.stats?.wins) || Number(t.wins) || 0,
        winRate: Number(t.stats?.winRate) || Number(t.winRate) || 0,
        isOwner: Boolean(
          user?.id && (
            user.id === captainId ||
            user.role === 'admin' ||
            user.role === 'developer'
          )
        )
      } as Team;
    });
  }, [teamsRaw, user?.id, user?.role]);

  const tournaments = useMemo(() => {
    const items: any[] = Array.isArray(tournamentsRaw) ? tournamentsRaw : [];
    return items
      .filter((item: any) => item?.id || item?._id)
      .map((item: any) => ({
        id: String(item.id || item._id),
        name: String(item.name || item.title || 'Tournament'),
        status: item.status
      }));
  }, [tournamentsRaw]);

  const createTeamMutation = useMutation({
    mutationFn: (payload: any) => teamsService.create(payload),
    onSuccess: async () => {
      setActionInfo('Team created successfully');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['teams'] }),
        queryClient.invalidateQueries({ queryKey: ['rankings'] }),
        queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      ]);
    },
    onError: (e: any) => {
      setActionError(e?.message || 'Failed to create team');
    }
  });

  const joinTeamMutation = useMutation({
    mutationFn: (payload: any) => teamsService.join(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['teams'] }),
        queryClient.invalidateQueries({ queryKey: ['rankings'] }),
        queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      ]);
    },
    onError: (e: any) => {
      setActionError(e?.message || 'Failed to join team');
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => teamsService.update(id, payload),
    onSuccess: async () => {
      setActionInfo('Team updated successfully');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['teams'] }),
        queryClient.invalidateQueries({ queryKey: ['team'] }),
        queryClient.invalidateQueries({ queryKey: ['rankings'] }),
        queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      ]);
    },
    onError: (e: any) => {
      setActionError(e?.message || 'Failed to update team');
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => teamsService.remove(id),
    onSuccess: async () => {
      setActionInfo('Team deleted successfully');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['teams'] }),
        queryClient.invalidateQueries({ queryKey: ['rankings'] }),
        queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      ]);
    },
    onError: (e: any) => {
      setActionError(e?.message || 'Failed to delete team');
    }
  });

  const error = actionError || (queryError as Error | null)?.message || null;

  const handleCreateTeam = async (teamData: any) => {
    try {
      setActionInfo(null);
      setActionError(null);
      await createTeamMutation.mutateAsync({
        name: teamData?.name,
        tag: teamData?.tag,
        game: teamData?.game,
        tournamentId: teamData?.tournamentId,
        description: teamData?.description,
        logo: teamData?.logo,
        isPrivate: Boolean(teamData?.isPrivate),
        requiresApproval: Boolean(teamData?.requiresApproval)
      });
    } catch (e: any) {
      throw e;
    }
  };

  const handleJoinTeam = async (team: Team) => {
    try {
      if (!team.tournamentId) {
        setActionError('This team is not linked to a tournament');
        return;
      }
      setActionInfo(null);
      setActionError(null);
      const joinResult: any = await joinTeamMutation.mutateAsync({
        teamId: team.id,
        tournamentId: team.tournamentId
      });
      if (joinResult?.pendingApproval) {
        setActionInfo('Join request sent. Waiting for team owner approval.');
      } else {
        setActionInfo('You joined the team successfully');
      }
    } catch (e: any) {
      setActionError(e?.message || 'Failed to join team');
    }
  };

  const handleAnalyzeTeam = async (team: Team) => {
    try {
      setActionInfo(null);
      setActionError(null);
      setMatchmakingLoadingTeamId(team.id);
      const playerIds = team.members.map((m) => m.id).filter((id): id is string => Boolean(id));
      if (playerIds.length < 2) {
        setActionError('Need at least 2 identified players to run AI composition check');
        return;
      }

      const result: any = await api.post('/api/matchmaking/suggest-team', { playerIds });
      const suggestion = result?.data || result || {};
      setMatchmakingByTeam((prev) => ({ ...prev, [team.id]: suggestion }));
      setActionInfo(`AI team analysis updated for ${team.name}`);
    } catch (e: any) {
      setActionError(e?.message || 'Failed to analyze team composition');
    } finally {
      setMatchmakingLoadingTeamId(null);
    }
  };

  const handleViewDetails = (teamId: string) => {
    window.location.href = `/team/${teamId}`;
  };

  const handleEditTeam = (teamId: string) => {
    const team = teams.find((item) => item.id === teamId);
    if (!team) {
      setActionError('Team not found');
      return;
    }
    setEditTeamForm({
      id: team.id,
      name: team.name,
      tag: team.tag,
      game: team.game,
      description: team.description || '',
      logo: team.logo || '',
      isPrivate: Boolean(team.isPrivate),
      requiresApproval: Boolean(team.requiresApproval)
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteTeam = async (teamId: string) => {
    const confirmed = window.confirm('Delete this team? This action cannot be undone.');
    if (!confirmed) return;
    setActionInfo(null);
    setActionError(null);
    await deleteTeamMutation.mutateAsync(teamId);
  };

  const handleEditField = (field: keyof EditTeamFormState, value: string | boolean) => {
    setEditTeamForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleEditLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    await uploadEditLogoFile(file);
    e.target.value = '';
  };

  const uploadEditLogoFile = async (file?: File | null) => {
    if (!file) return;

    try {
      setActionInfo(null);
      setActionError(null);
      setIsUploadingLogo(true);
      const uploaded = await api.uploadImage(file);
      handleEditField('logo', resolveTeamLogoUrl(uploaded.url));
    } catch (uploadError: any) {
      setActionError(uploadError?.message || 'Failed to upload team logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const openEditLogoPicker = () => {
    if (isUploadingLogo) return;
    editLogoInputRef.current?.click();
  };

  const handleDropEditLogo = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isUploadingLogo) return;
    const file = event.dataTransfer?.files?.[0];
    await uploadEditLogoFile(file);
  };

  const handleDragOverEditLogo = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleSaveTeamEdit = async () => {
    if (!editTeamForm) return;
    const safeName = editTeamForm.name.trim();
    const safeTag = editTeamForm.tag.trim();
    const safeDescription = editTeamForm.description.trim();
    if (!safeName || !safeTag || !editTeamForm.game.trim()) {
      setActionError('Name, tag and game are required');
      return;
    }

    setActionInfo(null);
    setActionError(null);
    await updateTeamMutation.mutateAsync({
      id: editTeamForm.id,
      payload: {
        name: safeName,
        tag: safeTag,
        game: editTeamForm.game.trim(),
        description: safeDescription,
        logo: editTeamForm.logo,
        isPrivate: Boolean(editTeamForm.isPrivate),
        requiresApproval: Boolean(editTeamForm.requiresApproval)
      }
    });
    setIsEditModalOpen(false);
    setEditTeamForm(null);
  };

  return (
    <PageShell>
      <Seo
        title="Esports Teams Directory | WAY Esports"
        description="Discover esports teams, rosters, performance stats and recruitment opportunities on WAY Esports."
        canonicalPath="/teams"
        type="website"
        keywords={['esports teams', 'team directory', 'WAY Esports teams', 'competitive rosters']}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'WAY Esports Teams',
          description: 'Public team directory with rosters, stats and competitive results.'
        }}
      />
      <PageHero>
        <PageHeroLayout>
          <PageHeroContent>
            <HeaderKicker>Roster network</HeaderKicker>
            <PageTitle>{t('teamsTitle')}</PageTitle>
            <PageSubtitle>
              {t('teamsSubtitle')}
              {' '}
              {t('teamsSubtitle2')}
            </PageSubtitle>
          </PageHeroContent>
          {activeFilter === 'teams' && (
            <CreateTeamButton onClick={() => setIsCreateModalOpen(true)}>
              {t('createTeam')}
            </CreateTeamButton>
          )}
        </PageHeroLayout>
      </PageHero>

      <FilterRail>
        <FilterSection>
          <FilterGroup>
            <FilterLabel>View</FilterLabel>
            <FilterTabs>
              <FilterTab
                $active={activeFilter === 'teams'}
                onClick={() => setActiveFilter('teams')}
              >
                {t('teams')}
              </FilterTab>
              <FilterTab
                $active={activeFilter === 'rankings'}
                onClick={() => setActiveFilter('rankings')}
              >
                {t('rankings')}
              </FilterTab>
            </FilterTabs>
          </FilterGroup>
          {activeFilter === 'teams' && (
            <FilterGroup>
              <FilterLabel>Game</FilterLabel>
              <FilterDropdown
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
              >
                <option value="all">{t('allTeams')}</option>
                <option value="valorant-mobile">Valorant Mobile</option>
                <option value="critical-ops">Critical Ops</option>
                <option value="pubg-mobile">PUBG Mobile</option>
                <option value="cs2">CS2</option>
                <option value="dota2">Dota 2</option>
                <option value="standoff2">Standoff 2</option>
              </FilterDropdown>
            </FilterGroup>
          )}
        </FilterSection>
      </FilterRail>

      {activeFilter === 'teams' && (
        <>
          {error && (
            <NoticeBanner $tone="error">
              {error}
            </NoticeBanner>
          )}

          {!error && actionInfo && (
            <NoticeBanner $tone="success">
              {actionInfo}
            </NoticeBanner>
          )}

          {loading && !error && (
            <PageEmptyState>{t('loading')}</PageEmptyState>
          )}

          {!loading && !error && (
            <TeamsGrid>
              {teams
                .filter((team) => {
                  if (selectedGame === 'all') return true;
                  const safeGame = normalizeGame(team.game || '');
                  return safeGame === normalizeGame(selectedGame);
                })
                .map(team => (
                  <TeamCard key={team.id}>
                    <TeamHeader>
                      <FlameAuraAvatar
                        imageUrl={team.logo || team.captainProfileLogo || undefined}
                        fallbackText={team.tag.replace('#', '').slice(0, 2) || team.name || '?'}
                        size={60}
                        tier={getTierByPoints(getTeamPoints(team.wins, 0, team.winRate, team.tournaments))}
                        intensity={getIntensityByPointsAndRank(getTeamPoints(team.wins, 0, team.winRate, team.tournaments))}
                        rounded
                      />
                      <TeamInfo>
                        <TeamName>{team.name}</TeamName>
                        <TeamTag>{team.tag}</TeamTag>
                      </TeamInfo>
                    </TeamHeader>

                    <TeamDescription>{team.description}</TeamDescription>

                    <TeamStats>
                      <StatItem>
                        <StatValue>{team.tournaments}</StatValue>
                        <StatLabel>{t('tournamentsLabel')}</StatLabel>
                      </StatItem>
                      <StatItem>
                        <StatValue>{team.wins}</StatValue>
                        <StatLabel>{t('wins')}</StatLabel>
                      </StatItem>
                      <StatItem>
                        <StatValue>{team.winRate}%</StatValue>
                        <StatLabel>{t('winRate')}</StatLabel>
                      </StatItem>
                    </TeamStats>

                    <MembersList>
                      <MembersTitle>{t('membersLabel')} ({team.members.length}/5)</MembersTitle>
                      <Members>
                        {team.members.map((member, index) => (
                          <MemberTag key={index} $role={member.role}>
                            {member.name}
                          </MemberTag>
                        ))}
                      </Members>
                    </MembersList>

                    <ActionButtons>
                      {team.isOwner ? (
                        <>
                          <ActionButton $variant="secondary" onClick={() => handleEditTeam(team.id)}>
                            {t('edit')}
                          </ActionButton>
                          <ActionButton $variant="brand" onClick={() => handleViewDetails(team.id)}>
                            {t('viewDetails')}
                          </ActionButton>
                          <ActionButton
                            $variant="danger"
                            onClick={() => handleDeleteTeam(team.id)}
                            disabled={deleteTeamMutation.isPending}
                          >
                            {deleteTeamMutation.isPending ? 'Deleting...' : t('delete')}
                          </ActionButton>
                          <ActionButton
                            $variant="secondary"
                            onClick={() => handleAnalyzeTeam(team)}
                            disabled={matchmakingLoadingTeamId === team.id}
                          >
                            {matchmakingLoadingTeamId === team.id ? 'Analyzing...' : 'AI Fit'}
                          </ActionButton>
                        </>
                      ) : (
                        <>
                          <ActionButton $variant="secondary" onClick={() => handleViewDetails(team.id)}>
                            {t('viewDetails')}
                          </ActionButton>
                          <ActionButton
                            $variant="brand"
                            onClick={() => handleJoinTeam(team)}
                            disabled={joinTeamMutation.isPending || !team.tournamentId}
                          >
                            {joinTeamMutation.isPending ? 'Joining...' : t('joinTeam')}
                          </ActionButton>
                          <ActionButton
                            $variant="secondary"
                            onClick={() => handleAnalyzeTeam(team)}
                            disabled={matchmakingLoadingTeamId === team.id}
                          >
                            {matchmakingLoadingTeamId === team.id ? 'Analyzing...' : 'AI Fit'}
                          </ActionButton>
                        </>
                      )}
                    </ActionButtons>

                    {matchmakingByTeam[team.id] && (
                      <MetaBlock>
                        {Array.isArray(matchmakingByTeam[team.id].warnings) && matchmakingByTeam[team.id].warnings!.length > 0 && (
                          <MetaLine $tone="warning">
                            Warnings: {matchmakingByTeam[team.id].warnings!.join(' | ')}
                          </MetaLine>
                        )}
                        {Array.isArray(matchmakingByTeam[team.id].recommendations) && matchmakingByTeam[team.id].recommendations!.length > 0 && (
                          <MetaLine>
                            Recommendations: {matchmakingByTeam[team.id].recommendations!.join(' | ')}
                          </MetaLine>
                        )}
                        {matchmakingByTeam[team.id].teamMetrics && (
                          <MetaLine>
                            Team metrics: Chill {matchmakingByTeam[team.id].teamMetrics!.avgChill.toFixed(1)} · Leadership {matchmakingByTeam[team.id].teamMetrics!.avgLeadership.toFixed(1)} · Conflict {matchmakingByTeam[team.id].teamMetrics!.avgConflict.toFixed(1)}
                          </MetaLine>
                        )}
                      </MetaBlock>
                    )}
                  </TeamCard>
                ))}
            </TeamsGrid>
          )}
        </>
      )}

      {activeFilter === 'rankings' && (
        <RankingsPage />
      )}

      {isEditModalOpen && editTeamForm && (
        <ModalOverlay onClick={() => { setIsEditModalOpen(false); }}>
          <div onClick={(e) => e.stopPropagation()}>
            <ModalCard>
            <ModalTitle>Manage Team</ModalTitle>
            <ModalCopy>Update visuals, metadata and join policy so the team profile stays clean and consistent.</ModalCopy>

            <ModalField>
              <ModalLabel>Team Logo</ModalLabel>
              <UploadRow onDrop={handleDropEditLogo} onDragOver={handleDragOverEditLogo}>
                <LogoPreview $imageUrl={editTeamForm.logo}>
                  {!editTeamForm.logo ? (editTeamForm.tag || '?').slice(0, 2).toUpperCase() : null}
                </LogoPreview>
                <ActionButton $variant="secondary" disabled={isUploadingLogo} onClick={openEditLogoPicker}>
                  {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                </ActionButton>
                <HiddenFileInput
                  ref={editLogoInputRef}
                  id="team-edit-logo-input"
                  type="file"
                  accept="image/*"
                  onChange={handleEditLogoUpload}
                  disabled={isUploadingLogo}
                />
                <div style={{ color: '#c9c9c9', fontSize: '0.8rem' }}>or drag & drop image here</div>
              </UploadRow>
            </ModalField>

            <ModalField>
              <ModalLabel>Team Name</ModalLabel>
              <ModalInput
                value={editTeamForm.name}
                onChange={(e) => handleEditField('name', e.target.value)}
                maxLength={50}
              />
            </ModalField>

            <ModalField>
              <ModalLabel>Tag</ModalLabel>
              <ModalInput
                value={editTeamForm.tag}
                onChange={(e) => handleEditField('tag', e.target.value.toUpperCase())}
                maxLength={5}
              />
            </ModalField>

            <ModalField>
              <ModalLabel>Game</ModalLabel>
              <ModalInput
                value={editTeamForm.game}
                onChange={(e) => handleEditField('game', e.target.value)}
              />
            </ModalField>

            <ModalField>
              <ModalLabel>Description</ModalLabel>
              <ModalTextarea
                value={editTeamForm.description}
                onChange={(e) => handleEditField('description', e.target.value)}
                maxLength={500}
              />
            </ModalField>

            <ModalField>
              <InlineCheckbox>
                <input
                  type="checkbox"
                  checked={Boolean(editTeamForm.isPrivate)}
                  onChange={(e) => handleEditField('isPrivate', e.target.checked)}
                />
                Private team (invite only)
              </InlineCheckbox>
            </ModalField>

            <ModalField>
              <InlineCheckbox>
                <input
                  type="checkbox"
                  checked={Boolean(editTeamForm.requiresApproval)}
                  onChange={(e) => handleEditField('requiresApproval', e.target.checked)}
                />
                Require approval for joining
              </InlineCheckbox>
            </ModalField>

            <ModalActionRow>
              <ActionButton
                $variant="secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditTeamForm(null);
                }}
              >
                Cancel
              </ActionButton>
              <ActionButton
                $variant="brand"
                onClick={handleSaveTeamEdit}
                disabled={updateTeamMutation.isPending}
              >
                {updateTeamMutation.isPending ? 'Saving...' : 'Save Changes'}
              </ActionButton>
            </ModalActionRow>
            </ModalCard>
          </div>
        </ModalOverlay>
      )}

      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTeam={handleCreateTeam}
        tournaments={tournaments}
      />
    </PageShell>
  );
};

export default TeamsPage;
