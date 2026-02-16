import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import {
  Award,
  BarChart2,
  CreditCard,
  Crosshair,
  FileText,
  Gift,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Shield,
  LogOut,
  Users,
  User
} from 'react-feather';

import { GlobalStyles as GlobalStyle } from './styles/GlobalStyles';
import { theme as darkTheme, lightTheme } from './styles/theme';

// Import pages
import Home from './pages/Home';
import Tournaments from './pages/Tournaments';
import Profile from './pages/Profile';
import News from './pages/News';
import Teams from './pages/Teams';
import Rankings from './pages/Rankings';
import Prizes from './pages/Prizes';
import Matches from './pages/Matches';
import Wallet from './pages/Wallet';
import Settings from './pages/Settings';
import AdminPage from './pages/Admin/AdminPage';
import AdminAccessPage from './pages/Admin/AdminAccessPage';
import AuthPage from './pages/Auth/AuthPage';
import TournamentDetailsPage from './pages/Tournaments/TournamentDetailsPage';
import BillingPage from './pages/Billing/BillingPage';
import PublicProfilePage from './pages/Profile/PublicProfilePage';
import TeamPage from './pages/Teams/TeamPage';
import GameHubPage from './pages/Games/GameHubPage';

// Import components
import TermsGuard from './components/Legal/TermsGuard';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { api } from './services/api';

type NavItem = {
  label: string;
  to: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

const AppShell = styled.div`
  height: var(--app-height, 100vh);
  min-height: var(--app-height, 100vh);
  background:
    radial-gradient(900px 600px at 10% -10%, rgba(255, 255, 255, 0.06), transparent 60%),
    radial-gradient(800px 500px at 90% -20%, rgba(255, 255, 255, 0.04), transparent 60%),
    ${({ theme }) => theme.colors.bg.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.primary};
  display: flex;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding-left: var(--sal);
  padding-right: var(--sar);
  overflow-x: hidden;
  overflow-y: hidden;
`;

const Sidebar = styled.aside`
  display: none;
  width: clamp(220px, 22vw, 280px);
  min-width: clamp(200px, 18vw, 240px);
  padding: 1.5rem 1rem;
  background: ${({ theme }) => theme.colors.glass.panel};
  border-right: 1px solid ${({ theme }) => theme.colors.glass.panelBorder};
  backdrop-filter: blur(16px);
  position: sticky;
  top: 0;
  height: var(--app-height, 100vh);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-bottom: calc(1.5rem + var(--sab, 0px));

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
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
  font-family: ${({ theme }) => theme.fonts.title};
  font-size: clamp(0.95rem, 3vw, 1.2rem);
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: clamp(1px, 0.4vw, 2px);
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const BrandSub = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
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
  color: ${({ $active, theme }) => ($active ? theme.colors.text.primary : theme.colors.text.secondary)};
  background: ${({ $active, theme }) => ($active ? theme.colors.glass.panelHover : theme.colors.glass.panel)};
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.border.strong : theme.colors.glass.panelBorder)};
  transition: all ${({ theme }) => theme.transitions.fast};
  backdrop-filter: blur(12px);

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ theme }) => theme.colors.glass.panelHover};
      color: ${({ theme }) => theme.colors.text.primary};
      border-color: ${({ theme }) => theme.colors.border.strong};
      transform: translateY(-1px);
    }
  }

  &:active {
    transform: translateY(1px);
  }
`;

const NavItemIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const NavItemLabel = styled.span`
  font-family: ${({ theme }) => theme.fonts.accent};
  font-size: 0.85rem;
  letter-spacing: 0.6px;
  text-transform: uppercase;
`;

const ContentColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
`;

const TopBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 140;
  padding: calc(0.75rem + var(--sat)) 1rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: ${({ theme }) => theme.colors.glass.bar};
  border-bottom: 1px solid ${({ theme }) => theme.colors.glass.barBorder};
  backdrop-filter: blur(14px);

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 0.9rem 1.5rem;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    padding: 1rem 2rem;
  }
`;

const TopBarTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;

const TopBarBadge = styled.span`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors.text.secondary};
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
  border: 1px solid ${({ theme }) => theme.colors.glass.panelBorder};
  background: ${({ theme }) => theme.colors.glass.panel};
  color: ${({ theme }) => theme.colors.text.primary};

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: none;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ theme }) => theme.colors.glass.panelHover};
      border-color: ${({ theme }) => theme.colors.border.strong};
    }
  }

  &:active {
    transform: translateY(1px);
  }
`;

const TopBarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TopActionButton = styled.button`
  min-width: 44px;
  min-height: 44px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.glass.panelBorder};
  background: ${({ theme }) => theme.colors.glass.panel};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.7px;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ theme }) => theme.colors.glass.panelHover};
      border-color: ${({ theme }) => theme.colors.border.strong};
    }
  }

  &:active {
    transform: translateY(1px);
  }
`;

const MainContent = styled.main`
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 1rem 1rem calc(88px + var(--sab, 0px));
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 1.5rem 2rem 2rem;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    padding: 2rem 2.5rem 2.5rem;
  }
`;

const ContentInner = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Footer = styled.footer`
  background: ${({ theme }) => theme.colors.glass.bar};
  border-top: 1px solid ${({ theme }) => theme.colors.glass.barBorder};
  padding: 1.5rem 1rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
  flex: 0 0 auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
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
  padding: 10px calc(10px + var(--sar)) calc(10px + var(--sab, 0px)) calc(10px + var(--sal));
  background: ${({ theme }) => theme.colors.glass.bar};
  border-top: 1px solid ${({ theme }) => theme.colors.glass.barBorder};
  backdrop-filter: blur(12px);
  overflow-x: auto;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: none;
  }
`;

const BottomNavItem = styled(Link) <{ $active?: boolean }>`
  flex: 0 0 auto;
  min-width: 68px;
  min-height: 48px;
  border-radius: 12px;
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.border.strong : 'transparent')};
  background: ${({ $active, theme }) => ($active ? theme.colors.glass.panelHover : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.text.primary : theme.colors.text.secondary)};
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const MobileMenuOverlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.glass.overlay};
  backdrop-filter: blur(6px);
  z-index: 200;
  display: ${({ $open }) => ($open ? 'block' : 'none')};

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: none;
  }
`;

const MobileMenuPanel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: min(86vw, 360px);
  background: ${({ theme }) => theme.colors.glass.panel};
  border-right: 1px solid ${({ theme }) => theme.colors.glass.panelBorder};
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
  font-family: ${({ theme }) => theme.fonts.accent};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
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
  border: 1px solid ${({ theme }) => theme.colors.glass.panelBorder};
  background: ${({ theme }) => theme.colors.glass.panel};
  color: ${({ theme }) => theme.colors.text.primary};

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ theme }) => theme.colors.glass.panelHover};
      border-color: ${({ theme }) => theme.colors.border.strong};
    }
  }

  &:active {
    transform: translateY(1px);
  }
