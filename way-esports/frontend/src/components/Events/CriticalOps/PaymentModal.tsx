import React, { useState } from 'react';
import styled from 'styled-components';
import { openTelegramInvoice } from '../../../services/telegram';

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const ModalContent = styled.div`
    background: #1a1a1a;
    border-radius: 16px;
    padding: 24px;
    width: 100%;
    max-width: 480px;
    border: 1px solid rgba(255, 107, 0, 0.3);
    box-shadow: 0 0 20px rgba(255, 107, 0, 0.2);
`;

const Title = styled.h3`
    color: #fff;
    margin: 0 0 20px;
    font-size: 24px;
    text-align: center;
`;

const PaymentInfo = styled.div`
    background: rgba(255, 107, 0, 0.1);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
`;

const InfoRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    color: #fff;
    font-size: 16px;

    &:last-child {
        margin-bottom: 0;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        font-weight: bold;
    }
`;

const PaymentMethods = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 24px;
`;

const PaymentMethod = styled.button<{ selected?: boolean }>`
    background: ${props => props.selected ? 'rgba(255, 107, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
    border: 1px solid ${props => props.selected ? '#FF6B00' : 'transparent'};
    border-radius: 8px;
    padding: 12px;
    color: #fff;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:hover {
        background: rgba(255, 107, 0, 0.1);
    }
`;

const Input = styled.input`
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px;
    color: #fff;
    margin-bottom: 16px;

    &:focus {
        outline: none;
        border-color: #FF6B00;
    }
`;

const PayButton = styled.button`
    width: 100%;
    background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%);
    border: none;
    padding: 14px;
    border-radius: 8px;
    color: #000;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(255, 107, 0, 0.4);
    }

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }
`;

const CancelButton = styled.button`
    width: 100%;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 14px;
    border-radius: 8px;
    color: #fff;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    margin-top: 12px;
    transition: all 0.3s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.05);
    }
`;

interface PaymentModalProps {
    tournamentTitle: string;
    onClose: () => void;
    onPaymentComplete: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
    tournamentTitle,
    onClose,
    onPaymentComplete
}) => {
    const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'card'>('crypto');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePayment = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Request invoice URL from backend
            const response = await fetch('/api/payments/invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-Init-Data': (window.Telegram?.WebApp as any)?.initData || ''
                },
                body: JSON.stringify({
                    tournamentTitle,
                    paymentMethod
                })
            });
            if (!response.ok) throw new Error('Failed to get invoice URL');
            const data = await response.json();
            const invoiceUrl = data.invoiceUrl;
            if (!invoiceUrl) throw new Error('No invoice URL received');

            // 2. Open Telegram payment dialog
            await openTelegramInvoice(invoiceUrl);
            setLoading(false);
            onPaymentComplete();
        } catch (error: any) {
            setLoading(false);
            setError(error.message || 'Payment failed.');
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <Title>Tournament Registration</Title>
                
                <PaymentInfo>
                    <InfoRow>
                        <span>Tournament</span>
                        <span>{tournamentTitle}</span>
                    </InfoRow>
                    <InfoRow>
                        <span>Team Size</span>
                        <span>5 players</span>
                    </InfoRow>
                    <InfoRow>
                        <span>Fee per Player</span>
                        <span>$5</span>
                    </InfoRow>
                    <InfoRow>
                        <span>Total Amount</span>
                        <span>$25</span>
                    </InfoRow>
                </PaymentInfo>

                <PaymentMethods>
                    <PaymentMethod 
                        selected={paymentMethod === 'crypto'}
                        onClick={() => setPaymentMethod('crypto')}
                    >
                        <span>Crypto</span>
                    </PaymentMethod>
                    <PaymentMethod 
                        selected={paymentMethod === 'card'}
                        onClick={() => setPaymentMethod('card')}
                    >
                        <span>Card</span>
                    </PaymentMethod>
                </PaymentMethods>

                {paymentMethod === 'crypto' && (
                    <Input 
                        type="text" 
                        placeholder="Enter your wallet address" 
                    />
                )}

                {paymentMethod === 'card' && (
                    <>
                        <Input 
                            type="text" 
                            placeholder="Card Number" 
                        />
                        <Input 
                            type="text" 
                            placeholder="MM/YY" 
                        />
                        <Input 
                            type="text" 
                            placeholder="CVV" 
                        />
                    </>
                )}

                {error && (
                    <div style={{ color: '#FF4C4C', marginBottom: '12px', textAlign: 'center' }}>{error}</div>
                )}

                <PayButton 
                    onClick={handlePayment}
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Pay $25'}
                </PayButton>
                <CancelButton onClick={onClose}>
                    Cancel
                </CancelButton>
            </ModalContent>
        </ModalOverlay>
    );
};

export default PaymentModal;
