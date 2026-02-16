import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';

const Container = styled.div`
  background: rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
`;

const Icon = styled.div`
  font-size: 2rem;
`;

const Title = styled.h3`
  color: #ffffff;
  margin: 0;
  font-size: 1.3rem;
`;

const ReferralCodeSection = styled.div`
  background: rgba(255, 107, 0, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 107, 0, 0.3);
`;

const CodeLabel = styled.div`
  color: #cccccc;
  font-size: 0.9rem;
  margin-bottom: 8px;
`;

const CodeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Code = styled.div`
  background: rgba(0, 0, 0, 0.3);
  color: #ff6b00;
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  font-weight: bold;
  padding: 12px 16px;
  border-radius: 8px;
  flex: 1;
  letter-spacing: 2px;
`;

const CopyButton = styled.button`
  background: #ff6b00;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: #ff8533;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 15px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #ff6b00;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  color: #cccccc;
  font-size: 0.8rem;
`;

const ProgressSection = styled.div`
  margin-bottom: 20px;
`;

const ProgressLabel = styled.div`
  color: #cccccc;
  font-size: 0.9rem;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  background: linear-gradient(90deg, #ff6b00, #ff8533);
  width: ${({ $percentage }) => Math.min($percentage, 100)}%;
  transition: width 0.3s ease;
`;

const ShareSection = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const ShareButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: #cccccc;
`;

interface ReferralStats {
  referralCode: string;
  completedReferrals: number;
  rewardedReferrals: number;
  pendingReferrals: number;
  totalBonusesEarned: number;
  referralsUntilNextBonus: number;
  freeEntriesCount: number;
  isSubscribed: boolean;
  subscriptionExpiresAt?: string;
}

const ReferralCard: React.FC = () => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralStats();
  }, []);

  const loadReferralStats = async () => {
    if (!api.hasToken()) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response: any = await api.get('/api/referrals/stats');
      setStats((response?.data || response) as ReferralStats);
    } catch (error: any) {
      if (error?.status === 401) {
        setStats(null);
        return;
      }
      console.error('Failed to load referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    if (!stats?.referralCode) return;

    try {
      await navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const shareReferralLink = (platform: string) => {
    if (!stats?.referralCode) return;

    const referralUrl = `${window.location.origin}/auth?ref=${encodeURIComponent(stats.referralCode)}`;
    const message = `Join me on WAY Esports! Use my referral code: ${stats.referralCode}`;

    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralUrl)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(message)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(referralUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <Container>
        <LoadingState>Loading referral information...</LoadingState>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container>
        <LoadingState>Unable to load referral information</LoadingState>
      </Container>
    );
  }

  const progressPercentage = stats.referralsUntilNextBonus === 0 ? 100 : 
    ((3 - stats.referralsUntilNextBonus) / 3) * 100;

  return (
    <Container>
      <Header>
        <Icon>{'\u{1F381}'}</Icon>
        <Title>Referral Program</Title>
      </Header>

      <ReferralCodeSection>
        <CodeLabel>Your Referral Code</CodeLabel>
        <CodeContainer>
          <Code>{stats.referralCode}</Code>
          <CopyButton onClick={copyReferralCode}>
            {copied ? '\u2713 Copied' : '\u{1F4CB} Copy'}
          </CopyButton>
        </CodeContainer>
      </ReferralCodeSection>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.completedReferrals}</StatValue>
          <StatLabel>Total Referrals</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.freeEntriesCount}</StatValue>
          <StatLabel>Free Entries</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.totalBonusesEarned}</StatValue>
          <StatLabel>Bonuses Earned</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.isSubscribed ? '\u2713' : '\u2717'}</StatValue>
          <StatLabel>Subscribed</StatLabel>
        </StatCard>
      </StatsGrid>

      <ProgressSection>
        <ProgressLabel>
          <span>Progress to Next Bonus</span>
          <span>{stats.referralsUntilNextBonus === 0 ? 'Complete!' : `${stats.referralsUntilNextBonus} more referrals`}</span>
        </ProgressLabel>
        <ProgressBar>
          <ProgressFill $percentage={progressPercentage} />
        </ProgressBar>
      </ProgressSection>

      <ShareSection>
        <ShareButton onClick={() => shareReferralLink('copy')}>
          {'\u{1F4CB}'} Copy Link
        </ShareButton>
        <ShareButton onClick={() => shareReferralLink('twitter')}>
          {'\u{1F426}'} Share on Twitter
        </ShareButton>
        <ShareButton onClick={() => shareReferralLink('telegram')}>
          {'\u2708'} Share on Telegram
        </ShareButton>
      </ShareSection>
    </Container>
  );
};

export default ReferralCard;
