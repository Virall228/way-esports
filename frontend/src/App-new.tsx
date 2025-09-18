import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { GlobalStyles } from './styles/cyberpunk-theme';
import { cyberpunkTheme } from './styles/cyberpunk-theme';
import styled from 'styled-components';
import CyberButton from './components/UI/CyberButton';

// Import pages
import Home from './pages/Home';
import Tournaments from './pages/Tournaments';
import Profile from './pages/Profile';
import News from './pages/News';
import Teams from './pages/Teams';
import TournamentDetails from './components/TournamentDetails';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';

// Styled components for new design
const AppContainer = styled.div`
  min-height: 100vh;
  background: ${cyberpunkTheme.colors.bg.primary};
  color: ${cyberpunkTheme.colors.text.primary};
  font-family: ${cyberpunkTheme.fonts.secondary};
`;

const Header = styled.header`
  background: ${cyberpunkTheme.colors.bg.secondary};
  border-bottom: 1px solid ${cyberpunkTheme.colors.border.medium};
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
  font-family: ${cyberpunkTheme.fonts.accent};
  font-size: 1.5rem;
  font-weight: ${cyberpunkTheme.fontWeights.bold};
  color: ${cyberpunkTheme.colors.white};
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const Navigation = styled.nav`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const NavButton = styled(CyberButton)`
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
`;

const MainContent = styled.main`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Footer = styled.footer`
  background: ${cyberpunkTheme.colors.bg.secondary};
  border-top: 1px solid ${cyberpunkTheme.colors.border.medium};
  padding: 2rem;
  text-align: center;
  color: ${cyberpunkTheme.colors.text.secondary};
  font-size: 0.875rem;
`;

const LoadingScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: ${cyberpunkTheme.colors.bg.primary};
  color: ${cyberpunkTheme.colors.text.primary};
`;

const LoadingText = styled.div`
  font-family: ${cyberpunkTheme.fonts.accent};
  font-size: 1.5rem;
  margin-bottom: 2rem;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const LoadingBar = styled.div`
  width: 200px;
  height: 2px;
  background: ${cyberpunkTheme.colors.border.medium};
  border-radius: 1px;
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: ${cyberpunkTheme.colors.white};
    animation: loading 2s infinite;
  }
  
  @keyframes loading {
    0% { left: -100%; }
    100% { left: 100%; }
  }
`;

// Navigation component
const AppNavigation: React.FC = () => {
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/tournaments', label: 'Tournaments', icon: '🏆' },
    { path: '/teams', label: 'Teams', icon: '👥' },
    { path: '/news', label: 'News', icon: '📰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <Navigation>
      {navItems.map((item) => (
        <NavButton
          key={item.path}
          variant="ghost"
          size="sm"
          onClick={() => navigate(item.path)}
        >
          {item.icon} {item.label}
        </NavButton>
      ))}
    </Navigation>
  );
};

// Main App Component
const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');

  useEffect(() => {
    const initializeApp = async () => {
      const stages = [
        'Connecting to Telegram WebApp...',
        'Loading user authentication...',
        'Fetching platform data...',
        'Preparing cyberpunk interface...',
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
          <LoadingBar />
        </LoadingScreen>
      </AppContainer>
    );
  }

  return (
    <AppProvider>
      <AuthProvider>
        <ThemeProvider theme={cyberpunkTheme}>
          <GlobalStyles />
          <BrowserRouter>
            <AppContainer>
              <Header>
                <Logo>WAY ESPORTS</Logo>
                <AppNavigation />
              </Header>
              
              <MainContent>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/tournaments" element={<Tournaments />} />
                  <Route path="/tournaments/:id" element={<div>Tournament Details Coming Soon</div>} />
                  <Route path="/teams" element={<Teams />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainContent>
              
              <Footer>
                <p>© 2024 WAY ESPORTS. All rights reserved.</p>
                <p>Powered by Cyberpunk Technology</p>
              </Footer>
            </AppContainer>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </AppProvider>
  );
};

export default App;
