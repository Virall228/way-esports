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
        background: ${({ theme }) => theme.colors.primary};
        color: ${({ theme }) => theme.colors.white};
        &:hover:not(:disabled) {
          background: ${({ theme }) => theme.colors.primaryDark};
          box-shadow: ${({ theme }) => theme.shadows.glow};
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
        color: ${({ theme }) => theme.colors.accent};
        border: 2px solid ${({ theme }) => theme.colors.accent};
        &:hover:not(:disabled) {
          background: ${({ theme }) => `${theme.colors.accent}10`};
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
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-weight: ${({ theme }) => theme.typography.button.fontWeight};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  width: ${({ fullWidth }) => fullWidth ? '100%' : 'auto'};

  ${({ variant }) => getButtonStyles(variant)}
  ${({ size }) => getButtonSize(size)}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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