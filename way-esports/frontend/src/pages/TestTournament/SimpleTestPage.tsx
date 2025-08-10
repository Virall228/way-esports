import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  padding: 80px 20px 40px;
  color: white;
`;

const Card = styled.div`
  max-width: 600px;
  margin: 0 auto;
  background: rgba(42, 42, 42, 0.9);
  border-radius: 16px;
  padding: 32px;
  border: 2px solid rgba(255, 107, 0, 0.3);
  text-align: center;
`;

const Title = styled.h1`
  color: #ff6b00;
  margin-bottom: 24px;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #ff6b00, #ff8533);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin: 8px;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const Status = styled.div<{ $hasSubscription: boolean }>`
  padding: 16px;
  margin: 16px 0;
  border-radius: 8px;
  background: ${({ $hasSubscription }) => 
    $hasSubscription ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 107, 0, 0.1)'};
  border: 1px solid ${({ $hasSubscription }) => 
    $hasSubscription ? 'rgba(46, 213, 115, 0.3)' : 'rgba(255, 107, 0, 0.3)'};
  color: ${({ $hasSubscription }) => $hasSubscription ? '#2ed573' : '#ff6b00'};
`;

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
  text-align: center;
  color: white;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;
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

const SimpleTestPage: React.FC = () => {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!hasSubscription) {
      setShowModal(true);
      return;
    }

    // Simulate API call
    try {
      const response = await fetch('http://localhost:5000/api/tournaments/test-tournament/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.requiresSubscription) {
          setShowModal(true);
          return;
        }
      }

      if (response.ok) {
        alert('✅ Registration successful!');
      } else {
        alert('❌ Registration failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Network error');
    }
  };

  const handleToggleSubscription = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/test/toggle-subscription', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setHasSubscription(data.hasActiveSubscription);
        alert(`Subscription ${data.hasActiveSubscription ? 'activated' : 'deactivated'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Failed to toggle subscription');
    }
  };

  const handleGetSubscription = () => {
    navigate('/subscription');
    setShowModal(false);
  };

  return (
    <Container>
      <Card>
        <Title>🎮 Tournament Registration Test</Title>
        
        <Status $hasSubscription={hasSubscription}>
          {hasSubscription 
            ? '✅ You have an active subscription - Ready to register!' 
            : '⚠️ Active subscription required to register for tournaments'
          }
        </Status>

        <div>
          <h3>Valorant Championship</h3>
          <p>Prize Pool: $5,000 | Players: 32/64</p>
        </div>

        <div>
          <Button onClick={handleRegister}>
            Register for Tournament
          </Button>
          <br />
          <Button onClick={handleToggleSubscription}>
            Toggle Subscription (Test)
          </Button>
        </div>
      </Card>

      <Modal $isOpen={showModal} onClick={() => setShowModal(false)}>
        <ModalContent $isOpen={showModal} onClick={(e) => e.stopPropagation()}>
          <h2>🔒 Subscription Required</h2>
          <p>To register for this tournament, you need an active subscription.</p>
          <p>With a subscription, you'll get:</p>
          <ul style={{ textAlign: 'left', margin: '16px 0' }}>
            <li>✓ Access to all tournaments</li>
            <li>✓ Priority registration</li>
            <li>✓ Advanced statistics</li>
            <li>✓ Exclusive rewards</li>
          </ul>
          <div>
            <Button onClick={() => setShowModal(false)}>
              Maybe Later
            </Button>
            <Button onClick={handleGetSubscription}>
              Get Subscription
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default SimpleTestPage;