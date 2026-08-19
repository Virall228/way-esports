import React, { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import PrizeHistory from '../../components/Prizes/PrizeHistory';
import PrizeLeaderboard from '../../components/Prizes/PrizeLeaderboard';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Plasma from '../../components/UI/Plasma';

const Container = styled.div`
  padding: 1rem;
  width: 100%;
  max-width: 100%;
  margin: 0;
`;

const Header = styled(Card).attrs({ variant: 'elevated' })`
  position: relative;
  overflow: hidden;
  text-align: center;
  margin-bottom: 40px;
  padding: 2rem;
`;

const HeaderBackdrop = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
`;

const HeaderPlasma = styled(Plasma)`
  position: absolute;
  inset: -8%;
`;

const HeaderVeil = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 20%, rgba(255,255,255,0.08), transparent 24%),
    radial-gradient(circle at 80% 22%, rgba(245,154,74,0.16), transparent 22%),
    linear-gradient(120deg, rgba(8,10,13,0.76), rgba(8,10,13,0.3) 40%, rgba(8,10,13,0.72));
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
  width: 100%;
  max-width: 100%;
  margin: 0;
`;

const PrizesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'history' | 'leaderboard'>('history');
  const theme = useTheme();

  return (
    <Container>
      <Header>
        <HeaderBackdrop>
          <HeaderPlasma
            color={theme.isLight ? '#c96a16' : '#f59a4a'}
            speed={0.4}
            scale={1.16}
            opacity={theme.isLight ? 0.18 : 0.46}
            mouseInteractive={false}
          />
          <HeaderVeil />
        </HeaderBackdrop>
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
