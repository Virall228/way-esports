import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import styled, { ThemeProvider, keyframes } from 'styled-components';
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

// Import components
import TermsGuard from './components/Legal/TermsGuard';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { api } from './services/api';

const Home = React.lazy(() => import('./pages/Home'));
const Tournaments = React.lazy(() => import('./pages/Tournaments'));
const Profile = React.lazy(() => import('./pages/Profile'));
const News = React.lazy(() => import('./pages/News'));
const Teams = React.lazy(() => import('./pages/Teams'));
const Rankings = React.lazy(() => import('./pages/Rankings'));
const Prizes = React.lazy(() => import('./pages/Prizes'));
const Matches = React.lazy(() => import('./pages/Matches'));
const Wallet = React.lazy(() => import('./pages/Wallet'));
const Settings = React.lazy(() => import('./pages/Settings'));
const AnalyticsPage = React.lazy(() => import('./pages/Analytics/AnalyticsPage'));
const AdminPage = React.lazy(() => import('./pages/Admin/AdminPage'));
const AdminAccessPage = React.lazy(() => import('./pages/Admin/AdminAccessPage'));
const AdminOcrPage = React.lazy(() => import('./pages/Admin/AdminOcrPage'));
const AuthPage = React.lazy(() => import('./pages/Auth/AuthPage'));
const TournamentDetailsPage = React.lazy(() => import('./pages/Tournaments/TournamentDetailsPage'));
const BillingPage = React.lazy(() => import('./pages/Billing/BillingPage'));
const PublicProfilePage = React.lazy(() => import('./pages/Profile/PublicProfilePage'));
const TeamPage = React.lazy(() => import('./pages/Teams/TeamPage'));
const GameHubPage = React.lazy(() => import('./pages/Games/GameHubPage'));
const ScoutHubPage = React.lazy(() => import('./pages/ScoutHub/ScoutHubPage'));
const PublicScoutProfilePage = React.lazy(() => import('./pages/ScoutHub/PublicScoutProfilePage'));
const NewsDetail = React.lazy(() => import('./components/News/NewsDetail'));
const PublicLandingPage = React.lazy(() => import('./pages/PublicLanding'));

type NavItem = {
  label: string;
  to: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

const shellGlow = keyframes`
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.58;
  }
  50% {
    transform: translate3d(1.5%, -2%, 0) scale(1.08);
    opacity: 0.8;
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.58;
  }
`;

const routeReveal = keyframes`
  0% {
    opacity: 0;
    transform: translate3d(0, 14px, 0) scale(0.992);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
`;

const loaderSweep = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const AppShell = styled.div`
  height: var(--app-height, 100vh);
  min-height: var(--app-height, 100vh);
  background:
    ${({ theme }) =>
      theme.isLight
        ? 'radial-gradient(900px 600px at 10% -10%, rgba(255, 214, 170, 0.34), transparent 60%), radial-gradient(800px 500px at 90% -20%, rgba(255, 242, 224, 0.9), transparent 58%), radial-gradient(760px 520px at 85% 110%, rgba(201, 106, 22, 0.12), transparent 60%),'
        : 'radial-gradient(900px 600px at 10% -10%, rgba(245, 154, 74, 0.12), transparent 58%), radial-gradient(860px 560px at 90% -20%, rgba(255, 255, 255, 0.04), transparent 60%), radial-gradient(620px 420px at 84% 110%, rgba(255, 255, 255, 0.03), transparent 62%),'}
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
  position: relative;
  isolation: isolate;
`;

const ShellGlow = styled.div<{ $position: 'left' | 'right' }>`
  position: fixed;
  top: ${({ $position }) => ($position === 'left' ? '14%' : '52%')};
  ${({ $position }) => ($position === 'left' ? 'left: -12rem;' : 'right: -14rem;')}
  width: clamp(18rem, 34vw, 30rem);
  height: clamp(18rem, 34vw, 30rem);
  border-radius: 999px;
  background: ${({ $position }) =>
    $position === 'left'
      ? 'radial-gradient(circle, rgba(245, 154, 74, 0.18) 0%, rgba(245, 154, 74, 0.06) 38%, transparent 68%)'
      : 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 36%, transparent 70%)'};
  filter: blur(18px);
  pointer-events: none;
  z-index: -1;
  animation: ${shellGlow} 20s ease-in-out infinite;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    opacity: 0.58;
    width: 16rem;
    height: 16rem;
  }
`;

const Sidebar = styled.aside`
  display: none;
  width: clamp(250px, 21vw, 300px);
  min-width: clamp(230px, 19vw, 270px);
  padding: 1.4rem 1rem 1.5rem;
  background: ${({ theme }) =>
    theme.isLight
      ? theme.colors.glass.panel
      : 'linear-gradient(180deg, rgba(9, 12, 16, 0.92) 0%, rgba(4, 6, 8, 0.98) 100%)'};
  border-right: 1px solid ${({ theme }) => theme.colors.border.light};
  backdrop-filter: blur(18px);
  box-shadow: ${({ theme }) => (theme.isLight ? 'none' : '22px 0 54px rgba(0, 0, 0, 0.22)')};
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
  align-items: center;
  min-height: 52px;
  padding: 0.15rem 0.2rem 0.95rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const Logo = styled.div`
  font-family: ${({ theme }) => theme.fonts.brand || theme.fonts.title};
  font-size: clamp(0.95rem, 3vw, 1.15rem);
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: clamp(1px, 0.4vw, 2.5px);
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.primary};
  text-shadow: 0 0 24px rgba(245, 154, 74, 0.12);
