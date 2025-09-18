import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import navigationService from '../../services/NavigationService';

interface NavigationProviderProps {
  children: React.ReactNode;
}

const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigationService.setNavigate(navigate);
  }, [navigate]);

  return <>{children}</>;
};

export default NavigationProvider; 
 