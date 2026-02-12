import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';

const Container = styled.div`
  padding: 20px;
  width: 100%;
  max-width: 100%;
  margin: 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  color: #ffffff;
  margin: 0;
  font-size: 1.8rem;
`;

const PrizeIcon = styled.div`
  font-size: 2rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #ff6b00;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  color: #cccccc;
  font-size: 0.9rem;
`;

const TransactionList = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const TransactionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  margin-bottom: 10px;
  border-left: 4px solid #ff6b00;

  &:last-child {
    margin-bottom: 0;
  }
`;

const TransactionInfo = styled.div`
  flex: 1;
`;

const TransactionTitle = styled.div`
  color: #ffffff;
  font-weight: 600;
  margin-bottom: 5px;
`;

const TransactionDate = styled.div`
  color: #cccccc;
  font-size: 0.9rem;
`;

const TransactionAmount = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
  color: #4CAF50;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #999;
  font-style: italic;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: #cccccc;
`;

interface PrizeTransaction {
  type: 'prize';
  amount: number;
  description: string;
  date: string;
}

interface PrizeStats {
  totalPrizes: number;
  prizeCount: number;
  transactions: PrizeTransaction[];
  stats: {
    tournamentsPlayed: number;
    tournamentsWon: number;
  };
}

const PrizeHistory: React.FC = () => {
  const [prizeData, setPrizeData] = useState<PrizeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrizeHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/prizes/user/history');
        setPrizeData(response.data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load prize history');
      } finally {
        setLoading(false);
      }
    };

    loadPrizeHistory();
  }, []);

  if (loading) {
    return (
      <Container>
        <LoadingState>Loading prize history...</LoadingState>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <EmptyState>Error: {error}</EmptyState>
      </Container>
    );
  }

  if (!prizeData) {
    return (
      <Container>
        <EmptyState>No prize data available</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <PrizeIcon>{'\u{1F3C6}'}</PrizeIcon>
        <Title>Prize History</Title>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatValue>${prizeData.totalPrizes.toFixed(2)}</StatValue>
          <StatLabel>Total Prizes</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{prizeData.prizeCount}</StatValue>
          <StatLabel>Prizes Won</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{prizeData.stats.tournamentsPlayed}</StatValue>
          <StatLabel>Tournaments Played</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{prizeData.stats.tournamentsWon}</StatValue>
          <StatLabel>Tournaments Won</StatLabel>
        </StatCard>
      </StatsGrid>

      <TransactionList>
        <h3 style={{ color: '#ffffff', marginBottom: '20px' }}>Recent Prize Transactions</h3>
        {prizeData.transactions.length > 0 ? (
          prizeData.transactions.map((transaction, index) => (
            <TransactionItem key={index}>
              <TransactionInfo>
                <TransactionTitle>{transaction.description}</TransactionTitle>
                <TransactionDate>
                  {new Date(transaction.date).toLocaleDateString()}
                </TransactionDate>
              </TransactionInfo>
              <TransactionAmount>+${transaction.amount.toFixed(2)}</TransactionAmount>
            </TransactionItem>
          ))
        ) : (
          <EmptyState>No prize transactions yet. Start winning tournaments!</EmptyState>
        )}
      </TransactionList>
    </Container>
  );
};

export default PrizeHistory;
