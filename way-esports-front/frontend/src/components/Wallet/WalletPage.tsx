import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';

const Container = styled.div`
    padding: 24px;
    width: 100%;
    max-width: 100%;
    margin: 0;
    display: grid;
    gap: 16px;

    @media (max-width: 768px) {
        padding: 14px;
        gap: 12px;
    }
`;

const WalletCard = styled.div`
    background:
      linear-gradient(180deg, rgba(22, 24, 28, 0.9) 0%, rgba(12, 13, 16, 0.96) 100%),
      #0b0c10;
    border: 1px solid rgba(110, 118, 130, 0.16);
    border-radius: 16px;
    padding: 18px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.04),
      0 10px 25px rgba(0, 0, 0, 0.32);
`;

const Title = styled.h2`
    color: #f3f5f7;
    margin: 0;
    letter-spacing: 0.6px;
    font-size: 20px;
    font-weight: 700;
`;

const Balance = styled.div`
    display: grid;
    gap: 4px;
    margin-top: 14px;
`;

const BalanceLabel = styled.div`
    color: #8e96a3;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
`;

const BalanceValue = styled.div`
    font-size: 32px;
    color: #f2f6fa;
    font-weight: 800;
`;

const BalanceHint = styled.div`
    color: #7e8794;
    font-size: 12px;
`;

const FormGrid = styled.div`
    margin-top: 14px;
    display: grid;
    gap: 10px;
`;

const InlineGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

const FieldLabel = styled.label`
    color: #aeb6c2;
    font-size: 12px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
    background: ${props =>
      props.variant === 'secondary'
        ? 'linear-gradient(180deg, #373b43 0%, #2a2f37 100%)'
        : 'linear-gradient(180deg, #ff7d24 0%, #ff6b00 100%)'};
    color: ${props => (props.variant === 'secondary' ? '#eef2f7' : '#111')};
    border: 1px solid ${props => (props.variant === 'secondary' ? 'rgba(160, 168, 180, 0.25)' : 'rgba(255, 145, 72, 0.65)')};
    padding: 12px 14px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 700;
    width: 100%;
    transition: transform 0.15s ease, filter 0.15s ease;

    &:hover {
        transform: translateY(-1px);
        filter: brightness(1.04);
    }

    &:disabled {
        cursor: not-allowed;
        filter: grayscale(0.2);
        opacity: 0.65;
        transform: none;
    }
`;

const Input = styled.input`
    width: 100%;
    padding: 12px 13px;
    border: 1px solid rgba(147, 156, 170, 0.24);
    border-radius: 10px;
    background: #14171d;
    color: #ecf1f6;
    font-size: 14px;

    &:focus {
        outline: none;
        border-color: #ff7b1f;
        box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.14);
    }

    &::placeholder {
      color: #6f7987;
    }
`;

const Select = styled.select`
    width: 100%;
    padding: 12px 13px;
    border: 1px solid rgba(147, 156, 170, 0.24);
    border-radius: 10px;
    background: #14171d;
    color: #ecf1f6;
    font-size: 14px;

    &:focus {
        outline: none;
        border-color: #ff7b1f;
        box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.14);
    }
`;

const TransactionHistory = styled.div`
    margin-top: 12px;
    display: grid;
    gap: 9px;
`;

const Transaction = styled.div`
    background: rgba(24, 27, 33, 0.88);
    border: 1px solid rgba(108, 116, 128, 0.18);
    padding: 13px;
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
`;

const TxAmount = styled.div<{ $positive: boolean }>`
    color: ${({ $positive }) => ($positive ? '#7ad89f' : '#ff8b8b')};
    font-weight: 800;
    font-size: 16px;
`;

const TxMeta = styled.div`
    font-size: 12px;
    color: #8b94a1;
    margin-top: 3px;
`;

const TxExtra = styled.div`
    font-size: 12px;
    color: #778190;
    margin-top: 3px;
    word-break: break-all;
`;

const TxDate = styled.div`
    font-size: 12px;
    color: #8b94a1;
    white-space: nowrap;
`;

const ErrorText = styled.div`
    color: #ff8b8b;
    margin-top: 2px;
    font-size: 13px;
`;

const Muted = styled.div`
    color: #7f8998;
    font-size: 13px;
`;