`;

const SidebarNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-top: 1.1rem;
`;

const NavItemLink = styled(Link) <{ $active?: boolean; $compact?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: ${({ $compact }) => ($compact ? '0.7rem 0.85rem' : '0.9rem 1rem')};
  border-radius: 16px;
  text-decoration: none;
  color: ${({ $active, theme }) => ($active ? theme.colors.text.primary : theme.colors.text.secondary)};
  background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.07)' : 'transparent')};
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.border.accent : 'transparent')};
  transition: all ${({ theme }) => theme.transitions.fast};
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 10px auto 10px 0;
    width: 3px;
    border-radius: 0 999px 999px 0;
    background: ${({ $active, theme }) => ($active ? theme.colors.accent : 'transparent')};
    box-shadow: ${({ $active }) => ($active ? '0 0 16px rgba(245, 154, 74, 0.42)' : 'none')};
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ theme }) => theme.colors.glass.panelHover};
      color: ${({ theme }) => theme.colors.text.primary};
      border-color: ${({ theme }) => theme.colors.border.light};
      transform: translateY(-1px);
      box-shadow: ${({ theme }) => (theme.isLight ? theme.shadows.small : '0 16px 30px rgba(0, 0, 0, 0.2)')};
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
  font-size: 0.9rem;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.01em;
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
  padding: calc(0.8rem + var(--sat)) 1rem 0.8rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: ${({ theme }) =>
    theme.isLight
      ? theme.colors.glass.bar
      : 'linear-gradient(180deg, rgba(8, 10, 13, 0.92) 0%, rgba(8, 10, 13, 0.82) 100%)'};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
  backdrop-filter: blur(18px);

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 0.9rem 1.5rem;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    padding: 1rem 2rem;
  }
`;

const TopBarTitle = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
`;

const TopBarPageTitle = styled.h1`
  margin: 0;
  font-size: clamp(1rem, 2vw, 1.35rem);
  line-height: 1.1;
  letter-spacing: 0.01em;
`;

const BurgerButton = styled.button`
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
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
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: ${({ theme }) => theme.colors.glass.panel};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.8rem;
  letter-spacing: 0.03em;

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
    padding: 1.35rem 1.75rem 2rem;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    padding: 1.6rem 2.1rem 2.4rem;
  }
`;

const ContentInner = styled.div`
  width: min(100%, 1480px);
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
`;

const RouteStage = styled.div`
  display: grid;
  gap: 1rem;
  animation: ${routeReveal} 360ms cubic-bezier(0.22, 1, 0.36, 1);
`;

const Footer = styled.footer`
  background: ${({ theme }) =>
    theme.isLight
      ? theme.colors.glass.bar
      : 'linear-gradient(180deg, rgba(8, 10, 13, 0.96) 0%, rgba(6, 8, 11, 0.98) 100%)'};
  border-top: 1px solid ${({ theme }) => theme.colors.border.light};
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
  gap: 8px;
  padding: 10px calc(10px + var(--sar)) calc(10px + var(--sab, 0px)) calc(10px + var(--sal));
  background: ${({ theme }) => theme.colors.glass.bar};
  border-top: 1px solid ${({ theme }) => theme.colors.border.light};
  backdrop-filter: blur(18px);
  overflow-x: auto;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: none;
  }
`;

