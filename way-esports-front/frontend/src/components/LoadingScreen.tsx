import React from 'react';
import styled from 'styled-components';

const LoadingContainer = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #000000;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
`;

const LoadingSpinner = styled.div`
    width: 100px;
    height: 100px;
    position: relative;
    animation: fadeOut 0.5s ease-out 3s forwards;

    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
            visibility: hidden;
        }
    }
`;

const Knife = styled.div`
    position: absolute;
    width: 30px;
    height: 30px;
    background: url('/knife.svg') no-repeat center center;
    background-size: contain;

    &:nth-child(1) {
        top: 0;
        left: 50%;
        transform-origin: 50% 50px;
        animation: spin 1s linear infinite;
    }

    &:nth-child(2) {
        top: 50%;
        right: 0;
        transform-origin: -20px 50%;
        animation: spin 1s linear infinite 0.25s;
    }

    &:nth-child(3) {
        bottom: 0;
        left: 50%;
        transform-origin: 50% -20px;
        animation: spin 1s linear infinite 0.5s;
    }

    &:nth-child(4) {
        top: 50%;
        left: 0;
        transform-origin: 50px 50%;
        animation: spin 1s linear infinite 0.75s;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;

interface LoadingScreenProps {
    isVisible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <LoadingContainer>
            <LoadingSpinner>
                <Knife />
                <Knife />
                <Knife />
                <Knife />
            </LoadingSpinner>
        </LoadingContainer>
    );
};

export default LoadingScreen; 