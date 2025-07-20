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
        background: ${({ theme }) => theme.colors.surface};
        box-shadow: ${({ theme }) => theme.shadows.small};
      `;
    case 'outlined':
      return css`
        background: transparent;
        border: 1px solid ${({ theme }) => theme.colors.text.disabled};
      `;
    case 'elevated':
      return css`
        background: ${({ theme }) => theme.colors.surface};
        box-shadow: ${({ theme }) => theme.shadows.large};
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