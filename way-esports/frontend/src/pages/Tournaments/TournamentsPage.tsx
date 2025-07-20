import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNotifications } from '../../contexts/NotificationContext';

const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: url('/images/Global2.jpg') center/cover no-repeat fixed;
  min-height: 100vh;
  position: relative;
  z-index: 0;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(20, 20, 20, 0.8); /* increased overlay for better readability */
    z-index: 1;
    pointer-events: none;
  }

  > * {
    position: relative;
    z-index: 2;
  }
`;

const Header = styled.div`
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 2px solid #ff0000;
`;

const Title = styled.h1`
  color: #ffffff;
  margin: 0;
  font-size: 32px;
  background: linear-gradient(135deg, #ff0000, #ff69b4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  gap: 10px;
  flex-wrap: wrap;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => 
    $active ? 'linear-gradient(135deg, #ff0000, #ff69b4)' : 'rgba(42, 42, 42, 0.8)'};
  color: ${({ $active }) => $active ? '#000000' : '#ffffff'};
  border: 1px solid ${({ $active }) => $active ? '#ff0000' : 'rgba(255, 0, 0, 0.3)'};
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: ${({ $active }) => 
      $active ? 'linear-gradient(135deg, #ff69b4, #ff1493)' : 'rgba(255, 0, 0, 0.1)'};
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
  border: 1px solid rgba(255, 0, 0, 0.3);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(255, 0, 0, 0.6);
  }

  &:focus {
    outline: none;
    border-color: #ff0000;
    box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.2);
  }

  option {
    background: #1a1a1a;
    color: #ffffff;
  }
`;

const CreateButton = styled.button`
  background: linear-gradient(135deg, #ff0000, #ff69b4);
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255, 0, 0, 0.4);
  }
`;

const TournamentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
`;

const TournamentCard = styled.div<{ $status: string }>`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
  border-radius: 12px;
  padding: 24px;
  border: 1px solid ${({ $status }) => 
    $status === 'active' ? 'rgba(46, 213, 115, 0.3)' :
    $status === 'upcoming' ? 'rgba(255, 107, 0, 0.3)' :
    $status === 'completed' ? 'rgba(128, 128, 128, 0.3)' : 'rgba(255, 107, 0, 0.2)'};
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
    background: ${({ $status }) => 
      $status === 'active' ? 'linear-gradient(90deg, #2ed573, #3ddb7f)' :
      $status === 'upcoming' ? 'linear-gradient(90deg, #ff6b00, #ff8533)' :
      $status === 'completed' ? 'linear-gradient(90deg, #808080, #a0a0a0)' : 'linear-gradient(90deg, #ff6b00, #ff8533)'};
  }
`;

const TournamentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const TournamentInfo = styled.div`
  flex: 1;
`;

const TournamentName = styled.h3`
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const TournamentGame = styled.div`
  color: #ff6b00;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
`;

const TournamentStatus = styled.div<{ $status: string }>`
  color: ${({ $status }) => 
    $status === 'active' ? '#2ed573' :
    $status === 'upcoming' ? '#ff6b00' :
    $status === 'completed' ? '#808080' : '#ff6b00'};
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const TournamentStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 16px 0;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #ff6b00;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  color: #cccccc;
  font-size: 12px;
`;

const TournamentDetails = styled.div`
  margin: 16px 0;
  color: #cccccc;
  font-size: 14px;
  line-height: 1.6;
`;

const TournamentActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
  background: ${({ $variant }) => 
    $variant === 'danger' ? 'linear-gradient(135deg, #ff4757, #ff6b7a)' :
    $variant === 'success' ? 'linear-gradient(135deg, #2ed573, #3ddb7f)' :
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

const BracketContainer = styled.div`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
  border-radius: 12px;
  padding: 24px;
  margin-top: 24px;
  border: 1px solid rgba(255, 107, 0, 0.2);
`;

const BracketTitle = styled.h3`
  color: #ffffff;
  margin: 0 0 20px 0;
  font-size: 18px;
