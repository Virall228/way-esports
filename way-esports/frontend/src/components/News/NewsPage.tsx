import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { NewsCard } from './';
import type { NewsItem } from './';

const Container = styled.div`
    padding-bottom: 80px;
`;

const Header = styled.div`
    margin-bottom: 30px;
`;

const Title = styled.h1`
    color: #FF6B00;
    margin: 0 0 20px 0;
    font-size: 2rem;
    position: relative;
    display: inline-block;

    &::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, #FF6B00, transparent);
    }
`;

const FilterBar = styled.div`
    display: flex;
    gap: 15px;
    margin-bottom: 30px;
    overflow-x: auto;
    padding-bottom: 10px;
    position: relative;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, #FF6B00, transparent);
    }

    &::-webkit-scrollbar {
        height: 4px;
    }

    &::-webkit-scrollbar-track {
        background: #2a2a2a;
    }

    &::-webkit-scrollbar-thumb {
        background: #FF6B00;
        border-radius: 2px;
    }
`;

const FilterButton = styled.button<{ active: boolean }>`
    background-color: ${props => props.active ? '#FF6B00' : '#2a2a2a'};
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;

    &:hover {
        background-color: ${props => props.active ? '#ff8533' : '#3a3a3a'};
        transform: translateY(-2px);
    }
`;

const mockNews: NewsItem[] = [
    {
        id: '1',
        title: 'WAY Esports Tournament Finals',
        date: '2024-03-15',
        category: 'Tournaments',
        preview: 'Join us for the epic finale of our CS2 tournament series with a prize pool of $10,000!',
        imageUrl: 'https://example.com/tournament.jpg',
        content: 'Full article content here...'
    },
    {
        id: '2',
        title: 'New Team Registrations Open',
        date: '2024-03-14',
        category: 'Teams',
        preview: 'Register your team for the upcoming spring season. Limited spots available!',
        content: 'Full article content here...'
    },
    // Add more mock news items as needed
];

const NewsPage: React.FC = () => {
    const [filter, setFilter] = useState<string>('all');
    const { t } = useLanguage();
    const navigate = useNavigate();

    const categories = ['all', 'tournaments', 'teams', 'updates', 'community'];

    const filteredNews = mockNews.filter(news => 
        filter === 'all' || news.category.toLowerCase() === filter
    );

    const handleNewsClick = (newsId: string) => {
        navigate(`/news/${newsId}`);
    };

    return (
        <Container>
            <Header>
                <Title>{t('news')}</Title>
                <FilterBar>
                    {categories.map(category => (
                        <FilterButton
                            key={category}
                            active={filter === category}
                            onClick={() => setFilter(category)}
                        >
                            {t(category)}
                        </FilterButton>
                    ))}
                </FilterBar>
            </Header>

            {filteredNews.map(news => (
                <NewsCard
                    key={news.id}
                    title={news.title}
                    date={news.date}
                    category={news.category}
                    preview={news.preview}
                    imageUrl={news.imageUrl}
                    onClick={() => handleNewsClick(news.id)}
                />
            ))}
        </Container>
    );
};

export default NewsPage; 