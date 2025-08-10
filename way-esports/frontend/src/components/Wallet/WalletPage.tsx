import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
`;

const WalletCard = styled.div`
    background-color: #2a2a2a;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
`;

const Title = styled.h2`
    color: #c0c0c0;
    margin: 0 0 20px 0;
`;

const Balance = styled.div`
    font-size: 24px;
    color: #4CAF50;
    margin: 20px 0;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
    background-color: ${props => props.variant === 'secondary' ? '#333' : '#808080'};
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    margin: 10px 0;
    width: 100%;
    transition: background-color 0.3s ease;

    &:hover {
        background-color: ${props => props.variant === 'secondary' ? '#444' : '#a0a0a0'};
    }

    &:disabled {
        background-color: #555;
        cursor: not-allowed;
    }
`;

const Input = styled.input`
    width: 100%;
    padding: 12px;
    margin: 10px 0;
    border: 1px solid #333;
    border-radius: 8px;
    background-color: #333;
    color: white;
    font-size: 16px;

    &:focus {
        outline: none;
        border-color: #c0c0c0;
    }
`;

const TransactionHistory = styled.div`
    margin-top: 20px;
`;

const Transaction = styled.div`
    background-color: #333;
    padding: 15px;
    border-radius: 8px;
    margin: 10px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const WalletPage: React.FC = () => {
    const [balance, setBalance] = useState('1000');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [transactions, setTransactions] = useState<any[]>([
        { id: 1, type: 'deposit', amount: 500, date: '2024-01-15' },
        { id: 2, type: 'withdrawal', amount: -200, date: '2024-01-14' },
        { id: 3, type: 'tournament_win', amount: 300, date: '2024-01-13' }
    ]);

    const handleWithdraw = async () => {
        try {
            if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
                alert('Please enter a valid amount');
                return;
            }

            const amount = parseFloat(withdrawAmount);
            if (amount > parseFloat(balance)) {
                alert('Insufficient balance');
                return;
            }

            setBalance((parseFloat(balance) - amount).toString());
            setTransactions(prev => [{
                id: Date.now(),
                type: 'withdrawal',
                amount: -amount,
                date: new Date().toISOString().split('T')[0]
            }, ...prev]);
            
            alert('Withdrawal successful!');
            setWithdrawAmount('');
        } catch (error) {
            console.error('Error withdrawing:', error);
            alert('Failed to process withdrawal. Please try again.');
        }
    };

    return (
        <Container>
            <WalletCard>
                <Title>My Wallet</Title>
                <Balance>Balance: ${balance}</Balance>
                
                <div>
                    <Input
                        type="number"
                        placeholder="Enter amount to withdraw"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <Button onClick={handleWithdraw}>
                        Withdraw Funds
                    </Button>
                </div>
            </WalletCard>

            <WalletCard>
                <Title>Transaction History</Title>
                <TransactionHistory>
                    {transactions.map((transaction) => (
                        <Transaction key={transaction.id}>
                            <div>
                                <div style={{ 
                                    color: transaction.amount > 0 ? '#4CAF50' : '#ff4757',
                                    fontWeight: 'bold'
                                }}>
                                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                                </div>
                                <div style={{ fontSize: '12px', color: '#888' }}>
                                    {transaction.type.replace('_', ' ').toUpperCase()}
                                </div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#888' }}>
                                {transaction.date}
                            </div>
                        </Transaction>
                    ))}
                </TransactionHistory>
            </WalletCard>
        </Container>
    );
};

export default WalletPage; 