const BottomNavItem = styled(Link) <{ $active?: boolean }>`
  flex: 0 0 auto;
  min-width: 68px;
  min-height: 48px;
  border-radius: 16px;
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.border.accent : 'transparent')};
  background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.06)' : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.text.primary : theme.colors.text.secondary)};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 10px;
  letter-spacing: 0.04em;
  text-decoration: none;
  box-shadow: ${({ $active, theme }) => ($active && !theme.isLight ? '0 16px 28px rgba(0, 0, 0, 0.22)' : 'none')};
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

const RouteLoader = styled.div`
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  border-radius: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: ${({ theme }) => theme.colors.glass.panel};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: ${({ theme }) => theme.fonts.accent};
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const LoaderOrb = styled.div`
  position: relative;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.025);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);

  &::before {
    content: '';
    position: absolute;
    inset: 5px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.08);
    border-top-color: rgba(255, 255, 255, 0.92);
    border-right-color: rgba(255, 255, 255, 0.34);
    animation: ${loaderSweep} 0.82s linear infinite;
  }
`;

const LoaderCaption = styled.div`
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 0.74rem;
  letter-spacing: 0.1em;
`;

const renderLazyRoute = (element: React.ReactNode) => (
  <React.Suspense
    fallback={
      <RouteLoader>
        <LoaderOrb />
        <div>Loading page...</div>
        <LoaderCaption>Preparing the next scene</LoaderCaption>
      </RouteLoader>
    }
  >
    {element}
  </React.Suspense>
);

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
  background: ${({ theme }) =>
    theme.isLight
      ? theme.colors.glass.panel
      : 'linear-gradient(180deg, rgba(8, 10, 13, 0.98) 0%, rgba(4, 5, 7, 1) 100%)'};
  border-right: 1px solid ${({ theme }) => theme.colors.border.light};
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 26px 0 64px rgba(0, 0, 0, 0.3);
`;

const MobileMenuHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MobileMenuTitle = styled.div`
  font-family: ${({ theme }) => theme.fonts.accent};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.05em;
