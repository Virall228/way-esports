import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
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
  background: #2a2a2a;
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
  font-size: 3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 15px;
`;

const Subtitle = styled.p`
  color: #cccccc;
  font-size: 1.2rem;
`;

const RulesButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  justify-content: center;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }
  }
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

const FilterTab = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => 
    $active ? '#ff4757' : 'transparent'};
  color: ${({ $active }) => $active ? '#ffffff' : '#cccccc'};
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
      background: ${({ $active }) => 
      $active ? 'rgba(255,255,255,0.12)' : 'rgba(255, 255, 255, 0.06)'};
      transform: translateY(-2px);
    }
  }
`;

const FilterDropdowns = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
`;

const FilterSelect = styled.select`
  background: #2a2a2a;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
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

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.strong};
  }

  option {
    background: #2a2a2a;
    color: #ffffff;
  }
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

  @media (min-width: ${({ theme }) => theme.breakpoints.wide}) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const TournamentCard = styled.div`
  background: #2a2a2a;
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

const GameBadge = styled.div`
  display: inline-block;
  background: ${({ theme }) => theme.colors.bg.elevated};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 15px;
`;

const TournamentTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 10px;
  font-size: 1.3rem;
`;

const TournamentInfo = styled.div`
  margin-bottom: 20px;
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
  font-size: 1.4rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
  margin: 15px 0;
`;

const StatusBadge = styled.div<{ $status: string }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${({ $status }) => 
    $status === 'live' ? 'rgba(76, 175, 80, 0.2)' :
    $status === 'upcoming' ? 'rgba(33, 150, 243, 0.2)' :
    'rgba(158, 158, 158, 0.2)'};
  color: ${({ $status }) => 
    $status === 'live' ? '#4CAF50' :
    $status === 'upcoming' ? '#2196F3' :
    '#9E9E9E'};
  margin-bottom: 15px;
