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
        min-height: 40px;
        padding: 0.7rem 0.9rem;
        font-size: ${({ theme }) => theme.typography.body2.fontSize};
      `;
    case 'medium':
      return css`
        min-height: 46px;
        padding: 0.85rem 1rem;
        font-size: ${({ theme }) => theme.typography.body1.fontSize};
      `;
    case 'large':
      return css`
        min-height: 54px;
        padding: 1rem 1.15rem;
        font-size: ${({ theme }) => theme.typography.h5.fontSize};
      `;
  }
};

const InputContainer = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
  position: relative;
`;

const FieldShell = styled.div`
  position: relative;
`;

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.84rem;
  letter-spacing: -0.01em;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const StyledInput = styled.input<InputProps>`
  width: 100%;
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => (theme.isLight ? theme.colors.border.medium : theme.colors.border.medium)};
  border-radius: 18px;
  outline: none;
  transition:
    border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.medium},
    box-shadow ${({ theme }) => theme.transitions.medium},
    transform ${({ theme }) => theme.transitions.fast};
  backdrop-filter: blur(16px) saturate(120%);
  box-shadow: ${({ theme }) => (theme.isLight ? '0 10px 24px rgba(31, 41, 55, 0.05)' : 'inset 0 1px 0 rgba(255, 255, 255, 0.03)')};
  background: ${({ theme }) =>
    theme.isLight
      ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(246, 248, 251, 0.9) 100%)'
      : 'linear-gradient(180deg, rgba(16, 19, 24, 0.9) 0%, rgba(8, 10, 13, 0.96) 100%)'};

  ${({ size }) => getInputSize(size)}

  ${({ variant, theme }) =>
    variant === 'filled' &&
    css`
      background: ${theme.isLight ? 'rgba(244, 235, 224, 0.78)' : 'rgba(255, 255, 255, 0.05)'};
      border-color: ${theme.isLight ? theme.colors.border.light : theme.colors.border.light};
    `}

  ${({ variant, theme }) =>
    variant === 'outlined' &&
    css`
      background: ${theme.isLight ? 'rgba(255, 255, 255, 0.64)' : 'transparent'};
    `}

  &:focus {
    border-color: ${({ theme }) => theme.colors.border.strong};
    box-shadow: ${({ theme }) =>
      theme.isLight
        ? '0 0 0 4px rgba(59, 130, 246, 0.1), 0 16px 28px rgba(31, 41, 55, 0.08)'
        : '0 0 0 4px rgba(219, 229, 241, 0.08), 0 18px 30px rgba(0, 0, 0, 0.24)'};
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
        box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.12);
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
  color: ${({ theme }) => theme.colors.text.tertiary};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;

  &.left {
    left: ${({ theme }) => theme.spacing.sm};

    & + input {
      padding-left: calc(${({ theme }) => theme.spacing.xl} + 0.1rem);
    }
  }
`;

const ErrorText = styled.span`
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.8rem;
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
}) => (
  <InputContainer fullWidth={fullWidth} className={className}>
    {label && <Label>{label}</Label>}
    <FieldShell>
      {icon && <IconWrapper className="left">{icon}</IconWrapper>}
      <StyledInput variant={variant} size={size} error={error} {...props} />
    </FieldShell>
    {error && <ErrorText>{error}</ErrorText>}
  </InputContainer>
);

export default Input;
