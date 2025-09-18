import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const slideUp = keyframes`
    from {
        transform: translateY(20px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
`;

const pulse = keyframes`
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
    100% {
        transform: scale(1);
    }
`;

const rotate = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
`;

const rotateGradient = keyframes`
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
`;

const shimmer = keyframes`
    0% {
        background-position: -200% center;
    }
    100% {
        background-position: 200% center;
    }
`;

const Container = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    animation: ${fadeIn} 0.5s ease-out;
`;

const LogoContainer = styled.div`
    position: relative;
    width: 120px;
    height: 120px;
    margin-bottom: 30px;
`;

const LogoCircle = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    animation: ${rotate} 8s linear infinite;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: conic-gradient(
            from 0deg,
            #FF6B00,
            #FFD700,
            #FF8C00,
            #FFA500,
            #FF6B00
        );
        animation: ${rotateGradient} 4s linear infinite;
    }

    &::after {
        content: '';
        position: absolute;
        inset: 3px;
        background: #1a1a1a;
        border-radius: 50%;
        z-index: 1;
    }
`;

const GradientRing = styled.div`
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 50%;
    padding: 2px;
    background: linear-gradient(90deg, #FF6B00, #FFD700, #FF6B00);
    background-size: 200% auto;
    animation: ${shimmer} 3s linear infinite;
    z-index: 2;

    &::after {
        content: '';
        position: absolute;
        inset: 2px;
        background: #1a1a1a;
        border-radius: 50%;
    }
`;

const LogoInner = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%);
    border-radius: 50%;
    animation: ${pulse} 2s ease-in-out infinite;
    z-index: 3;
    box-shadow: 0 0 20px rgba(255, 107, 0, 0.5);
`;

const Title = styled.h1`
    color: #fff;
    font-size: 32px;
    font-weight: bold;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 2px;
    animation: ${slideUp} 0.5s ease-out 0.3s both;
    text-align: center;
`;

const Subtitle = styled.p`
    color: #FF6B00;
    font-size: 18px;
    margin: 10px 0 0;
    opacity: 0.8;
    animation: ${slideUp} 0.5s ease-out 0.6s both;
    text-align: center;
`;

const LoadingBar = styled.div`
    width: 200px;
    height: 4px;
    background: rgba(255, 107, 0, 0.2);
    border-radius: 2px;
    margin-top: 30px;
    overflow: hidden;
    position: relative;

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 40%;
        height: 100%;
        background: linear-gradient(90deg, #FF6B00, #FFD700);
        border-radius: 2px;
        animation: loading 1.5s ease-in-out infinite;
    }

    @keyframes loading {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(350%);
        }
    }
`;

const StatusText = styled.div`
    color: #666;
    font-size: 14px;
    margin-top: 15px;
    animation: ${slideUp} 0.5s ease-out 0.9s both;
`;

interface PreLoaderProps {
    status?: string;
}

const PreLoader: React.FC<PreLoaderProps> = ({ status = 'Loading...' }) => {
    return (
        <Container>
            <LogoContainer>
                <LogoCircle />
                <GradientRing />
                <LogoInner />
            </LogoContainer>
            <Title>WAY Esports</Title>
            <Subtitle>Your Path to Victory</Subtitle>
            <LoadingBar />
            <StatusText>{status}</StatusText>
        </Container>
    );
};

export default PreLoader; 