`;

const JoinButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.gray[700]}, ${({ theme }) => theme.colors.gray[900]});
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 44px;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(255, 107, 0, 0.4);
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

interface Tournament {
  id: string;
  title: string;
  game: string;
  status: 'live' | 'upcoming' | 'completed';
  prizePool: number;
  participants: number;
  maxParticipants: number;
  startDate: string;
  endDate?: string;
  format: string;
}

const TournamentsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res: any = await api.get('/api/tournaments');
        const items: any[] = (res && (res.data || res.tournaments)) || [];

        const mapped: Tournament[] = items.map((t: any) => {
          const rawStatus = (t.status || '').toString();
          const status: Tournament['status'] =
            rawStatus === 'in_progress' || rawStatus === 'ongoing' || rawStatus === 'live'
              ? 'live'
              : rawStatus === 'completed'
                ? 'completed'
                : 'upcoming';

          return {
            id: (t.id || t._id || '').toString(),
            title: t.title || t.name || '',
            game: t.game || '',
            status,
            prizePool: Number(t.prizePool) || 0,
            participants: Number(t.participants) || 0,
            maxParticipants: Number(t.maxParticipants || t.maxTeams) || 0,
            startDate: t.startDate || '',
            endDate: t.endDate || '',
            format: t.format || ''
          };
        });

        if (!mounted) return;
        setTournaments(mapped);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load tournaments');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredTournaments = tournaments.filter((tournament) =>
    activeFilter === 'all'
      ? true
      : activeFilter === 'upcoming' || activeFilter === 'live' || activeFilter === 'completed'
        ? tournament.status === activeFilter
        : tournament.game.toLowerCase() === activeFilter
  );

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'IN_PROGRESS';
      case 'upcoming': return 'REGISTRATION';
      case 'completed': return 'COMPLETED';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return '#00ff00';
      case 'upcoming': return '#ff6b00';
      case 'completed': return '#666666';
      default: return '#666666';
    }
  };

  return (
    <Container>
      <Header>
        <HeaderContent>
          <Title>Tournaments</Title>
          <Subtitle>
            Compete in tournaments, win prizes, and prove your skills
          </Subtitle>
        </HeaderContent>
        <RulesButton onClick={() => setIsRulesModalOpen(true)}>
          📋 Rules
        </RulesButton>
      </Header>

      <FilterSection>
        <FilterTabs>
          <FilterTab 
            $active={activeFilter === 'all'} 
            onClick={() => setActiveFilter('all')}
          >
            All Tournaments
          </FilterTab>
          <FilterTab 
            $active={activeFilter === 'upcoming'} 
            onClick={() => setActiveFilter('upcoming')}
          >
            Registration Open
          </FilterTab>
          <FilterTab 
            $active={activeFilter === 'live'} 
            onClick={() => setActiveFilter('live')}
          >
            In Progress
          </FilterTab>
          <FilterTab 
            $active={activeFilter === 'completed'} 
            onClick={() => setActiveFilter('completed')}
          >
            Completed
          </FilterTab>
          <FilterTab 
            $active={activeFilter === 'my'} 
            onClick={() => setActiveFilter('my')}
          >
            My Tournaments
          </FilterTab>
        </FilterTabs>
      </FilterSection>

      <FilterDropdowns>
        <FilterSelect>
          <option>All Games</option>
          <option>Valorant</option>
          <option>Critical Ops</option>
          <option>CS2</option>
        </FilterSelect>
        <FilterSelect>
          <option>All Types</option>
          <option>Single Elimination</option>
          <option>Round Robin</option>
          <option>Swiss</option>
        </FilterSelect>
      </FilterDropdowns>

      {error && (
        <EmptyState>
          {error}
        </EmptyState>
      )}

      {loading && !error && (
        <EmptyState>
          Loading...
        </EmptyState>
      )}

      {!loading && !error && filteredTournaments.length > 0 ? (
        <TournamentsGrid>
          {filteredTournaments.map(tournament => (
            <TournamentCard key={tournament.id}>
              <GameBadge>{tournament.game}</GameBadge>
              <StatusBadge $status={tournament.status} style={{ color: getStatusColor(tournament.status) }}>
                {getStatusText(tournament.status)} • TEAM
              </StatusBadge>
              
              <TournamentTitle>{tournament.title}</TournamentTitle>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff6b00' }}>${tournament.prizePool.toLocaleString()}</div>
                  <div style={{ fontSize: '0.9rem', color: '#cccccc' }}>Prize Pool</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff' }}>{tournament.participants}/{tournament.maxParticipants}</div>
                  <div style={{ fontSize: '0.9rem', color: '#cccccc' }}>Teams</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff' }}>—</div>
                  <div style={{ fontSize: '0.9rem', color: '#cccccc' }}>Entry Fee</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffffff', marginBottom: '5px' }}>{tournament.format}</div>
                <div style={{ fontSize: '0.9rem', color: '#cccccc' }}>Format</div>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#cccccc', marginBottom: '20px' }}>
                <div>Start: {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : '—'}</div>
                <div>End: {tournament.endDate ? new Date(tournament.endDate).toLocaleDateString() : '—'}</div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <JoinButton 
                  style={{ 
                    flex: 1, 
                    background: tournament.status === 'upcoming' ? '#ff6b00' : '#666666',
                    opacity: tournament.status === 'upcoming' ? 1 : 0.7
                  }}
                  onClick={() => {
                    if (tournament.status === 'upcoming') {
                      setIsCreateTeamModalOpen(true);
                    } else {
                      console.log('Viewing tournament details:', tournament.id);
                    }
                  }}
                >
                  {tournament.status === 'live' ? 'View Details' : 
                   tournament.status === 'upcoming' ? 'Register Team' : 'View Details'}
                </JoinButton>
                <JoinButton 
                  style={{ 
                    flex: 1, 
                    background: 'transparent',
                    border: '1px solid #666666',
                    color: '#cccccc'
                  }}
                  onClick={() => console.log('View details:', tournament.id)}
                >
                  View Details
                </JoinButton>
              </div>
            </TournamentCard>
          ))}
        </TournamentsGrid>
      ) : (
        <EmptyState>
          <h3>No tournaments found</h3>
          <p>Try selecting a different filter or check back later</p>
        </EmptyState>
      )}

      {/* Modals */}
      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        onCreateTeam={(teamData) => {
          console.log('Team created for tournament:', teamData);
          setIsCreateTeamModalOpen(false);
        }}
      />

      {/* Rules Modal */}
      {isRulesModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'calc(16px + var(--sat, 0px)) calc(16px + var(--sar, 0px)) calc(16px + var(--sab, 0px)) calc(16px + var(--sal, 0px))'
        }} onClick={() => setIsRulesModalOpen(false)}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '16px',
            padding: '30px',
            width: '90%',
            maxWidth: '600px',
            position: 'relative',
            maxHeight: 'calc(var(--app-height, 100dvh) - 32px - var(--sat, 0px) - var(--sab, 0px))',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setIsRulesModalOpen(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >×</button>
            
            <h2 style={{ color: '#ff6b00', marginBottom: '20px' }}>Tournament Rules</h2>
            
            <div style={{ color: '#cccccc', lineHeight: '1.6' }}>
              <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>General Rules</h3>
              <ul style={{ marginBottom: '20px' }}>
                <li>All players must be registered on WAY Esports platform</li>
                <li>Teams must have 5 players minimum to participate</li>
                <li>No cheating, hacking, or exploiting allowed</li>
                <li>Respect all players and staff members</li>
              </ul>
              
              <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>Match Rules</h3>
              <ul style={{ marginBottom: '20px' }}>
                <li>Matches are best of 3 (BO3) format</li>
                <li>Teams have 15 minutes to show up or forfeit</li>
                <li>Screenshots required for dispute resolution</li>
                <li>Server location will be announced before match</li>
              </ul>
              
              <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>Prize Distribution</h3>
              <ul>
                <li>1st Place: 50% of prize pool</li>
                <li>2nd Place: 30% of prize pool</li>
                <li>3rd Place: 20% of prize pool</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default TournamentsPage;