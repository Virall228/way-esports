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
            ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(247, 240, 230, 0.92) 100%)'
            : 'linear-gradient(180deg, rgba(17, 20, 25, 0.88) 0%, rgba(9, 11, 15, 0.94) 100%)'};
        border-color: ${({ theme }) => (theme.isLight ? theme.colors.border.light : theme.colors.border.light)};
        box-shadow: ${({ theme }) => theme.shadows.medium};
      `;
    case 'outlined':
      return css`
        background: ${({ theme }) =>
          theme.isLight
            ? 'rgba(255, 255, 255, 0.78)'
            : 'linear-gradient(180deg, rgba(12, 15, 19, 0.8) 0%, rgba(7, 9, 12, 0.9) 100%)'};
        border-color: ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.border.medium)};
      `;
    case 'elevated':
      return css`
        background: ${({ theme }) =>
          theme.isLight
            ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 239, 229, 0.94) 100%)'
            : 'linear-gradient(180deg, rgba(24, 28, 34, 0.94) 0%, rgba(10, 12, 15, 0.98) 58%, rgba(17, 12, 8, 0.94) 100%)'};
        border-color: ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.border.accent)};
        box-shadow: ${({ theme }) => theme.shadows.large};
      `;
  }
};

const StyledCard = styled.div<CardProps>`
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme, noPadding }) => (noPadding ? '0' : theme.spacing.md)};
  transition:
    transform ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.medium},
    background ${({ theme }) => theme.transitions.medium};
  backdrop-filter: blur(14px);
  isolation: isolate;

  ${({ variant }) => getCardStyles(variant)}

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.08), transparent 34%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 26%);
    opacity: ${({ theme }) => (theme.isLight ? 0.3 : 1)};
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
        transform: translateY(-3px);
        border-color: ${({ theme }) => theme.colors.border.accent};
        box-shadow: ${({ theme }) => theme.shadows.glow};
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
