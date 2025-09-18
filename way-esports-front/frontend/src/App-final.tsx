import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import { eslTheme } from './styles/esl-theme';

// Import pages
import Home from './pages/Home';
import Tournaments from './pages/Tournaments';
import Profile from './pages/Profile';
import News from './pages/News';
import Teams from './pages/Teams';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';

// Styled components for clean black/white/gray design
const AppContainer = styled.div`
  min-height: 100vh;
  background: ${eslTheme.colors.bg.primary};
  color: ${eslTheme.colors.text.primary};
  font-family: ${eslTheme.fonts.primary};
`;

const Header = styled.header`
  background: ${eslTheme.colors.bg.secondary};
  border-bottom: 1px solid ${eslTheme.colors.border.medium};
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
`;

const Logo = styled.h1`
  font-family: ${eslTheme.fonts.accent};
  font-size: 1.5rem;
  font-weight: ${eslTheme.fontWeights.bold};
  color: ${eslTheme.colors.white};
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const Navigation = styled.nav`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const NavButton = styled.button`
  font-family: ${eslTheme.fonts.accent};
  font-size: 0.875rem;
  font-weight: ${eslTheme.fontWeights.medium};
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border-radius: ${eslTheme.borderRadius.sm};
  transition: all ${eslTheme.transitions.fast};
  cursor: pointer;
  padding: 0.5rem 1rem;
  background: transparent;
  color: ${eslTheme.colors.text.secondary};
  border: 1px solid ${eslTheme.colors.border.medium};
  
  &:hover {
    background: ${eslTheme.colors.bg.elevated};
    color: ${eslTheme.colors.text.primary};
    border-color: ${eslTheme.colors.white};
  }
  
  &:active {
    transform: translateY(1px);
  }
`;

const MainContent = styled.main`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 120px);
`;

const Footer = styled.footer`
  background: ${eslTheme.colors.bg.secondary};
  border-top: 1px solid ${eslTheme.colors.border.medium};
  padding: 2rem;
  text-align: center;
  color: ${eslTheme.colors.text.secondary};
  font-size: 0.875rem;
`;

const LoadingScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: ${eslTheme.colors.bg.primary};
  color: ${eslTheme.colors.text.primary};
`;

const LoadingText = styled.div`
  font-family: ${eslTheme.fonts.accent};
  font-size: 1.5rem;
  margin-bottom: 2rem;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');

  useEffect(() => {
    const initializeApp = async () => {
      const stages = [
        'Connecting to Telegram WebApp...',
        'Loading user authentication...',
        'Fetching platform data...',
        'Preparing interface...',
        'System ready...'
      ];

      for (let i = 0; i < stages.length; i++) {
        setLoadingStatus(stages[i]);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Initialize Telegram WebApp
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }

      setIsLoading(false);
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <AppContainer>
        <LoadingScreen>
          <LoadingText>{loadingStatus}</LoadingText>
        </LoadingScreen>
      </AppContainer>
    );
  }

  return (
    <AppProvider>
      <AuthProvider>
        <ThemeProvider theme={eslTheme}>
          <BrowserRouter>
            <AppContainer>
              <Header>
                <Logo>WAY ESPORTS</Logo>
                <Navigation>
                  <NavButton onClick={() => window.location.href = '/'}>Home</NavButton>
                  <NavButton onClick={() => window.location.href = '/tournaments'}>Tournaments</NavButton>
                  <NavButton onClick={() => window.location.href = '/teams'}>Teams</NavButton>
                  <NavButton onClick={() => window.location.href = '/news'}>News</NavButton>
                  <NavButton onClick={() => window.location.href = '/profile'}>Profile</NavButton>
                </Navigation>
              </Header>
              
              <MainContent>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/tournaments" element={<Tournaments />} />
                  <Route path="/teams" element={<Teams />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainContent>
              
              <Footer>
                <p>© 2024 WAY ESPORTS. All rights reserved.</p>
                <p>Powered by Professional Gaming Technology</p>
              </Footer>
            </AppContainer>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </AppProvider>
  );
};

export default App;
