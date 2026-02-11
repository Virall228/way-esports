import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import SearchComponent from '../Search';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%); */
  position: relative;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 25%, #ff6b00 50%, #ff4757 75%, #1a1a1a 100%);
  color: #ffffff;
  box-shadow: 0 4px 20px rgba(255, 107, 0, 0.3), 0 0 40px rgba(255, 71, 87, 0.2);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #ff6b00, #ff4757, #808080, #ff6b00);
    background-size: 400% 400%;
    animation: headerGradient 4s ease infinite;
    opacity: 0.1;
    z-index: 0;
  }
  
  @keyframes headerGradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

const HeaderLogo = styled.h1<{ $isHomePage: boolean }>`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  background: ${({ $isHomePage }) =>
    $isHomePage
      ? 'linear-gradient(135deg, #ff6b00 0%, #ff4757 25%, #808080 50%, #ff6b00 75%, #ff4757 100%)'
      : 'linear-gradient(135deg, #ff6b00 0%, #ff4757 25%, #808080 50%, #ff6b00 75%, #ff4757 100%)'
  };
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: ${({ $isHomePage }) =>
    $isHomePage
      ? '0 0 15px rgba(255, 107, 0, 0.5), 0 0 30px rgba(255, 71, 87, 0.3)'
      : '0 0 15px rgba(255, 107, 0, 0.5), 0 0 30px rgba(255, 71, 87, 0.3)'
  };
  letter-spacing: 3px;
  text-transform: uppercase;
  position: relative;
  display: flex;
  flex-direction: row;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(135deg, #ff6b00, #ff4757, #808080, #ff6b00);
    background-size: 400% 400%;
    animation: gradientShift 3s ease infinite;
    z-index: -1;
    border-radius: 4px;
    opacity: 0.3;
  }
  
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

const SearchToggle = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  color: #ffffff;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 18px;
  }
`;

const SearchOverlay = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 100px;
  opacity: ${({ $isVisible }) => $isVisible ? 1 : 0};
  visibility: ${({ $isVisible }) => $isVisible ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
`;

const SearchContainer = styled.div`
  width: 90%;
  max-width: 600px;
  position: relative;
`;

const Content = styled.main`
  flex: 1;
  padding: 1rem;
`;

const Navigation = styled.nav<{ $isVisible: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 25%, #ff6b00 50%, #ff4757 75%, #1a1a1a 100%);
  padding: 0.8rem 0.5rem;
  display: flex;
  justify-content: space-around;
  z-index: 1000;
  transform: translateY(${({ $isVisible }) => $isVisible ? '0' : '100%'});
  transition: transform 0.3s ease-in-out;
  box-shadow: 0 -4px 20px rgba(255, 107, 0, 0.3), 0 0 40px rgba(255, 71, 87, 0.2);
  position: relative;
  
  /* Desktop: always show navigation */
  @media (min-width: 769px) {
    transform: translateY(0) !important;
    opacity: 1 !important;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #ff6b00, #ff4757, #808080, #ff6b00);
    background-size: 400% 400%;
    animation: navGradient 4s ease infinite;
    opacity: 0.1;
    z-index: 0;
  }
  
  @keyframes navGradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

const NavButton = styled.button<{ $active?: boolean }>`
  background: ${({ $active }) => $active
    ? 'linear-gradient(135deg, rgba(255, 107, 0, 0.2), rgba(255, 71, 87, 0.2))'
    : 'transparent'
  };
  border: 1px solid ${({ $active }) => $active
    ? 'rgba(255, 215, 0, 0.5)'
    : 'transparent'
  };
  border-radius: 8px;
  color: ${({ $active }) => $active ? '#ffd700' : '#ffffff'};
  padding: 0.8rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    color: #ffd700;
    transform: translateY(-3px);
    background: linear-gradient(135deg, rgba(255, 107, 0, 0.1), rgba(255, 71, 87, 0.1));
    border-color: rgba(255, 215, 0, 0.3);
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.2);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #ff6b00, #ff4757, #808080, #ff6b00);
    background-size: 400% 400%;
    animation: buttonGlow 3s ease infinite;
    opacity: 0;
    border-radius: 8px;
    z-index: -1;
    transition: opacity 0.3s ease;
  }

  &:hover::before {
    opacity: 0.1;
  }

  @keyframes buttonGlow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 3px;
    background: linear-gradient(90deg, #ff6b00, #ffd700, #ff4757);
    transition: all 0.3s ease;
    transform: translateX(-50%);
    border-radius: 2px;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }

  &:hover::after {
    width: 80%;
  }

  ${({ $active }) => $active && `
    &::before {
      opacity: 0.15;
    }
    
    &::after {
      width: 80%;
    }
    
    box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
  `}