const WalletPage: React.FC = () => {
    const MIN_WITHDRAW_USD = 10;
    const [balance, setBalance] = useState(0);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawNetwork, setWithdrawNetwork] = useState('USDT-TRC20');
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toNumber = (value: any, fallback = 0) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    const detectNetworkByAddress = (addressRaw: string): string | null => {
        const address = (addressRaw || '').trim();
        if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) return 'USDT-TRC20';
        if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'USDT-ERC20';
        return null;
    };

    const loadWallet = async () => {
        if (!api.hasToken()) {
            setBalance(0);
            setTransactions([]);
            setError(null);
            setLoading(false);
            return;
        }

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
            if (err?.status === 401) {
                setBalance(0);
                setTransactions([]);
                setError(null);
            } else {
                setError(err?.message || 'Failed to load wallet');
            }
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
            const walletAddress = withdrawAddress.trim();
            if (!Number.isFinite(amount) || amount <= 0) {
                setError('Please enter a valid amount');
                return;
            }
            if (amount < MIN_WITHDRAW_USD) {
                setError(`Minimum withdrawal amount is $${MIN_WITHDRAW_USD}`);
                return;
            }
            if (!walletAddress || walletAddress.length < 16) {
                setError('Enter a valid USDT wallet address');
                return;
            }

            if (amount > balance) {
                setError('Insufficient balance');
                return;
            }

            setIsWithdrawing(true);
            const response: any = await api.post('/api/wallet/withdraw', {
                amount,
                walletAddress,
                network: withdrawNetwork
            }, true);
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
            setWithdrawAddress('');
        } catch (err: any) {
            console.error('Error withdrawing:', err);
            setError(err?.message || 'Failed to process withdrawal. Please try again.');
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handlePasteAddress = async () => {
        try {
            if (!navigator?.clipboard?.readText) {
                setError('Clipboard access is not available in this browser');
                return;
            }
            const text = await navigator.clipboard.readText();
            const value = (text || '').trim();
            setWithdrawAddress(value);
            const detected = detectNetworkByAddress(value);
            if (detected) setWithdrawNetwork(detected);
        } catch {
            setError('Failed to read clipboard');
        }
    };

    return (
        <Container>
            <WalletCard>
                <Title>My Wallet</Title>
                <Balance>
                    <BalanceLabel>Available Balance</BalanceLabel>
                    <BalanceValue>${balance.toFixed(2)}</BalanceValue>
                    <BalanceHint>USDT withdrawal minimum: ${MIN_WITHDRAW_USD}</BalanceHint>
                </Balance>

                <FormGrid>
                    <FieldLabel>Amount</FieldLabel>
                    <Input
                        type="number"
                        placeholder="Enter amount to withdraw"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <InlineGrid>
                        <div>
                            <FieldLabel>USDT Address</FieldLabel>
                            <Input
                                type="text"
                                placeholder="USDT wallet address"
                                value={withdrawAddress}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setWithdrawAddress(value);
                                    const detected = detectNetworkByAddress(value);
                                    if (detected) setWithdrawNetwork(detected);
                                }}
                            />
                        </div>
                        <div>
                            <FieldLabel>Network</FieldLabel>
                            <Select
                                value={withdrawNetwork}
                                onChange={(e) => setWithdrawNetwork(e.target.value)}
                            >
                                <option value="USDT-TRC20">USDT-TRC20</option>
                                <option value="USDT-ERC20">USDT-ERC20</option>
                                <option value="USDT-BEP20">USDT-BEP20</option>
                            </Select>
                        </div>
                    </InlineGrid>
                    <Button variant="secondary" onClick={handlePasteAddress} disabled={isWithdrawing || loading}>
                        Paste Address
                    </Button>
                    <Button onClick={handleWithdraw} disabled={isWithdrawing || loading}>
                        {isWithdrawing ? 'Processing...' : 'Withdraw Funds'}
                    </Button>
                    {error && (
                        <ErrorText>{error}</ErrorText>
                    )}
                </FormGrid>
            </WalletCard>

            <WalletCard>
                <Title>Transaction History</Title>
                <TransactionHistory>
                    {loading && (
                        <Muted>Loading...</Muted>
                    )}
                    {!loading && !transactions.length && (
                        <Muted>No transactions yet.</Muted>
                    )}
                    {!loading && transactions.map((transaction) => {
                        const amount = toNumber(transaction.amount, 0);
                        const isDebit = transaction.type === 'withdrawal' || transaction.type === 'fee';
                        const displayAmount = isDebit ? -Math.abs(amount) : Math.abs(amount);
                        const displayDate = transaction.date ? new Date(transaction.date).toLocaleDateString() : '';

                        return (
                            <Transaction key={transaction._id || transaction.id}>
                                <div>
                                    <TxAmount $positive={displayAmount >= 0}>
                                        {displayAmount > 0 ? '+' : ''}{displayAmount}
                                    </TxAmount>
                                    <TxMeta>
                                        {(transaction.type || '').replace('_', ' ').toUpperCase()}
                                        {transaction.status ? ` \u2022 ${transaction.status}` : ''}
                                    </TxMeta>
                                    {transaction.type === 'withdrawal' && transaction.walletAddress && (
                                        <TxExtra>
                                            {transaction.network || 'USDT'}: {transaction.walletAddress}
                                        </TxExtra>
                                    )}
                                    {transaction.txHash && (
                                        <TxExtra>
                                            TX: {transaction.txHash}
                                        </TxExtra>
                                    )}
                                </div>
                                <TxDate>
                                    {displayDate}
                                </TxDate>
                            </Transaction>
                        );
                    })}
                </TransactionHistory>
            </WalletCard>
        </Container>
    );
};

export default WalletPage; 
