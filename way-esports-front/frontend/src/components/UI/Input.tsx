import React from 'react';
import styled, { css } from 'styled-components';

type InputVariant = 'default' | 'filled' | 'outlined';
type InputSize = 'small' | 'medium' | 'large';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  error?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const getInputSize = (size: InputSize = 'medium') => {
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

const InputContainer = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
  position: relative;
`;

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
`;

const StyledInput = styled.input<InputProps>`
  background: rgba(255, 255, 255, 0.04);
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  outline: none;
  transition: all ${({ theme }) => theme.transitions.fast};
  width: 100%;
  backdrop-filter: blur(12px);

  ${({ size }) => getInputSize(size)}

  ${({ variant, theme }) =>
    variant === 'filled' &&
    css`
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: ${theme.borderRadius.small} ${theme.borderRadius.small} 0 0;

      &:focus {
        border-color: ${theme.colors.accent};
        background: rgba(255, 255, 255, 0.12);
      }
    `}

  ${({ variant, theme }) =>
    variant === 'outlined' &&
    css`
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.2);

      &:focus {
        border-color: ${theme.colors.accent};
        box-shadow: 0 0 0 2px ${`${theme.colors.accent}33`};
      }
    `}

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${({ error, theme }) =>
    error &&
    css`
      border-color: ${theme.colors.error} !important;
      &:focus {
        box-shadow: 0 0 0 2px ${`${theme.colors.error}33`};
      }
    `}

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.disabled};
  }
`;

const IconWrapper = styled.div`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.text.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;

  &.left {
    left: ${({ theme }) => theme.spacing.sm};
    & + input {
      padding-left: ${({ theme }) => theme.spacing.xl};
    }
  }

  &.right {
    right: ${({ theme }) => theme.spacing.sm};
    & ~ input {
      padding-right: ${({ theme }) => theme.spacing.xl};
    }
  }
`;

const ErrorText = styled.span`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const Input: React.FC<InputProps> = ({
  variant = 'default',
  size = 'medium',
  label,
  error,
  fullWidth,
  icon,
  className,
  ...props
}) => {
  return (
    <InputContainer fullWidth={fullWidth} className={className}>
      {label && <Label>{label}</Label>}
      {icon && <IconWrapper className="left">{icon}</IconWrapper>}
      <StyledInput
        variant={variant}
        size={size}
        error={error}
        {...props}
      />
      {error && <ErrorText>{error}</ErrorText>}
    </InputContainer>
  );
};

export default Input; 
