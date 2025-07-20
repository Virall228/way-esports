import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const slideIn = keyframes`
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
`;

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
    animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
    background: #1a1a1a;
    border-radius: 16px;
    padding: 32px;
    width: 100%;
    max-width: 480px;
    border: 2px solid #229ED9;
    box-shadow: 0 0 30px rgba(34, 158, 217, 0.2);
    animation: ${slideIn} 0.3s ease-out;
`;

const Title = styled.h3`
    color: #fff;
    margin: 0 0 24px;
    font-size: 24px;
    text-align: center;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const Label = styled.label`
    color: #fff;
    font-size: 14px;
`;

const Input = styled.input`
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px;
    color: #fff;
    font-size: 16px;

    &:focus {
        outline: none;
        border-color: #FF6B00;
    }
`;

const TeamMembersContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 8px;
`;

const TeamMemberInput = styled.div`
    display: flex;
    gap: 8px;
`;

const SubscribeButton = styled.button`
    width: 100%;
    background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%);
    border: none;
    padding: 16px;
    border-radius: 8px;
    color: #000;
    font-weight: bold;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 12px;

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
    padding: 16px;
    border-radius: 8px;
    color: #fff;
    font-weight: bold;
    font-size: 18px;
    cursor: pointer;
    margin-top: 12px;
    transition: all 0.3s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.05);
    }
`;

const PlanInfo = styled.div`
    background: rgba(255, 107, 0, 0.1);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
`;

const PlanDetails = styled.div`
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

const TelegramConnect = styled.div`
    text-align: center;
    margin: 32px 0;
`;

const TelegramLogo = styled.div`
    width: 80px;
    height: 80px;
    margin: 0 auto 16px;
    background: #229ED9;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
        width: 48px;
        height: 48px;
        color: white;
    }
`;

const ConnectButton = styled.button`
    background: #229ED9;
    color: white;
    border: none;
    padding: 16px 32px;
    border-radius: 8px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    margin-bottom: 16px;

    &:hover {
        background: #1E90C2;
        transform: translateY(-2px);
    }

    svg {
        width: 24px;
        height: 24px;
    }
`;

const BenefitsList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 24px 0;
`;

const BenefitItem = styled.li`
    color: #fff;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    font-size: 16px;

    svg {
        width: 20px;
        height: 20px;
        color: #229ED9;
    }
`;

const InstantPayment = styled.div`
    background: rgba(34, 158, 217, 0.1);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 16px;

    svg {
        width: 24px;
        height: 24px;
        color: #FFD700;
    }

    span {
        color: #FFD700;
        font-weight: bold;
    }
`;

interface SubscriptionModalProps {
    planType: 'individual' | 'team';
    onClose: () => void;
    onSubscribe: (data: any) => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
    planType,
    onClose,
    onSubscribe
}) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'connect' | 'details'>('connect');
    const [teamMembers, setTeamMembers] = useState(['', '', '', '']);

    const handleTelegramConnect = async () => {
        setLoading(true);
        try {
            // Simulate Telegram connection
            await new Promise(resolve => setTimeout(resolve, 1500));
            setStep('details');
        } catch (error) {
            console.error('Connection failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            onSubscribe({
                planType,
                teamMembers: planType === 'team' ? teamMembers : undefined
            });
        } catch (error) {
            console.error('Subscription failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <Title>
                    {planType === 'individual' ? 'Individual Pro' : 'Team Elite'} Subscription
                </Title>

                {step === 'connect' ? (
                    <>
                        <TelegramConnect>
                            <TelegramLogo>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.38-.49 1.03-.75 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.18.14.12.18.28.2.45-.02.07-.02.21-.03.26z"/>
                                </svg>
                            </TelegramLogo>
                            <ConnectButton 
                                onClick={handleTelegramConnect}
                                disabled={loading}
                            >
                                {loading ? 'Connecting...' : 'Connect Telegram Wallet'}
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14v-4H8l4-4 4 4h-3v4h-2z"/>
                                </svg>
                            </ConnectButton>
                        </TelegramConnect>

                        <BenefitsList>
                            <BenefitItem>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                                </svg>
                                Instant payment processing
                            </BenefitItem>
                            <BenefitItem>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                                </svg>
                                Secure and encrypted
                            </BenefitItem>
                            <BenefitItem>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                                </svg>
                                No hidden fees
                            </BenefitItem>
                        </BenefitsList>

                        <InstantPayment>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13 5.08V3h-2v2.08C7.61 5.57 5 8.47 5 12v8h2v2h10v-2h2v-8c0-3.53-2.61-6.43-6-6.92zM12 15c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                            </svg>
                            <span>Lightning-fast payment processing</span>
                        </InstantPayment>
                    </>
                ) : (
                    <Form onSubmit={handleSubmit}>
                        {planType === 'team' && (
                            <InputGroup>
                                <Label>Team Members (In-Game Names)</Label>
                                <TeamMembersContainer>
                                    {teamMembers.map((member, index) => (
                                        <TeamMemberInput key={index}>
                                            <Input
                                                placeholder={`Team Member ${index + 2}`}
                                                value={member}
                                                onChange={(e) => {
                                                    const newMembers = [...teamMembers];
                                                    newMembers[index] = e.target.value;
                                                    setTeamMembers(newMembers);
                                                }}
                                            />
                                        </TeamMemberInput>
                                    ))}
                                </TeamMembersContainer>
                            </InputGroup>
                        )}

                        <SubscribeButton type="submit" disabled={loading}>
                            {loading ? 'Processing...' : `Pay ${planType === 'individual' ? '$9.99' : '$39.99'} with Telegram`}
                        </SubscribeButton>
                        <CancelButton type="button" onClick={onClose}>
                            Cancel
                        </CancelButton>
                    </Form>
                )}
            </ModalContent>
        </ModalOverlay>
    );
};

export default SubscriptionModal; 