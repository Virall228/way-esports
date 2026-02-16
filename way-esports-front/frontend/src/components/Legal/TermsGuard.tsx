import React, { useState, useEffect } from 'react';
import TermsModal from './TermsModal';
import { api } from '../../services/api';

interface TermsGuardProps {
  children: React.ReactNode;
}

interface TermsStatus {
  hasCurrentTerms: boolean;
  required: boolean;
  accepted: boolean;
  acceptedAt?: string;
  termsVersion?: string;
  termsTitle?: string;
}

const TermsGuard: React.FC<TermsGuardProps> = ({ children }) => {
  const [termsStatus, setTermsStatus] = useState<TermsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    checkTermsStatus();
  }, []);

  const checkTermsStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get<TermsStatus>('/api/terms/status');
      setTermsStatus(response);

      if (response.required && !response.accepted) {
        setShowTermsModal(true);
      }
    } catch (error) {
      console.error('Failed to check terms status:', error);
      setTermsStatus({
        hasCurrentTerms: false,
        required: false,
        accepted: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTermsAccepted = () => {
    setShowTermsModal(false);
    checkTermsStatus(); // Refresh status
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (!termsStatus?.hasCurrentTerms) {
    // No terms configured, allow access
    return <>{children}</>;
  }

  if (termsStatus.required && !termsStatus.accepted) {
    // Terms are required but not accepted
    return (
      <>
        {showTermsModal && (
          <TermsModal
            isOpen={showTermsModal}
            onClose={() => setShowTermsModal(false)}
            onAccept={handleTermsAccepted}
            required={true}
          />
        )}
        {/* Show a blocked screen while terms modal is open */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            color: 'white',
            textAlign: 'center',
            fontSize: '18px'
          }}>
            Please accept the Terms of Service to continue
          </div>
        </div>
      </>
    );
  }

  // Terms are accepted or not required
  return <>{children}</>;
};

export default TermsGuard;
