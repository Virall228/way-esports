import React, { useState } from 'react';
import styled from 'styled-components';
import CreateTeamModal from '../../components/Teams/CreateTeamModal';

const Container = styled.div`
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;
  color: #ffffff;
`;

const Header = styled.div`
  background: #2a2a2a;
  border-radius: 16px;
  padding: 40px;
  margin-bottom: 40px;
  position: relative;
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: #ff6b00;
  margin-bottom: 15px;
`;

const Subtitle = styled.p`
  color: #cccccc;
  font-size: 1.2rem;
  line-height: 1.6;
  max-width: 800px;
`;

const CreateTeamButton = styled.button`
  background: #ff6b00;
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  font-size: 1rem;

  &:hover {
    background: #E55A00;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 107, 0, 0.4);
  }
`;

const FilterSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 10px;
`;

const FilterTab = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => 
    $active ? '#ff6b00' : 'transparent'};
  color: ${({ $active }) => $active ? '#ffffff' : '#cccccc'};
  border: 1px solid ${({ $active }) => $active ? '#ff6b00' : 'rgba(255, 255, 255, 0.2)'};
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ $active }) => 
      $active ? '#ff6b00' : 'rgba(255, 255, 255, 0.1)'};
    transform: translateY(-2px);
  }
`;

const FilterDropdown = styled.select`
  background: #2a2a2a;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #ff6b00;
  }

  option {
    background: #2a2a2a;
    color: #ffffff;
  }
`;

const TeamsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
`;

const TeamCard = styled.div`
  background: #2a2a2a;
  border-radius: 16px;
  padding: 25px;
  border: 1px solid rgba(255, 107, 0, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(255, 107, 0, 0.2);
    border-color: rgba(255, 107, 0, 0.4);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #ff6b00, #ff4757);
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
  background: linear-gradient(135deg, #ff6b00, #ff4757);
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
  color: #ff6b00;
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
  color: #ff6b00;
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
  background: ${({ $role }) => $role === 'captain' ? 'rgba(255, 107, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${({ $role }) => $role === 'captain' ? '#ff6b00' : '#cccccc'};
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
  padding: 10px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #ff6b00, #ff4757);
          color: white;
          border: none;
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(255, 107, 0, 0.4);
          }
        `;
      case 'secondary':
        return `
          background: rgba(255, 255, 255, 0.1);
          color: #cccccc;
          border: 1px solid rgba(255, 255, 255, 0.2);
          
          &:hover {
            background: rgba(255, 255, 255, 0.2);
            color: #ffffff;
          }
        `;
      case 'danger':
        return `
          background: rgba(244, 67, 54, 0.1);
          color: #F44336;
          border: 1px solid rgba(244, 67, 54, 0.3);
          
          &:hover {
            background: rgba(244, 67, 54, 0.2);
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

const mockTeams: Team[] = [
  {
    id: '1',
    name: 'WAY Warriors',
    tag: '#WAY',
    game: 'Valorant',
    description: 'Elite Valorant team representing WAY Esports',
    members: [
      { name: 'Captain (C)', role: 'captain' },
      { name: 'Player1', role: 'player' },
      { name: 'Player2', role: 'player' },
      { name: 'Player3', role: 'player' }
    ],
    tournaments: 15,
    wins: 12,
    winRate: 80,
    isOwner: true
  },
  {
    id: '2',
    name: 'Critical Strike',
    tag: '#CS',
    game: 'Critical Ops',
    description: 'Professional Critical Ops team',
    members: [
      { name: 'Leader (C)', role: 'captain' },
      { name: 'Sniper', role: 'player' },
      { name: 'Rusher', role: 'player' },
      { name: 'Support', role: 'player' },
      { name: 'Flex', role: 'player' }
    ],
    tournaments: 8,
    wins: 6,
    winRate: 75
  }
];

const TeamsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('teams');
  const [selectedGame, setSelectedGame] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateTeam = (teamData: any) => {
    console.log('Creating team:', teamData);
    // Here you would typically send the data to your backend
  };

  const handleJoinTeam = (teamId: string) => {
    console.log('Joining team:', teamId);
    // Handle team join logic
  };

  const handleViewDetails = (teamId: string) => {
    console.log('Viewing team details:', teamId);
    // Handle view details logic
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
        <TeamsGrid>
          {mockTeams.map(team => (
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

      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTeam={handleCreateTeam}
      />
    </Container>
  );
};

export default TeamsPage;