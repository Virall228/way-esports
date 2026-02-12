import React from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import Card from '../../components/UI/Card';
import { teamsService } from '../../services/teamsService';

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
`;

const TeamTag = styled.span`
  background: #ff6b00;
  color: #fff;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 1rem;
  margin-left: 1rem;
  vertical-align: middle;
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

const TeamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: team, isLoading, error } = useQuery({
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

  if (isLoading) return <Container><div style={{ textAlign: 'center', padding: '3rem' }}>Loading team details...</div></Container>;
  if (error || !team) {
    const message = (error as Error | undefined)?.message || 'Team not found';
    return <Container><div style={{ textAlign: 'center', padding: '3rem', color: '#ff6b6b' }}>{message}</div></Container>;
  }

  const totalPrizeMoney = team.stats?.totalPrizeMoney || 0;
  const wins = team.stats?.wins || 0;
  const losses = team.stats?.losses || 0;
  const winRate = team.stats?.winRate || 0;

  return (
    <Container>
      <TeamHeader>
        {team.logo ? (
          <Logo src={team.logo} alt={team.name} />
        ) : (
          <LogoPlaceholder>
            {team.tag?.replace('#', '') || team.name?.charAt(0)}
          </LogoPlaceholder>
        )}
        <div>
          <TeamTitle>
            {team.name}
            <TeamTag>{team.tag}</TeamTag>
          </TeamTitle>
          <p style={{ margin: '0.5rem 0', opacity: 0.8 }}>{team.game}</p>
        </div>
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

      {/* Team Members */}
      <Section>
        <SectionTitle>Team Roster ({team.members?.length || 0}/5)</SectionTitle>
        <MemberList>
          {(team.members || []).map((member: any, index: number) => (
            <MemberCard key={index} to={`/profile/${member.id}`}>
              {member.profileLogo ? (
                <MemberAvatar src={member.profileLogo} alt={member.username} />
              ) : (
                <AvatarPlaceholder>
                  {member.username?.charAt(0)?.toUpperCase() || '?'}
                </AvatarPlaceholder>
              )}
              <div>
                <h4 style={{ margin: '0 0 4px 0' }}>{member.username || 'Unknown'}</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>
                  {member.id === team.captain?.id ? '\u{1F451} Captain' : 'Player'}
                </p>
              </div>
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
    </Container>
  );
};

export default TeamPage;
