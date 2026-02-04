import React, { useState } from 'react';
import styled from 'styled-components';
import PrizeHistory from '../../components/Prizes/PrizeHistory';
import PrizeLeaderboard from '../../components/Prizes/PrizeLeaderboard';

const Container = styled.div`
  min-height: 100vh;
  background: #0a0a0a;
  padding: 20px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  color: #ffffff;
  font-size: 2.5rem;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: #cccccc;
  font-size: 1.1rem;
  margin: 0;
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => $active ? 'rgba(255, 107, 0, 0.2)' : 'transparent'};
  color: ${({ $active }) => $active ? '#ff6b00' : '#cccccc'};
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:first-child {
    border-radius: 8px 0 0 8px;
  }
  
  &:last-child {
    border-radius: 0 8px 8px 0;
  }
  
  &:not(:first-child) {
    border-left: none;
  }

  &:hover {
    background: rgba(255, 107, 0, 0.1);
  }
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PrizesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'history' | 'leaderboard'>('history');

  return (
    <Container>
      <Header>
        <Title>Prizes & Rewards</Title>
        <Subtitle>Track your tournament winnings and see top performers</Subtitle>
      </Header>

      <TabsContainer>
        <Tab 
          $active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')}
        >
          My Prizes
        </Tab>
        <Tab 
          $active={activeTab === 'leaderboard'} 
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
        </Tab>
      </TabsContainer>

      <Content>
        {activeTab === 'history' ? <PrizeHistory /> : <PrizeLeaderboard />}
      </Content>
    </Container>
  );
};

export default PrizesPage;
