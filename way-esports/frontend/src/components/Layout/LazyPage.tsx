import React, { Suspense, lazy } from 'react';
import styled from 'styled-components';

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 107, 0, 0.3);
  border-top: 3px solid #ff6b00;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-family: 'Orbitron', monospace;
  color: #ff6b00;
  margin-top: 1rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

interface LazyPageProps {
  component: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
}

const LazyPage: React.FC<LazyPageProps> = ({ 
  component, 
  fallback = (
    <LoadingContainer>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner />
        <LoadingText>Loading...</LoadingText>
      </div>
    </LoadingContainer>
  ) 
}) => {
  const LazyComponent = lazy(component);

  return (
    <Suspense fallback={fallback}>
      <LazyComponent />
    </Suspense>
  );
};

export default LazyPage; 