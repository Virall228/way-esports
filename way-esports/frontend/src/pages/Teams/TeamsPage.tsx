import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNotifications } from '../../contexts/NotificationContext';

const Container = styled.div`
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 20px;
`;

const TitleContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Title = styled.h1`
  color: #fff;
  margin: 0;
  font-size: 36px;
  background: linear-gradient(135deg, #ff6b00, #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(255, 107, 0, 0.3);
  font-weight: 800;
  letter-spacing: 2px;
`;

const Description = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  margin: 8px 0 0 0;
  max-width: 600px;
  line-height: 1.6;
  font-weight: 400;
`;

const CreateTeamButton = styled.button`
  background: linear-gradient(135deg, #FF6B00, #FFD700);
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  color: #000;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255, 107, 0, 0.4);
  }
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  gap: 10px;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => 
    $active ? 'linear-gradient(135deg, #ff6b00, #ff8533)' : 'rgba(42, 42, 42, 0.8)'};
  color: ${({ $active }) => $active ? '#000000' : '#ffffff'};
  border: 1px solid ${({ $active }) => $active ? '#ff6b00' : 'rgba(255, 107, 0, 0.3)'};
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: ${({ $active }) => 
      $active ? 'linear-gradient(135deg, #ff8533, #ff9f66)' : 'rgba(255, 107, 0, 0.1)'};
    transform: translateY(-2px);
  }
`;

const FilterContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
`;

const Select = styled.select`
  background: rgba(26, 26, 26, 0.8);
  color: #ffffff;
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(255, 107, 0, 0.6);
  }

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }

  option {
    background: #1a1a1a;
    color: #ffffff;
  }
`;

const TeamsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
`;

const TeamCard = styled.div`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(255, 107, 0, 0.2);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #ff6b00, #ff8533);
  }
`;

const TeamHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
`;

const TeamLogo = styled.div<{ $logo?: string }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${({ $logo }) => $logo ? `url(${$logo})` : 'linear-gradient(135deg, #ff6b00, #ffd700)'};
  background-size: cover;
  background-position: center;
  border: 3px solid rgba(255, 107, 0, 0.3);
`;

const TeamInfo = styled.div`
  flex: 1;
`;

const TeamName = styled.h3`
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
`;

const TeamTag = styled.div`
  color: #ff6b00;
  font-size: 14px;
  font-weight: 500;
`;

const TeamStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 16px 0;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #ff6b00;
`;

const StatLabel = styled.div`
  color: #cccccc;
  font-size: 12px;
  margin-top: 4px;
`;

const TeamMembers = styled.div`
  margin: 16px 0;
`;

const MembersTitle = styled.h4`
  color: #ffffff;
  font-size: 14px;
  margin: 0 0 8px 0;
`;

const MemberList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MemberTag = styled.div`
  background: rgba(255, 107, 0, 0.2);
  color: #ff6b00;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const TeamActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${({ $variant }) => 
    $variant === 'danger' ? 'linear-gradient(135deg, #ff4757, #ff6b7a)' :
    $variant === 'secondary' ? 'rgba(255, 255, 255, 0.1)' :
    'linear-gradient(135deg, #ff6b00, #ff8533)'};
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
  }
`;

// Rankings styles
const RankingCard = styled.div<{ $rank: number }>`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid ${({ $rank }) => 
    $rank === 1 ? 'rgba(255, 215, 0, 0.5)' :
    $rank === 2 ? 'rgba(192, 192, 192, 0.5)' :
    $rank === 3 ? 'rgba(205, 127, 50, 0.5)' : 'rgba(255, 107, 0, 0.2)'};
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${({ $rank }) => 
      $rank === 1 ? 'linear-gradient(90deg, #ffd700, #ffed4e)' :
      $rank === 2 ? 'linear-gradient(90deg, #c0c0c0, #e0e0e0)' :
      $rank === 3 ? 'linear-gradient(90deg, #cd7f32, #daa520)' : 'linear-gradient(90deg, #ff6b00, #ff8533)'};
  }
`;

const RankBadge = styled.div<{ $rank: number }>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  background: ${({ $rank }) => 
    $rank === 1 ? 'linear-gradient(135deg, #ffd700, #ffed4e)' :
    $rank === 2 ? 'linear-gradient(135deg, #c0c0c0, #e0e0e0)' :
    $rank === 3 ? 'linear-gradient(135deg, #cd7f32, #daa520)' : 'linear-gradient(135deg, #ff6b00, #ff8533)'};
  color: ${({ $rank }) => $rank <= 3 ? '#000000' : '#ffffff'};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const EntityInfo = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const EntityAvatar = styled.div<{ $imageUrl?: string }>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${({ $imageUrl }) => $imageUrl ? `url(${$imageUrl})` : 'linear-gradient(135deg, #ff6b00, #ffd700)'};
  background-size: cover;
  background-position: center;
  border: 2px solid rgba(255, 107, 0, 0.3);
