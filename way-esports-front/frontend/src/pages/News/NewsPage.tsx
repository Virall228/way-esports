import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import Card from '../../components/UI/Card';
import { ThumbsUp, ThumbsDown } from 'react-feather';
import { Seo } from '../../components/SEO';
import { formatCategoryLabel, getGameHubPath, parseCategorySlug, slugifyCategory } from '../../utils/discovery';

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

const ReadMoreLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  margin-top: 0.85rem;
  color: #ff6b00;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const CategoryBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin: 0 0 1rem;
`;

const CategoryLink = styled(Link)<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 0.95rem;
  border-radius: 999px;
  text-decoration: none;
  color: ${({ $active }) => ($active ? '#ffffff' : '#ffb27a')};
  background: ${({ $active }) => ($active ? 'rgba(255, 107, 0, 0.82)' : 'rgba(255, 255, 255, 0.04)')};
  border: 1px solid ${({ $active }) => ($active ? 'rgba(255, 107, 0, 0.9)' : 'rgba(255, 255, 255, 0.12)')};
  font-size: 0.84rem;
  font-weight: 700;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  color: #9e9e9e;
  font-size: 0.82rem;
  margin-bottom: 0.5rem;
`;

const MetaChip = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 0.75rem;
  border-radius: 999px;
  text-decoration: none;
  color: #ffb27a;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 0.78rem;
  font-weight: 700;
`;

const ReactionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
`;

