import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';

interface TermsData {
  version: string;
  title: string;
  content: string;
  effectiveDate: string;
}

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  required?: boolean;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  padding: 32px;
  width: 90%;
  max-width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
`;

const Title = styled.h2`
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
  text-align: center;
`;

const Content = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
  
  h1, h2, h3 {
    color: #fff;
    margin-top: 20px;
    margin-bottom: 10px;
  }
  
  h1 { font-size: 20px; }
  h2 { font-size: 18px; }
  h3 { font-size: 16px; }
  
  ul, ol {
    margin-left: 20px;
    margin-bottom: 10px;
  }
  
  li {
    margin-bottom: 5px;
  }
  
  strong {
    color: #4fc3f7;
    font-weight: 600;
  }
  
  code {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 12px;
`;

const Checkbox = styled.input`
  margin-top: 4px;
  width: 18px;
  height: 18px;
  accent-color: #4fc3f7;
`;

const CheckboxLabel = styled.label`
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  line-height: 1.4;
  cursor: pointer;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;

  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%);
    color: #000;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(79, 195, 247, 0.3);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
    }
  `}
`;

const EffectiveDate = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  text-align: center;
  margin-bottom: 20px;
`;

const LoadingText = styled.div`
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  padding: 40px;
`;

const TermsModal: React.FC<TermsModalProps> = ({ 
  isOpen, 
  onClose, 
  onAccept, 
  required = true 
}) => {
  const [terms, setTerms] = useState<TermsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTerms();
    }
  }, [isOpen]);

  const loadTerms = async () => {
    try {
      setLoading(true);
      const response: any = await api.get('/api/terms/current');
      setTerms((response?.data || response) as TermsData);
    } catch (error) {
      console.error('Failed to load terms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!terms || !accepted) return;

    try {
      setAccepting(true);
      await api.post('/api/terms/accept', {
        termsVersion: terms.version,
        accepted: true
      });
      
      onAccept();
    } catch (error) {
      console.error('Failed to accept terms:', error);
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!terms) return;

    try {
      await api.post('/api/terms/accept', {
        termsVersion: terms.version,
        accepted: false
      });
      
      if (required) {
        // For required terms, just show message
        alert('Terms acceptance is required to continue using the platform.');
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Failed to decline terms:', error);
    }
  };

  const renderContent = (content: string) => {
    // Convert markdown to basic HTML
    return content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br />');
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <LoadingText>Loading terms and conditions...</LoadingText>
        ) : terms ? (
          <>
            <Title>{terms.title}</Title>
            <EffectiveDate>
              Effective Date: {new Date(terms.effectiveDate).toLocaleDateString()}
            </EffectiveDate>
            
            <Content dangerouslySetInnerHTML={{ __html: renderContent(terms.content) }} />
            
            <CheckboxContainer>
              <Checkbox
                type="checkbox"
                id="terms-accepted"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <CheckboxLabel htmlFor="terms-accepted">
                I have read and agree to the {terms.title}. 
                {required && ' This is required to use the platform.'}
              </CheckboxLabel>
            </CheckboxContainer>

            <ButtonContainer>
              {!required && (
                <Button variant="secondary" onClick={onClose}>
                  Maybe Later
                </Button>
              )}
              <Button variant="secondary" onClick={handleDecline}>
                Decline
              </Button>
              <Button 
                variant="primary" 
                onClick={handleAccept}
                disabled={!accepted || accepting}
              >
                {accepting ? 'Accepting...' : 'Accept & Continue'}
              </Button>
            </ButtonContainer>
          </>
        ) : (
          <LoadingText>Failed to load terms and conditions.</LoadingText>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default TermsModal;