`;

const EntityDetails = styled.div`
  flex: 1;
`;

const EntityName = styled.div`
  color: #ffffff;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
`;

const EntityTag = styled.div`
  color: #ff6b00;
  font-size: 14px;
  font-weight: 500;
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 30px;
  align-items: center;
`;

const StatItemRanking = styled.div`
  text-align: center;
`;

const StatValueRanking = styled.div`
  color: #ffffff;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
`;

const StatLabelRanking = styled.div`
  color: #cccccc;
  font-size: 12px;
`;

const ProgressBar = styled.div`
  width: 100px;
  height: 8px;
  background: rgba(128, 128, 128, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 4px;
`;

const ProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  background: linear-gradient(90deg, #ff6b00, #ff8533);
  width: ${({ $percentage }) => Math.min($percentage, 100)}%;
  transition: width 0.3s ease;
`;

const Modal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${({ $isOpen }) => $isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.95), rgba(26, 26, 26, 0.95));
  border-radius: 16px;
  padding: 32px;
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 2px solid #ff6b00;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: #ffffff;
  font-weight: 500;
  font-size: 14px;
`;

const Input = styled.input`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }
`;

const TextArea = styled.textarea`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${({ $variant }) => 
    $variant === 'danger' ? 'linear-gradient(135deg, #ff4757, #ff6b7a)' :
    $variant === 'secondary' ? 'rgba(255, 255, 255, 0.1)' :
    'linear-gradient(135deg, #ff6b00, #ff8533)'};
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
  }
