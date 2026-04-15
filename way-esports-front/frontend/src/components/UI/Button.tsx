import React from 'react';
import styled, { css } from 'styled-components';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'brand' | 'danger' | 'success';
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
        background: ${({ theme }) =>
          theme.isLight
            ? 'rgba(255, 255, 255, 0.92)'
            : 'linear-gradient(135deg, rgba(255, 138, 31, 0.18) 0%, rgba(14, 17, 22, 0.92) 48%, rgba(255, 107, 0, 0.12) 100%)'};
        color: ${({ theme }) => theme.colors.text.primary};
        border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.glass.panelBorder)};
        box-shadow: ${({ theme }) =>
          theme.isLight
            ? '0 10px 24px rgba(109, 78, 44, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
            : '0 14px 28px rgba(0, 0, 0, 0.4), 0 0 18px rgba(255, 107, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.08)'};
        &:hover:not(:disabled) {
          background: ${({ theme }) =>
            theme.isLight
              ? 'rgba(255, 248, 241, 1)'
              : 'linear-gradient(135deg, rgba(255, 138, 31, 0.28) 0%, rgba(18, 21, 27, 0.96) 46%, rgba(255, 107, 0, 0.18) 100%)'};
          border-color: ${({ theme }) => theme.colors.border.strong};
        }
        &:active {
          transform: translateY(1px);
        }
      `;
    case 'secondary':
      return css`
        background: ${({ theme }) => (theme.isLight ? 'rgba(239, 228, 212, 0.72)' : 'rgba(255, 138, 31, 0.055)')};
        color: ${({ theme }) => theme.colors.text.secondary};
        border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.light : theme.colors.border.medium)};
        &:hover:not(:disabled) {
          color: ${({ theme }) => theme.colors.text.primary};
          background: ${({ theme }) => (theme.isLight ? 'rgba(232, 214, 194, 0.86)' : 'rgba(255, 138, 31, 0.12)')};
          border-color: ${({ theme }) => theme.colors.border.strong};
        }
      `;
    case 'outline':
      return css`
        background: ${({ theme }) => (theme.isLight ? 'rgba(255, 255, 255, 0.48)' : 'transparent')};
        color: ${({ theme }) => theme.colors.text.primary};
        border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.border.medium)};
        &:hover:not(:disabled) {
          background: ${({ theme }) => (theme.isLight ? 'rgba(255, 248, 241, 0.82)' : 'rgba(255, 138, 31, 0.08)')};
          border-color: ${({ theme }) => theme.colors.border.strong};
        }
      `;
    case 'text':
      return css`
        background: transparent;
        color: ${({ theme }) => (theme.isLight ? theme.colors.text.secondary : theme.colors.text.primary)};
        &:hover:not(:disabled) {
          color: ${({ theme }) => theme.colors.accent};
          background: ${({ theme }) => (theme.isLight ? 'rgba(201, 106, 22, 0.08)' : 'transparent')};
        }
      `;
    case 'brand':
      return css`
        background: linear-gradient(135deg, #ff6b00 0%, #ff9d3d 52%, #ff6b00 100%);
        color: #100702;
        border: 1px solid rgba(255, 177, 93, 0.72);
        box-shadow: ${({ theme }) =>
          theme.isLight
            ? '0 14px 30px rgba(201, 106, 22, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : '0 16px 32px rgba(255, 107, 0, 0.18), 0 12px 24px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.28)'};
        &:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff7a1a 0%, #ffb15d 52%, #ff7a1a 100%);
          border-color: rgba(255, 203, 145, 0.84);
          box-shadow: ${({ theme }) =>
            theme.isLight
              ? '0 16px 34px rgba(201, 106, 22, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.28)'
              : '0 0 28px rgba(255, 107, 0, 0.26), 0 16px 34px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.32)'};
        }
        &:active {
          transform: translateY(1px);
        }
      `;
    case 'danger':
      return css`
        background: rgba(239, 68, 68, 0.12);
        color: ${({ theme }) => theme.colors.error};
        border: 1px solid rgba(239, 68, 68, 0.3);
        &:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
        }
      `;
    case 'success':
      return css`
        background: rgba(34, 197, 94, 0.12);
        color: ${({ theme }) => theme.colors.success};
        border: 1px solid rgba(34, 197, 94, 0.35);
        &:hover:not(:disabled) {
          background: rgba(34, 197, 94, 0.2);
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
  min-height: 44px;
  backdrop-filter: blur(12px);

  ${({ variant }) => getButtonStyles(variant)}
  ${({ size }) => getButtonSize(size)}

  &:disabled {
    opacity: ${({ theme }) => (theme.isLight ? 0.5 : 0.6)};
    cursor: not-allowed;
    box-shadow: none;
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
