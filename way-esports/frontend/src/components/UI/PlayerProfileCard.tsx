import React from 'react';
import styled from 'styled-components';
import Card from './Card';
import ProfileLogo from './ProfileLogo';

interface PlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  matchesPlayed: number;
  winRate: number;
  averageDamage: number;
  headshots: number;
}

interface PlayerProfileCardProps {
  playerId: string;
  nickname: string;
  realName?: string;
  avatar?: string;
  team?: string;
  teamLogo?: string;
  game: 'CS2' | 'CriticalOps' | 'PUBG';
  role?: string;
  country?: string;
  stats: PlayerStats;
  onClick?: () => void;
}

const StyledCard = styled(Card)`
  overflow: hidden;
`;

const CoverSection = styled.div`
  height: 80px;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary} 0%,
    ${({ theme }) => theme.colors.accent} 100%
  );
  position: relative;
`;

const AvatarContainer = styled.div`
  position: absolute;
  bottom: -40px;
  left: ${({ theme }) => theme.spacing.md};
  width: 80px;
  height: 80px;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  border: 4px solid ${({ theme }) => theme.colors.surface};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.primary};
`;

const Avatar = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PlayerInfo = styled.div`
  padding: ${({ theme }) => `${theme.spacing.xl} ${theme.spacing.md} ${theme.spacing.md}`};
`;

const NicknameRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Nickname = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 700;
`;

const RealName = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
`;

const TeamInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const TeamLogo = styled.img`
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
`;

const TeamName = styled.span`
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 500;
`;

const PlayerMeta = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const StatLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
`;

const StatValue = styled.span<{ highlight?: boolean }>`
  color: ${({ theme, highlight }) => 
    highlight ? theme.colors.accent : theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.body1.fontSize};
  font-weight: 600;
`;

const PlayerProfileCard: React.FC<PlayerProfileCardProps> = ({
  nickname,
  realName,
  avatar,
  team,
  teamLogo,
  game,
  role,
  country,
  stats,
  onClick,
}) => {
  return (
    <StyledCard variant="elevated" clickable={!!onClick} onClick={onClick}>
      <CoverSection>
        <AvatarContainer>
          <ProfileLogo
            logoUrl={avatar}
            username={nickname}
            size="large"
            showBorder={false}
          />
        </AvatarContainer>
      </CoverSection>

      <PlayerInfo>
        <NicknameRow>
          <Nickname>{nickname}</Nickname>
          {realName && <RealName>({realName})</RealName>}
        </NicknameRow>

        {team && (
          <TeamInfo>
            {teamLogo && <TeamLogo src={teamLogo} alt={team} />}
            <TeamName>{team}</TeamName>
          </TeamInfo>
        )}

        <PlayerMeta>
          <MetaItem>🎮 {game}</MetaItem>
          {role && <MetaItem>👥 {role}</MetaItem>}
          {country && <MetaItem>🌍 {country}</MetaItem>}
        </PlayerMeta>

        <StatsGrid>
          <StatItem>
            <StatLabel>K/D/A</StatLabel>
            <StatValue highlight>
              {stats.kills}/{stats.deaths}/{stats.assists}
            </StatValue>
          </StatItem>

          <StatItem>
            <StatLabel>KDA Ratio</StatLabel>
            <StatValue highlight>{stats.kda.toFixed(2)}</StatValue>
          </StatItem>

          <StatItem>
            <StatLabel>Matches</StatLabel>
            <StatValue>{stats.matchesPlayed}</StatValue>
          </StatItem>

          <StatItem>
            <StatLabel>Win Rate</StatLabel>
            <StatValue>{stats.winRate}%</StatValue>
          </StatItem>

          <StatItem>
            <StatLabel>Avg Damage</StatLabel>
            <StatValue>{stats.averageDamage}</StatValue>
          </StatItem>

          <StatItem>
            <StatLabel>Headshots</StatLabel>
            <StatValue>{stats.headshots}%</StatValue>
          </StatItem>
        </StatsGrid>
      </PlayerInfo>
    </StyledCard>
  );
};

export default PlayerProfileCard; 