`;

const MobileMenuActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.glass.panelBorder};
  background: ${({ theme }) => theme.colors.glass.panel};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.accent};
  font-size: 0.85rem;
  letter-spacing: 0.6px;
  text-transform: uppercase;
`;

const AppContent: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { addNotification } = useNotifications();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const iconProps = React.useMemo(() => ({ size: 18, strokeWidth: 2 }), []);
  const hasAdminAccess = user?.role === 'admin' || user?.role === 'developer';

  const handleLogout = React.useCallback(() => {
    logout();
    closeMobileMenu();
    navigate('/');
  }, [logout, navigate]);

  const handleLogin = React.useCallback(() => {
    closeMobileMenu();
    navigate('/auth');
  }, [navigate]);

  const navItems = React.useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { label: t('home'), to: '/', icon: <HomeIcon {...iconProps} /> },
      { label: t('tournaments'), to: '/tournaments', icon: <Award {...iconProps} /> },
      { label: t('teams'), to: '/teams', icon: <Users {...iconProps} /> },
      { label: t('rankings'), to: '/rankings', icon: <BarChart2 {...iconProps} /> },
      { label: t('matches'), to: '/matches', icon: <Crosshair {...iconProps} /> },
      { label: t('prizes'), to: '/prizes', icon: <Gift {...iconProps} /> },
      { label: t('news'), to: '/news', icon: <FileText {...iconProps} /> },
      { label: t('wallet'), to: '/wallet', icon: <CreditCard {...iconProps} /> },
      { label: t('profile'), to: '/profile', icon: <User {...iconProps} /> },
      { label: t('settings'), to: '/settings', icon: <SettingsIcon {...iconProps} /> }
    ];

    if (hasAdminAccess) {
      items.push({ label: 'Control', to: '/admin', icon: <Shield {...iconProps} />, adminOnly: true });
    }

    return items;
  }, [hasAdminAccess, iconProps, t]);

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
            <TopBarBadge>{t('onePlatformOneUi')}</TopBarBadge>
          </TopBarTitle>
          <TopBarActions>
            {!isAuthenticated && (
              <TopActionButton type="button" onClick={handleLogin} aria-label="Login">
                Login
              </TopActionButton>
            )}
            {isAuthenticated && (
              <TopActionButton type="button" onClick={handleLogout} aria-label="Logout">
                <LogOut size={14} />
                Logout
              </TopActionButton>
            )}
            <BurgerButton type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
              {'\u2630'}
            </BurgerButton>
          </TopBarActions>
        </TopBar>

        <MainContent>
          <ContentInner>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/tournaments/:id" element={<TournamentDetailsPage />} />
              <Route path="/tournament/:id" element={<TournamentDetailsPage />} />
              <Route path="/games/:game" element={<GameHubPage />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/rankings" element={<Rankings />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/prizes" element={<Prizes />} />
              <Route path="/rewards" element={<Prizes />} />
              <Route path="/news" element={<News />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile/:id" element={<PublicProfilePage />} />
              <Route path="/user/:id" element={<PublicProfilePage />} />
              <Route path="/team/:id" element={<TeamPage />} />
              <Route path="/teams/:id" element={<TeamPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/admin" element={<AdminRoute />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/admin-access" element={<AdminAccessPage />} />
              <Route path="/control-access" element={<AdminAccessPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ContentInner>
        </MainContent>

        <Footer>
          <p>{'\u00A9'} 2024 WAY ESPORTS. All rights reserved.</p>
          <p>Powered by Professional Gaming Technology</p>
        </Footer>
      </ContentColumn>

      <MobileMenuOverlay $open={mobileMenuOpen} onClick={closeMobileMenu}>
        <MobileMenuPanel onClick={(e) => e.stopPropagation()}>
          <MobileMenuHeader>
            <MobileMenuTitle>{t('menu')}</MobileMenuTitle>
            <CloseButton type="button" onClick={closeMobileMenu} aria-label="Close menu">
              {'\u2715'}
            </CloseButton>
          </MobileMenuHeader>

          {navItems.filter((item) => !item.adminOnly || hasAdminAccess).map((item) => (
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
          {hasAdminAccess && (
            <MobileMenuActionButton type="button" onClick={() => { closeMobileMenu(); navigate('/admin'); }}>
              Control
            </MobileMenuActionButton>
          )}
        </MobileMenuPanel>
      </MobileMenuOverlay>

      <BottomNav>
        {navItems.filter((item) => !item.adminOnly || hasAdminAccess).map((item) => (
          <BottomNavItem key={item.to} to={item.to} $active={isActive(item.to)}>
            <BottomNavIcon>{item.icon}</BottomNavIcon>
            {item.label}
          </BottomNavItem>
        ))}
      </BottomNav>
    </AppShell>
  );
};

const AdminRoute: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const hasAdminAccess = isAuthenticated && (user?.role === 'admin' || user?.role === 'developer');

  if (isLoading) {
    return null;
  }

  if (!hasAdminAccess) {
    return <Navigate to="/control-access" replace />;
  }

  return <AdminPage />;
};

const ThemeShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDarkMode } = useApp();
  const activeTheme = React.useMemo(() => (isDarkMode ? darkTheme : lightTheme), [isDarkMode]);

  return (
    <ThemeProvider theme={activeTheme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <ThemeShell>
        <AuthProvider>
          <NotificationProvider>
            <LanguageProvider>
              <TermsGuard>
                <BrowserRouter>
                  <AppContent />
                </BrowserRouter>
              </TermsGuard>
            </LanguageProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeShell>
    </AppProvider>
  );
};

export default App;



