import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TonConnector } from '@tonconnect/sdk';

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
    const [isConnected, setIsConnected] = useState(false);
    const [balance, setBalance] = useState('0');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [transactions, setTransactions] = useState<any[]>([]);
    const [tonConnector, setTonConnector] = useState<TonConnector | null>(null);

    useEffect(() => {
        const initTonConnect = async () => {
            const connector = new TonConnector({
                manifestUrl: 'https://way-esports.com/tonconnect-manifest.json'
            });
            setTonConnector(connector);

            // Restore connection if previously connected
            const walletConnectionSource = await connector.restoreConnection();
            if (walletConnectionSource) {
                setIsConnected(true);
                fetchBalance();
            }
        };

        initTonConnect();
    }, []);

    const connectWallet = async () => {
        try {
            if (!tonConnector) return;
            
            const walletConnectionSource = await tonConnector.connect();
            setIsConnected(true);
            fetchBalance();
        } catch (error) {
            console.error('Error connecting wallet:', error);
            alert('Failed to connect wallet. Please try again.');
        }
    };

    const disconnectWallet = async () => {
        try {
            if (!tonConnector) return;
            
            await tonConnector.disconnect();
            setIsConnected(false);
            setBalance('0');
        } catch (error) {
            console.error('Error disconnecting wallet:', error);
            alert('Failed to disconnect wallet. Please try again.');
        }
    };

    const fetchBalance = async () => {
        try {
            const response = await fetch('/api/wallet/balance', {
                headers: {
                    'X-Telegram-Init-Data': window.Telegram.WebApp.initData
                }
            });
            const data = await response.json();
            setBalance(data.balance);
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    };

    const handleWithdraw = async () => {
        try {
            if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
                alert('Please enter a valid amount');
                return;
            }

            const response = await fetch('/api/wallet/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-Init-Data': window.Telegram.WebApp.initData
                },
                body: JSON.stringify({ amount: withdrawAmount })
            });

            if (!response.ok) {
                throw new Error('Withdrawal failed');
            }

            alert('Withdrawal successful!');
            setWithdrawAmount('');
            fetchBalance();
            fetchTransactions();
        } catch (error) {
            console.error('Error withdrawing:', error);
            alert('Failed to process withdrawal. Please try again.');
        }
    };

    const fetchTransactions = async () => {
        try {
            const response = await fetch('/api/wallet/transactions', {
                headers: {
                    'X-Telegram-Init-Data': window.Telegram.WebApp.initData
                }
            });
            const data = await response.json();
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    useEffect(() => {
        if (isConnected) {
            fetchTransactions();
        }
    }, [isConnected]);

    return (
        <Container>
            <WalletCard>
                <Title>My Wallet</Title>
                {!isConnected ? (
                    <Button onClick={connectWallet}>Connect TON Wallet</Button>
                ) : (
                    <>
                        <Balance>{balance} TON</Balance>
                        <Input
                            type="number"
                            placeholder="Enter amount to withdraw"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            min="0"
                            step="0.1"
                        />
                        <Button onClick={handleWithdraw}>Withdraw</Button>
                        <Button variant="secondary" onClick={disconnectWallet}>
                            Disconnect Wallet
                        </Button>
                    </>
                )}
            </WalletCard>

            {isConnected && (
                <TransactionHistory>
                    <Title>Transaction History</Title>
                    {transactions.map((tx, index) => (
                        <Transaction key={index}>
                            <div>
                                <div>{tx.type}</div>
                                <div>{new Date(tx.date).toLocaleString()}</div>
                            </div>
                            <div>{tx.amount} TON</div>
                        </Transaction>
                    ))}
                </TransactionHistory>
            )}
        </Container>
    );
};

export default WalletPage; 