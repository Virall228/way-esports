import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import MatchStats from '../../components/Profile/MatchStats';
import { profileService } from '../../services/profileService';
import { useNotifications } from '../../contexts/NotificationContext';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const ProfileHeader = styled.div`
  background: #2a2a2a;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
`;

const Avatar = styled.div<{ $hasLogo?: boolean }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${({ $hasLogo }) => $hasLogo ? 'transparent' : '#1a1a1a'};
  border: 3px solid #ff6b00;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: #ffd700;
    transform: scale(1.05);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
`;

const AvatarOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;

  ${Avatar}:hover & {
    opacity: 1;
  }

  svg {
    width: 24px;
    height: 24px;
    color: #ffffff;
  }
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const UsernameContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Username = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
`;

const WalletButton = styled.button`
  background: transparent;
  border: none;
  border-radius: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: none;
    background: transparent;
  }

  &:active {
    transform: translateY(0);
  }
`;

const Tag = styled.div`
  color: #ff6b00;
  font-size: 18px;
  font-weight: 500;
`;

const Stats = styled.div`
  display: flex;
  gap: 24px;
  margin-top: 16px;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #ff6b00;
`;

const StatLabel = styled.div`
  color: #cccccc;
  font-size: 14px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
`;

const Card = styled.div`
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
`;

const AchievementCard = styled.div`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 2px solid rgba(255, 107, 0, 0.3);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 107, 0, 0.6);
  }
`;

const AchievementTitle = styled.h3`
  color: #ff6b00;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const AchievementDescription = styled.p`
  color: #cccccc;
  font-size: 14px;
  margin: 0;
  line-height: 1.4;
`;

const AchievementDate = styled.div`
  color: #888888;
  font-size: 12px;
  margin-top: 8px;
`;

const NoAchievements = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #888888;
  font-style: italic;
`;

const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #ffffff;
`;

const MatchHistory = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MatchItem = styled.div<{ $won?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: ${({ $won }) => 
    $won ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)'};
  border-radius: 8px;
  color: #ffffff;
`;

const MatchResult = styled.div<{ $won?: boolean }>`
  color: ${({ $won }) => 
    $won ? '#2ed573' : '#ff4757'};
  font-weight: 500;
`;

// Wallet Modal styles
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
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  border: 2px solid rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #ffd700, #ffed4e);
  }
`;

const ModalScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  margin-right: -8px;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #ffd700, #ffed4e);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #ffed4e, #fff5a0);
  }
`;

const ModalFooter = styled.div`
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  color: #ffffff;
  margin: 0;
  font-size: 24px;
  font-weight: 700;
`;

const WalletIcon = styled.div`
  font-size: 32px;
  color: #ffd700;
`;

const BalanceSection = styled.div`
  background: rgba(255, 215, 0, 0.1);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  text-align: center;
  border: 1px solid rgba(255, 215, 0, 0.2);
`;

const BalanceAmount = styled.div`
  font-size: 36px;
  font-weight: 700;
  color: #ffd700;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
`;

const BalanceLabel = styled.div`
  color: #cccccc;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const TransactionSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
`;

const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TransactionItem = styled.div<{ $type: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 4px solid ${({ $type }) => 
    $type === 'deposit' ? '#2ed573' : 
    $type === 'withdrawal' ? '#ff4757' : 
    $type === 'prize' ? '#ffd700' : '#ff6b00'};
`;

const TransactionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TransactionDescription = styled.div`
  color: #ffffff;
  font-weight: 500;
`;

const TransactionDate = styled.div`
  color: #cccccc;
  font-size: 12px;
`;

const TransactionAmount = styled.div<{ $type: string }>`
  color: ${({ $type }) => 
    $type === 'deposit' ? '#2ed573' : 
    $type === 'withdrawal' ? '#ff4757' : 
    $type === 'prize' ? '#ffd700' : '#ff6b00'};
  font-weight: 700;
  font-size: 16px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${({ $variant }) => $variant === 'primary' ? `
    background: linear-gradient(135deg, #ffd700, #ffed4e);
    color: #000000;
    &:hover {
      background: linear-gradient(135deg, #ffed4e, #fff5a0);
      transform: translateY(-2px);
    }
  ` : `
    background: transparent;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.3);
    &:hover {
      border-color: #ffd700;
      color: #ffd700;
    }
  `}
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: #cccccc;
  font-size: 24px;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #ffffff;
  }
