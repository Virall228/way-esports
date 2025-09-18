import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: #2a2a2a;
  border-bottom: 2px solid #ff6b00;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  z-index: 1000;
`;

const Logo = styled(Link)`
  font-size: 1.8rem;
  font-weight: bold;
  color: #ff6b00;
  text-decoration: none;
  letter-spacing: 2px;
  
  &:hover {
    color: #ff4757;
  }
`;

const Navigation = styled.nav`
  display: flex;
  gap: 40px;
  align-items: center;
`;

const NavLink = styled(Link)<{ $active?: boolean }>`
  color: ${({ $active }) => $active ? '#ff6b00' : '#cccccc'};
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  transition: color 0.3s ease;
  position: relative;
  
  &:hover {
    color: #ff6b00;
  }
  
  ${({ $active }) => $active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      right: 0;
      height: 2px;
      background: #ff6b00;
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
        <SearchButton>🔍</SearchButton>
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;