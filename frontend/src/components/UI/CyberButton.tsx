import React from 'react';
import styled, { css } from 'styled-components';
import { cyberpunkTheme } from '../../styles/cyberpunk-theme';

interface CyberButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const getVariantStyles = (variant: string) => {
  switch (variant) {
    case 'primary':
      return css`
        background: ${cyberpunkTheme.colors.white};
        color: ${cyberpunkTheme.colors.black};
        border: 1px solid ${cyberpunkTheme.colors.white};
        
        &:hover:not(:disabled) {
          background: ${cyberpunkTheme.colors.gray[200]};
          box-shadow: ${cyberpunkTheme.shadows.glow};
        }
        
        &:active:not(:disabled) {
          background: ${cyberpunkTheme.colors.gray[300]};
          transform: translateY(1px);
        }
      `;
      
    case 'secondary':
      return css`
        background: ${cyberpunkTheme.colors.bg.elevated};
        color: ${cyberpunkTheme.colors.text.primary};
        border: 1px solid ${cyberpunkTheme.colors.border.medium};
        
        &:hover:not(:disabled) {
          background: ${cyberpunkTheme.colors.gray[700]};
          border-color: ${cyberpunkTheme.colors.white};
        }
        
        &:active:not(:disabled) {
          background: ${cyberpunkTheme.colors.gray[600]};
        }
      `;
      
    case 'ghost':
      return css`
        background: transparent;
        color: ${cyberpunkTheme.colors.text.secondary};
        border: 1px solid transparent;
        
        &:hover:not(:disabled) {
          background: ${cyberpunkTheme.colors.bg.elevated};
          color: ${cyberpunkTheme.colors.text.primary};
        }
        
        &:active:not(:disabled) {
          background: ${cyberpunkTheme.colors.gray[700]};
        }
      `;
      
    case 'danger':
      return css`
        background: ${cyberpunkTheme.colors.error};
        color: ${cyberpunkTheme.colors.white};
        border: 1px solid ${cyberpunkTheme.colors.error};
        
        &:hover:not(:disabled) {
          background: #dc2626;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        }
        
        &:active:not(:disabled) {
          background: #b91c1c;
          transform: translateY(1px);
        }
      `;
      
    default:
      return css`
        background: ${cyberpunkTheme.colors.bg.elevated};
        color: ${cyberpunkTheme.colors.text.primary};
        border: 1px solid ${cyberpunkTheme.colors.border.medium};
      `;
  }
};

const getSizeStyles = (size: string) => {
  switch (size) {
    case 'sm':
      return css`
        padding: ${cyberpunkTheme.spacing.xs} ${cyberpunkTheme.spacing.sm};
        font-size: 0.875rem;
        min-height: 32px;
      `;
    case 'md':
      return css`
        padding: ${cyberpunkTheme.spacing.sm} ${cyberpunkTheme.spacing.md};
        font-size: 1rem;
        min-height: 44px;
      `;
    case 'lg':
      return css`
        padding: ${cyberpunkTheme.spacing.md} ${cyberpunkTheme.spacing.lg};
        font-size: 1.125rem;
        min-height: 56px;
      `;
    default:
      return css`
        padding: ${cyberpunkTheme.spacing.sm} ${cyberpunkTheme.spacing.md};
        font-size: 1rem;
        min-height: 44px;
      `;
  }
};

const StyledButton = styled.button<CyberButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${cyberpunkTheme.spacing.xs};
  font-family: ${cyberpunkTheme.fonts.accent};
  font-weight: ${cyberpunkTheme.fontWeights.medium};
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border-radius: ${cyberpunkTheme.borderRadius.sm};
  transition: all ${cyberpunkTheme.transitions.fast};
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  
  ${props => getVariantStyles(props.variant || 'secondary')}
  ${props => getSizeStyles(props.size || 'md')}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
  
  /* Loading state */
  ${props => props.loading && css`
    color: transparent;
    pointer-events: none;
    
    &::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid ${cyberpunkTheme.colors.border.medium};
      border-top: 2px solid ${cyberpunkTheme.colors.white};
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  `}
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Focus styles */
  &:focus-visible {
    outline: 2px solid ${cyberpunkTheme.colors.white};
    outline-offset: 2px;
  }
`;

const CyberButton: React.FC<CyberButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  children,
  fullWidth = false,
  type = 'button',
  ...props
}) => {
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <StyledButton
      variant={variant}
      size={size}
      disabled={disabled || loading}
      loading={loading}
      onClick={handleClick}
      fullWidth={fullWidth}
      type={type}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default CyberButton;
