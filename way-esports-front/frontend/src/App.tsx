import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';

import { GlobalStyles as GlobalStyle } from './styles/GlobalStyles';
import { theme as eslTheme } from './styles/theme';

// Import pages
import Home from './pages/Home';
import Tournaments from './pages/Tournaments';
import Profile from './pages/Profile';
import News from './pages/News';
import Teams from './pages/Teams';
import AdminPage from './pages/Admin/AdminPage';
import TournamentDetailsPage from './pages/Tournaments/TournamentDetailsPage';
import BillingPage from './pages/Billing/BillingPage';
import PublicProfilePage from './pages/Profile/PublicProfilePage';
import TeamPage from './pages/Teams/TeamPage';

// Import components
import TermsGuard from './components/Legal/TermsGuard';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { api } from './services/api';

type NavItem = {
  label: string;
  to: string;
  icon: string;
  adminOnly?: boolean;
};

const AppShell = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(900px 600px at 10% -10%, rgba(255, 255, 255, 0.06), transparent 60%),
    radial-gradient(800px 500px at 90% -20%, rgba(255, 255, 255, 0.04), transparent 60%),
    ${eslTheme.colors.bg.primary};
  color: ${eslTheme.colors.text.primary};
  font-family: ${eslTheme.fonts.primary};
  display: flex;
  width: 100%;
`;

const Sidebar = styled.aside`
  display: none;
  width: 260px;
  min-width: 240px;
  padding: 1.5rem 1rem;
  background: rgba(17, 17, 17, 0.7);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  position: sticky;
  top: 0;
  height: 100vh;

  @media (min-width: ${eslTheme.breakpoints.tablet}) {
    display: flex;
    flex-direction: column;
  }
`;

const SidebarBrand = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Logo = styled.div`
  font-family: ${eslTheme.fonts.title};
  font-size: 1.2rem;
  font-weight: ${eslTheme.fontWeights.bold};
  letter-spacing: 2px;
  text-transform: uppercase;
  color: ${eslTheme.colors.white};
`;

const BrandSub = styled.div`
  font-size: 0.75rem;
  color: ${eslTheme.colors.text.secondary};
  letter-spacing: 0.8px;
  text-transform: uppercase;
`;

const SidebarNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1.5rem;
`;

const NavItemLink = styled(Link) <{ $active?: boolean; $compact?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: ${({ $compact }) => ($compact ? '0.6rem 0.75rem' : '0.75rem 0.9rem')};
  border-radius: 12px;
  text-decoration: none;
  color: ${({ $active }) => ($active ? eslTheme.colors.text.primary : eslTheme.colors.text.secondary)};
  background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)')};
  border: 1px solid ${({ $active }) => ($active ? eslTheme.colors.border.strong : 'rgba(255, 255, 255, 0.08)')};
  transition: all ${eslTheme.transitions.fast};
  backdrop-filter: blur(12px);

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: rgba(255, 255, 255, 0.12);
      color: ${eslTheme.colors.text.primary};
      border-color: ${eslTheme.colors.border.strong};
      transform: translateY(-1px);
    }
  }

  &:active {
    transform: translateY(1px);
  }
`;

const NavItemIcon = styled.span`
  font-size: 1rem;
  line-height: 1;
`;

const NavItemLabel = styled.span`
  font-family: ${eslTheme.fonts.accent};
  font-size: 0.85rem;
  letter-spacing: 0.6px;
  text-transform: uppercase;
`;

const ContentColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const TopBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 140;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(12, 12, 12, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);

  @media (min-width: ${eslTheme.breakpoints.tablet}) {
    padding: 0.9rem 1.5rem;
  }

  @media (min-width: ${eslTheme.breakpoints.desktop}) {
    padding: 1rem 2rem;
  }
`;

const TopBarTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TopBarBadge = styled.span`
  font-size: 0.7rem;
  color: ${eslTheme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const BurgerButton = styled.button`
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: ${eslTheme.colors.text.primary};

  @media (min-width: ${eslTheme.breakpoints.tablet}) {
    display: none;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: ${eslTheme.colors.border.strong};
    }
  }

  &:active {
    transform: translateY(1px);
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: 1rem 1rem calc(88px + var(--sab, 0px));

  @media (min-width: ${eslTheme.breakpoints.tablet}) {
    padding: 1.5rem 2rem 2rem;
  }

  @media (min-width: ${eslTheme.breakpoints.desktop}) {
    padding: 2rem 2.5rem 2.5rem;
  }
`;

const ContentInner = styled.div`
  width: min(100%, 1200px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Footer = styled.footer`
  background: rgba(10, 10, 10, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.5rem 1rem;
  text-align: center;
  color: ${eslTheme.colors.text.secondary};
  font-size: 0.875rem;

  @media (max-width: ${eslTheme.breakpoints.tablet}) {
    display: none;
  }
`;

const BottomNav = styled.nav`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 150;
  display: flex;
  gap: 6px;
  padding: 10px 10px calc(10px + var(--sab, 0px));
  background: rgba(12, 12, 12, 0.85);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  overflow-x: auto;

  @media (min-width: ${eslTheme.breakpoints.tablet}) {
    display: none;
  }
`;

const BottomNavItem = styled(Link) <{ $active?: boolean }>`
  flex: 0 0 auto;
  min-width: 68px;
  min-height: 48px;
  border-radius: 12px;
  border: 1px solid ${({ $active }) => ($active ? eslTheme.colors.border.strong : 'transparent')};
  background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.1)' : 'transparent')};
  color: ${({ $active }) => ($active ? eslTheme.colors.text.primary : eslTheme.colors.text.secondary)};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  text-decoration: none;
`;

const BottomNavIcon = styled.span`
  font-size: 16px;
  line-height: 1;
`;

const MobileMenuOverlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  z-index: 200;
  display: ${({ $open }) => ($open ? 'block' : 'none')};

  @media (min-width: ${eslTheme.breakpoints.tablet}) {
    display: none;
  }
`;

const MobileMenuPanel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: min(86vw, 360px);
  background: rgba(15, 15, 15, 0.92);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
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
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: ${eslTheme.colors.text.primary};

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: ${eslTheme.colors.border.strong};
    }
  }

  &:active {
    transform: translateY(1px);
  }
`;

const AppContent: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const location = useLocation();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navItems = React.useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { label: 'Home', to: '/', icon: '🏠' },
      { label: 'Tournaments', to: '/tournaments', icon: '🏆' },
      { label: 'Teams', to: '/teams', icon: '👥' },
      { label: 'News', to: '/news', icon: '📰' },
      { label: 'Profile', to: '/profile', icon: '👤' }
    ];

    if (user?.role === 'admin' || user?.role === 'developer') {
      items.push({ label: 'Admin', to: '/admin', icon: '⚙️', adminOnly: true });
    }

    return items;
  }, [user]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  React.useEffect(() => {
    // Initialize API notification handler
    api.setNotifyHandler((type, title, message) => {
      addNotification({ type, title, message });
    });
  }, [addNotification]);

  React.useEffect(() => {
    const setAppHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${height}px`);
    };

    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    window.visualViewport?.addEventListener('resize', setAppHeight);
    window.visualViewport?.addEventListener('scroll', setAppHeight);

    return () => {
      window.removeEventListener('resize', setAppHeight);
      window.visualViewport?.removeEventListener('resize', setAppHeight);
      window.visualViewport?.removeEventListener('scroll', setAppHeight);
    };
  }, []);

  React.useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    if (!tg) return;

    try {
      tg.ready?.();
      tg.expand?.();

      const params = tg.themeParams ?? {};
      if (params.bg_color) document.documentElement.style.setProperty('--tg-bg', params.bg_color);
      if (params.text_color) document.documentElement.style.setProperty('--tg-text', params.text_color);
      if (params.hint_color) document.documentElement.style.setProperty('--tg-hint', params.hint_color);
      if (params.link_color) document.documentElement.style.setProperty('--tg-link', params.link_color);
      if (params.button_color) document.documentElement.style.setProperty('--tg-button', params.button_color);
      if (params.button_text_color) document.documentElement.style.setProperty('--tg-button-text', params.button_text_color);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AppShell>
      <Sidebar>
        <SidebarBrand>
          <Logo>WAY ESPORTS</Logo>
          <BrandSub>Unified Arena</BrandSub>
        </SidebarBrand>
        <SidebarNav>
          {navItems.map((item) => (
            <NavItemLink key={item.to} to={item.to} $active={isActive(item.to)}>
              <NavItemIcon>{item.icon}</NavItemIcon>
              <NavItemLabel>{item.label}</NavItemLabel>
            </NavItemLink>
          ))}
        </SidebarNav>
      </Sidebar>

      <ContentColumn>
        <TopBar>
          <TopBarTitle>
            <Logo>WAY ESPORTS</Logo>
            <TopBarBadge>One Platform · One UI</TopBarBadge>
          </TopBarTitle>
          <BurgerButton type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            ☰
          </BurgerButton>
        </TopBar>

        <MainContent>
          <ContentInner>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/tournaments/:id" element={<TournamentDetailsPage />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/news" element={<News />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<PublicProfilePage />} />
              <Route path="/team/:id" element={<TeamPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ContentInner>
        </MainContent>

        <Footer>
          <p>© 2024 WAY ESPORTS. All rights reserved.</p>
          <p>Powered by Professional Gaming Technology</p>
        </Footer>
      </ContentColumn>

      <MobileMenuOverlay $open={mobileMenuOpen} onClick={closeMobileMenu}>
        <MobileMenuPanel onClick={(e) => e.stopPropagation()}>
          <MobileMenuHeader>
            <MobileMenuTitle>Menu</MobileMenuTitle>
            <CloseButton type="button" onClick={closeMobileMenu} aria-label="Close menu">
              ✕
            </CloseButton>
          </MobileMenuHeader>

          {navItems.map((item) => (
            <NavItemLink
              key={item.to}
              to={item.to}
              $active={isActive(item.to)}
              $compact
              onClick={closeMobileMenu}
            >
              <NavItemIcon>{item.icon}</NavItemIcon>
              <NavItemLabel>{item.label}</NavItemLabel>
            </NavItemLink>
          ))}
        </MobileMenuPanel>
      </MobileMenuOverlay>

      <BottomNav>
        {navItems.map((item) => (
          <BottomNavItem key={item.to} to={item.to} $active={isActive(item.to)}>
            <BottomNavIcon>{item.icon}</BottomNavIcon>
            {item.label}
          </BottomNavItem>
        ))}
      </BottomNav>
    </AppShell>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={eslTheme}>
      <AuthProvider>
        <NotificationProvider>
          <AppProvider>
            <GlobalStyle />
            <TermsGuard>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </TermsGuard>
          </AppProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
