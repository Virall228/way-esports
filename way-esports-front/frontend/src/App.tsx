import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { eslTheme, GlobalStyles } from './styles/esl-theme';

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
  background: linear-gradient(180deg, ${eslTheme.colors.bg.secondary} 0%, ${eslTheme.colors.bg.tertiary} 100%);
  border-bottom: 1px solid ${eslTheme.colors.border.medium};
  padding: 0.75rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: saturate(140%) blur(8px);
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
  font-size: 0.85rem;
  font-weight: ${eslTheme.fontWeights.medium};
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border-radius: ${eslTheme.borderRadius.md};
  transition: all ${eslTheme.transitions.fast};
  cursor: pointer;
  padding: 0.45rem 0.9rem;
  background: linear-gradient(180deg, ${eslTheme.colors.gray[800]} 0%, ${eslTheme.colors.gray[900]} 100%);
  color: ${eslTheme.colors.text.secondary};
  border: 1px solid ${eslTheme.colors.border.medium};
  
  &:hover {
    background: ${eslTheme.colors.bg.elevated};
    color: ${eslTheme.colors.text.primary};
    border-color: ${eslTheme.colors.border.strong};
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

const GlobalStyle = createGlobalStyle`${GlobalStyles}`;

const App: React.FC = () => {
  return (
    <AppProvider>
      <AuthProvider>
        <ThemeProvider theme={eslTheme}>
          <GlobalStyle />
          <BrowserRouter>
            <AppContainer>
              <Header>
                <Logo>WAY ESPORTS</Logo>
                <Navigation>
                  <Link to="/"><NavButton as="span">Home</NavButton></Link>
                  <Link to="/tournaments"><NavButton as="span">Tournaments</NavButton></Link>
                  <Link to="/teams"><NavButton as="span">Teams</NavButton></Link>
                  <Link to="/news"><NavButton as="span">News</NavButton></Link>
                  <Link to="/profile"><NavButton as="span">Profile</NavButton></Link>
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
