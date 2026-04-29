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
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-100%);
  }
`;

const shimmer = keyframes`
  0% {
    transform: rotate(0deg) scale(0.98);
    opacity: 0.72;
  }
  50% {
    transform: rotate(180deg) scale(1.04);
    opacity: 1;
  }
  100% {
    transform: rotate(360deg) scale(0.98);
    opacity: 0.72;
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
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `}
`;

const LoadingStage = styled.div<LoadingProps>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(${({ size }) => getSize(size)} * 1.9);
  height: calc(${({ size }) => getSize(size)} * 1.9);
`;

const LoadingHalo = styled.div<LoadingProps>`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle, ${({ color }) => color || 'rgba(245, 154, 74, 0.22)'} 0%, rgba(245, 154, 74, 0.06) 42%, transparent 72%);
  filter: blur(10px);
  animation: ${shimmer} 4.6s linear infinite;
  pointer-events: none;
`;

const Spinner = styled.div<LoadingProps>`
  position: relative;
  z-index: 1;
  width: ${({ size }) => getSize(size)};
  height: ${({ size }) => getSize(size)};
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-top-color: ${({ theme, color }) => color || theme.colors.accent};
  border-right-color: rgba(255, 255, 255, 0.24);
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  box-shadow: 0 0 0 0.4rem rgba(245, 154, 74, 0.06);
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
  background: linear-gradient(180deg, ${({ theme, color }) => color || theme.colors.accent}, rgba(255, 255, 255, 0.95));
  border-radius: 50%;
  animation: ${bounce} 0.5s ease-in-out infinite;
  box-shadow: 0 0 0 0.35rem rgba(245, 154, 74, 0.08);

  &:nth-child(2) {
    animation-delay: 0.1s;
  }

  &:nth-child(3) {
    animation-delay: 0.2s;
  }
`;

const PulseCircle = styled.div<LoadingProps>`
  position: relative;
  z-index: 1;
  width: ${({ size }) => getSize(size)};
  height: ${({ size }) => getSize(size)};
  background:
    radial-gradient(circle at 35% 35%, rgba(255,255,255,0.94), rgba(255,255,255,0) 28%),
    radial-gradient(circle, ${({ theme, color }) => color || theme.colors.accent}, rgba(245, 154, 74, 0.24));
  border-radius: 50%;
  animation: ${pulse} 1.2s ease-in-out infinite;
  box-shadow: 0 0 0 0.45rem rgba(245, 154, 74, 0.08);
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