`;

const InviteSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const InviteInput = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

interface Team {
  id: string;
  name: string;
  tag: string;
  logo?: string;
  description: string;
  game: string;
  members: string[];
  maxMembers: number;
  captain: string;
  stats: {
    tournaments: number;
    wins: number;
    winRate: number;
  };
  status: 'recruiting' | 'full' | 'closed';
  createdAt: string;
}

interface RankingEntity {
  id: string;
  name: string;
  tag?: string;
  avatar?: string;
  rank: number;
  rating: number;
  matches: number;
  wins: number;
  winRate: number;
  totalPrize?: number;
  tournamentWins?: number;
  recentForm: ('W' | 'L')[];
  lastActive: string;
}

type MainTab = 'teams' | 'rankings';
type TeamFilter = 'all' | 'recruiting' | 'full';
type TimeFrame = 'all' | 'month' | 'week';
type GameFilter = 'all' | 'valorant' | 'csgo' | 'criticalops';

const TeamsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('teams');
  const [teams, setTeams] = useState<Team[]>([]);
  const [rankings, setRankings] = useState<RankingEntity[]>([]);
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('all');
  const [gameFilter, setGameFilter] = useState<GameFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const { addNotification } = useNotifications();

  // Mock data
  useEffect(() => {
    const mockTeams: Team[] = [
      {
        id: '1',
        name: 'WAY Warriors',
        tag: 'WAY',
        logo: '/images/team1.jpg',
        description: 'Elite Valorant team representing WAY Esports',
        game: 'Valorant',
        members: ['Captain', 'Player1', 'Player2', 'Player3'],
        maxMembers: 5,
        captain: 'Captain',
        stats: {
          tournaments: 15,
          wins: 12,
          winRate: 80
        },
        status: 'recruiting',
        createdAt: '2024-01-01'
      },
      {
        id: '2',
        name: 'Critical Strike',
        tag: 'CS',
        logo: '/images/team2.jpg',
        description: 'Professional Critical Ops team',
        game: 'Critical Ops',
        members: ['Leader', 'Sniper', 'Rusher', 'Support', 'Flex'],
        maxMembers: 5,
        captain: 'Leader',
        stats: {
          tournaments: 8,
          wins: 6,
          winRate: 75
        },
        status: 'full',
        createdAt: '2024-01-05'
      }
    ];

    const mockRankings: RankingEntity[] = [
      {
        id: '1',
        name: 'WAY Warriors',
        tag: 'WAY',
        avatar: '/images/team1.jpg',
        rank: 1,
        rating: 1850,
        matches: 45,
        wins: 38,
        winRate: 84.4,
        totalPrize: 25000,
        tournamentWins: 8,
        recentForm: ['W', 'W', 'L', 'W', 'W'],
        lastActive: '2024-01-15'
      },
      {
        id: '2',
        name: 'Critical Strike',
        tag: 'CS',
        avatar: '/images/team2.jpg',
        rank: 2,
        rating: 1780,
        matches: 32,
        wins: 26,
        winRate: 81.3,
        totalPrize: 18000,
        tournamentWins: 5,
        recentForm: ['W', 'L', 'W', 'W', 'L'],
        lastActive: '2024-01-14'
      }
    ];

    setTeams(mockTeams);
    setRankings(mockRankings);
  }, []);

  const handleCreateTeam = () => {
    setEditingTeam(null);
    setIsModalOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const handleDeleteTeam = (id: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      setTeams(prev => prev.filter(team => team.id !== id));
      addNotification({
        type: 'success',
        title: 'Team Deleted',
        message: 'The team has been successfully deleted.'
      });
    }
  };

  const handleInviteMember = (teamId: string) => {
    if (inviteEmail.trim()) {
      addNotification({
        type: 'success',
        title: 'Invitation Sent',
        message: `Invitation sent to ${inviteEmail}`
      });
      setInviteEmail('');
    }
  };

  const handleSaveTeam = (formData: any) => {
    if (editingTeam) {
      setTeams(prev => prev.map(team =>
        team.id === editingTeam.id
          ? { ...team, ...formData, id: team.id }
          : team
      ));
      addNotification({
        type: 'success',
        title: 'Team Updated',
        message: 'The team has been successfully updated.'
      });
    } else {
      const newTeam: Team = {
        ...formData,
        id: Date.now().toString(),
        members: [formData.captain],
        stats: {
          tournaments: 0,
          wins: 0,
          winRate: 0
        },
        status: 'recruiting',
        createdAt: new Date().toISOString()
      };
      setTeams(prev => [newTeam, ...prev]);
      addNotification({
        type: 'success',
        title: 'Team Created',
        message: 'The team has been successfully created.'
      });
    }
    setIsModalOpen(false);
  };

  const renderTeams = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#ffffff', margin: 0 }}>Teams</h3>
        <CreateTeamButton onClick={handleCreateTeam}>Create Team</CreateTeamButton>
      </div>
      
      <FilterContainer>
        <Select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value as TeamFilter)}>
          <option value="all">All Teams</option>
          <option value="recruiting">Recruiting</option>
          <option value="full">Full</option>
        </Select>
      </FilterContainer>
      
      <TeamsGrid>
        {teams.map(team => (
          <TeamCard key={team.id}>
            <TeamHeader>
              <TeamLogo $logo={team.logo} />
              <TeamInfo>
                <TeamName>{team.name}</TeamName>
                <TeamTag>#{team.tag}</TeamTag>
              </TeamInfo>
            </TeamHeader>

            <p style={{ color: '#cccccc', fontSize: '14px', margin: '8px 0' }}>
              {team.description}
            </p>

            <TeamStats>
              <StatItem>
                <StatValue>{team.stats.tournaments}</StatValue>
                <StatLabel>Tournaments</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{team.stats.wins}</StatValue>
                <StatLabel>Wins</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{team.stats.winRate}%</StatValue>
                <StatLabel>Win Rate</StatLabel>
              </StatItem>
            </TeamStats>

            <TeamMembers>
              <MembersTitle>Members ({team.members.length}/{team.maxMembers})</MembersTitle>
              <MemberList>
                {team.members.map((member, index) => (
                  <MemberTag key={index}>
                    {member} {member === team.captain ? '(C)' : ''}
                  </MemberTag>
                ))}
              </MemberList>
            </TeamMembers>

            {team.status === 'recruiting' && (
              <InviteSection>
                <MembersTitle>Invite New Member</MembersTitle>
                <InviteInput>
                  <Input
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <ActionButton onClick={() => handleInviteMember(team.id)}>
                    Invite
                  </ActionButton>
                </InviteInput>
              </InviteSection>
            )}

            <TeamActions>
              <ActionButton onClick={() => handleEditTeam(team)}>
                Edit
              </ActionButton>
              <ActionButton $variant="secondary">
                View Details
              </ActionButton>
              <ActionButton $variant="danger" onClick={() => handleDeleteTeam(team.id)}>
                Delete
              </ActionButton>
            </TeamActions>
          </TeamCard>
        ))}
      </TeamsGrid>
    </div>
  );

  const renderRankings = () => (
    <div>
      <h3 style={{ color: '#ffffff', marginBottom: '20px' }}>Team Rankings</h3>
      
      <FilterContainer>
        <Select value={timeFrame} onChange={(e) => setTimeFrame(e.target.value as TimeFrame)}>
          <option value="all">All Time</option>
          <option value="month">This Month</option>
          <option value="week">This Week</option>
        </Select>
        
        <Select value={gameFilter} onChange={(e) => setGameFilter(e.target.value as GameFilter)}>
          <option value="all">All Games</option>
          <option value="valorant">Valorant</option>
          <option value="csgo">CS:GO</option>
          <option value="criticalops">Critical Ops</option>
        </Select>
      </FilterContainer>
      
      <div>
        {rankings.map(entity => (
          <RankingCard key={entity.id} $rank={entity.rank}>
            <RankBadge $rank={entity.rank}>
              {entity.rank}
            </RankBadge>
            
            <EntityInfo>
              <EntityAvatar $imageUrl={entity.avatar} />
              <EntityDetails>
                <EntityName>{entity.name}</EntityName>
                {entity.tag && <EntityTag>#{entity.tag}</EntityTag>}
              </EntityDetails>
            </EntityInfo>
            
            <StatsContainer>
              <StatItemRanking>
                <StatValueRanking>{entity.rating}</StatValueRanking>
                <StatLabelRanking>Rating</StatLabelRanking>
              </StatItemRanking>
              
              <StatItemRanking>
                <StatValueRanking>{entity.matches}</StatValueRanking>
                <StatLabelRanking>Matches</StatLabelRanking>
              </StatItemRanking>
              
              <StatItemRanking>
                <StatValueRanking>{entity.winRate}%</StatValueRanking>
                <StatLabelRanking>Win Rate</StatLabelRanking>
                <ProgressBar>
                  <ProgressFill $percentage={entity.winRate} />
                </ProgressBar>
              </StatItemRanking>
              
              {entity.totalPrize && (
                <StatItemRanking>
                  <StatValueRanking>${entity.totalPrize.toLocaleString()}</StatValueRanking>
                  <StatLabelRanking>Prize Money</StatLabelRanking>
                </StatItemRanking>
              )}
            </StatsContainer>
          </RankingCard>
        ))}
      </div>
    </div>
  );

  return (
    <Container>
      <Header>
        <TitleContainer>
          <Title>WAY Ranked</Title>
          <Description>
            A modern ranking system for tracking player and team performance across the platform. 
            Compete, climb the leaderboards, and establish your dominance in the esports community.
          </Description>
        </TitleContainer>
      </Header>

      <TabContainer>
        <Tab $active={activeTab === 'teams'} onClick={() => setActiveTab('teams')}>
          Teams
        </Tab>
        <Tab $active={activeTab === 'rankings'} onClick={() => setActiveTab('rankings')}>
          Rankings
        </Tab>
      </TabContainer>

      {activeTab === 'teams' ? renderTeams() : renderRankings()}

      <Modal $isOpen={isModalOpen} onClick={() => setIsModalOpen(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <h2 style={{ color: '#ffffff', marginBottom: '24px' }}>
            {editingTeam ? 'Edit Team' : 'Create New Team'}
          </h2>
          <Form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSaveTeam({
              name: formData.get('name'),
              tag: formData.get('tag'),
              description: formData.get('description'),
              game: formData.get('game'),
              maxMembers: parseInt(formData.get('maxMembers')?.toString() || '5'),
              captain: formData.get('captain'),
              logo: formData.get('logo')
            });
          }}>
            <FormGroup>
              <Label>Team Name</Label>
              <Input
                name="name"
                defaultValue={editingTeam?.name}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Team Tag</Label>
              <Input
                name="tag"
                defaultValue={editingTeam?.tag}
                maxLength={4}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Description</Label>
              <TextArea
                name="description"
                defaultValue={editingTeam?.description}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Game</Label>
              <Select name="game" defaultValue={editingTeam?.game || 'valorant'}>
                <option value="valorant">Valorant</option>
                <option value="csgo">CS:GO</option>
                <option value="criticalops">Critical Ops</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Max Members</Label>
              <Input
                name="maxMembers"
                type="number"
                min="1"
                max="10"
                defaultValue={editingTeam?.maxMembers || 5}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Captain</Label>
              <Input
                name="captain"
                defaultValue={editingTeam?.captain}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Logo URL</Label>
              <Input
                name="logo"
                type="url"
                defaultValue={editingTeam?.logo}
              />
            </FormGroup>
            
            <ButtonGroup>
              <Button type="submit">
                {editingTeam ? 'Update Team' : 'Create Team'}
              </Button>
              <Button type="button" $variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default TeamsPage; 