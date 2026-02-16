import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';

const Container = styled.div`
  min-height: 100vh;
  background: #0a0a0a;
  padding: 20px;
  width: 100%;
  max-width: 100%;
  margin: 0;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
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

const PricingCard = styled.div`
  background: rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 30px;
  text-align: center;
`;

const Price = styled.div`
  font-size: 3rem;
  font-weight: bold;
  color: #ff6b00;
  margin-bottom: 10px;
`;

const PricePeriod = styled.div`
  color: #cccccc;
  font-size: 1rem;
  margin-bottom: 30px;
`;

const SubscribeButton = styled.button`
  background: linear-gradient(135deg, #ff6b00, #ff8533);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  margin-bottom: 20px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 107, 0, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const BenefitsList = styled.div`
  text-align: left;
  margin-top: 30px;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  color: #ffffff;
  font-size: 1rem;
`;

const CheckIcon = styled.div`
  color: #4CAF50;
  font-size: 1.2rem;
  font-weight: bold;
`;

const FreeEntriesSection = styled.div`
  background: rgba(76, 175, 80, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  border: 1px solid rgba(76, 175, 80, 0.3);
`;

const FreeEntriesTitle = styled.h3`
  color: #4CAF50;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
`;

const FreeEntriesText = styled.p`
  color: #cccccc;
  margin: 0;
  line-height: 1.5;
`;

const ReferralSection = styled.div`
  background: rgba(255, 107, 0, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  border: 1px solid rgba(255, 107, 0, 0.3);
  text-align: center;
`;

const ReferralText = styled.p`
  color: #ffffff;
  margin: 0 0 15px 0;
  font-size: 1rem;
`;

const ReferralButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: #cccccc;
`;

const ErrorMessage = styled.div`
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: #F44336;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
`;

const SuccessMessage = styled.div`
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  color: #4CAF50;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
`;

interface BillingData {
  isSubscribed: boolean;
  subscriptionExpiresAt?: string;
  freeEntriesCount: number;
  subscriptionPrice: number;
  referralCode?: string;
  pendingSubscriptionRequest?: boolean;
}

const BillingPage: React.FC = () => {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    if (!api.hasToken()) {
      setBilling({
        isSubscribed: false,
        freeEntriesCount: 0,
        subscriptionPrice: 9.99
      });
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [referralResponse, publicSettingsResponse, transactionsResponse]: any[] = await Promise.all([
        api.get('/api/referrals/stats'),
        api.get('/api/referrals/public-settings'),
        api.get('/api/wallet/transactions')
      ]);

      const stats = referralResponse?.data || referralResponse || {};
      const publicSettings = publicSettingsResponse?.data || publicSettingsResponse || {};

      let subscriptionPrice = 9.99;
      try {
        const parsedPrice = Number(publicSettings.subscriptionPrice);
        if (Number.isFinite(parsedPrice) && parsedPrice > 0) {
          subscriptionPrice = parsedPrice;
        }
      } catch {
        // keep default price
      }

      const txList: any[] = Array.isArray(transactionsResponse?.data)
        ? transactionsResponse.data
        : (Array.isArray(transactionsResponse) ? transactionsResponse : []);

      const pendingSubscriptionRequest = txList.some((tx: any) => (
        tx?.type === 'subscription' && tx?.status === 'pending'
      ));

      setBilling({
        isSubscribed: Boolean(stats.isSubscribed),
        subscriptionExpiresAt: stats.subscriptionExpiresAt,
        freeEntriesCount: Number(stats.freeEntriesCount || 0),
        subscriptionPrice,
        referralCode: stats.referralCode,
        pendingSubscriptionRequest
      });
    } catch (error: any) {
      if (error?.status === 401) {
        setBilling({
          isSubscribed: false,
          freeEntriesCount: 0,
          subscriptionPrice: 9.99
        });
        setError(null);
        return;
      }
      console.error('Failed to load billing data:', error);
      setError(error?.message || 'Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      const response: any = await api.post('/api/wallet/subscribe', {
        paymentMethod: 'manual'
      });
      const payload = response?.data || response || {};
      const status = payload?.status || 'pending';
      const amount = Number(payload?.amount || billing?.subscriptionPrice || 0);

      if (status === 'completed') {
        setSuccess(`Subscription activated successfully. Charged $${amount.toFixed(2)}.`);
      } else {
        setSuccess(`Subscription request created for $${amount.toFixed(2)}. Awaiting admin confirmation.`);
      }
      
      // Reload data
      await loadBillingData();
    } catch (error: any) {
      console.error('Subscription failed:', error);
      setError(error?.message || 'Subscription failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const goToReferral = () => {
    window.location.href = '/profile#referrals';
  };

  if (loading) {
    return (
      <Container>
        <LoadingState>Loading billing information...</LoadingState>
      </Container>
    );
  }

  if (!billing) {
    return (
      <Container>
        <ErrorMessage>Unable to load billing information</ErrorMessage>
      </Container>
    );
  }

  const isExpired = billing.subscriptionExpiresAt && 
    new Date(billing.subscriptionExpiresAt) < new Date();

  return (
    <Container>
      <Header>
        <Title>Billing & Subscription</Title>
        <Subtitle>Manage your subscription and tournament access</Subtitle>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      {billing.freeEntriesCount > 0 && (
        <FreeEntriesSection>
          <FreeEntriesTitle>{'\u{1F381}'} You Have Free Entries!</FreeEntriesTitle>
          <FreeEntriesText>
            You currently have <strong>{billing.freeEntriesCount}</strong> free tournament entries available. 
            You can use these to join tournaments without an active subscription.
          </FreeEntriesText>
        </FreeEntriesSection>
      )}

      <PricingCard>
        <h2 style={{ color: '#ffffff', marginBottom: '20px' }}>WAY Esports Premium</h2>
        <Price>${billing.subscriptionPrice}</Price>
        <PricePeriod>per month</PricePeriod>
        
        {(!billing.isSubscribed || isExpired) ? (
          <>
            <SubscribeButton 
              onClick={handleSubscribe}
              disabled={processing || billing.pendingSubscriptionRequest}
            >
              {billing.pendingSubscriptionRequest
                ? 'Pending admin confirmation'
                : processing
                  ? 'Processing...'
                  : 'Subscribe Now'}
            </SubscribeButton>
            {billing.pendingSubscriptionRequest && (
              <div style={{ color: '#cccccc', fontSize: '0.9rem' }}>
                Your payment request is pending review in admin panel.
              </div>
            )}
          </>
        ) : (
          <SubscribeButton disabled>
            {'\u2713'} Active Subscription
          </SubscribeButton>
        )}

        <BenefitsList>
          <BenefitItem>
            <CheckIcon>{'\u2713'}</CheckIcon>
            Unlimited tournament registrations
          </BenefitItem>
          <BenefitItem>
            <CheckIcon>{'\u2713'}</CheckIcon>
            Priority tournament access
          </BenefitItem>
          <BenefitItem>
            <CheckIcon>{'\u2713'}</CheckIcon>
            Exclusive premium tournaments
          </BenefitItem>
          <BenefitItem>
            <CheckIcon>{'\u2713'}</CheckIcon>
            Advanced statistics and analytics
          </BenefitItem>
          <BenefitItem>
            <CheckIcon>{'\u2713'}</CheckIcon>
            Priority customer support
          </BenefitItem>
          <BenefitItem>
            <CheckIcon>{'\u2713'}</CheckIcon>
            Custom profile badges
          </BenefitItem>
        </BenefitsList>
      </PricingCard>

      <ReferralSection>
        <ReferralText>
          {'\u{1F381}'} Get free tournament entries by referring friends!
        </ReferralText>
        <ReferralButton onClick={goToReferral}>
          View Referral Program
        </ReferralButton>
      </ReferralSection>
    </Container>
  );
};

export default BillingPage;
