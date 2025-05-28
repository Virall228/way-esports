import React from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Trophy, User, Newspaper } from 'react-feather';

const NavContainer = styled.nav`
  background: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
`;

const NavList = styled.ul`
  list-style: none;
  display: flex;
  justify-content: space-around;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
`;

interface NavItemProps {
  isActive: boolean;
}

const NavItem = styled.li<NavItemProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  color: ${({ theme, isActive }) => 
    isActive ? theme.colors.primary : theme.colors.text.secondary};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
  }

  svg {
    width: 24px;
    height: 24px;
    margin-bottom: ${({ theme }) => theme.spacing.xs};
  }
`;

const NavText = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
`;

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/tournaments', icon: Trophy, label: 'Tournaments' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/news', icon: Newspaper, label: 'News' },
  ];

  return (
    <NavContainer>
      <NavList>
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavItem
            key={path}
            isActive={location.pathname === path}
            onClick={() => navigate(path)}
          >
            <Icon />
            <NavText>{label}</NavText>
          </NavItem>
        ))}
      </NavList>
    </NavContainer>
  );
};

export default Navigation; 