import React from 'react';
import styled from 'styled-components';
import { useTournamentAccess } from '../../hooks/useTournamentAccess';

const Overlay = styled.div`
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
  padding: 20px;
`;

const Modal = styled.div`
  background: #1a1a1a;
  border-radius: 16px;
  padding: 30px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Icon = styled.div`
  font-size: 3rem;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  color: #ffffff;
  margin: 0 0 15px 0;
  font-size: 1.5rem;
`;

const Message = styled.p`
  color: #cccccc;
  margin: 0 0 25px 0;
  line-height: 1.5;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #ff6b00, #ff8533);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 107, 0, 0.3);
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-top: 10px;
  width: 100%;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

interface TournamentRegistrationGuardProps {
  children: React.ReactNode;
  onAccessDenied?: () => void;
}

const TournamentRegistrationGuard: React.FC<TournamentRegistrationGuardProps> = ({ 
  children, 
  onAccessDenied 
}) => {
  const { accessStatus, loading } = useTournamentAccess();

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (!accessStatus?.canJoin) {
    return (
      <Overlay>
        <Modal>
          <Icon>{'\u{1F512}'}</Icon>
          <Title>Subscription Required</Title>
          <Message>
            You need an active subscription or free entries to join tournaments.
            {accessStatus.freeEntriesCount === 0 && 
              ' Get free entries by referring friends or subscribe to unlock unlimited access!'
            }
          </Message>
          <Button onClick={() => window.location.href = '/billing'}>
            {accessStatus.freeEntriesCount === 0 ? 'Get Subscription' : 'Go to Billing'}
          </Button>
          <CloseButton onClick={onAccessDenied}>
            Close
          </CloseButton>
        </Modal>
      </Overlay>
    );
  }

  return <>{children}</>;
};

export default TournamentRegistrationGuard;
