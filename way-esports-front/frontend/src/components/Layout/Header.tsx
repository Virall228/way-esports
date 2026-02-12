import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled, { css } from 'styled-components';

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: ${({ theme }) => theme.colors.bg.secondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.medium};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  z-index: 1000;
`;

const Logo = styled(Link)`
  font-size: 1.8rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: none;
  letter-spacing: 2px;
  
  &:hover { color: ${({ theme }) => theme.colors.text.primary}; opacity: 0.9; }
`;

const Navigation = styled.nav`
  display: flex;
  gap: 40px;
  align-items: center;
`;

const NavLink = styled(Link)<{ $active?: boolean }>`
  color: ${({ $active, theme }) => $active ? theme.colors.text.primary : theme.colors.text.secondary};
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  transition: color 0.3s ease;
  position: relative;
  
  &:hover { color: ${({ theme }) => theme.colors.text.primary}; }
  
  ${({ $active, theme }) => $active && css`
    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      right: 0;
      height: 2px;
      background: ${theme.colors.border.strong};
    }
  `}
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const SearchButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #cccccc;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
  }
`;

const Header: React.FC = () => {
  const location = useLocation();

  return (
    <HeaderContainer>
      <Logo to="/">WAY ESPORTS</Logo>
      
      <Navigation>
        <NavLink to="/" $active={location.pathname === '/'}>
          Home
        </NavLink>
        <NavLink to="/tournaments" $active={location.pathname.includes('/tournaments')}>
          Tournaments
        </NavLink>
        <NavLink to="/teams" $active={location.pathname.includes('/teams')}>
          Teams
        </NavLink>
        <NavLink to="/profile" $active={location.pathname.includes('/profile')}>
          Profile
        </NavLink>
        <NavLink to="/news" $active={location.pathname.includes('/news')}>
          News
        </NavLink>
      </Navigation>
      
      <RightSection>
        <SearchButton>{'\u{1F50D}'}</SearchButton>
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;
