import React from 'react';
import styled, { css } from 'styled-components';

type CardVariant = 'default' | 'outlined' | 'elevated';

interface CardProps {
  variant?: CardVariant;
  clickable?: boolean;
  noPadding?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const getCardStyles = (variant: CardVariant = 'default') => {
  switch (variant) {
    case 'default':
      return css`
        background: ${({ theme }) =>
          theme.isLight
            ? 'rgba(255, 255, 255, 0.84)'
            : 'linear-gradient(145deg, rgba(18, 22, 28, 0.82) 0%, rgba(6, 8, 11, 0.88) 100%)'};
        border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.light : theme.colors.glass.panelBorder)};
        box-shadow: ${({ theme }) => (theme.isLight ? theme.shadows.medium : theme.shadows.medium)};
        backdrop-filter: blur(16px);
      `;
    case 'outlined':
      return css`
        background: ${({ theme }) =>
          theme.isLight
            ? 'rgba(255, 252, 247, 0.76)'
            : 'linear-gradient(145deg, rgba(11, 14, 18, 0.72) 0%, rgba(4, 6, 8, 0.82) 100%)'};
        border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.border.medium)};
        backdrop-filter: blur(12px);
      `;
    case 'elevated':
      return css`
        background: ${({ theme }) =>
          theme.isLight
            ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(252, 246, 237, 0.92) 100%)'
            : 'linear-gradient(145deg, rgba(24, 28, 36, 0.92) 0%, rgba(6, 8, 11, 0.96) 58%, rgba(19, 11, 4, 0.88) 100%)'};
        border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.glass.panelBorder)};
        box-shadow: ${({ theme }) => (theme.isLight ? theme.shadows.large : theme.shadows.large)};
        backdrop-filter: blur(20px);
      `;
  }
};

const StyledCard = styled.div<CardProps>`
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme, noPadding }) => noPadding ? '0' : theme.spacing.md};
  transition: all ${({ theme }) => theme.transitions.fast};
  position: relative;
  overflow: hidden;

  ${({ variant }) => getCardStyles(variant)}

  &::before {
    content: ${({ theme }) => (theme.isLight ? 'none' : "''")};
    position: absolute;
    top: 0;
    right: 0;
    width: 42%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 138, 31, 0.58), transparent);
    pointer-events: none;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  ${({ clickable }) =>
    clickable &&
    css`
      cursor: pointer;
      &:hover {
        transform: translateY(-2px);
        box-shadow: ${({ theme }) => (theme.isLight ? theme.shadows.large : theme.shadows.glow)};
        border-color: ${({ theme }) => theme.colors.border.strong};
      }
      &:active {
        transform: translateY(0);
      }
    `}
`;

const Card: React.FC<CardProps> = ({
  variant = 'default',
  clickable = false,
  noPadding = false,
  children,
  className,
  onClick,
}) => {
  return (
    <StyledCard
      variant={variant}
      clickable={clickable}
      noPadding={noPadding}
      className={className}
      onClick={onClick}
    >
      {children}
    </StyledCard>
  );
};

export default Card; 
