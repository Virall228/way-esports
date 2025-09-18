import React from 'react';
import styled from 'styled-components';

const TestContainer = styled.div`
  padding: 2rem;
  text-align: center;
  background: rgba(255, 107, 0, 0.1);
  border-radius: 8px;
  margin: 1rem;
`;

const TestButton = styled.button`
  background: linear-gradient(135deg, #ff6b00, #ff4757);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-family: 'Orbitron', monospace;
  font-weight: 600;
  cursor: pointer;
  margin: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255, 107, 0, 0.3);
  }
`;

const TestComponent: React.FC = () => {
  const handleTestClick = () => {
    console.log('Test button clicked!');
    alert('Test button works!');
  };

  return (
    <TestContainer>
      <h2>Test Component</h2>
      <p>This is a test component to verify that the app is working correctly.</p>
      <TestButton onClick={handleTestClick}>
        Test Button
      </TestButton>
    </TestContainer>
  );
};

export default TestComponent; 