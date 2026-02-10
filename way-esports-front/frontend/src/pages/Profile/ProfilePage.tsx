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

const Bio = styled.p`
  line-height: 1.6;
  color: #ddd;
  font-style: italic;
  margin-top: 15px;
`;

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ProfileHeader = styled.div`
  background: ${({ theme }) => theme.colors.surface};
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
    content: '📷';
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

const SubscriptionButton = styled.button`
  background: ${({ theme }) => theme.colors.gray[800]};
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  font-size: 12px;
  min-height: 40px;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ theme }) => theme.colors.gray[700]};
      transform: translateY(-2px);
    }
  }
`;

const WalletButton = styled.button`
  background: rgba(255, 255, 255, 0.06);
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 10px;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover { background: rgba(255,255,255,0.12); }
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

const StatsCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 16px;
  padding: 25px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const CardTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 20px;
  font-size: 1.3rem;
`;

const GameStats = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const GameName = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
`;

const GameRank = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
`;

const AchievementsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
`;

const AchievementCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 1px solid rgba(255, 107, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(255, 107, 0, 0.2);
  }
`;

const AchievementIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 15px;
`;

const AchievementTitle = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
  margin-bottom: 8px;
`;

const AchievementDescription = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.9rem;
`;

const ProfilePage: React.FC = () => {
  const { user, fetchProfile } = useAuth();
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.bio) {
      setNewBio(user.bio);
    }
  }, [user]);

  const handleSaveBio = async () => {
    try {
      setIsSaving(true);
      await api.patch('/api/profile', { bio: newBio });
      await fetchProfile();
      setIsEditingBio(false);
    } catch (error) {
      console.error('Error saving bio:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const { url } = await api.uploadImage(file);

      // Update user profile with new logo URL
      await api.post('/api/profile/upload-logo', { logoUrl: url });

      // Refresh profile to get updated data
      await fetchProfile();
    } catch (error) {
      console.error('Error in photo upload:', error);
    } finally {
      setIsUploading(false);
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
          $hasImage={!!user?.profileLogo}
          $imageUrl={user?.profileLogo}
          onClick={() => setIsPhotoUploadOpen(true)}
        >
          {user?.profileLogo ? (
            <AvatarImage src={getFullAvatarUrl(user.profileLogo) || ''} alt="Profile" />
          ) : (
            user?.username?.charAt(0).toUpperCase() || '👤'
          )}
        </Avatar>
        <ProfileInfo>
          <ProfileTop>
            <div>
              <Username>{user?.username || 'Gamer'}</Username>
              <UserOrg>{user?.email || 'WAY Esports Member'}</UserOrg>
              <Link to={`/profile/${user?.id}`} style={{ color: '#ff6b00', fontSize: '0.9rem', textDecoration: 'none' }}>
                🔗 View Public Profile
              </Link>
            </div>
            <div>
              <SubscriptionButton onClick={() => setIsSubscriptionOpen(true)}>
                {user?.isSubscribed ? 'MANAGE SUBSCRIPTION' : 'GET SUBSCRIPTION'}
              </SubscriptionButton>
              <WalletButton onClick={() => setIsWalletOpen(true)}>
                💰 {user?.balance?.toFixed(2) || '0.00'}
              </WalletButton>
            </div>
          </ProfileTop>
          <UserStats>
            <StatItem>
              <StatValue>{user?.stats?.matches || 0}</StatValue>
              <StatLabel>Matches</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{user?.stats?.wins || 0}</StatValue>
              <StatLabel>Wins</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{user?.stats?.mvps || 0}</StatValue>
              <StatLabel>MVPs</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{user?.stats?.kdRatio || '0.00'}</StatValue>
              <StatLabel>K/D Ratio</StatLabel>
            </StatItem>
          </UserStats>

          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <StatLabel>BIO</StatLabel>
              {!isEditingBio ? (
                <button onClick={() => setIsEditingBio(true)} style={{ background: 'none', border: 'none', color: '#ff6b00', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Edit Bio
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleSaveBio} disabled={isSaving} style={{ background: 'none', border: 'none', color: '#00ff00', cursor: 'pointer', fontSize: '0.8rem' }}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setIsEditingBio(false)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Cancel
                  </button>
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
              <Bio style={{ marginTop: 0 }}>{user?.bio || "No bio set yet. Tell people who you are!"}</Bio>
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
          <span style={{ fontSize: '1.5rem' }}>📊</span>
          <CardTitle style={{ margin: 0 }}>Match Statistics</CardTitle>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <button style={{
            background: '#ff6b00',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            All Matches (0)
          </button>
          <button style={{
            background: 'transparent',
            color: '#cccccc',
            border: '1px solid #333',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            Wins (0)
          </button>
          <button style={{
            background: 'transparent',
            color: '#cccccc',
            border: '1px solid #333',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            Losses (0)
          </button>
        </div>

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
