import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import WalletModal from '../../components/Wallet/WalletModal';
import SubscriptionModal from '../../components/Subscription/SubscriptionModal';
import PhotoUploadModal from '../../components/Profile/PhotoUploadModal';
import AchievementsSection from '../../components/Profile/AchievementsSection';
import ReferralCard from '../../components/Referral/ReferralCard';
import SubscriptionCard from '../../components/Subscription/SubscriptionCard';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { useProfileQuery } from '../../hooks/useProfileQuery';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

const Bio = styled.p`
  line-height: 1.6;
  color: #ddd;
  font-style: italic;
  margin-top: 15px;
`;

const Container = styled.div`
  padding: 20px;
  width: 100%;
  max-width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ProfileHeader = styled(Card).attrs({ variant: 'elevated' })`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  display: flex;
  align-items: flex-start;
  gap: 30px;
  flex-wrap: wrap;
`;

const Avatar = styled.div<{ $hasImage?: boolean; $imageUrl?: string | null }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${({ theme, $hasImage, $imageUrl }) => ($hasImage || $imageUrl) ? 'transparent' : theme.colors.surface};
  border: 3px solid ${({ theme }) => theme.colors.border.medium};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: #cccccc;
  font-weight: bold;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover { transform: scale(1.05); box-shadow: 0 0 20px rgba(0,0,0,0.35); }

  &:hover::after {
    content: '\\1F4F7';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const ProfileTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const Username = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 5px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const UserOrg = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.1rem;
  margin-bottom: 15px;
`;

const SubscriptionButton = styled(Button).attrs({ variant: 'brand', size: 'small' })`
  font-size: 12px;
  min-height: 40px;
`;

const WalletButton = styled(Button).attrs({ variant: 'secondary', size: 'small' })`
  font-size: 12px;
  min-height: 40px;
  margin-left: 10px;
`;

const UserStats = styled.div`
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const StatLabel = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.9rem;
  margin-top: 5px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
`;

const StatsCard = styled(Card).attrs({ variant: 'outlined' })`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 16px;
  padding: 25px;
`;

const StatFilters = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const StatFilterButton = styled(Button).attrs({ size: 'small' })``;

const CardTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 20px;
  font-size: 1.3rem;
`;


const InlineAction = styled(Button).attrs({ variant: 'text', size: 'small' })`
  min-height: auto;
  padding: 0;
`;

const InlineConfirm = styled(Button).attrs({ variant: 'text', size: 'small' })`
  min-height: auto;
  padding: 0;
  color: #00ff00;
`;

const InlineCancel = styled(Button).attrs({ variant: 'text', size: 'small' })`
  min-height: auto;
  padding: 0;
  color: #ff4444;
`;

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { data: profileData, refetch: refetchProfile } = useProfileQuery();
  const profile = profileData || user;
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile?.bio) {
      setNewBio(profile.bio);
    }
  }, [profile]);

  const handleSaveBio = async () => {
    try {
      setIsSaving(true);
      await api.patch('/api/profile', { bio: newBio });
      await refetchProfile();
      setIsEditingBio(false);
    } catch (error) {
      console.error('Error saving bio:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      const { url } = await api.uploadImage(file);

      // Update user profile with new logo URL
      await api.post('/api/profile/upload-logo', { logoUrl: url });

      // Refresh profile to get updated data
      await refetchProfile();
    } catch (error) {
      console.error('Error in photo upload:', error);
    }
  };

  const getFullAvatarUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    // Assuming the backend serves static files at the base URL + path
    return path;
  };

  return (
    <Container>
      <ProfileHeader>
        <Avatar
          $hasImage={!!profile?.profileLogo}
          $imageUrl={profile?.profileLogo}
          onClick={() => setIsPhotoUploadOpen(true)}
        >
          {profile?.profileLogo ? (
            <AvatarImage src={getFullAvatarUrl(profile.profileLogo) || ''} alt="Profile" />
          ) : (
            profile?.username?.charAt(0).toUpperCase() || '\u{1F464}'
          )}
        </Avatar>
        <ProfileInfo>
          <ProfileTop>
            <div>
              <Username>{profile?.username || 'Gamer'}</Username>
              <UserOrg>{profile?.email || 'WAY Esports Member'}</UserOrg>
              <Link to={`/profile/${profile?.id || user?.id}`} style={{ color: '#ff6b00', fontSize: '0.9rem', textDecoration: 'none' }}>
                {'\u{1F517}'} View Public Profile
              </Link>
            </div>
            <div>
              <SubscriptionButton onClick={() => setIsSubscriptionOpen(true)}>
                {profile?.isSubscribed ? 'MANAGE SUBSCRIPTION' : 'GET SUBSCRIPTION'}
              </SubscriptionButton>
              <WalletButton onClick={() => setIsWalletOpen(true)}>
                {'\u{1F4B0}'} {profile?.balance?.toFixed(2) || '0.00'}
              </WalletButton>
            </div>
          </ProfileTop>
          <UserStats>
            <StatItem>
              <StatValue>{profile?.stats?.matches || 0}</StatValue>
              <StatLabel>Matches</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{profile?.stats?.wins || 0}</StatValue>
              <StatLabel>Wins</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{profile?.stats?.mvps || 0}</StatValue>
              <StatLabel>MVPs</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{profile?.stats?.kdRatio || '0.00'}</StatValue>
              <StatLabel>K/D Ratio</StatLabel>
            </StatItem>
          </UserStats>

          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <StatLabel>BIO</StatLabel>
              {!isEditingBio ? (
                <InlineAction onClick={() => setIsEditingBio(true)}>
                  Edit Bio
                </InlineAction>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <InlineConfirm onClick={handleSaveBio} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </InlineConfirm>
                  <InlineCancel onClick={() => setIsEditingBio(false)}>
                    Cancel
                  </InlineCancel>
                </div>
              )}
            </div>

            {isEditingBio ? (
              <textarea
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid #333',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: '8px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder="Tell the world about yourself..."
              />
            ) : (
              <Bio style={{ marginTop: 0 }}>{profile?.bio || "No bio set yet. Tell people who you are!"}</Bio>
            )}
          </div>
        </ProfileInfo>
      </ProfileHeader>

      <StatsGrid>
        <StatsCard>
          <CardTitle>Recent Matches</CardTitle>
          <div style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
            No matches played yet. Join tournaments to see your match history!
          </div>
        </StatsCard>

        <StatsCard>
          <CardTitle>Achievements</CardTitle>
          <div style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
            No achievements yet. Keep playing to earn your first achievement!
          </div>
        </StatsCard>
      </StatsGrid>

      <StatsCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <span style={{ fontSize: '1.5rem' }}>{'\u{1F4CA}'}</span>
          <CardTitle style={{ margin: 0 }}>Match Statistics</CardTitle>
        </div>

        <StatFilters>
          <StatFilterButton variant="brand">All Matches (0)</StatFilterButton>
          <StatFilterButton variant="outline">Wins (0)</StatFilterButton>
          <StatFilterButton variant="outline">Losses (0)</StatFilterButton>
        </StatFilters>

        <div style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
          No match statistics available yet. Start playing to see your performance data!
        </div>
      </StatsCard>

      <AchievementsSection />

      <ReferralCard />
      <SubscriptionCard />

      {/* Modals */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
      />

      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
      />

      <PhotoUploadModal
        isOpen={isPhotoUploadOpen}
        onClose={() => setIsPhotoUploadOpen(false)}
        onUpload={handlePhotoUpload}
      />
    </Container>
  );
};

export default ProfilePage;