`;

const BracketRound = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

const MatchCard = styled.div<{ $status: string }>`
  background: ${({ $status }) => 
    $status === 'completed' ? 'rgba(46, 213, 115, 0.1)' :
    $status === 'in_progress' ? 'rgba(255, 107, 0, 0.1)' :
    'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${({ $status }) => 
    $status === 'completed' ? 'rgba(46, 213, 115, 0.3)' :
    $status === 'in_progress' ? 'rgba(255, 107, 0, 0.3)' :
    'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TeamInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const TeamName = styled.div<{ $winner?: boolean }>`
  color: ${({ $winner }) => $winner ? '#2ed573' : '#ffffff'};
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
`;

const Score = styled.div`
  color: #ff6b00;
  font-weight: 700;
  font-size: 16px;
  min-width: 30px;
  text-align: center;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(128, 128, 128, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  background: linear-gradient(90deg, #ff6b00, #ff8533);
  width: ${({ $percentage }) => Math.min($percentage, 100)}%;
  transition: width 0.3s ease;
`;

const TournamentDetailsModal = styled.div<{ $isOpen: boolean }>`
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

const TournamentDetailsContent = styled.div`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.95), rgba(26, 26, 26, 0.95));
  border-radius: 16px;
  padding: 32px;
  max-width: 1000px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 2px solid #ff6b00;
`;

const RegisteredTeams = styled.div`
  margin: 24px 0;
`;

const TeamsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const TeamCard = styled.div`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(255, 107, 0, 0.2);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
`;

const TeamTag = styled.div`
  color: #ff6b00;
  font-size: 12px;
  font-weight: 500;
`;

interface Tournament {
  id: string;
  name: string;
  game: string;
  description: string;
  status: 'upcoming' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  maxTeams: number;
  currentTeams: number;
  entryFee: number;
  prizePool: number;
  format: string;
  rules: string;
  registeredTeams: string[];
  bracket?: any;
  createdBy: string;
  createdAt: string;
}

type TournamentTab = 'all' | 'upcoming' | 'active' | 'completed' | 'my-tournaments';

const TournamentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TournamentTab>('all');
  const [gameFilter, setGameFilter] = useState('all');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { addNotification } = useNotifications();

  // Mock data
  useEffect(() => {
    const mockTournaments: Tournament[] = [
      {
        id: '1',
        name: 'WAY Esports Championship 2024',
        game: 'Valorant',
        description: 'The biggest tournament of the year with massive prize pool',
        status: 'upcoming',
        startDate: '2024-02-01T18:00:00Z',
        endDate: '2024-02-15T22:00:00Z',
        maxTeams: 16,
        currentTeams: 8,
        entryFee: 100,
        prizePool: 10000,
        format: 'Single Elimination',
        rules: 'Standard tournament rules apply...',
        registeredTeams: ['WAY Warriors', 'Critical Strike', 'Valorant Elite'],
        bracket: {
          rounds: [
            {
              round: 1,
              matches: [
                { id: '1', team1: 'WAY Warriors', team2: 'Critical Strike', score1: 13, score2: 11, status: 'completed' },
                { id: '2', team1: 'Valorant Elite', team2: 'Team Alpha', score1: 8, score2: 13, status: 'completed' },
                { id: '3', team1: 'Team Beta', team2: 'Team Gamma', score1: 13, score2: 9, status: 'completed' },
                { id: '4', team1: 'Team Delta', team2: 'Team Epsilon', score1: 11, score2: 13, status: 'completed' }
              ]
            },
            {
              round: 2,
              matches: [
                { id: '5', team1: 'WAY Warriors', team2: 'Team Alpha', score1: 13, score2: 10, status: 'completed' },
                { id: '6', team1: 'Team Beta', team2: 'Team Epsilon', score1: 0, score2: 0, status: 'pending' }
              ]
            },
            {
              round: 3,
              matches: [
                { id: '7', team1: 'WAY Warriors', team2: 'TBD', score1: 0, score2: 0, status: 'pending' }
              ]
            }
          ]
        },
        createdBy: 'admin',
        createdAt: '2024-01-01'
      },
      {
        id: '2',
        name: 'Critical Ops Pro League',
        game: 'Critical Ops',
        description: 'Professional league for Critical Ops teams',
        status: 'active',
        startDate: '2024-01-10T18:00:00Z',
        endDate: '2024-01-25T22:00:00Z',
        maxTeams: 8,
        currentTeams: 8,
        entryFee: 50,
        prizePool: 5000,
        format: 'Round Robin',
        rules: 'League format with points system...',
        registeredTeams: ['Critical Strike', 'Pro Team 1', 'Pro Team 2', 'Pro Team 3'],
        bracket: {
          rounds: [
            {
              round: 1,
              matches: [
                { id: '1', team1: 'Critical Strike', team2: 'Pro Team 1', score1: 13, score2: 11, status: 'completed' },
                { id: '2', team1: 'Pro Team 2', team2: 'Pro Team 3', score1: 8, score2: 13, status: 'completed' }
              ]
            }
          ]
        },
        createdBy: 'admin',
        createdAt: '2024-01-05'
      }
    ];

    setTournaments(mockTournaments);
  }, []);

  // Filter tournaments
  useEffect(() => {
    let filtered = tournaments;

    if (activeTab !== 'all') {
      filtered = filtered.filter(tournament => tournament.status === activeTab);
    }

    if (gameFilter !== 'all') {
      filtered = filtered.filter(tournament => tournament.game.toLowerCase() === gameFilter);
    }

    setFilteredTournaments(filtered);
  }, [tournaments, activeTab, gameFilter]);

  const handleCreateTournament = () => {
    setEditingTournament(null);
    setIsModalOpen(true);
  };

  const handleEditTournament = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setIsModalOpen(true);
  };

  const handleDeleteTournament = (id: string) => {
    if (window.confirm('Are you sure you want to delete this tournament?')) {
      setTournaments(prev => prev.filter(tournament => tournament.id !== id));
      addNotification({
        type: 'success',
        title: 'Tournament Deleted',
        message: 'The tournament has been successfully deleted.'
      });
    }
  };

  const handleRegisterTeam = (tournamentId: string) => {
    addNotification({
      type: 'success',
      title: 'Team Registered',
      message: 'Your team has been successfully registered for the tournament.'
    });
  };

  const handleSaveTournament = (formData: any) => {
    if (editingTournament) {
      // Update existing tournament
      setTournaments(prev => prev.map(tournament =>
        tournament.id === editingTournament.id
          ? { ...tournament, ...formData, id: tournament.id }
          : tournament
      ));
      addNotification({
        type: 'success',
        title: 'Tournament Updated',
        message: 'The tournament has been successfully updated.'
      });
    } else {
      // Create new tournament
      const newTournament: Tournament = {
        ...formData,
        id: Date.now().toString(),
        currentTeams: 0,
        registeredTeams: [],
        createdBy: 'admin',
        createdAt: new Date().toISOString()
      };
      setTournaments(prev => [newTournament, ...prev]);
      addNotification({
        type: 'success',
        title: 'Tournament Created',
        message: 'The tournament has been successfully created.'
      });
    }
    setIsModalOpen(false);
  };

  const handleViewDetails = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsDetailsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTournamentCard = (tournament: Tournament) => (
    <TournamentCard key={tournament.id} $status={tournament.status}>
      <TournamentHeader>
        <TournamentInfo>
          <TournamentName>{tournament.name}</TournamentName>
          <TournamentGame>{tournament.game}</TournamentGame>
          <TournamentStatus $status={tournament.status}>
            {tournament.status}
          </TournamentStatus>
        </TournamentInfo>
      </TournamentHeader>

      <TournamentDetails>
        {tournament.description}
      </TournamentDetails>

      <TournamentStats>
        <StatItem>
          <StatValue>${tournament.prizePool.toLocaleString()}</StatValue>
          <StatLabel>Prize Pool</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{tournament.currentTeams}/{tournament.maxTeams}</StatValue>
          <StatLabel>Teams</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>${tournament.entryFee}</StatValue>
          <StatLabel>Entry Fee</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{tournament.format}</StatValue>
          <StatLabel>Format</StatLabel>
        </StatItem>
      </TournamentStats>

      <div style={{ color: '#cccccc', fontSize: '12px', marginBottom: '16px' }}>
        <div>Start: {formatDate(tournament.startDate)}</div>
        <div>End: {formatDate(tournament.endDate)}</div>
      </div>

      <TournamentActions>
        {tournament.status === 'upcoming' && (
          <ActionButton onClick={() => handleRegisterTeam(tournament.id)}>
            Register Team
          </ActionButton>
        )}
        <ActionButton $variant="secondary" onClick={() => handleViewDetails(tournament)}>
          View Details
        </ActionButton>
        {isAdmin && (
          <>
            <ActionButton onClick={() => handleEditTournament(tournament)}>
              Edit
            </ActionButton>
            <ActionButton $variant="danger" onClick={() => handleDeleteTournament(tournament.id)}>
              Delete
            </ActionButton>
          </>
        )}
      </TournamentActions>
    </TournamentCard>
  );

  const renderTournamentDetails = () => {
    if (!selectedTournament) return null;

    return (
      <TournamentDetailsModal $isOpen={isDetailsModalOpen} onClick={() => setIsDetailsModalOpen(false)}>
        <TournamentDetailsContent onClick={(e) => e.stopPropagation()}>
          <TournamentHeader>
            <TournamentInfo>
              <TournamentName>{selectedTournament.name}</TournamentName>
              <TournamentGame>{selectedTournament.game}</TournamentGame>
              <TournamentStatus $status={selectedTournament.status}>
                {selectedTournament.status}
              </TournamentStatus>
            </TournamentInfo>
          </TournamentHeader>

          <TournamentStats>
            <StatItem>
              <StatValue>${selectedTournament.prizePool.toLocaleString()}</StatValue>
              <StatLabel>Prize Pool</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{selectedTournament.currentTeams}/{selectedTournament.maxTeams}</StatValue>
              <StatLabel>Teams</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>${selectedTournament.entryFee}</StatValue>
              <StatLabel>Entry Fee</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{selectedTournament.format}</StatValue>
              <StatLabel>Format</StatLabel>
            </StatItem>
          </TournamentStats>

          <RegisteredTeams>
            <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>Registered Teams</h3>
            <TeamsList>
              {selectedTournament.registeredTeams.map((team, index) => (
                <TeamCard key={index}>
                  <TeamName>{team}</TeamName>
                  <TeamTag>#{team.split(' ')[0]}</TeamTag>
                </TeamCard>
              ))}
            </TeamsList>
          </RegisteredTeams>

          {selectedTournament.bracket && (
            <BracketContainer>
              <BracketTitle>Tournament Bracket</BracketTitle>
              {selectedTournament.bracket.rounds.map((round: any, roundIndex: number) => (
                <BracketRound key={roundIndex}>
                  <div style={{ color: '#ffffff', fontWeight: '600', marginBottom: '8px' }}>
                    Round {round.round}
                  </div>
                  {round.matches.map((match: any) => (
                    <MatchCard key={match.id} $status={match.status}>
                      <TeamInfo>
                        <TeamName $winner={match.score1 > match.score2}>{match.team1}</TeamName>
                        <Score>{match.score1}</Score>
                      </TeamInfo>
                      <div style={{ color: '#888888' }}>vs</div>
                      <TeamInfo>
                        <TeamName $winner={match.score2 > match.score1}>{match.team2}</TeamName>
                        <Score>{match.score2}</Score>
                      </TeamInfo>
                    </MatchCard>
                  ))}
                </BracketRound>
              ))}
            </BracketContainer>
          )}

          <ButtonGroup>
            <Button onClick={() => setIsDetailsModalOpen(false)}>
              Close
            </Button>
          </ButtonGroup>
        </TournamentDetailsContent>
      </TournamentDetailsModal>
    );
  };

  return (
    <Container>
      <Header>
        <Title>Tournaments</Title>
        <p style={{ color: '#cccccc', margin: '8px 0 0 0' }}>
          Compete in tournaments, win prizes, and prove your skills
        </p>
      </Header>

      <TabContainer>
        <Tab $active={activeTab === 'all'} onClick={() => setActiveTab('all')}>
          All Tournaments
        </Tab>
        <Tab $active={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')}>
          Upcoming
        </Tab>
        <Tab $active={activeTab === 'active'} onClick={() => setActiveTab('active')}>
          Active
        </Tab>
        <Tab $active={activeTab === 'completed'} onClick={() => setActiveTab('completed')}>
          Completed
        </Tab>
        <Tab $active={activeTab === 'my-tournaments'} onClick={() => setActiveTab('my-tournaments')}>
          My Tournaments
        </Tab>
      </TabContainer>

      <FilterContainer>
        <Select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)}>
          <option value="all">All Games</option>
          <option value="valorant">Valorant</option>
          <option value="csgo">CS:GO</option>
          <option value="criticalops">Critical Ops</option>
        </Select>
        {isAdmin && (
          <CreateButton onClick={handleCreateTournament}>
            Create Tournament
          </CreateButton>
        )}
      </FilterContainer>

      <TournamentsGrid>
        {filteredTournaments.map(renderTournamentCard)}
      </TournamentsGrid>

      {renderTournamentDetails()}

      <Modal $isOpen={isModalOpen} onClick={() => setIsModalOpen(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <h2 style={{ color: '#ffffff', marginBottom: '24px' }}>
            {editingTournament ? 'Edit Tournament' : 'Create New Tournament'}
          </h2>
          <Form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSaveTournament({
              name: formData.get('name'),
              game: formData.get('game'),
              description: formData.get('description'),
              startDate: formData.get('startDate'),
              endDate: formData.get('endDate'),
              maxTeams: parseInt(formData.get('maxTeams')?.toString() || '8'),
              entryFee: parseInt(formData.get('entryFee')?.toString() || '0'),
              prizePool: parseInt(formData.get('prizePool')?.toString() || '0'),
              format: formData.get('format'),
              rules: formData.get('rules'),
              status: formData.get('status') || 'upcoming'
            });
          }}>
            <FormGroup>
              <Label>Tournament Name</Label>
              <Input
                name="name"
                defaultValue={editingTournament?.name}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Game</Label>
              <Select name="game" defaultValue={editingTournament?.game || 'valorant'}>
                <option value="valorant">Valorant</option>
                <option value="csgo">CS:GO</option>
                <option value="criticalops">Critical Ops</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Description</Label>
              <TextArea
                name="description"
                defaultValue={editingTournament?.description}
                required
              />
            </FormGroup>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormGroup>
                <Label>Start Date</Label>
                <Input
                  name="startDate"
                  type="datetime-local"
                  defaultValue={editingTournament?.startDate?.slice(0, 16)}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>End Date</Label>
                <Input
                  name="endDate"
                  type="datetime-local"
                  defaultValue={editingTournament?.endDate?.slice(0, 16)}
                  required
                />
              </FormGroup>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <FormGroup>
                <Label>Max Teams</Label>
                <Input
                  name="maxTeams"
                  type="number"
                  min="2"
                  max="32"
                  defaultValue={editingTournament?.maxTeams || 8}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Entry Fee ($)</Label>
                <Input
                  name="entryFee"
                  type="number"
                  min="0"
                  defaultValue={editingTournament?.entryFee || 0}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Prize Pool ($)</Label>
                <Input
                  name="prizePool"
                  type="number"
                  min="0"
                  defaultValue={editingTournament?.prizePool || 0}
                  required
                />
              </FormGroup>
            </div>
            
            <FormGroup>
              <Label>Format</Label>
              <Select name="format" defaultValue={editingTournament?.format || 'single-elimination'}>
                <option value="single-elimination">Single Elimination</option>
                <option value="double-elimination">Double Elimination</option>
                <option value="round-robin">Round Robin</option>
                <option value="swiss">Swiss System</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Rules</Label>
              <TextArea
                name="rules"
                defaultValue={editingTournament?.rules}
                placeholder="Enter tournament rules and regulations..."
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Status</Label>
              <Select name="status" defaultValue={editingTournament?.status || 'upcoming'}>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </Select>
            </FormGroup>
            
            <ButtonGroup>
              <Button type="submit">
                {editingTournament ? 'Update Tournament' : 'Create Tournament'}
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

export default TournamentsPage; 