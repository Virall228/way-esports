import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';

const Container = styled.div`
    padding: 20px;
    width: 100%;
    max-width: 100%;
    margin: 0;
`;

const WalletCard = styled.div`
    background-color: #2a2a2a;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
`;

const Title = styled.h2`
    color: #FF6B00;
    margin: 0 0 20px 0;
`;

const Balance = styled.div`
    font-size: 24px;
    color: #4CAF50;
    margin: 20px 0;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
    background-color: ${props => props.variant === 'secondary' ? '#333' : '#FF6B00'};
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
        background-color: ${props => props.variant === 'secondary' ? '#444' : '#ff8533'};
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
        border-color: #FF6B00;
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
    const [balance, setBalance] = useState(0);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toNumber = (value: any, fallback = 0) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    const loadWallet = async () => {
        try {
            setLoading(true);
            setError(null);
            const [balanceRes, transactionsRes]: any[] = await Promise.all([
                api.get('/api/wallet/balance', true),
                api.get('/api/wallet/transactions', true)
            ]);

            const nextBalance = toNumber(balanceRes?.balance ?? balanceRes?.data?.balance ?? balanceRes?.data?.wallet?.balance ?? 0);
            setBalance(nextBalance);

            const list = Array.isArray(transactionsRes?.data)
                ? transactionsRes.data
                : (Array.isArray(transactionsRes) ? transactionsRes : []);
            const sorted = [...list].sort((a, b) => {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
            setTransactions(sorted);
        } catch (err: any) {
            setError(err?.message || 'Failed to load wallet');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWallet();
    }, []);

    const handleWithdraw = async () => {
        try {
            setError(null);
            const amount = Number(withdrawAmount);
            if (!Number.isFinite(amount) || amount <= 0) {
                setError('Please enter a valid amount');
                return;
            }

            if (amount > balance) {
                setError('Insufficient balance');
                return;
            }

            setIsWithdrawing(true);
            const response: any = await api.post('/api/wallet/withdraw', { amount }, true);
            const nextBalance = toNumber(response?.data?.balance ?? response?.balance, balance - amount);
            setBalance(nextBalance);

            if (Array.isArray(response?.data?.transactions)) {
                const sorted = [...response.data.transactions].sort((a, b) => {
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                });
                setTransactions(sorted);
            } else {
                await loadWallet();
            }

            setWithdrawAmount('');
        } catch (err: any) {
            console.error('Error withdrawing:', err);
            setError(err?.message || 'Failed to process withdrawal. Please try again.');
        } finally {
            setIsWithdrawing(false);
        }
    };

    return (
        <Container>
            <WalletCard>
                <Title>My Wallet</Title>
                <Balance>Balance: ${balance.toFixed(2)}</Balance>
                
                <div>
                    <Input
                        type="number"
                        placeholder="Enter amount to withdraw"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <Button onClick={handleWithdraw} disabled={isWithdrawing || loading}>
                        {isWithdrawing ? 'Processing...' : 'Withdraw Funds'}
                    </Button>
                    {error && (
                        <div style={{ color: '#ff6b6b', marginTop: '10px' }}>{error}</div>
                    )}
                </div>
            </WalletCard>

            <WalletCard>
                <Title>Transaction History</Title>
                <TransactionHistory>
                    {loading && (
                        <div style={{ color: '#888' }}>Loading...</div>
                    )}
                    {!loading && !transactions.length && (
                        <div style={{ color: '#888' }}>No transactions yet.</div>
                    )}
                    {!loading && transactions.map((transaction) => {
                        const amount = toNumber(transaction.amount, 0);
                        const isDebit = transaction.type === 'withdrawal' || transaction.type === 'fee';
                        const displayAmount = isDebit ? -Math.abs(amount) : Math.abs(amount);
                        const displayDate = transaction.date ? new Date(transaction.date).toLocaleDateString() : '';

                        return (
                            <Transaction key={transaction._id || transaction.id}>
                                <div>
                                    <div style={{ 
                                        color: displayAmount >= 0 ? '#4CAF50' : '#ff4757',
                                        fontWeight: 'bold'
                                    }}>
                                        {displayAmount > 0 ? '+' : ''}{displayAmount}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#888' }}>
                                        {(transaction.type || '').replace('_', ' ').toUpperCase()}
                                        {transaction.status ? ` \u2022 ${transaction.status}` : ''}
                                    </div>
                                </div>
                                <div style={{ fontSize: '12px', color: '#888' }}>
                                    {displayDate}
                                </div>
                            </Transaction>
                        );
                    })}
                </TransactionHistory>
            </WalletCard>
        </Container>
    );
};

export default WalletPage; 