const ReactionButton = styled.button<{ $active?: boolean; $tone: 'like' | 'dislike' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  border: 1px solid
    ${({ $active, $tone }) =>
      $active
        ? $tone === 'like'
          ? 'rgba(76, 175, 80, 0.8)'
          : 'rgba(244, 67, 54, 0.8)'
        : 'rgba(255, 255, 255, 0.2)'};
  background: ${({ $active, $tone }) =>
    $active
      ? $tone === 'like'
        ? 'rgba(76, 175, 80, 0.2)'
        : 'rgba(244, 67, 54, 0.2)'
      : 'rgba(255, 255, 255, 0.06)'};
  color: #fff;
  min-height: 34px;
  padding: 0 12px;
  cursor: pointer;
`;

const NewsPage: React.FC = () => {
  const { category: categoryParam } = useParams<{ category?: string }>();
  const queryClient = useQueryClient();
  const activeCategory = useMemo(() => parseCategorySlug(categoryParam), [categoryParam]);

  const { data: newsRaw = [], isLoading, error } = useQuery({
    queryKey: ['news', activeCategory || 'all'],
    queryFn: async () => {
      const query = activeCategory ? `?category=${encodeURIComponent(activeCategory)}` : '';
      const result: any = await api.get(`/api/news${query}`);
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
      createdAt: n.publishDate || n.createdAt,
      category: String(n.category || '').trim(),
      game: String(n.game || '').trim(),
      likeCount: Number(n.likeCount ?? n.likes ?? 0),
      dislikeCount: Number(n.dislikeCount ?? 0),
      myReaction: n.myReaction === 'like' || n.myReaction === 'dislike' ? n.myReaction : null
    }));
  }, [newsRaw]);

  const categories = useMemo(() => {
    const discovered = items
      .map((item) => item.category)
      .filter(Boolean)
      .map((item) => item.toLowerCase());
    const defaults = ['tournaments', 'teams', 'players', 'platform', 'matches', 'rankings'];
    return Array.from(new Set([activeCategory, ...defaults, ...discovered].filter(Boolean) as string[]));
  }, [activeCategory, items]);

  const seoTitle = activeCategory
    ? `${formatCategoryLabel(activeCategory)} Esports News | WAY Esports`
    : 'Esports News and Tournament Updates | WAY Esports';

  const seoDescription = activeCategory
    ? `${formatCategoryLabel(activeCategory)} news, tournament updates and platform coverage from WAY Esports.`
    : 'Latest WAY Esports news, tournament announcements, team updates and platform releases.';

  const reactionMutation = useMutation({
    mutationFn: async ({ newsId, value }: { newsId: string; value: 'like' | 'dislike' }) => {
      return api.post(`/api/news/${newsId}/reaction`, { value });
    },
    onSuccess: (_result, vars) => {
      queryClient.setQueryData(['news', activeCategory || 'all'], (prev: any) => {
        const src: any[] = Array.isArray(prev) ? prev : Array.isArray(prev?.data) ? prev.data : [];
        return src.map((row: any) => {
          const rowId = String(row?._id || row?.id || '');
          if (rowId !== vars.newsId) return row;
          const current = row?.myReaction === 'like' || row?.myReaction === 'dislike' ? row.myReaction : null;
          let nextReaction: 'like' | 'dislike' | null = vars.value;
          if (current === vars.value) nextReaction = null;
          const likeCount = Math.max(
            0,
            Number(row?.likeCount ?? row?.likes ?? 0) + (nextReaction === 'like' ? 1 : 0) - (current === 'like' ? 1 : 0)
          );
          const dislikeCount = Math.max(
            0,
            Number(row?.dislikeCount ?? 0) + (nextReaction === 'dislike' ? 1 : 0) - (current === 'dislike' ? 1 : 0)
          );
          return { ...row, myReaction: nextReaction, likeCount, dislikeCount, likes: likeCount };
        });
      });
    }
  });

  return (
    <NewsContainer>
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={activeCategory ? `/news/category/${slugifyCategory(activeCategory)}` : '/news'}
        type="website"
        keywords={['esports news', 'tournament news', 'WAY Esports', 'team updates', activeCategory || '']}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: activeCategory ? `${formatCategoryLabel(activeCategory)} News` : 'WAY Esports News',
          description: seoDescription
        }}
      />
      <NewsHeader>
        <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: '0.5rem' }}>Join the Community</h2>
        <p style={{ color: '#ccc', textAlign: 'center', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Follow us for latest updates and tournament news</p>
        <SocialLinksHeader>
          <SocialLink href="https://wayesports.duckdns.org/" target="_blank">
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

      <NewsTitle>{activeCategory ? `${formatCategoryLabel(activeCategory)} News` : 'Latest News'}</NewsTitle>
      <CategoryBar>
        <CategoryLink to="/news" $active={!activeCategory}>All</CategoryLink>
        {categories.map((category) => (
          <CategoryLink
            key={category}
            to={`/news/category/${slugifyCategory(category)}`}
            $active={category === activeCategory}
          >
            {formatCategoryLabel(category)}
          </CategoryLink>
        ))}
      </CategoryBar>
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
            <MetaRow>
              <span>{new Date(item.createdAt || Date.now()).toLocaleDateString()}</span>
              {item.category ? (
                <MetaChip to={`/news/category/${slugifyCategory(item.category)}`}>
                  {formatCategoryLabel(item.category)}
                </MetaChip>
              ) : null}
              {item.game && getGameHubPath(item.game) ? (
                <MetaChip to={getGameHubPath(item.game) || '/news'}>
                  {item.game}
                </MetaChip>
              ) : null}
            </MetaRow>
            <NewsItemContent>{item.content}</NewsItemContent>
            <ReactionsRow>
              <ReactionButton
                $tone="like"
                $active={item.myReaction === 'like'}
                onClick={() => reactionMutation.mutate({ newsId: item.id, value: 'like' })}
              >
                <ThumbsUp size={14} /> {item.likeCount}
              </ReactionButton>
              <ReactionButton
                $tone="dislike"
                $active={item.myReaction === 'dislike'}
                onClick={() => reactionMutation.mutate({ newsId: item.id, value: 'dislike' })}
              >
                <ThumbsDown size={14} /> {item.dislikeCount}
              </ReactionButton>
            </ReactionsRow>
            <ReadMoreLink to={`/news/${item.id}`}>Read full article</ReadMoreLink>
          </NewsContentWrapper>
        </NewsItem>
      ))}
    </NewsContainer>
  );
};

export default NewsPage;