`;

const NavButtonMemo = React.memo<{
  $active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}>(({ $active, onClick, children }) => (
  <NavButton $active={$active} onClick={onClick}>
    {children}
  </NavButton>
));

NavButtonMemo.displayName = 'NavButtonMemo';

const BackgroundImage = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -2;
  background: url('images/abs.png.jpg') center/cover no-repeat;
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(10, 10, 10, 0.65); /* dark overlay */
    z-index: 1;
  }
`;

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const isHomePage = useMemo(() => location.pathname === '/', [location.pathname]);
  const isTournamentsPage = useMemo(() => location.pathname.startsWith('/tournaments'), [location.pathname]);

  // Extract handleScroll for stable reference
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;

    // Show navigation when scrolling up or near the top
    if (currentScrollY < lastScrollY || currentScrollY < 100) {
      setIsNavVisible(true);
    }
    // Hide navigation when scrolling down (after 100px)
    else if (currentScrollY > lastScrollY && currentScrollY > 100) {
      setIsNavVisible(false);
    }

    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  useEffect(() => {
    // Throttling for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initialize on page load
    const initialScrollY = window.scrollY;
    if (initialScrollY > 100) {
      setIsNavVisible(false);
    }

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [handleScroll]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleNavigation = useCallback((path: string) => {
    console.log('Navigating to:', path);
    // Vibrate on profile and wallet
    if (path === '/profile' || path === '/wallet') {
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    }
    navigate(path);
  }, [navigate]);

  const handleSearchResult = useCallback((result: any) => {
    console.log('Search result selected:', result);
    setIsSearchOpen(false);
    // Handle navigation based on result type
    if (result.type === 'player') {
      navigate(`/profile/${result.id}`);
    } else if (result.type === 'team') {
      navigate(`/teams/${result.id}`);
    } else if (result.type === 'tournament') {
      navigate(`/tournaments/${result.id}`);
    }
  }, [navigate]);

  return (
    <>
      {/* Show background image except on Home and Tournaments pages */}
      {!(isHomePage || isTournamentsPage) && <BackgroundImage />}
      <LayoutContainer>
        <Header>
          <HeaderLogo $isHomePage={isHomePage}>
            WAY&nbsp;Esports
          </HeaderLogo>
          <SearchToggle onClick={() => setIsSearchOpen(true)} className="touch-target">
            {'\u{1F50D}'}
          </SearchToggle>
        </Header>
        <Content>
          {children}
        </Content>
        <Navigation $isVisible={isNavVisible}>
          <NavButtonMemo
            $active={location.pathname === '/'}
            onClick={() => handleNavigation('/')}
          >
            {'\u{1F3E0}'} Home
          </NavButtonMemo>
          <NavButtonMemo
            $active={location.pathname === '/tournaments'}
            onClick={() => handleNavigation('/tournaments')}
          >
            {'\u{1F3C6}'} Tournaments
          </NavButtonMemo>
          <NavButtonMemo
            $active={location.pathname === '/teams'}
            onClick={() => handleNavigation('/teams')}
          >
            {'\u{1F465}'} WAY Ranked
          </NavButtonMemo>
          <NavButtonMemo
            $active={location.pathname === '/news'}
            onClick={() => handleNavigation('/news')}
          >
            {'\u{1F4F0}'} News
          </NavButtonMemo>
          <NavButtonMemo
            $active={location.pathname === '/rewards'}
            onClick={() => handleNavigation('/rewards')}
          >
            {'\u{1F3C5}'} Rewards
          </NavButtonMemo>
          <NavButtonMemo
            $active={location.pathname === '/profile'}
            onClick={() => handleNavigation('/profile')}
          >
            {'\u{1F464}'} Profile
          </NavButtonMemo>
        </Navigation>
        <SearchOverlay $isVisible={isSearchOpen} onClick={() => setIsSearchOpen(false)}>
          <SearchContainer onClick={(e) => e.stopPropagation()}>
            <SearchComponent
              onResultSelect={handleSearchResult}
              placeholder="Search players, teams, tournaments..."
            />
          </SearchContainer>
        </SearchOverlay>
      </LayoutContainer>
    </>
  );
};

export default MainLayout; 
