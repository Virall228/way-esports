import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useLanguage } from '../contexts/LanguageContext';

const glowPulse = keyframes`
    0% { box-shadow: 0 0 5px #FF6B00, 0 0 10px #FF6B00, 0 0 15px #FF6B00; }
    50% { box-shadow: 0 0 10px #FF6B00, 0 0 20px #FF6B00, 0 0 30px #FF6B00; }
    100% { box-shadow: 0 0 5px #FF6B00, 0 0 10px #FF6B00, 0 0 15px #FF6B00; }
`;

const borderAnimation = keyframes`
    0% { clip-path: inset(0 0 98% 0); }
    25% { clip-path: inset(0 98% 0 0); }
    50% { clip-path: inset(98% 0 0 0); }
    75% { clip-path: inset(0 0 0 98%); }
    100% { clip-path: inset(0 0 98% 0); }
`;

const SwitcherContainer = styled.div`
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    gap: 12px;
    padding: 4px;
    background: rgba(26, 26, 26, 0.8);
    border-radius: 8px;
    backdrop-filter: blur(5px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);

    &::before {
        content: '';
        position: absolute;
        top: -1px;
        left: -1px;
        right: -1px;
        bottom: -1px;
        background: linear-gradient(45deg, #FF6B00, #ff8533, #FF6B00);
        border-radius: 9px;
        z-index: -1;
        animation: ${borderAnimation} 4s linear infinite;
    }
`;

const ButtonWrapper = styled.div`
    position: relative;
    overflow: hidden;
    border-radius: 6px;

    &::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(45deg, #FF6B00, #ff8533);
        z-index: -1;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    &:hover::before {
        opacity: 1;
    }
`;

const LanguageButton = styled.button<{ active: boolean }>`
    background-color: ${props => props.active ? '#FF6B00' : '#2a2a2a'};
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 1px;
    transition: all 0.3s ease;
    position: relative;
    text-shadow: ${props => props.active ? '0 0 10px rgba(255, 107, 0, 0.5)' : 'none'};
    
    ${props => props.active && `
        animation: ${glowPulse} 2s infinite;
    `}

    &:hover {
        background-color: ${props => props.active ? '#ff8533' : '#3a3a3a'};
        transform: translateY(-2px);
    }

    &:active {
        transform: translateY(0);
    }

    &::after {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(45deg, #FF6B00, #ff8533);
        z-index: -1;
        opacity: ${props => props.active ? 0.3 : 0};
        transition: opacity 0.3s ease;
        border-radius: 8px;
    }
`;

const HexagonDecoration = styled.div`
    position: absolute;
    width: 30px;
    height: 30px;
    opacity: 0.1;
    border: 2px solid #FF6B00;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
`;

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <SwitcherContainer>
            <HexagonDecoration style={{ top: -15, left: -15 }} />
            <HexagonDecoration style={{ bottom: -15, right: -15 }} />
            <ButtonWrapper>
                <LanguageButton
                    active={language === 'en'}
                    onClick={() => setLanguage('en')}
                >
                    ENG
                </LanguageButton>
            </ButtonWrapper>
            <ButtonWrapper>
                <LanguageButton
                    active={language === 'ru'}
                    onClick={() => setLanguage('ru')}
                >
                    RUS
                </LanguageButton>
            </ButtonWrapper>
        </SwitcherContainer>
    );
};

export default LanguageSwitcher; 