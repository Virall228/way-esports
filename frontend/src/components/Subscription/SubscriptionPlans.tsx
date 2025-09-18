import React from 'react';
import styled, { keyframes } from 'styled-components';

const floatAnimation = keyframes`
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
`;

const glowAnimation = keyframes`
    0% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
    50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.5); }
    100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
`;

const pulseAnimation = keyframes`
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
`;

const Container = styled.div`
    padding: 40px 20px;
    max-width: 1200px;
    margin: 0 auto;
`;

const Header = styled.div`
    text-align: center;
    margin-bottom: 40px;
`;

const Title = styled.h2`
    color: #fff;
    font-size: 36px;
    margin: 0 0 16px;
`;

const Subtitle = styled.p`
    color: rgba(255, 255, 255, 0.7);
    font-size: 18px;
    margin: 0;
`;

const PlansContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 32px;
    margin-top: 40px;
`;

const PlanCard = styled.div<{ featured?: boolean }>`
    background: ${props => props.featured ? 
        'linear-gradient(135deg, rgba(255, 107, 0, 0.15), rgba(255, 215, 0, 0.15))' : 
        'rgba(26, 26, 26, 0.95)'};
    border-radius: 16px;
    padding: 32px;
    border: ${props => props.featured ? '2px solid #FFD700' : '1px solid rgba(255, 107, 0, 0.3)'};
    position: relative;
    transform-origin: center;
    animation: ${props => props.featured ? 
        `${floatAnimation} 3s ease-in-out infinite, ${glowAnimation} 3s infinite, ${pulseAnimation} 2s infinite` : 
        'none'};
    ${props => props.featured && `
        box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
    `}
`;

const PlanHeader = styled.div`
    text-align: center;
    margin-bottom: 24px;
`;

const PlanName = styled.h3<{ featured?: boolean }>`
    color: ${props => props.featured ? '#FFD700' : '#fff'};
    font-size: 24px;
    margin: 0 0 8px;
`;

const PlanPrice = styled.div`
    color: #fff;
    font-size: 48px;
    font-weight: bold;
    margin-bottom: 8px;

    span {
        font-size: 20px;
        opacity: 0.7;
    }
`;

const BillingCycle = styled.div`
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
`;

const FeaturesList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 32px 0;
`;

const FeatureItem = styled.li<{ featured?: boolean }>`
    color: #fff;
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    font-size: 16px;

    &:before {
        content: '✓';
        color: ${props => props.featured ? '#FFD700' : '#FF6B00'};
        margin-right: 12px;
        font-weight: bold;
    }
`;

const TelegramButton = styled.button<{ featured?: boolean }>`
    width: 100%;
    background: ${props => props.featured ? '#229ED9' : 'transparent'};
    border: ${props => props.featured ? 'none' : '1px solid #229ED9'};
    padding: 16px;
    border-radius: 8px;
    color: ${props => props.featured ? '#fff' : '#229ED9'};
    font-weight: bold;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:hover {
        transform: translateY(-2px);
        background: ${props => props.featured ? '#1E90C2' : 'rgba(34, 158, 217, 0.1)'};
    }

    svg {
        width: 24px;
        height: 24px;
    }
`;

const SaveBadge = styled.div`
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #FF6B00, #FFD700);
    padding: 8px 20px;
    border-radius: 20px;
    color: #000;
    font-weight: bold;
    font-size: 16px;
    box-shadow: 0 4px 15px rgba(255, 107, 0, 0.4);
`;

const FeaturedTag = styled.div`
    position: absolute;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #FFD700, #FF6B00);
    padding: 6px 16px;
    border-radius: 16px;
    color: #000;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(255, 215, 0, 0.4);
`;

const FastPayment = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    color: #FFD700;
    font-size: 14px;
    margin-top: 8px;
    justify-content: center;

    svg {
        width: 16px;
        height: 16px;
    }
`;

interface SubscriptionPlansProps {
    onSubscribe: (planType: 'individual' | 'team') => void;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onSubscribe }) => {
    return (
        <Container>
            <Header>
                <Title>Choose Your Plan</Title>
                <Subtitle>Get unlimited access to all tournaments and exclusive benefits</Subtitle>
            </Header>

            <PlansContainer>
                <PlanCard>
                    <PlanHeader>
                        <PlanName>Individual Pro</PlanName>
                        <PlanPrice>$9.99 <span>/month</span></PlanPrice>
                        <BillingCycle>Billed monthly</BillingCycle>
                    </PlanHeader>

                    <FeaturesList>
                        <FeatureItem>Access to all tournaments</FeatureItem>
                        <FeatureItem>Priority registration</FeatureItem>
                        <FeatureItem>Tournament statistics</FeatureItem>
                        <FeatureItem>Player profile badge</FeatureItem>
                        <FeatureItem>24/7 Support</FeatureItem>
                    </FeaturesList>

                    <TelegramButton onClick={() => onSubscribe('individual')}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.38-.49 1.03-.75 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.18.14.12.18.28.2.45-.02.07-.02.21-.03.26z"/>
                        </svg>
                        Pay with Telegram
                    </TelegramButton>
                </PlanCard>

                <PlanCard featured>
                    <SaveBadge>SAVE 20% PER PLAYER</SaveBadge>
                    <FeaturedTag>BEST VALUE</FeaturedTag>
                    <PlanHeader>
                        <PlanName featured>Team Elite</PlanName>
                        <PlanPrice>$39.99 <span>/month</span></PlanPrice>
                        <BillingCycle>For teams up to 5 players</BillingCycle>
                    </PlanHeader>

                    <FeaturesList>
                        <FeatureItem featured>All Individual Pro features</FeatureItem>
                        <FeatureItem featured>Map pick/ban priority</FeatureItem>
                        <FeatureItem featured>Team profile & statistics</FeatureItem>
                        <FeatureItem featured>Custom team badge</FeatureItem>
                        <FeatureItem featured>Exclusive team tournaments</FeatureItem>
                        <FeatureItem featured>Priority support</FeatureItem>
                        <FeatureItem featured>Monthly bonus rewards</FeatureItem>
                        <FeatureItem featured>Team analytics dashboard</FeatureItem>
                    </FeaturesList>

                    <TelegramButton featured onClick={() => onSubscribe('team')}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.38-.49 1.03-.75 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.18.14.12.18.28.2.45-.02.07-.02.21-.03.26z"/>
                        </svg>
                        Subscribe with Telegram
                    </TelegramButton>
                    <FastPayment>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 5.08V3h-2v2.08C7.61 5.57 5 8.47 5 12v8h2v2h10v-2h2v-8c0-3.53-2.61-6.43-6-6.92zM12 15c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                        </svg>
                        Instant payment processing
                    </FastPayment>
                </PlanCard>
            </PlansContainer>
        </Container>
    );
};

export default SubscriptionPlans; 