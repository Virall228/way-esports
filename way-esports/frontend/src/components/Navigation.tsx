import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const NavContainer = styled.nav`
    display: flex;
    justify-content: space-around;
    align-items: center;
    background-color: #2a2a2a;
    padding: 15px;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
`;

const NavButton = styled.button<{ $active: boolean }>`
    background: ${props => props.$active ? '#FF6B00' : 'transparent'};
    border: none;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        background: ${props => props.active ? '#FF6B00' : '#3a3a3a'};
    }

    &:active {
        transform: scale(0.95);
    }
`;

const Navigation: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <NavContainer>
            <NavButton 
                $active={isActive('/')} 
                onClick={() => navigate('/')}
            >
                Home
            </NavButton>
            <NavButton 
                $active={isActive('/tournaments')} 
                onClick={() => navigate('/tournaments')}
            >
                Tournaments
            </NavButton>
            <NavButton 
                $active={isActive('/profile')} 
                onClick={() => navigate('/profile')}
            >
                Profile
            </NavButton>
        </NavContainer>
    );
};

export default Navigation; 