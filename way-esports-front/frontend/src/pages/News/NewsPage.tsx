import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import Card from '../../components/UI/Card';

const NewsContainer = styled.div`
  width: min(100% - 2rem, 800px);
  margin: 0 auto;
  padding: 1rem 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: min(100% - 3rem, 900px);
    padding: 1.5rem 0;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    width: min(100% - 4rem, 960px);
    padding: 2rem 0;
  }
`;

const NewsTitle = styled.h1`
  color: #ffffff;
  margin-bottom: 1.25rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin-bottom: 1.75rem;
  }
`;

const NewsHeader = styled(Card).attrs({ variant: 'elevated' })`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.bg.secondary}, ${({ theme }) => theme.colors.bg.tertiary});
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  text-align: center;
`;

const SocialLinksHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
`;

const SocialLink = styled.a`
  color: ${({ theme }) => theme.colors.text.primary};
  background: rgba(255, 255, 255, 0.06);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: #ff6b00;
    border-color: rgba(255, 107, 0, 0.6);
    color: #ffffff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.4);
  }
`;

const NewsItem = styled(Card).attrs({ variant: 'outlined' })`
  background: linear-gradient(145deg, #1a1a1a, #222222);
  border-radius: 12px;
  margin-bottom: 2rem;
  border: 1px solid #333;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
      border-color: #444;
    }
  }
`;

const NewsItemImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-bottom: 1px solid #333;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    height: 300px;
  }
`;

const NewsContentWrapper = styled.div`
  padding: 1.25rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 1.5rem;
  }
`;

const NewsItemTitle = styled.h2`
  color: #ffffff;
  margin-bottom: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
`;

const NewsItemContent = styled.p`
  color: #bbbbbb;
  margin-bottom: 0.5rem;
  line-height: 1.6;
`;

const NewsPage: React.FC = () => {
  const { data: newsRaw = [], isLoading, error } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const result: any = await api.get('/api/news');
      return (result && result.data) || [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const items = useMemo(() => {
    const data: any[] = Array.isArray(newsRaw) ? newsRaw : [];
    return data.map((n: any) => ({
      id: (n._id || n.id || '').toString(),
      title: n.title || '',
      content: n.summary || n.content || '',
      coverImage: n.coverImage,
      createdAt: n.publishDate || n.createdAt
    }));
  }, [newsRaw]);

  return (
    <NewsContainer>
      <NewsHeader>
        <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: '0.5rem' }}>Join the Community</h2>
        <p style={{ color: '#ccc', textAlign: 'center', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Follow us for latest updates and tournament news</p>
        <SocialLinksHeader>
          <SocialLink href="https://www.wayesports.org/" target="_blank">
            {'\u{1F310}'} Website
          </SocialLink>
          <SocialLink href="https://t.me/wayesports" target="_blank">
            {'\u2708'} Telegram
          </SocialLink>
          <SocialLink href="https://discord.gg/wayesports" target="_blank">
            {'\u{1F4AC}'} Discord
          </SocialLink>
          <SocialLink href="https://www.twitch.tv/WAY_Esports" target="_blank">
            {'\u{1F4FA}'} Twitch
          </SocialLink>
        </SocialLinksHeader>
      </NewsHeader>

      <NewsTitle>Latest News</NewsTitle>
      {isLoading && <div style={{ color: '#cccccc', textAlign: 'center', padding: '50px' }}>Loading news...</div>}
      {error && <div style={{ color: '#ff4757', textAlign: 'center', padding: '20px' }}>{(error as Error).message}</div>}
      {!isLoading && !error && items.length === 0 && (
        <div style={{ color: '#888', textAlign: 'center', padding: '50px' }}>No news published yet.</div>
      )}
      {!isLoading && !error && items.map(item => (
        <NewsItem key={item.id}>
          {item.coverImage && <NewsItemImage src={item.coverImage} alt={item.title} />}
          <NewsContentWrapper>
            <NewsItemTitle>{item.title}</NewsItemTitle>
            <NewsItemContent>{item.content}</NewsItemContent>
          </NewsContentWrapper>
        </NewsItem>
      ))}
    </NewsContainer>
  );
};

export default NewsPage;
