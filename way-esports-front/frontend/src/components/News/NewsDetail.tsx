import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const scanline = keyframes`
    0% {
        transform: translateY(-100%);
    }
    100% {
        transform: translateY(100%);
    }
`;

const Container = styled.div`
    padding-bottom: 80px;
    position: relative;
    overflow: hidden;

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
            transparent 50%,
            rgba(255, 107, 0, 0.025) 50%
        );
        background-size: 100% 4px;
        pointer-events: none;
    }
`;

const BackButton = styled.button`
    background: none;
    border: none;
    color: #FF6B00;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0;
    margin-bottom: 20px;
    font-size: 1rem;
    transition: color 0.3s ease;

    &:hover {
        color: #ff8533;
    }

    &::before {
        content: '←';
        font-size: 1.2rem;
    }
`;

const Header = styled.div`
    position: relative;
    margin-bottom: 30px;
`;

const HeroImage = styled.img`
    width: 100%;
    height: 300px;
    object-fit: cover;
    border-radius: 12px;
    margin-bottom: 20px;
`;

const Title = styled.h1`
    color: #FF6B00;
    margin: 0 0 15px 0;
    font-size: 2.5rem;
    line-height: 1.2;
    position: relative;
    text-shadow: 0 0 10px rgba(255, 107, 0, 0.3);
`;

const Meta = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 30px;
    color: #666;
`;

const Tag = styled.span`
    background: rgba(255, 107, 0, 0.1);
    color: #FF6B00;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.9rem;
`;

const Content = styled.div`
    color: #ccc;
    line-height: 1.8;
    font-size: 1.1rem;

    p {
        margin-bottom: 20px;
    }

    h2 {
        color: #FF6B00;
        margin: 40px 0 20px;
    }

    img {
        width: 100%;
        border-radius: 8px;
        margin: 20px 0;
    }

    blockquote {
        border-left: 4px solid #FF6B00;
        margin: 20px 0;
        padding-left: 20px;
        font-style: italic;
        color: #999;
    }
`;

const ShareSection = styled.div`
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 107, 0, 0.2);
`;

const ShareTitle = styled.h3`
    color: #FF6B00;
    margin: 0 0 15px 0;
`;

const ShareButtons = styled.div`
    display: flex;
    gap: 15px;
`;

const ShareButton = styled.button`
    background: #2a2a2a;
    border: none;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        background: #FF6B00;
        transform: translateY(-2px);
    }
`;

const NewsDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Mock data - replace with actual data fetching
    const newsItem = {
        title: 'WAY Esports Tournament Finals',
        date: '2024-03-15',
        category: 'Tournaments',
        content: `
            <h2>Tournament Details</h2>
            <p>Join us for the epic finale of our CS2 tournament series with a prize pool of $10,000! The best teams from around the world will compete for glory and prizes.</p>
            
            <h2>Schedule</h2>
            <p>The finals will take place over two days, featuring intense matches and special events for our community.</p>
            
            <blockquote>
                "This tournament represents the pinnacle of competitive gaming in our region" - Tournament Director
            </blockquote>
            
            <h2>Prize Distribution</h2>
            <p>1st Place: $5,000<br>
            2nd Place: $3,000<br>
            3rd Place: $2,000</p>
        `,
        imageUrl: 'https://example.com/tournament.jpg'
    };

    const handleShare = (platform: string) => {
        // Implement sharing functionality
        console.log(`Sharing on ${platform}`);
    };

    return (
        <Container>
            <BackButton onClick={() => navigate('/news')}>{t('back')}</BackButton>
            
            <Header>
                {newsItem.imageUrl && <HeroImage src={newsItem.imageUrl} alt={newsItem.title} />}
                <Title>{newsItem.title}</Title>
                <Meta>
                    <span>{new Date(newsItem.date).toLocaleDateString()}</span>
                    <Tag>{newsItem.category}</Tag>
                </Meta>
            </Header>

            <Content dangerouslySetInnerHTML={{ __html: newsItem.content }} />

            <ShareSection>
                <ShareTitle>{t('share')}</ShareTitle>
                <ShareButtons>
                    <ShareButton onClick={() => handleShare('telegram')}>Telegram</ShareButton>
                    <ShareButton onClick={() => handleShare('twitter')}>Twitter</ShareButton>
                    <ShareButton onClick={() => handleShare('facebook')}>Facebook</ShareButton>
                </ShareButtons>
            </ShareSection>
        </Container>
    );
};

export default NewsDetail; 