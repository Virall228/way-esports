import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { api } from '../../services/api';
import Card from '../../components/UI/Card';

const Container = styled.div`
  padding: 2rem 1rem;
  max-width: 1000px;
  margin: 0 auto;
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
  border-radius: 12px;
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

const TeamPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [team, setTeam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                setLoading(true);
                const res: any = await api.get(`/api/teams/${id}`);
                if (res.success) {
                    setTeam(res.data);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load team');
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, [id]);

    if (loading) return <Container>Loading team...</Container>;
    if (error || !team) return <Container>Error: {error || 'Not found'}</Container>;

    return (
        <Container>
            <TeamHeader>
                <Logo src={team.logo || '/images/default-team.png'} alt={team.name} />
                <div>
                    <TeamTitle>
                        {team.name}
                        <TeamTag>{team.tag}</TeamTag>
                    </TeamTitle>
                    <div style={{ marginTop: '0.5rem', color: '#aaa' }}>Game: {team.game}</div>
                </div>
            </TeamHeader>

            <Section>
                <SectionTitle>Members</SectionTitle>
                <MemberList>
                    {(team.members || []).map((member: any) => (
                        <MemberCard key={member.id} to={`/profile/${member.id}`}>
                            <MemberAvatar src={member.profileLogo || '/images/default-avatar.png'} />
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{member.username}</div>
                                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                    {team.captain?.id === member.id ? '👑 Captain' : 'Player'}
                                </div>
                            </div>
                        </MemberCard>
                    ))}
                </MemberList>
            </Section>

            <Section>
                <SectionTitle>Team Stats</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    <Card style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ fontSize: '1.5rem', color: '#ff6b00' }}>{team.stats?.wins || 0}</div>
                        <div style={{ color: '#aaa' }}>Wins</div>
                    </Card>
                    <Card style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ fontSize: '1.5rem', color: '#ff6b00' }}>{team.stats?.losses || 0}</div>
                        <div style={{ color: '#aaa' }}>Losses</div>
                    </Card>
                    <Card style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ fontSize: '1.5rem', color: '#ff6b00' }}>{team.stats?.winRate?.toFixed(1) || 0}%</div>
                        <div style={{ color: '#aaa' }}>Win Rate</div>
                    </Card>
                </div>
            </Section>
        </Container>
    );
};

export default TeamPage;
