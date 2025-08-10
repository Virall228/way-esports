import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

interface SubscriptionRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentName?: string;
}

const Modal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, ${({ $isOpen }) => $isOpen ? '0.7' : '0'});
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(${({ $isOpen }) => $isOpen ? '8px' : '0px'});
  padding: 20px;
  opacity: ${({ $isOpen }) => $isOpen ? '1' : '0'};
  visibility: ${({ $isOpen }) => $isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
`;

const ModalContent = styled.div<{ $isOpen: boolean }>`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.85), rgba(26, 26, 26, 0.85));
  border-radius: 20px;
  padding: 40px;
  max-width: 520px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  border: 2px solid rgba(255, 107, 0, 0.4);
  backdrop-filter: blur(15px);
  position: relative;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  transform: ${({ $isOpen }) => $isOpen ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(-20px)'};
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #ff6b00, #ffd700, #ff1493);
    border-radius: 20px 20px 0 0;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: #cccccc;
  font-size: 24px;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #ffffff;
  }
`;

const Icon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  color: #ff6b00;
`;

const Title = styled.h2`
  color: #ffffff;
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 700;
`;

const Message = styled.p`
  color: #cccccc;
  margin: 0 0 24px 0;
  font-size: 16px;
  line-height: 1.5;
`;

const TournamentName = styled.span`
  color: #ff6b00;
  font-weight: 600;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${({ $variant }) => $variant === 'primary' ? `
    background: linear-gradient(135deg, #ff6b00, #ff8533);
    color: #ffffff;
    &:hover {
      background: linear-gradient(135deg, #ff8533, #ffa366);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 107, 0, 0.4);
    }
  ` : `
    background: transparent;
    color: #ffffff;
    border: 2px solid rgba(255, 255, 255, 0.3);
    &:hover {
      border-color: rgba(255, 255, 255, 0.6);
      transform: translateY(-2px);
    }
  `}
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 16px 0 24px 0;
  text-align: left;
`;

const FeatureItem = styled.li`
  color: #cccccc;
  font-size: 14px;
  margin-bottom: 8px;
  padding-left: 20px;
  position: relative;

  &::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: #ff6b00;
    font-weight: 700;
  }
`;

const SubscriptionRequiredModal: React.FC<SubscriptionRequiredModalProps> = ({
  isOpen,
  onClose,
  tournamentName
}) => {
  const navigate = useNavigate();

  const handleGetSubscription = () => {
    navigate('/subscription');
    onClose();
  };

  return (
    <Modal $isOpen={isOpen} onClick={onClose}>
      <ModalContent $isOpen={isOpen} onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <Icon>🔒</Icon>
        
        <Title>Subscription Required</Title>
        
        <Message>
          To register for {tournamentName ? <TournamentName>{tournamentName}</TournamentName> : 'this tournament'}, 
          you need an active subscription.
        </Message>

        <Message>
          With a subscription, you'll get:
        </Message>

        <FeaturesList>
          <FeatureItem>Access to all tournaments</FeatureItem>
          <FeatureItem>Priority registration</FeatureItem>
          <FeatureItem>Advanced statistics</FeatureItem>
          <FeatureItem>Exclusive rewards</FeatureItem>
        </FeaturesList>

        <ButtonContainer>
          <Button $variant="secondary" onClick={onClose}>
            Maybe Later
          </Button>
          <Button $variant="primary" onClick={handleGetSubscription}>
            Get Subscription
          </Button>
        </ButtonContainer>
      </ModalContent>
    </Modal>
  );
};

export default SubscriptionRequiredModal;