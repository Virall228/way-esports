import React, { useState } from 'react';
import styled from 'styled-components';
import WalletModal from '../../components/Wallet/WalletModal';
import SubscriptionModal from '../../components/Subscription/SubscriptionModal';
import PhotoUploadModal from '../../components/Profile/PhotoUploadModal';

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

const Avatar = styled.div<{ $hasImage?: boolean }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${({ theme, $hasImage }) => $hasImage ? 'transparent' : theme.colors.surface};
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
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handlePhotoUpload = (file: File) => {
    // Create a URL for the uploaded file
    const imageUrl = URL.createObjectURL(file);
    setProfileImage(imageUrl);
    
    // Here you would typically upload the file to your server
    console.log('Uploading photo:', file);
  };

  return (
    <Container>
      <ProfileHeader>
        <Avatar 
          $hasImage={!!profileImage}
          onClick={() => setIsPhotoUploadOpen(true)}
        >
          {profileImage ? (
            <AvatarImage src={profileImage} alt="Profile" />
          ) : (
            '👤'
          )}
        </Avatar>
        <ProfileInfo>
          <ProfileTop>
            <div>
              <Username>WAY.Striker</Username>
              <UserOrg>WAY Esports</UserOrg>
            </div>
            <div>
              <SubscriptionButton onClick={() => setIsSubscriptionOpen(true)}>
                SUBSCRIPTION
              </SubscriptionButton>
              <WalletButton onClick={() => setIsWalletOpen(true)}>
                💰
              </WalletButton>
            </div>
          </ProfileTop>
          <UserStats>
            <StatItem>
              <StatValue>156</StatValue>
              <StatLabel>Matches</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>98</StatValue>
              <StatLabel>Wins</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>45</StatValue>
              <StatLabel>MVPs</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>2.45</StatValue>
              <StatLabel>K/D Ratio</StatLabel>
            </StatItem>
          </UserStats>
        </ProfileInfo>
      </ProfileHeader>

      <StatsGrid>
        <StatsCard>
          <CardTitle>Recent Matches</CardTitle>
          <GameStats>
            <GameName>vs Nova Esports</GameName>
            <GameRank style={{ color: '#4CAF50' }}>13-7</GameRank>
          </GameStats>
          <GameStats>
            <GameName>vs Tribe Gaming</GameName>
            <GameRank style={{ color: '#4CAF50' }}>16-14</GameRank>
          </GameStats>
          <GameStats>
            <GameName>vs Cloud9</GameName>
            <GameRank style={{ color: '#F44336' }}>7-13</GameRank>
          </GameStats>
          <GameStats>
            <GameName>vs Team Liquid</GameName>
            <GameRank style={{ color: '#4CAF50' }}>13-11</GameRank>
          </GameStats>
          <GameStats>
            <GameName>vs NaVi</GameName>
            <GameRank style={{ color: '#F44336' }}>10-13</GameRank>
          </GameStats>
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
          <CardTitle style={{ margin: 0 }}>Match Statistics - WAY.Striker</CardTitle>
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
            All Matches (3)
          </button>
          <button style={{ 
            background: 'transparent', 
            color: '#cccccc', 
            border: '1px solid #333', 
            padding: '8px 16px', 
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            Wins (2)
          </button>
          <button style={{ 
            background: 'transparent', 
            color: '#cccccc', 
            border: '1px solid #333', 
            padding: '8px 16px', 
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            Losses (1)
          </button>
        </div>

        <div style={{ 
          background: 'rgba(0, 255, 0, 0.1)', 
          border: '1px solid #00ff00',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#ffffff', fontWeight: 'bold' }}>Critical Ops Pro League</div>
              <div style={{ color: '#cccccc', fontSize: '14px' }}>Tournament Match</div>
            </div>
            <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '18px' }}>VICTORY</div>
          </div>
        </div>
      </StatsCard>

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