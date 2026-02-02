import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: calc(16px + var(--sat, 0px)) calc(16px + var(--sar, 0px)) calc(16px + var(--sab, 0px)) calc(16px + var(--sal, 0px));
`;

const ModalContent = styled.div`
  background: #1a1a1a;
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  border-radius: 16px;
  padding: 0;
  width: 90%;
  max-width: 500px;
  position: relative;
  overflow: hidden;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
  z-index: 10;
  
  &:hover {
  color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const WalletHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 30px 30px 0 30px;
  margin-bottom: 30px;
`;

const WalletIcon = styled.div`
  font-size: 2rem;
`;

const WalletTitle = styled.h2`
  color: #ffffff;
  margin: 0;
  font-size: 1.8rem;
`;

const BalanceCard = styled.div`
  background: rgba(61, 61, 61, 0.8);
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  margin: 0 30px 30px 30px;
`;

const CurrentBalance = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: #e5e5e5;
  margin-bottom: 5px;
`;

const BalanceLabel = styled.div`
  color: #cccccc;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const TransactionsList = styled.div`
  margin-bottom: 30px;
  padding: 0 30px;
`;

const TransactionsTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 20px;
  font-size: 1.2rem;
`;

const TransactionItem = styled.div<{ $type: 'income' | 'expense' }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #2a2a2a;
  border-radius: 8px;
  margin-bottom: 10px;
  border-left: 4px solid ${({ $type }) => $type === 'income' ? '#4CAF50' : '#F44336'};
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

const TransactionAmount = styled.div<{ $type: 'income' | 'expense' }>`
  font-weight: bold;
  font-size: 1.1rem;
  color: ${({ $type }) => $type === 'income' ? '#4CAF50' : '#F44336'};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0;
  padding: 0 30px 30px 30px;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 15px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  border: none;
  
  ${({ $variant }) => $variant === 'primary' ? `
    background: #3a3a3a;
    color: #000000;
    border-radius: 0 0 0 14px;
    
    &:hover {
      background: #ffed4e;
    }
  ` : `
    background: #333333;
    color: #ffffff;
    border-radius: 0 0 14px 0;
    
    &:hover {
      background: #444444;
    }
  `}
`;

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const transactions = [
    {
      id: 1,
      title: 'Tournament Prize - CS2 Cup',
      date: '2024-03-15',
      amount: 500.00,
      type: 'income' as const
    },
    {
      id: 2,
      title: 'Deposit via Card',
      date: '2024-03-10',
      amount: 200.00,
      type: 'income' as const
    },
    {
      id: 3,
      title: 'Withdrawal to Bank',
      date: '2024-03-08',
      amount: 150.00,
      type: 'expense' as const
    },
    {
      id: 4,
      title: 'Tournament Prize - Critical Ops',
      date: '2024-03-05',
      amount: 300.00,
      type: 'income' as const
    }
  ];

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <WalletHeader>
          <WalletIcon>💰</WalletIcon>
          <WalletTitle>Wallet</WalletTitle>
        </WalletHeader>

        <BalanceCard>
          <CurrentBalance>$1250.50</CurrentBalance>
          <BalanceLabel>CURRENT BALANCE</BalanceLabel>
        </BalanceCard>

        <TransactionsList>
          <TransactionsTitle>Recent Transactions</TransactionsTitle>
          {transactions.map(transaction => (
            <TransactionItem key={transaction.id} $type={transaction.type}>
              <TransactionInfo>
                <TransactionTitle>{transaction.title}</TransactionTitle>
                <TransactionDate>{transaction.date}</TransactionDate>
              </TransactionInfo>
              <TransactionAmount $type={transaction.type}>
                {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
              </TransactionAmount>
            </TransactionItem>
          ))}
        </TransactionsList>

        <ActionButtons>
          <ActionButton $variant="primary">Deposit</ActionButton>
          <ActionButton $variant="secondary">Withdraw</ActionButton>
        </ActionButtons>
      </ModalContent>
    </ModalOverlay>
  );
};

export default WalletModal;