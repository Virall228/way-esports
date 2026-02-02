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
import AdminPage from './pages/Admin/AdminPage';
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
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: saturate(140%) blur(8px);

  @media (min-width: ${eslTheme.breakpoints.tablet}) {
    padding: 0.75rem 1.5rem;
  }

  @media (min-width: ${eslTheme.breakpoints.desktop}) {
    padding: 0.75rem 2rem;
  }
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
  display: none;
  gap: 1rem;
  align-items: center;

  @media (min-width: ${eslTheme.breakpoints.desktop}) {
    display: flex;
  }
`;

const BurgerButton = styled.button`
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${eslTheme.borderRadius.md};
  border: 1px solid ${eslTheme.colors.border.medium};
  background: linear-gradient(180deg, ${eslTheme.colors.gray[800]} 0%, ${eslTheme.colors.gray[900]} 100%);
  color: ${eslTheme.colors.text.primary};

  @media (min-width: ${eslTheme.breakpoints.desktop}) {
    display: none;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${eslTheme.colors.bg.elevated};
      border-color: ${eslTheme.colors.border.strong};
    }
  }

  &:active {
    transform: translateY(1px);
  }
`;

const MobileMenuOverlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  z-index: 200;
  display: ${({ $open }) => ($open ? 'block' : 'none')};

  @media (min-width: ${eslTheme.breakpoints.desktop}) {
    display: none;
  }
`;

const MobileMenuPanel = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: min(86vw, 360px);
  background: ${eslTheme.colors.bg.secondary};
  border-left: 1px solid ${eslTheme.colors.border.medium};
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const MobileMenuHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MobileMenuTitle = styled.div`
  font-family: ${eslTheme.fonts.accent};
  font-weight: ${eslTheme.fontWeights.bold};
  letter-spacing: 1px;
  text-transform: uppercase;
`;

const CloseButton = styled.button`
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${eslTheme.borderRadius.md};
  border: 1px solid ${eslTheme.colors.border.medium};
  background: transparent;
  color: ${eslTheme.colors.text.primary};

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${eslTheme.colors.bg.elevated};
      border-color: ${eslTheme.colors.border.strong};
    }
  }

  &:active {
    transform: translateY(1px);
  }
`;

const NavButton = styled.button`
  font-family: ${eslTheme.fonts.accent};
  font-size: 0.85rem;
  font-weight: ${eslTheme.fontWeights.medium};
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border-radius: ${eslTheme.borderRadius.sm};
  transition: all ${eslTheme.transitions.fast};
  cursor: pointer;
  padding: 0.55rem 0.9rem;
  min-height: 44px;
  background: linear-gradient(180deg, ${eslTheme.colors.gray[800]} 0%, ${eslTheme.colors.gray[900]} 100%);
  color: ${eslTheme.colors.text.secondary};
  border: 1px solid ${eslTheme.colors.border.medium};

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${eslTheme.colors.bg.elevated};
      color: ${eslTheme.colors.text.primary};
      border-color: ${eslTheme.colors.border.strong};
    }
  }
  
  &:active {
    transform: translateY(1px);
  }
`;

const MainContent = styled.main`
  padding: 1rem;
  width: min(100% - 2rem, 1200px);
  margin: 0 auto;
  min-height: calc(100vh - 120px);

  @media (min-width: ${eslTheme.breakpoints.tablet}) {
    padding: 1.5rem;
    width: min(100% - 3rem, 1200px);
  }

  @media (min-width: ${eslTheme.breakpoints.desktop}) {
    padding: 2rem;
    width: min(100% - 4rem, 1200px);
  }
`;

const Footer = styled.footer`
  background: ${eslTheme.colors.bg.secondary};
  border-top: 1px solid ${eslTheme.colors.border.medium};
  padding: 1.5rem 1rem;
  text-align: center;
  color: ${eslTheme.colors.text.secondary};
  font-size: 0.875rem;

  @media (min-width: ${eslTheme.breakpoints.tablet}) {
    padding: 2rem 1.5rem;
  }

  @media (min-width: ${eslTheme.breakpoints.desktop}) {
    padding: 2rem;
  }
`;

const GlobalStyle = createGlobalStyle`${GlobalStyles}`;

const App: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <AppProvider>
      <AuthProvider>
        <ThemeProvider theme={eslTheme}>
          <GlobalStyle />
          <BrowserRouter>
            <AppContainer>
              <Header>
                <Logo>WAY ESPORTS</Logo>
                <BurgerButton type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
                  ☰
                </BurgerButton>
                <Navigation>
                  <Link to="/"><NavButton as="span">Home</NavButton></Link>
                  <Link to="/tournaments"><NavButton as="span">Tournaments</NavButton></Link>
                  <Link to="/teams"><NavButton as="span">Teams</NavButton></Link>
                  <Link to="/news"><NavButton as="span">News</NavButton></Link>
                  <Link to="/profile"><NavButton as="span">Profile</NavButton></Link>
                </Navigation>
              </Header>

              <MobileMenuOverlay $open={mobileMenuOpen} onClick={closeMobileMenu}>
                <MobileMenuPanel onClick={(e) => e.stopPropagation()}>
                  <MobileMenuHeader>
                    <MobileMenuTitle>Menu</MobileMenuTitle>
                    <CloseButton type="button" onClick={closeMobileMenu} aria-label="Close menu">
                      ✕
                    </CloseButton>
                  </MobileMenuHeader>

                  <Link to="/" onClick={closeMobileMenu}><NavButton as="span">Home</NavButton></Link>
                  <Link to="/tournaments" onClick={closeMobileMenu}><NavButton as="span">Tournaments</NavButton></Link>
                  <Link to="/teams" onClick={closeMobileMenu}><NavButton as="span">Teams</NavButton></Link>
                  <Link to="/news" onClick={closeMobileMenu}><NavButton as="span">News</NavButton></Link>
                  <Link to="/profile" onClick={closeMobileMenu}><NavButton as="span">Profile</NavButton></Link>
                  <Link to="/admin" onClick={closeMobileMenu}><NavButton as="span">Admin</NavButton></Link>
                </MobileMenuPanel>
              </MobileMenuOverlay>
              
              <MainContent>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/tournaments" element={<Tournaments />} />
                  <Route path="/teams" element={<Teams />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<AdminPage />} />
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
