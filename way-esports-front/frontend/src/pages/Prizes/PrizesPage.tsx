import React, { useState } from 'react';
import styled from 'styled-components';
import PrizeHistory from '../../components/Prizes/PrizeHistory';
import PrizeLeaderboard from '../../components/Prizes/PrizeLeaderboard';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

const Container = styled.div`
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled(Card).attrs({ variant: 'elevated' })`
  text-align: center;
  margin-bottom: 40px;
  padding: 2rem;
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
  gap: 12px;
  flex-wrap: wrap;
`;

const Tab = styled(Button).attrs<{ $active: boolean }>((props) => ({
  variant: props.$active ? 'brand' : 'outline',
  size: 'small'
}))<{ $active: boolean }>`
  padding: 12px 24px;
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
