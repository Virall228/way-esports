import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import CreateTeamModal from '../../components/Teams/CreateTeamModal';
import { api } from '../../services/api';

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

const Header = styled.div`
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

const CreateTeamButton = styled.button`
  background: ${({ theme }) => theme.colors.gray[800]};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  font-size: 1rem;
  min-height: 44px;
  width: 100%;
  max-width: 420px;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: auto;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ theme }) => theme.colors.gray[700]};
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }
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

const FilterTab = styled.button<{ $active: boolean }>`
  background: ${({ $active, theme }) => $active ? theme.colors.gray[800] : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.white : theme.colors.text.secondary};
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors.border.strong : 'rgba(255, 255, 255, 0.2)'};
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 44px;
  white-space: nowrap;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ $active, theme }) => $active ? theme.colors.gray[700] : 'rgba(255, 255, 255, 0.1)'};
      transform: translateY(-2px);
    }
  }
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

const TeamCard = styled.div`
  background: ${({ theme }) => theme.colors.bg.secondary};
  border-radius: 16px;
  padding: 25px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
      border-color: ${({ theme }) => theme.colors.border.medium};
    }
  }

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

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' | 'danger' }>`
  flex: 1;
  padding: 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 44px;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, ${'${({ theme }) => theme.colors.gray[700]}'}, ${'${({ theme }) => theme.colors.gray[900]}'});
          color: white;
          border: none;
          
          @media (hover: hover) and (pointer: fine) {
            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
            }
          }
        `;
      case 'secondary':
        return `
          background: rgba(255, 255, 255, 0.1);
          color: #cccccc;
          border: 1px solid rgba(255, 255, 255, 0.2);
          
          @media (hover: hover) and (pointer: fine) {
            &:hover {
              background: rgba(255, 255, 255, 0.2);
              color: #ffffff;
            }
          }
        `;
      case 'danger':
        return `
          background: rgba(244, 67, 54, 0.08);
          color: #F44336;
          border: 1px solid rgba(244, 67, 54, 0.25);
          
          @media (hover: hover) and (pointer: fine) {
            &:hover {
              background: rgba(244, 67, 54, 0.15);
            }
          }
        `;
    }
  }}
`;

interface Team {
  id: string;
  name: string;
  tag: string;
  game: string;
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

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);

      const res: any = await api.get('/api/teams');
      const items: any[] = (res && (res.data || res.teams)) || [];

      const mapped: Team[] = items.map((t: any) => {
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
          description: t.description || '',
          members,
          tournaments: Number(t.tournaments) || 0,
          wins: Number(t.stats?.wins) || Number(t.wins) || 0,
          winRate: Number(t.stats?.winRate) || Number(t.winRate) || 0,
          isOwner: false
        };
      });

      setTeams(mapped);
    } catch (e: any) {
      setError(e?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateTeam = async (teamData: any) => {
    try {
      setError(null);
      await api.post('/api/teams', {
        name: teamData?.name,
        tag: teamData?.tag,
        game: teamData?.game,
        description: teamData?.description,
        isPrivate: Boolean(teamData?.isPrivate),
        requiresApproval: Boolean(teamData?.requiresApproval)
      });
      await fetchTeams();
    } catch (e: any) {
      setError(e?.message || 'Failed to create team');
    }
  };

  const handleJoinTeam = (teamId: string) => {
    console.log('Joining team:', teamId);
    // Handle team join logic
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
                .filter((team) => selectedGame === 'all' ? true : team.game.toLowerCase().includes(selectedGame.replace('-', ' ')))
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
                          <ActionButton $variant="primary" onClick={() => handleViewDetails(team.id)}>
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
                          <ActionButton $variant="primary" onClick={() => handleJoinTeam(team.id)}>
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
      />
    </Container>
  );
};

export default TeamsPage;