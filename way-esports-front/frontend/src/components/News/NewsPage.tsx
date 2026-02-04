import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { NewsCard } from './';
import type { NewsItem } from './';
import { api } from '../../services/api';

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

const SocialLinks = styled.div`
    display: flex;
    gap: 15px;
    margin-top: 30px;
    flex-wrap: wrap;
    justify-content: center;
`;

const SocialLink = styled.a`
    color: #007bff;
    text-decoration: none;
    font-size: 0.9rem;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;

    @media (hover: hover) and (pointer: fine) {
        &:hover {
            background: rgba(255, 255, 255, 0.1);
            text-decoration: none;
            color: #0056b3;
        }
    }
`;

const NewsPage: React.FC = () => {
    const [filter, setFilter] = useState<string>('all');
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [items, setItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const categories = ['all', 'tournaments', 'teams', 'updates', 'community'];

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const result: any = await api.get('/api/news');
                const data: any[] = (result && result.data) || [];

                const mapped: NewsItem[] = data.map((n: any) => ({
                    id: (n._id || n.id || '').toString(),
                    title: n.title || '',
                    date: (n.publishDate || n.createdAt || new Date().toISOString()).toString(),
                    category: (n.category || 'other').toString(),
                    preview: (n.summary || (n.content || '').slice(0, 200) || '').toString(),
                    imageUrl: n.coverImage || n.imageUrl,
                    content: (n.content || '').toString()
                }));

                if (!mounted) return;
                setItems(mapped);
            } catch (e: any) {
                if (!mounted) return;
                setError(e?.message || 'Failed to load news');
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, []);

    const filteredNews = items.filter(news => 
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

            {error && (
                <div style={{ color: '#ff4757', marginBottom: '16px' }}>{error}</div>
            )}

            {loading && !error && (
                <div style={{ color: '#cccccc', marginBottom: '16px' }}>Loading...</div>
            )}

            {!loading && !error && filteredNews.map(news => (
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

            <SocialLinks>
                <SocialLink href="https://www.wayesports.org/" target="_blank">Website</SocialLink>
                <SocialLink href="https://t.me/wayesports" target="_blank">Telegram</SocialLink>
                <SocialLink href="https://discord.gg/wayesports" target="_blank">Discord</SocialLink>
                <SocialLink href="https://www.twitch.tv/WAY_Esports" target="_blank">Twitch</SocialLink>
            </SocialLinks>
        </Container>
    );
};

export default NewsPage;