`;

const CloseButton = styled.button`
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
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
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: ${({ theme }) => theme.colors.glass.panel};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.accent};
  font-size: 0.88rem;
  letter-spacing: 0.02em;
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
  const hasScoutHubAccess = React.useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'developer') return true;
    if (!user.isSubscribed) return false;
    if (!user.subscriptionExpiresAt) return true;
    const expiresAt = new Date(user.subscriptionExpiresAt).getTime();
    return Number.isNaN(expiresAt) || expiresAt > Date.now();
  }, [user]);

  const handleLogout = React.useCallback(() => {
    logout();
    closeMobileMenu();
    navigate('/');
  }, [logout, navigate]);

  const handleLogin = React.useCallback(() => {
    closeMobileMenu();
    navigate('/auth');
  }, [navigate]);

  React.useEffect(() => {
    const onHotkey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey && event.shiftKey)) return;
      if (event.key.toLowerCase() !== 'a') return;
      event.preventDefault();
      navigate('/control-access');
    };

    window.addEventListener('keydown', onHotkey);
    return () => window.removeEventListener('keydown', onHotkey);
  }, [navigate]);

  const navItems = React.useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { label: t('home'), to: '/', icon: <HomeIcon {...iconProps} /> },
      { label: t('tournaments'), to: '/tournaments', icon: <Award {...iconProps} /> },
      { label: t('teams'), to: '/teams', icon: <Users {...iconProps} /> },
      { label: t('rankings'), to: '/rankings', icon: <BarChart2 {...iconProps} /> },
      { label: t('matches'), to: '/matches', icon: <Crosshair {...iconProps} /> },
      { label: t('prizes'), to: '/prizes', icon: <Gift {...iconProps} /> },
      { label: t('news'), to: '/news', icon: <FileText {...iconProps} /> }
    ];

    if (isAuthenticated) {
      items.push(
        { label: t('wallet'), to: '/wallet', icon: <CreditCard {...iconProps} /> },
        { label: t('profile'), to: '/profile', icon: <User {...iconProps} /> },
        { label: 'Analytics', to: '/analytics', icon: <BarChart2 {...iconProps} /> },
        { label: t('settings'), to: '/settings', icon: <SettingsIcon {...iconProps} /> }
      );

      if (hasScoutHubAccess) {
        items.splice(items.length - 2, 0, { label: 'Scout Hub', to: '/scout-hub', icon: <Crosshair {...iconProps} /> });
      }
    }

    if (hasAdminAccess) {
      items.push({ label: 'Control', to: '/admin', icon: <Shield {...iconProps} />, adminOnly: true });
      items.push({ label: 'OCR', to: '/admin/ocr', icon: <Shield {...iconProps} />, adminOnly: true });
    }

    return items;
  }, [hasAdminAccess, hasScoutHubAccess, iconProps, isAuthenticated, t]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const currentSectionTitle = React.useMemo(() => {
    if (location.pathname.startsWith('/tournaments/')) return 'Tournament Details';
    if (location.pathname.startsWith('/teams/')) return 'Team Profile';
    if (location.pathname.startsWith('/profile/')) return 'Player Profile';
    if (location.pathname.startsWith('/news/')) return 'News Detail';
    if (location.pathname.startsWith('/games/')) return 'Game Hub';
    if (location.pathname.startsWith('/scouts/')) return 'Scout Profile';

    return navItems.find((item) => isActive(item.to))?.label || 'WAY Esports';
  }, [location.pathname, navItems]);

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
      <ShellGlow $position="left" />
      <ShellGlow $position="right" />
      <Sidebar>
        <SidebarBrand>
          <Logo>WAY ESPORTS</Logo>
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
            <TopBarPageTitle>{currentSectionTitle}</TopBarPageTitle>
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
            <RouteStage key={location.pathname}>
            <Routes>
              <Route path="/" element={renderLazyRoute(isAuthenticated ? <Home /> : <PublicLandingPage />)} />
              <Route path="/tournaments" element={renderLazyRoute(<Tournaments />)} />
              <Route path="/tournaments/:id" element={renderLazyRoute(<TournamentDetailsPage />)} />
              <Route path="/tournament/:id" element={renderLazyRoute(<TournamentDetailsPage />)} />
              <Route path="/games/:game" element={renderLazyRoute(<GameHubPage />)} />
              <Route path="/teams" element={renderLazyRoute(<Teams />)} />
              <Route path="/rankings" element={renderLazyRoute(<Rankings />)} />
              <Route path="/matches" element={renderLazyRoute(<Matches />)} />
              <Route path="/prizes" element={renderLazyRoute(<Prizes />)} />
              <Route path="/rewards" element={renderLazyRoute(<Prizes />)} />
              <Route path="/news" element={renderLazyRoute(<News />)} />
              <Route path="/news/category/:category" element={renderLazyRoute(<News />)} />
              <Route path="/news/:id" element={renderLazyRoute(<NewsDetail />)} />
              <Route path="/wallet" element={renderLazyRoute(<RequireAuth><Wallet /></RequireAuth>)} />
              <Route path="/profile" element={renderLazyRoute(<RequireAuth><Profile /></RequireAuth>)} />
              <Route path="/scout-hub" element={renderLazyRoute(<RequireScoutHubAccess><ScoutHubPage /></RequireScoutHubAccess>)} />
              <Route path="/analytics" element={renderLazyRoute(<RequireAuth><AnalyticsPage /></RequireAuth>)} />
              <Route path="/settings" element={renderLazyRoute(<RequireAuth><Settings /></RequireAuth>)} />
              <Route path="/profile/:id" element={renderLazyRoute(<PublicProfilePage />)} />
              <Route path="/user/:id" element={renderLazyRoute(<PublicProfilePage />)} />
              <Route path="/scouts/:identifier" element={renderLazyRoute(<PublicScoutProfilePage />)} />
              <Route path="/team/:id" element={renderLazyRoute(<TeamPage />)} />
              <Route path="/teams/:id" element={renderLazyRoute(<TeamPage />)} />
              <Route path="/billing" element={renderLazyRoute(<BillingPage />)} />
              <Route path="/admin" element={<AdminRoute />} />
              <Route path="/admin/ocr" element={<AdminOcrRoute />} />
              <Route path="/auth" element={isAuthenticated ? <Navigate to="/" replace /> : renderLazyRoute(<AuthPage />)} />
              <Route path="/admin-access" element={renderLazyRoute(<AdminAccessPage />)} />
              <Route path="/control-access" element={renderLazyRoute(<AdminAccessPage />)} />
              <Route path="/control" element={<Navigate to="/control-access" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </RouteStage>
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

  return renderLazyRoute(<AdminPage />);
};

const AdminOcrRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const hasAdminAccess = isAuthenticated && (user?.role === 'admin' || user?.role === 'developer');

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (!hasAdminAccess) {
    return <Navigate to="/control-access" replace />;
  }

  return renderLazyRoute(<AdminOcrPage />);
};

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

const RequireScoutHubAccess: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const isPrivileged = user?.role === 'admin' || user?.role === 'developer';
  const hasActiveSubscription = Boolean(
    user?.isSubscribed && (
      !user?.subscriptionExpiresAt ||
      Number.isNaN(new Date(user.subscriptionExpiresAt).getTime()) ||
      new Date(user.subscriptionExpiresAt).getTime() > Date.now()
    )
  );

  if (!isPrivileged && !hasActiveSubscription) {
    return <Navigate to="/billing" replace />;
  }

  return children;
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



