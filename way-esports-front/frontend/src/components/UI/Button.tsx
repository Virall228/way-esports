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
            ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(244, 236, 226, 0.94) 100%)'
            : 'linear-gradient(180deg, rgba(29, 34, 41, 0.96) 0%, rgba(12, 15, 20, 0.96) 100%)'};
        color: ${({ theme }) => theme.colors.text.primary};
        border-color: ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.border.medium)};
        box-shadow: ${({ theme }) => theme.shadows.md};

        &:hover:not(:disabled) {
          border-color: ${({ theme }) => theme.colors.border.strong};
          box-shadow: ${({ theme }) => theme.shadows.lg};
        }
      `;
    case 'secondary':
      return css`
        background: ${({ theme }) => (theme.isLight ? 'rgba(255, 252, 247, 0.84)' : 'rgba(255, 255, 255, 0.045)')};
        color: ${({ theme }) => theme.colors.text.secondary};
        border-color: ${({ theme }) => (theme.isLight ? theme.colors.border.light : theme.colors.border.light)};

        &:hover:not(:disabled) {
          color: ${({ theme }) => theme.colors.text.primary};
          background: ${({ theme }) => (theme.isLight ? 'rgba(255, 247, 238, 0.96)' : 'rgba(255, 255, 255, 0.07)')};
          border-color: ${({ theme }) => theme.colors.border.medium};
        }
      `;
    case 'outline':
      return css`
        background: transparent;
        color: ${({ theme }) => theme.colors.text.primary};
        border-color: ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.border.medium)};

        &:hover:not(:disabled) {
          background: ${({ theme }) => (theme.isLight ? 'rgba(201, 106, 22, 0.06)' : 'rgba(255, 255, 255, 0.05)')};
          border-color: ${({ theme }) => theme.colors.border.accent};
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
          background: ${({ theme }) => (theme.isLight ? 'rgba(201, 106, 22, 0.06)' : 'rgba(255, 255, 255, 0.04)')};
        }
      `;
    case 'ghost':
      return css`
        background: ${({ theme }) => (theme.isLight ? 'rgba(255, 255, 255, 0.52)' : 'rgba(255, 255, 255, 0.03)')};
        color: ${({ theme }) => theme.colors.text.primary};
        border-color: transparent;
        box-shadow: none;

        &:hover:not(:disabled) {
          background: ${({ theme }) => (theme.isLight ? 'rgba(255, 255, 255, 0.78)' : 'rgba(255, 255, 255, 0.07)')};
          border-color: ${({ theme }) => theme.colors.border.light};
        }
      `;
    case 'brand':
      return css`
        background: linear-gradient(135deg, #f08a32 0%, #ffb267 52%, #f08a32 100%);
        color: #1a1108;
        border-color: rgba(255, 214, 169, 0.54);
        box-shadow: ${({ theme }) =>
          theme.isLight
            ? '0 16px 34px rgba(201, 106, 22, 0.18)'
            : '0 18px 36px rgba(245, 154, 74, 0.14), 0 18px 32px rgba(0, 0, 0, 0.34)'};

        &:hover:not(:disabled) {
          box-shadow: ${({ theme }) => theme.shadows.glow};
          border-color: rgba(255, 224, 188, 0.88);
        }
      `;
    case 'danger':
      return css`
        background: rgba(248, 113, 113, 0.1);
        color: ${({ theme }) => theme.colors.error};
        border-color: rgba(248, 113, 113, 0.3);

        &:hover:not(:disabled) {
          background: rgba(248, 113, 113, 0.16);
        }
      `;
    case 'success':
      return css`
        background: rgba(52, 211, 153, 0.1);
        color: ${({ theme }) => theme.colors.success};
        border-color: rgba(52, 211, 153, 0.28);

        &:hover:not(:disabled) {
          background: rgba(52, 211, 153, 0.16);
        }
      `;
  }
};

const getButtonSize = (size: ButtonSize = 'medium') => {
  switch (size) {
    case 'small':
      return css`
        min-height: 40px;
        padding: 0.7rem 0.95rem;
        font-size: ${({ theme }) => theme.typography.body2.fontSize};
      `;
    case 'medium':
      return css`
        min-height: 46px;
        padding: 0.85rem 1.15rem;
        font-size: ${({ theme }) => theme.typography.body1.fontSize};
      `;
    case 'large':
      return css`
        min-height: 54px;
        padding: 1rem 1.5rem;
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
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-family: ${({ theme }) => theme.fonts.accent};
  font-weight: ${({ theme }) => theme.typography.button.fontWeight};
  line-height: 1;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition:
    transform ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.medium},
    border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.medium},
    color ${({ theme }) => theme.transitions.fast};
  backdrop-filter: blur(12px);
  overflow: hidden;
  isolation: isolate;

  &::before {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: inherit;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
    opacity: ${({ theme }) => (theme.isLight ? 0.45 : 0.2)};
    pointer-events: none;
    z-index: -1;
  }

  ${({ variant }) => getButtonStyles(variant)}
  ${({ size }) => getButtonSize(size)}

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(1px) scale(0.995);
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
