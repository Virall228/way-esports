import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const ProfileContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
`;

const Avatar = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 3px solid #007bff;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const Username = styled.h2`
  margin: 0;
  color: #ffffff;
`;

const Bio = styled.p`
  color: #cccccc;
  margin: 0.5rem 0;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const SocialLink = styled.a`
  color: #007bff;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
`;

const StatCard = styled.div`
  background: #1a1a1a;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
`;

const StatLabel = styled.div`
  color: #cccccc;
  font-size: 0.9rem;
`;

const EditButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
`;

interface UserProfile {
  username: string;
  avatar: string;
  bio: string;
  socialLinks: {
    twitter?: string;
    discord?: string;
    twitch?: string;
  };
  stats: {
    tournamentsPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
  };
}

export const EnhancedProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/api/users/${user?.id}/profile`);
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleSave = async (updatedProfile: Partial<UserProfile>) => {
    try {
      await api.put(`/api/users/${user?.id}/profile`, updatedProfile);
      setProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <ProfileContainer>
      <ProfileHeader>
        <Avatar src={profile.avatar} alt={profile.username} />
        <ProfileInfo>
          <Username>{profile.username}</Username>
          <Bio>{profile.bio}</Bio>
          <SocialLinks>
            {profile.socialLinks.twitter && (
              <SocialLink href={profile.socialLinks.twitter} target="_blank">
                Twitter
              </SocialLink>
            )}
            {profile.socialLinks.discord && (
              <SocialLink href={profile.socialLinks.discord} target="_blank">
                Discord
              </SocialLink>
            )}
            {profile.socialLinks.twitch && (
              <SocialLink href={profile.socialLinks.twitch} target="_blank">
                Twitch
              </SocialLink>
            )}
          </SocialLinks>
        </ProfileInfo>
        <EditButton onClick={() => setIsEditing(true)}>
          Edit Profile
        </EditButton>
      </ProfileHeader>

      <StatsGrid>
        <StatCard>
          <StatValue>{profile.stats.tournamentsPlayed}</StatValue>
          <StatLabel>Tournaments Played</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{profile.stats.wins}</StatValue>
          <StatLabel>Wins</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{profile.stats.losses}</StatValue>
          <StatLabel>Losses</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{profile.stats.winRate}%</StatValue>
          <StatLabel>Win Rate</StatLabel>
        </StatCard>
      </StatsGrid>
    </ProfileContainer>
  );
};
