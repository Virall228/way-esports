import React from 'react';
import styled, { css } from 'styled-components';

type CardVariant = 'default' | 'outlined' | 'elevated';

interface CardProps {
  variant?: CardVariant;
  clickable?: boolean;
  noPadding?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const getCardStyles = (variant: CardVariant = 'default') => {
  switch (variant) {
    case 'default':
      return css`
        background: ${({ theme }) =>
          theme.isLight
            ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 247, 250, 0.92) 100%)'
            : 'linear-gradient(180deg, rgba(20, 24, 30, 0.88) 0%, rgba(10, 12, 16, 0.95) 100%)'};
        border-color: ${({ theme }) => (theme.isLight ? theme.colors.border.light : theme.colors.border.light)};
        box-shadow: ${({ theme }) => theme.shadows.medium};
      `;
    case 'outlined':
      return css`
        background: ${({ theme }) =>
          theme.isLight
            ? 'rgba(255, 255, 255, 0.8)'
            : 'linear-gradient(180deg, rgba(16, 19, 24, 0.8) 0%, rgba(8, 10, 13, 0.9) 100%)'};
        border-color: ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.border.medium)};
        box-shadow: ${({ theme }) => (theme.isLight ? '0 10px 24px rgba(31, 41, 55, 0.05)' : '0 18px 32px rgba(0, 0, 0, 0.12)')};
      `;
    case 'elevated':
      return css`
        background: ${({ theme }) =>
          theme.isLight
            ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(246, 248, 251, 0.95) 100%)'
            : 'linear-gradient(180deg, rgba(26, 31, 37, 0.94) 0%, rgba(12, 15, 19, 0.98) 62%, rgba(10, 12, 15, 1) 100%)'};
        border-color: ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.border.medium)};
        box-shadow: ${({ theme }) => theme.shadows.large};
      `;
  }
};

const StyledCard = styled.div<CardProps>`
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 28px;
  padding: ${({ theme, noPadding }) => (noPadding ? '0' : theme.spacing.md)};
  transition:
    transform ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.medium},
    background ${({ theme }) => theme.transitions.medium};
  backdrop-filter: blur(20px) saturate(120%);
  isolation: isolate;

  ${({ variant }) => getCardStyles(variant)}

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.06), transparent 34%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent 24%);
    opacity: ${({ theme }) => (theme.isLight ? 0.24 : 0.9)};
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    border: 1px solid rgba(255, 255, 255, 0.03);
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
        transform: translateY(-2px) scale(0.998);
        border-color: ${({ theme }) => theme.colors.border.strong};
        box-shadow: ${({ theme }) => (theme.isLight ? theme.shadows.medium : '0 22px 40px rgba(0, 0, 0, 0.24)')};
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
  style,
  onClick
}) => (
  <StyledCard
    variant={variant}
    clickable={clickable}
    noPadding={noPadding}
    className={className}
    style={style}
    onClick={onClick}
  >
    {children}
  </StyledCard>
);

export default Card;
