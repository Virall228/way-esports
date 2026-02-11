import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CreateTeamModal from '../../components/Teams/CreateTeamModal';
import { teamsService } from '../../services/teamsService';
import { tournamentService } from '../../services/tournamentService';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

const Container = styled.div`
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
  color: #ffffff;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 1.5rem;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    padding: 2.5rem;
  }
`;

const Header = styled(Card).attrs({ variant: 'elevated' })`
  background: ${({ theme }) => theme.colors.bg.secondary};
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  position: relative;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 2rem;
    margin-bottom: 2rem;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    padding: 2.5rem;
    margin-bottom: 2.5rem;
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 15px;
`;

const Subtitle = styled.p`
  color: #cccccc;
  font-size: 1.2rem;
  line-height: 1.6;
  max-width: 800px;
`;

const CreateTeamButton = styled(Button).attrs({ variant: 'brand', size: 'small' })`
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
  min-height: 44px;
  width: 100%;
  max-width: 420px;

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
  gap: 10px;
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

const FilterDropdown = styled.select`
  background: ${({ theme }) => theme.colors.bg.secondary};
  color: #ffffff;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  width: 100%;
  max-width: 420px;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: auto;
    min-width: 180px;
  }

  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.border.strong}; }

  option {
    background: #2a2a2a;
    color: #ffffff;
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
  background: ${({ theme }) => theme.colors.bg.secondary};
  border-radius: 16px;
  padding: 25px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${({ theme }) => theme.colors.gray[700]}, ${({ theme }) => theme.colors.gray[900]});
  }
`;

const TeamHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
`;

const TeamAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.gray[700]}, ${({ theme }) => theme.colors.gray[900]});
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  font-weight: bold;
`;

const TeamInfo = styled.div`
  flex: 1;
`;

const TeamName = styled.h3`
  color: #ffffff;
  margin-bottom: 5px;
  font-size: 1.3rem;
`;

const TeamTag = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: 600;
  font-size: 0.9rem;
`;

const TeamDescription = styled.p`
  color: #cccccc;
  margin-bottom: 20px;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const TeamStats = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const StatItem = styled.div`
  text-align: center;
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
  margin-bottom: 20px;
`;

const MembersTitle = styled.div`
  color: #ffffff;
  font-weight: 600;
  margin-bottom: 10px;
  font-size: 0.9rem;
`;

const Members = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MemberTag = styled.span<{ $role: 'captain' | 'player' }>`
  background: ${({ $role, theme }) => $role === 'captain' ? 'rgba(255,255,255,0.12)' : 'rgba(255, 255, 255, 0.06)'};
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled(Button).attrs<{ $variant: 'brand' | 'secondary' | 'danger' }>((props) => ({
  variant: props.$variant,
  size: 'small'
})) <{ $variant: 'brand' | 'secondary' | 'danger' }>`
  flex: 1;
  padding: 0.75rem;
  min-height: 44px;
`;

interface Team {
  id: string;
  name: string;
  tag: string;
  game: string;
  tournamentId?: string | null;
  description: string;
  members: Array<{ name: string; role: 'captain' | 'player' }>;
  tournaments: number;
  wins: number;
  winRate: number;
  isOwner?: boolean;
}

const TeamsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('teams');
  const [selectedGame, setSelectedGame] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

      const members: Array<{ name: string; role: 'captain' | 'player' }> = membersRaw.map((m: any) => {
        const id = (m?.id || m?._id || '').toString();
        const label = (m?.username || m?.firstName || m?.lastName || id || 'Member').toString();
        const role: 'captain' | 'player' = captainId && id === captainId ? 'captain' : 'player';
        return { name: label, role };
      });

      if (t.captain && captainId && !members.some((m: any) => m.role === 'captain')) {
        const captainName = (t.captain.username || t.captain.firstName || t.captain.lastName || 'Captain').toString();
        members.unshift({ name: captainName, role: 'captain' });
      }

      return {
        id: (t.id || t._id || '').toString(),
        name: t.name || '',
        tag: t.tag || '',
        game: t.game || '',
        tournamentId: t.tournamentId || null,
        description: t.description || '',
        members,
        tournaments: Number(t.tournaments) || 0,
        wins: Number(t.stats?.wins) || Number(t.wins) || 0,
        winRate: Number(t.stats?.winRate) || Number(t.winRate) || 0,
        isOwner: false
      } as Team;
    });
  }, [teamsRaw]);

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
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (e: any) => {
      setActionError(e?.message || 'Failed to create team');
    }
  });

  const joinTeamMutation = useMutation({
    mutationFn: (payload: any) => teamsService.join(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (e: any) => {
      setActionError(e?.message || 'Failed to join team');
    }
  });

  const error = actionError || (queryError as Error | null)?.message || null;

  const handleCreateTeam = async (teamData: any) => {
    try {
      setActionError(null);
      await createTeamMutation.mutateAsync({
        name: teamData?.name,
        tag: teamData?.tag,
        game: teamData?.game,
        tournamentId: teamData?.tournamentId,
        description: teamData?.description,
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
      setActionError(null);
      await joinTeamMutation.mutateAsync({
        teamId: team.id,
        tournamentId: team.tournamentId
      });
    } catch (e: any) {
      setActionError(e?.message || 'Failed to join team');
    }
  };

  const handleViewDetails = (teamId: string) => {
    window.location.href = `/team/${teamId}`;
  };

  const handleEditTeam = (teamId: string) => {
    console.log('Editing team:', teamId);
    // Handle edit team logic
  };

  const handleDeleteTeam = (teamId: string) => {
    console.log('Deleting team:', teamId);
    // Handle delete team logic
  };

  return (
    <Container>
      <Header>
        <HeaderContent>
          <Title>WAY Ranked</Title>
          <Subtitle>
            A modern ranking system for tracking player and team performance across the platform.
            Compete, climb the leaderboards, and establish your dominance in the esports community.
          </Subtitle>
        </HeaderContent>
      </Header>

      <FilterSection>
        <FilterTabs>
          <FilterTab
            $active={activeFilter === 'teams'}
            onClick={() => setActiveFilter('teams')}
          >
            Teams
          </FilterTab>
          <FilterTab
            $active={activeFilter === 'rankings'}
            onClick={() => setActiveFilter('rankings')}
          >
            Rankings
          </FilterTab>
        </FilterTabs>
        <FilterDropdown
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value)}
        >
          <option value="all">All Teams</option>
          <option value="valorant">Valorant</option>
          <option value="critical-ops">Critical Ops</option>
          <option value="cs2">CS2</option>
        </FilterDropdown>
        <CreateTeamButton onClick={() => setIsCreateModalOpen(true)}>
          Create Team
        </CreateTeamButton>
      </FilterSection>

      {activeFilter === 'teams' && (
        <>
          {error && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#e57373' }}>
              {error}
            </div>
          )}

          {loading && !error && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#cccccc' }}>
              Loading...
            </div>
          )}

          {!loading && !error && (
            <TeamsGrid>
              {teams
                .filter((team) => {
                  if (selectedGame === 'all') return true;
                  const safeGame = (team.game || '').toLowerCase();
                  return safeGame.includes(selectedGame.replace('-', ' '));
                })
                .map(team => (
                  <TeamCard key={team.id}>
                    <TeamHeader>
                      <TeamAvatar>{team.tag.replace('#', '')}</TeamAvatar>
                      <TeamInfo>
                        <TeamName>{team.name}</TeamName>
                        <TeamTag>{team.tag}</TeamTag>
                      </TeamInfo>
                    </TeamHeader>

                    <TeamDescription>{team.description}</TeamDescription>

                    <TeamStats>
                      <StatItem>
                        <StatValue>{team.tournaments}</StatValue>
                        <StatLabel>Tournaments</StatLabel>
                      </StatItem>
                      <StatItem>
                        <StatValue>{team.wins}</StatValue>
                        <StatLabel>Wins</StatLabel>
                      </StatItem>
                      <StatItem>
                        <StatValue>{team.winRate}%</StatValue>
                        <StatLabel>Win Rate</StatLabel>
                      </StatItem>
                    </TeamStats>

                    <MembersList>
                      <MembersTitle>Members ({team.members.length}/5)</MembersTitle>
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
                            Edit
                          </ActionButton>
                          <ActionButton $variant="brand" onClick={() => handleViewDetails(team.id)}>
                            View Details
                          </ActionButton>
                          <ActionButton $variant="danger" onClick={() => handleDeleteTeam(team.id)}>
                            Delete
                          </ActionButton>
                        </>
                      ) : (
                        <>
                          <ActionButton $variant="secondary" onClick={() => handleViewDetails(team.id)}>
                            View Details
                          </ActionButton>
                          <ActionButton $variant="brand" onClick={() => handleJoinTeam(team)}>
                            Join Team
                          </ActionButton>
                        </>
                      )}
                    </ActionButtons>
                  </TeamCard>
                ))}
            </TeamsGrid>
          )}
        </>
      )}

      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTeam={handleCreateTeam}
        tournaments={tournaments}
      />
    </Container>
  );
};

export default TeamsPage;
