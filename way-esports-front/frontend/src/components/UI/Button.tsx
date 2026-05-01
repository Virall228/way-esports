import React from 'react';
import styled, { css } from 'styled-components';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'brand' | 'danger' | 'success' | 'ghost';
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
            ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 247, 250, 0.94) 100%)'
            : 'linear-gradient(180deg, rgba(32, 37, 45, 0.94) 0%, rgba(18, 21, 27, 0.98) 100%)'};
        color: ${({ theme }) => theme.colors.text.primary};
        border-color: ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.border.medium)};
        box-shadow: ${({ theme }) => (theme.isLight ? theme.shadows.sm : '0 18px 34px rgba(0, 0, 0, 0.22)')};

        &:hover:not(:disabled) {
          border-color: ${({ theme }) => theme.colors.border.strong};
          box-shadow: ${({ theme }) => (theme.isLight ? theme.shadows.md : '0 22px 38px rgba(0, 0, 0, 0.26)')};
        }
      `;
    case 'secondary':
      return css`
        background: ${({ theme }) => (theme.isLight ? 'rgba(255, 255, 255, 0.84)' : 'rgba(255, 255, 255, 0.042)')};
        color: ${({ theme }) => theme.colors.text.primary};
        border-color: ${({ theme }) => (theme.isLight ? theme.colors.border.light : theme.colors.border.light)};

        &:hover:not(:disabled) {
          color: ${({ theme }) => theme.colors.text.primary};
          background: ${({ theme }) => (theme.isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(255, 255, 255, 0.062)')};
          border-color: ${({ theme }) => theme.colors.border.medium};
        }
      `;
    case 'outline':
      return css`
        background: ${({ theme }) => (theme.isLight ? 'rgba(255,255,255,0.48)' : 'rgba(255, 255, 255, 0.02)')};
        color: ${({ theme }) => theme.colors.text.primary};
        border-color: ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.border.medium)};

        &:hover:not(:disabled) {
          background: ${({ theme }) => (theme.isLight ? 'rgba(255,255,255,0.78)' : 'rgba(255, 255, 255, 0.05)')};
          border-color: ${({ theme }) => theme.colors.border.strong};
        }
      `;
    case 'text':
      return css`
        background: transparent;
        color: ${({ theme }) => theme.colors.text.secondary};
        border-color: transparent;
        box-shadow: none;

        &:hover:not(:disabled) {
          color: ${({ theme }) => theme.colors.text.primary};
          background: ${({ theme }) => (theme.isLight ? 'rgba(59, 130, 246, 0.06)' : 'rgba(255, 255, 255, 0.04)')};
        }
      `;
    case 'ghost':
      return css`
        background: ${({ theme }) => (theme.isLight ? 'rgba(255, 255, 255, 0.58)' : 'rgba(255, 255, 255, 0.025)')};
        color: ${({ theme }) => theme.colors.text.primary};
        border-color: transparent;
        box-shadow: none;

        &:hover:not(:disabled) {
          background: ${({ theme }) => (theme.isLight ? 'rgba(255, 255, 255, 0.82)' : 'rgba(255, 255, 255, 0.055)')};
          border-color: ${({ theme }) => theme.colors.border.light};
        }
      `;
    case 'brand':
      return css`
        background: ${({ theme }) =>
          theme.isLight
            ? 'linear-gradient(180deg, rgba(32, 39, 49, 0.96) 0%, rgba(22, 28, 37, 0.98) 100%)'
            : 'linear-gradient(180deg, rgba(40, 46, 56, 0.96) 0%, rgba(20, 24, 31, 1) 100%)'};
        color: ${({ theme }) => theme.colors.text.primary};
        border-color: ${({ theme }) => (theme.isLight ? 'rgba(96, 108, 123, 0.24)' : 'rgba(255, 255, 255, 0.14)')};
        box-shadow: ${({ theme }) =>
          theme.isLight
            ? '0 14px 28px rgba(31, 41, 55, 0.12)'
            : '0 18px 34px rgba(0, 0, 0, 0.26)'};

        &:hover:not(:disabled) {
          box-shadow: ${({ theme }) => (theme.isLight ? theme.shadows.md : '0 22px 38px rgba(0, 0, 0, 0.34)')};
          border-color: ${({ theme }) => (theme.isLight ? 'rgba(96, 108, 123, 0.34)' : theme.colors.border.strong)};
        }
      `;
    case 'danger':
      return css`
        background: rgba(248, 113, 113, 0.08);
        color: ${({ theme }) => theme.colors.text.primary};
        border-color: rgba(248, 113, 113, 0.24);

        &:hover:not(:disabled) {
          background: rgba(248, 113, 113, 0.12);
        }
      `;
    case 'success':
      return css`
        background: rgba(52, 211, 153, 0.08);
        color: ${({ theme }) => theme.colors.text.primary};
        border-color: rgba(52, 211, 153, 0.22);

        &:hover:not(:disabled) {
          background: rgba(52, 211, 153, 0.12);
        }
      `;
  }
};

const getButtonSize = (size: ButtonSize = 'medium') => {
  switch (size) {
    case 'small':
      return css`
        min-height: 38px;
        padding: 0.66rem 0.95rem;
        font-size: ${({ theme }) => theme.typography.body2.fontSize};
      `;
    case 'medium':
      return css`
        min-height: 44px;
        padding: 0.8rem 1.12rem;
        font-size: ${({ theme }) => theme.typography.body1.fontSize};
      `;
    case 'large':
      return css`
        min-height: 52px;
        padding: 0.95rem 1.45rem;
        font-size: ${({ theme }) => theme.typography.h5.fontSize};
      `;
  }
};

const StyledButton = styled.button<ButtonProps>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  font-family: ${({ theme }) => theme.fonts.accent};
  font-weight: ${({ theme }) => theme.typography.button.fontWeight};
  line-height: 1;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition:
    transform ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.medium},
    border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.medium},
    color ${({ theme }) => theme.transitions.fast};
  backdrop-filter: blur(18px) saturate(120%);
  overflow: hidden;
  isolation: isolate;

  &::before {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: inherit;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0));
    opacity: ${({ theme }) => (theme.isLight ? 0.24 : 0.1)};
    pointer-events: none;
    z-index: -1;
  }

  ${({ variant }) => getButtonStyles(variant)}
  ${({ size }) => getButtonSize(size)}

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.985);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.highlight};
    outline-offset: 2px;
  }

  ${({ isLoading }) =>
    isLoading &&
    css`
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
}) => (
  <StyledButton variant={variant} size={size} isLoading={isLoading} {...props}>
    {!isLoading && icon}
    {!isLoading && children}
    {isLoading && <span style={{ opacity: 0 }}>{children}</span>}
  </StyledButton>
);

export default Button;
