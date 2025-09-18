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

const LoadingContainer = styled.div<{ fullScreen?: boolean }>`
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

const Spinner = styled.div<LoadingProps>`
  width: ${({ size }) => getSize(size)};
  height: ${({ size }) => getSize(size)};
  border: 2px solid transparent;
  border-top-color: ${({ theme, color }) => color || theme.colors.accent};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const DotsContainer = styled.div<LoadingProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Dot = styled.div<LoadingProps>`
  width: ${({ size }) => getSize(size)};
  height: ${({ size }) => getSize(size)};
  background: ${({ theme, color }) => color || theme.colors.accent};
  border-radius: 50%;
  animation: ${bounce} 0.5s ease-in-out infinite;

  &:nth-child(2) {
    animation-delay: 0.1s;
  }

  &:nth-child(3) {
    animation-delay: 0.2s;
  }
`;

const PulseCircle = styled.div<LoadingProps>`
  width: ${({ size }) => getSize(size)};
  height: ${({ size }) => getSize(size)};
  background: ${({ theme, color }) => color || theme.colors.accent};
  border-radius: 50%;
  animation: ${pulse} 1.2s ease-in-out infinite;
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
        return <Spinner size={size} color={color} />;
      case 'dots':
        return (
          <DotsContainer>
            <Dot size={size} color={color} />
            <Dot size={size} color={color} />
            <Dot size={size} color={color} />
          </DotsContainer>
        );
      case 'pulse':
        return <PulseCircle size={size} color={color} />;
    }
  };

  return <LoadingContainer fullScreen={fullScreen}>{content()}</LoadingContainer>;
};

export default Loading; 