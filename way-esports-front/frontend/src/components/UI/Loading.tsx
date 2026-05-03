import React from 'react';
import styled, { keyframes } from 'styled-components';

type LoadingSize = 'small' | 'medium' | 'large';
type LoadingVariant = 'spinner' | 'dots' | 'pulse';

interface LoadingProps {
  size?: LoadingSize;
  variant?: LoadingVariant;
  color?: string;
  fullScreen?: boolean;
}

const getSize = (size: LoadingSize = 'medium') => {
  switch (size) {
    case 'small':
      return '1rem';
    case 'medium':
      return '2rem';
    case 'large':
      return '3rem';
  }
};

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 0.58;
    transform: scale(0.96);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
`;

const breathe = keyframes`
  0%, 100% {
    opacity: 0.42;
    transform: scale(0.96);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
`;

const getDotSize = (size: LoadingSize = 'medium') => {
  switch (size) {
    case 'small':
      return '0.38rem';
    case 'medium':
      return '0.55rem';
    case 'large':
      return '0.72rem';
  }
};

const LoadingContainer = styled.div<{ fullScreen?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  ${({ fullScreen }) =>
    fullScreen &&
    `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, rgba(5, 7, 10, 0.62), rgba(5, 7, 10, 0.8));
    backdrop-filter: blur(18px) saturate(125%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `}
`;

const LoadingStage = styled.div<LoadingProps>`
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: calc(${({ size }) => getSize(size)} * 1.7);
  height: calc(${({ size }) => getSize(size)} * 1.7);
`;

const LoadingHalo = styled.div<LoadingProps>`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(219, 229, 241, 0.12), transparent 70%);
  filter: blur(14px);
  animation: ${breathe} 2.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;
  pointer-events: none;
`;

const Spinner = styled.div<LoadingProps>`
  position: relative;
  z-index: 1;
  width: ${({ size }) => getSize(size)};
  height: ${({ size }) => getSize(size)};
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  border-top-color: ${({ theme, color }) => color || theme.colors.text.primary};
  border-right-color: rgba(219, 229, 241, 0.28);
  border-radius: 50%;
  animation: ${spin} 0.92s linear infinite;
  box-shadow:
    0 0 0 0.4rem rgba(255, 255, 255, 0.02),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
`;

const DotsContainer = styled.div<LoadingProps>`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Dot = styled.div<LoadingProps>`
  width: ${({ size }) => getDotSize(size)};
  height: ${({ size }) => getDotSize(size)};
  background: ${({ theme, color }) => color || theme.colors.text.primary};
  border-radius: 50%;
  animation: ${pulse} 1.05s cubic-bezier(0.22, 1, 0.36, 1) infinite;
  box-shadow: 0 0 0 0.34rem rgba(255, 255, 255, 0.035);

  &:nth-child(2) {
    animation-delay: 0.12s;
  }

  &:nth-child(3) {
    animation-delay: 0.24s;
  }
`;

const PulseCircle = styled.div<LoadingProps>`
  position: relative;
  z-index: 1;
  width: ${({ size }) => getSize(size)};
  height: ${({ size }) => getSize(size)};
  background:
    radial-gradient(circle at 35% 35%, rgba(255,255,255,0.94), rgba(255,255,255,0) 28%),
    radial-gradient(circle, ${({ theme, color }) => color || theme.colors.text.primary}, rgba(255, 255, 255, 0.12));
  border-radius: 50%;
  animation: ${pulse} 1.3s cubic-bezier(0.22, 1, 0.36, 1) infinite;
  box-shadow: 0 0 0 0.45rem rgba(255, 255, 255, 0.04);
`;

const Loading: React.FC<LoadingProps> = ({
  size = 'medium',
  variant = 'spinner',
  color,
  fullScreen = false,
}) => {
  const content = () => {
    switch (variant) {
      case 'spinner':
        return (
          <LoadingStage size={size} color={color}>
            <LoadingHalo size={size} color={color} />
            <Spinner size={size} color={color} />
          </LoadingStage>
        );
      case 'dots':
        return (
          <LoadingStage size={size} color={color}>
            <LoadingHalo size={size} color={color} />
            <DotsContainer>
              <Dot size={size} color={color} />
              <Dot size={size} color={color} />
              <Dot size={size} color={color} />
            </DotsContainer>
          </LoadingStage>
        );
      case 'pulse':
        return (
          <LoadingStage size={size} color={color}>
            <LoadingHalo size={size} color={color} />
            <PulseCircle size={size} color={color} />
          </LoadingStage>
        );
    }
  };

  return <LoadingContainer fullScreen={fullScreen}>{content()}</LoadingContainer>;
};

export default Loading; 
