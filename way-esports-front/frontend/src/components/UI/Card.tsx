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
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 16px 30px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(16px);
      `;
    case 'outlined':
      return css`
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.18);
        backdrop-filter: blur(12px);
      `;
    case 'elevated':
      return css`
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.14);
        box-shadow: 0 24px 40px rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(20px);
      `;
  }
};

const StyledCard = styled.div<CardProps>`
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme, noPadding }) => noPadding ? '0' : theme.spacing.md};
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ variant }) => getCardStyles(variant)}

  ${({ clickable }) =>
    clickable &&
    css`
      cursor: pointer;
      &:hover {
        transform: translateY(-2px);
        box-shadow: ${({ theme }) => theme.shadows.medium};
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