`;

const ProgressBar = styled.div`
  width: 100px;
  height: 8px;
  background: rgba(128, 128, 128, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 4px;
`;

const ProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  background: linear-gradient(90deg, #ff6b00, #ff8533);
  width: ${({ $percentage }) => Math.min($percentage, 100)}%;
  transition: width 0.3s ease;
`;

const ProfilePage: React.FC = () => {
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotifications();

  const defaultProfile = {
    username: "WAY.Striker",
    tag: "WAY Esports",
    profileLogo: null,
    wallet: {
      balance: 1250.50,
      transactions: [
        { id: 1, type: 'prize', amount: 500, description: 'Tournament Prize - CS2 Cup', date: '2024-03-15' },
        { id: 2, type: 'deposit', amount: 200, description: 'Deposit via Card', date: '2024-03-10' },
        { id: 3, type: 'withdrawal', amount: -150, description: 'Withdrawal to Bank', date: '2024-03-08' },
        { id: 4, type: 'prize', amount: 300, description: 'Tournament Prize - Critical Ops', date: '2024-03-05' },
        { id: 5, type: 'deposit', amount: 100, description: 'Deposit via Card', date: '2024-03-01' }
      ]
    },
    stats: {
      matches: 156,
      wins: 98,
      mvps: 45,
      kd: 2.45
    },
    recentMatches: [
      { id: 1, opponent: "Nova Esports", score: "13-7", won: true },
      { id: 2, opponent: "Tribe Gaming", score: "16-14", won: true },
      { id: 3, opponent: "Cloud9", score: "7-13", won: false },
      { id: 4, opponent: "Team Liquid", score: "13-11", won: true },
      { id: 5, opponent: "NaVi", score: "10-13", won: false }
    ]
  };

  useEffect(() => {
    loadProfile();
    loadAchievements();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await profileService.getProfile();
      if (response.success) {
        setProfile(response.data);
      } else {
        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(defaultProfile);
    } finally {
      setLoading(false);
    }
  };

  const loadAchievements = async () => {
    try {
      const response = await profileService.getAchievements();
      if (response.success) {
        setAchievements(response.data);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const handleAvatarClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // В реальном приложении здесь была бы загрузка файла на сервер
          // Для демонстрации используем FileReader
          const reader = new FileReader();
          reader.onload = async (e) => {
            const logoUrl = e.target?.result as string;
            const response = await profileService.uploadProfileLogo(logoUrl);
            if (response.success) {
              setProfile(prev => ({ ...prev, profileLogo: logoUrl }));
              showNotification('Success', 'Profile logo updated successfully!', 'success');
            }
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('Error uploading logo:', error);
          showNotification('Error', 'Failed to upload profile logo', 'error');
        }
      }
    };
    input.click();
  };

  const handleWalletClick = () => {
    setIsWalletOpen(true);
    // Вибрация при открытии кошелька
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  const handleCloseWallet = () => {
    setIsWalletOpen(false);
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '40px', color: '#cccccc' }}>
          Loading profile...
        </div>
      </Container>
    );
  }

  const currentProfile = profile || defaultProfile;

  return (
    <Container>
      <ProfileHeader>
        <Avatar 
          $hasLogo={!!currentProfile.profileLogo} 
          onClick={handleAvatarClick}
        >
          {currentProfile.profileLogo ? (
            <>
              <img src={currentProfile.profileLogo} alt="Profile Logo" />
              <AvatarOverlay>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </AvatarOverlay>
            </>
          ) : (
            <>
              👤
              <AvatarOverlay>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </AvatarOverlay>
            </>
          )}
        </Avatar>
        <ProfileInfo>
          <UsernameContainer>
            <Username>{currentProfile.username}</Username>
                    <WalletButton onClick={handleWalletClick} title="Wallet">
          💳
        </WalletButton>
          </UsernameContainer>
          <Tag>{currentProfile.tag}</Tag>
          <Stats>
            <StatItem>
              <StatValue>{currentProfile.stats.matches}</StatValue>
              <StatLabel>Matches</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{currentProfile.stats.wins}</StatValue>
              <StatLabel>Wins</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{currentProfile.stats.mvps}</StatValue>
              <StatLabel>MVPs</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{currentProfile.stats.kd}</StatValue>
              <StatLabel>K/D Ratio</StatLabel>
            </StatItem>
          </Stats>
        </ProfileInfo>
      </ProfileHeader>

      <Grid>
        <Card>
          <CardTitle>Recent Matches</CardTitle>
          <MatchHistory>
            {currentProfile.recentMatches.map((match: any) => (
              <MatchItem key={match.id} $won={match.won}>
                <div>vs {match.opponent}</div>
                <MatchResult $won={match.won}>{match.score}</MatchResult>
              </MatchItem>
            ))}
          </MatchHistory>
        </Card>

        <Card>
          <CardTitle>Achievements</CardTitle>
          {achievements.length > 0 ? (
            achievements.map((achievement, index) => (
              <AchievementCard key={index}>
                <AchievementTitle>{achievement}</AchievementTitle>
                <AchievementDescription>
                  Earned this achievement through your dedication and skill!
                </AchievementDescription>
                <AchievementDate>
                  Earned recently
                </AchievementDate>
              </AchievementCard>
            ))
          ) : (
            <NoAchievements>
              No achievements yet. Keep playing to earn your first achievement!
            </NoAchievements>
          )}
        </Card>
      </Grid>

      <MatchStats username={currentProfile.username} />

      {/* Wallet Modal */}
      <Modal $isOpen={isWalletOpen}>
        <ModalContent>
          <CloseButton onClick={handleCloseWallet}>×</CloseButton>
          
          <ModalHeader>
            <WalletIcon>💳</WalletIcon>
            <ModalTitle>Wallet</ModalTitle>
          </ModalHeader>

          <ModalScrollContent>
            <BalanceSection>
              <BalanceAmount>${currentProfile.wallet.balance.toFixed(2)}</BalanceAmount>
              <BalanceLabel>Current Balance</BalanceLabel>
            </BalanceSection>

            <TransactionSection>
              <SectionTitle>Recent Transactions</SectionTitle>
              <TransactionList>
                {currentProfile.wallet.transactions.slice(0, 5).map((transaction: any) => (
                  <TransactionItem key={transaction.id} $type={transaction.type}>
                    <TransactionInfo>
                      <TransactionDescription>{transaction.description}</TransactionDescription>
                      <TransactionDate>{transaction.date}</TransactionDate>
                    </TransactionInfo>
                    <TransactionAmount $type={transaction.type}>
                      {transaction.amount > 0 ? '+' : ''}${transaction.amount.toFixed(2)}
                    </TransactionAmount>
                  </TransactionItem>
                ))}
              </TransactionList>
            </TransactionSection>
          </ModalScrollContent>

          <ModalFooter>
            <ActionButtons>
              <ActionButton $variant="primary">
                Deposit
              </ActionButton>
              <ActionButton $variant="secondary">
                Withdraw
              </ActionButton>
            </ActionButtons>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default ProfilePage; 