import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';

const NewsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const NewsTitle = styled.h1`
  color: #ffffff;
  margin-bottom: 2rem;
`;

const NewsItem = styled.div`
  background: #1a1a1a;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #333;
`;

const NewsItemTitle = styled.h2`
  color: #ffffff;
  margin-bottom: 0.5rem;
`;

const NewsItemContent = styled.p`
  color: #cccccc;
  margin-bottom: 1rem;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const SocialLink = styled.a`
  color: #007bff;
  text-decoration: none;
  font-size: 0.9rem;
  &:hover {
    text-decoration: underline;
  }
`;

 const NewsPage: React.FC = () => {
  const [items, setItems] = useState<Array<{ id: string; title: string; content: string; createdAt?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result: any = await api.get('/api/news');
        const data: any[] = (result && result.data) || [];
        setItems(
          data.map((n: any) => ({
            id: (n._id || n.id || '').toString(),
            title: n.title || '',
            content: n.summary || n.content || '',
            createdAt: n.publishDate || n.createdAt
          }))
        );
      } catch (e: any) {
        setError(e?.message || 'Failed to load news');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <NewsContainer>
      <NewsTitle>Latest News</NewsTitle>
      {loading && <div style={{ color: '#cccccc' }}>Loading...</div>}
      {error && <div style={{ color: '#ff4757' }}>{error}</div>}
      {!loading && !error && items.map(item => (
        <NewsItem key={item.id}>
          <NewsItemTitle>{item.title}</NewsItemTitle>
          <NewsItemContent>{item.content}</NewsItemContent>
          <SocialLinks>
            <SocialLink href="https://www.wayesports.org/" target="_blank">Website</SocialLink>
            <SocialLink href="https://t.me/wayesports" target="_blank">Telegram</SocialLink>
            <SocialLink href="https://discord.gg/wayesports" target="_blank">Discord</SocialLink>
            <SocialLink href="https://www.twitch.tv/WAY_Esports" target="_blank">Twitch</SocialLink>
          </SocialLinks>
        </NewsItem>
      ))}
    </NewsContainer>
  );
};

export default NewsPage;
