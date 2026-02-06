import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { api } from '../../services/api';
import Card from '../../components/UI/Card';

const Container = styled.div`
  padding: 2rem 1rem;
  max-width: 1000px;
  margin: 0 auto;
  color: #fff;
`;

const ProfileHeader = styled(Card)`
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.bg.secondary}, ${({ theme }) => theme.colors.bg.tertiary});

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
  }
`;

const Avatar = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 4px solid #ff6b00;
  object-fit: cover;
`;

const Info = styled.div`
  flex: 1;
`;

const Username = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #ff6b00;
`;

const RealName = styled.h2`
  font-size: 1.2rem;
  color: #ccc;
  margin-bottom: 1rem;
`;

const Bio = styled.p`
  line-height: 1.6;
  color: #ddd;
  font-style: italic;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatItem = styled(Card)`
  text-align: center;
  padding: 1.5rem;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #ff6b00;
`;

const StatLabel = styled.div`
  color: #aaa;
  font-size: 0.9rem;
  text-transform: uppercase;
`;

const PublicProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const res: any = await api.get(`/api/profile/${id}/public`);
                if (res.success) {
                    setProfile(res.data);
                } else {
                    setError('Profile not found');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) return <Container>Loading profile...</Container>;
    if (error || !profile) return <Container>Error: {error || 'Not found'}</Container>;

    return (
        <Container>
            <ProfileHeader>
                <Avatar src={profile.profileLogo || '/images/default-avatar.png'} alt={profile.username} />
                <Info>
                    <Username>{profile.username}</Username>
                    <RealName>{profile.firstName} {profile.lastName}</RealName>
                    <Bio>{profile.bio || "This user hasn't set a bio yet."}</Bio>
                </Info>
            </ProfileHeader>

            <StatsGrid>
                <StatItem>
                    <StatValue>{profile.stats?.tournamentsPlayed || 0}</StatValue>
                    <StatLabel>Tournaments Played</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{profile.stats?.tournamentsWon || 0}</StatValue>
                    <StatLabel>Tournaments Won</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{profile.teams?.length || 0}</StatValue>
                    <StatLabel>Teams Joined</StatLabel>
                </StatItem>
            </StatsGrid>

            <h3>Game Profiles</h3>
            <StatsGrid>
                {(profile.gameProfiles || []).map((gp: any) => (
                    <StatItem key={gp.game}>
                        <StatLabel>{gp.game}</StatLabel>
                        <StatValue style={{ fontSize: '1.2rem' }}>{gp.username}</StatValue>
                    </StatItem>
                ))}
            </StatsGrid>
        </Container>
    );
};

export default PublicProfilePage;
