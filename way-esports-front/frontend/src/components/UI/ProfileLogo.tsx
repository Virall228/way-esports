import React from 'react';
import styled from 'styled-components';

interface ProfileLogoProps {
  logoUrl?: string;
  username: string;
  size?: 'small' | 'medium' | 'large';
  showBorder?: boolean;
  onClick?: () => void;
  className?: string;
}

const LogoContainer = styled.div<{ 
  $size: string; 
  $hasLogo: boolean; 
  $showBorder: boolean;
  $clickable: boolean;
}>`
  width: ${({ $size }) => {
    switch ($size) {
      case 'small': return '32px';
      case 'large': return '80px';
      default: return '48px';
    }
  }};
  height: ${({ $size }) => {
    switch ($size) {
      case 'small': return '32px';
      case 'large': return '80px';
      default: return '48px';
    }
  }};
  border-radius: 50%;
  background: ${({ $hasLogo }) => $hasLogo ? 'transparent' : '#1a1a1a'};
  border: ${({ $showBorder }) => $showBorder ? '2px solid #ff6b00' : 'none'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ $size }) => {
    switch ($size) {
      case 'small': return '16px';
      case 'large': return '32px';
      default: return '24px';
    }
  }};
  overflow: hidden;
  cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
  transition: all 0.3s ease;
  position: relative;

  ${({ $clickable }) => $clickable && `
    &:hover {
      transform: scale(1.05);
      border-color: #ffd700;
    }
  `}

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
`;

const LogoOverlay = styled.div`
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

  ${LogoContainer}:hover & {
    opacity: 1;
  }

  svg {
    width: 16px;
    height: 16px;
    color: #ffffff;
  }
`;

const ProfileLogo: React.FC<ProfileLogoProps> = ({
  logoUrl,
  username,
  size = 'medium',
  showBorder = true,
  onClick,
  className
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <LogoContainer
      $size={size}
      $hasLogo={!!logoUrl}
      $showBorder={showBorder}
      $clickable={!!onClick}
      onClick={handleClick}
      className={className}
    >
      {logoUrl ? (
        <>
          <img src={logoUrl} alt={`${username}'s profile logo`} />
          {onClick && (
            <LogoOverlay>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </LogoOverlay>
          )}
        </>
      ) : (
        <>
          👤
          {onClick && (
            <LogoOverlay>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </LogoOverlay>
          )}
        </>
      )}
    </LogoContainer>
  );
};

export default ProfileLogo; 