import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const NavContainer = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: ${({ theme }) => theme.spacing.lg} 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: none;
  }
`;

const Logo = styled.div`
  padding: 0 ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const LogoImage = styled.img`
  width: 160px;
  height: auto;
`;

const NavMenu = styled.nav`
  flex: 1;
`;

const NavItem = styled(Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.text};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  transition: all ${({ theme }) => theme.transitions.medium};
  border-left: 3px solid ${({ $active, theme }) => $active ? theme.colors.primary : 'transparent'};

  &:hover {
    background: ${({ theme }) => `rgba(${theme.colors.primary}, 0.1)`};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const UserSection = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const WalletBalance = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.secondary} 100%);
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  color: ${({ theme }) => theme.colors.background};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.surface};
  border: 2px solid ${({ theme }) => theme.colors.primary};
`;

const Navigation: React.FC = () => {
  const location = useLocation();
  const [balance] = useState("1,250 WAY");

  return (
    <NavContainer>
      <Logo>
        <LogoImage src="/images/way-esports-logo.png" alt="WAY Esports" />
      </Logo>
      <NavMenu>
        <NavItem to="/" $active={location.pathname === '/'}>
          🏠 Home
        </NavItem>
        <NavItem to="/tournaments" $active={location.pathname.includes('/tournaments')}>
          🏆 Tournaments
        </NavItem>
        <NavItem to="/matches" $active={location.pathname.includes('/matches')}>
          ⚔️ Matches
        </NavItem>
        <NavItem to="/rankings" $active={location.pathname.includes('/rankings')}>
          📊 Rankings
        </NavItem>
        <NavItem to="/teams" $active={location.pathname.includes('/teams')}>
          👥 Teams
        </NavItem>
        <NavItem to="/news" $active={location.pathname.includes('/news')}>
          📰 News
        </NavItem>
        <NavItem to="/wallet" $active={location.pathname.includes('/wallet')}>
          💳 Wallet
        </NavItem>
        <NavItem to="/settings" $active={location.pathname.includes('/settings')}>
          ⚙️ Settings
        </NavItem>
      </NavMenu>
      <UserSection>
        <WalletBalance>{balance}</WalletBalance>
        <UserAvatar />
      </UserSection>
    </NavContainer>
  );
};

export default Navigation; 