import React from 'react';
import styled, { css, keyframes } from 'styled-components';

type FlameTier = 'top20' | 'top50' | 'top100' | 'top150' | 'default';

interface FlameAuraAvatarProps {
  imageUrl?: string | null;
  fallbackText?: string;
  size?: number;
  tier?: FlameTier;
  intensity?: number;
  rounded?: boolean;
  borderColor?: string;
}

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.55; }
  50% { transform: scale(1.06); opacity: 0.9; }
  100% { transform: scale(1); opacity: 0.55; }
`;

const Wrapper = styled.div<{ $size: number; $rounded: boolean; $auraColor: string; $intensity: number }>`
  width: ${({ $size }) => `${$size}px`};
  height: ${({ $size }) => `${$size}px`};
  border-radius: ${({ $rounded }) => ($rounded ? '50%' : '16px')};
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  isolation: isolate;

  &::before {
    content: '';
    position: absolute;
    inset: -8px;
    border-radius: inherit;
    background: radial-gradient(circle, ${({ $auraColor }) => $auraColor} 0%, rgba(0, 0, 0, 0) 70%);
    filter: blur(10px);
    opacity: ${({ $intensity }) => (0.35 + Math.min(1, Math.max(0, $intensity)) * 0.5).toFixed(2)};
    z-index: -2;
    animation: ${pulse} 2.2s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    border: 1px solid ${({ $auraColor }) => $auraColor};
    box-shadow: 0 0 18px ${({ $auraColor }) => $auraColor};
    opacity: ${({ $intensity }) => (0.3 + Math.min(1, Math.max(0, $intensity)) * 0.6).toFixed(2)};
    z-index: -1;
  }
`;

const AvatarImage = styled.img<{ $rounded: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: ${({ $rounded }) => ($rounded ? '50%' : '16px')};
`;

const Fallback = styled.div<{ $rounded: boolean }>`
  width: 100%;
  height: 100%;
  border-radius: ${({ $rounded }) => ($rounded ? '50%' : '16px')};
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  ${({ $rounded }) => $rounded && css`font-size: 1.4rem;`}
`;

const tierToColor = (tier: FlameTier) => {
  if (tier === 'top20') return '#8a2be2';
  if (tier === 'top50') return '#ff4fa0';
  if (tier === 'top100') return '#ff3b30';
  if (tier === 'top150') return '#ff6b00';
  return '#ff6b00';
};

const FlameAuraAvatar: React.FC<FlameAuraAvatarProps> = ({
  imageUrl,
  fallbackText = '?',
  size = 56,
  tier = 'default',
  intensity = 0.6,
  rounded = true,
  borderColor
}) => {
  const [imageBroken, setImageBroken] = React.useState(false);
  React.useEffect(() => {
    setImageBroken(false);
  }, [imageUrl]);

  const auraColor = borderColor || tierToColor(tier);
  const safeImageUrl = imageUrl && !imageBroken ? imageUrl : null;
  return (
    <Wrapper $size={size} $rounded={rounded} $auraColor={auraColor} $intensity={intensity}>
      {safeImageUrl ? (
        <AvatarImage src={safeImageUrl} alt="avatar" $rounded={rounded} onError={() => setImageBroken(true)} />
      ) : (
        <Fallback $rounded={rounded}>{fallbackText.slice(0, 1).toUpperCase()}</Fallback>
      )}
    </Wrapper>
  );
};

export default FlameAuraAvatar;
