import React from 'react';
import styled, { css } from 'styled-components';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const getButtonStyles = (variant: ButtonVariant = 'primary') => {
  switch (variant) {
    case 'primary':
      return css`
        background: linear-gradient(180deg, ${({ theme }) => theme.colors.gray[800]} 0%, ${({ theme }) => theme.colors.gray[900]} 100%);
        color: ${({ theme }) => theme.colors.white};
        border: 1px solid ${({ theme }) => theme.colors.border.medium};
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), ${({ theme }) => theme.shadows.sm};
        &:hover:not(:disabled) {
          background: linear-gradient(180deg, ${({ theme }) => theme.colors.gray[700]} 0%, ${({ theme }) => theme.colors.gray[800]} 100%);
          border-color: ${({ theme }) => theme.colors.border.strong};
        }
        &:active {
          transform: translateY(1px);
        }
      `;
    case 'secondary':
      return css`
        background: ${({ theme }) => theme.colors.secondary};
        color: ${({ theme }) => theme.colors.white};
        &:hover:not(:disabled) {
          filter: brightness(110%);
        }
      `;
    case 'outline':
      return css`
        background: transparent;
        color: ${({ theme }) => theme.colors.text.primary};
        border: 1px solid ${({ theme }) => theme.colors.border.medium};
        &:hover:not(:disabled) {
          background: ${({ theme }) => theme.colors.bg.elevated};
        }
      `;
    case 'text':
      return css`
        background: transparent;
        color: ${({ theme }) => theme.colors.text.primary};
        &:hover:not(:disabled) {
          color: ${({ theme }) => theme.colors.accent};
        }
      `;
  }
};

const getButtonSize = (size: ButtonSize = 'medium') => {
  switch (size) {
    case 'small':
      return css`
        padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
        font-size: ${({ theme }) => theme.typography.body2.fontSize};
      `;
    case 'medium':
      return css`
        padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
        font-size: ${({ theme }) => theme.typography.body1.fontSize};
      `;
    case 'large':
      return css`
        padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
        font-size: ${({ theme }) => theme.typography.h3.fontSize};
      `;
  }
};

const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.typography.button.fontWeight};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  width: ${({ fullWidth }) => fullWidth ? '100%' : 'auto'};

  ${({ variant }) => getButtonStyles(variant)}
  ${({ size }) => getButtonSize(size)}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.highlight};
    outline-offset: 2px;
  }

  ${({ isLoading }) => isLoading && css`
    position: relative;
    pointer-events: none;

    &::after {
      content: '';
      position: absolute;
      width: 1em;
      height: 1em;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `}
`;

const Button: React.FC<ButtonProps> = ({ 
  children, 
  icon, 
  isLoading, 
  variant = 'primary',
  size = 'medium',
  ...props 
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      isLoading={isLoading}
      {...props}
    >
      {!isLoading && icon}
      {!isLoading && children}
      {isLoading && <span style={{ opacity: 0 }}>{children}</span>}
    </StyledButton>
  );
};

export default Button; 