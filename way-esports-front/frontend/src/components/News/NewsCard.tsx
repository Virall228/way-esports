import React from 'react';
import styled, { keyframes } from 'styled-components';
import type { NewsCardProps } from './';

const glowEffect = keyframes`
    0% { box-shadow: 0 0 5px rgba(255, 107, 0, 0.3); }
    50% { box-shadow: 0 0 15px rgba(255, 107, 0, 0.5); }
    100% { box-shadow: 0 0 5px rgba(255, 107, 0, 0.3); }
`;

const Card = styled.div`
    background: linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease;
    cursor: pointer;

    &:hover {
        transform: translateY(-5px);
        animation: ${glowEffect} 2s infinite;
    }

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: #FF6B00;
        border-radius: 4px 0 0 4px;
    }
`;

const Title = styled.h3`
    color: #FF6B00;
    margin: 0 0 10px 0;
    font-size: 1.2rem;
    position: relative;
    padding-left: 15px;
`;

const Meta = styled.div`
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
    color: #666;
    font-size: 0.9rem;
`;

const Tag = styled.span`
    background: rgba(255, 107, 0, 0.1);
    color: #FF6B00;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
`;

const Preview = styled.p`
    color: #ccc;
    margin: 0;
    line-height: 1.5;
`;

const Image = styled.img`
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 15px;
`;

const NewsCard: React.FC<NewsCardProps> = ({
    title,
    date,
    category,
    preview,
    imageUrl,
    onClick
}) => {

    return (
        <Card onClick={onClick}>
            {imageUrl && <Image src={imageUrl} alt={title} />}
            <Title>{title}</Title>
            <Meta>
                <span>{new Date(date).toLocaleDateString()}</span>
                <Tag>{category}</Tag>
            </Meta>
            <Preview>{preview}</Preview>
        </Card>
    );
};

export default NewsCard; 
