import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import Card from '../../components/UI/Card';
import { ThumbsUp, ThumbsDown } from 'react-feather';
import {
  PageEmptyState,
  PageHero,
  PageHeroContent,
  PageShell,
  PageSubtitle,
  PageTitle
} from '../../components/UI/PageLayout';
import { Seo } from '../../components/SEO';
import { formatCategoryLabel, getGameHubPath, parseCategorySlug, slugifyCategory } from '../../utils/discovery';

const NewsContainer = styled(PageShell)`
  width: min(100% - 1.5rem, 980px);
  margin: 0 auto;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: min(100% - 2.5rem, 1060px);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    width: min(100% - 3.5rem, 1120px);
  }
`;

const HeaderKicker = styled.div`
  margin-bottom: 0.75rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-family: ${({ theme }) => theme.fonts.accent};
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const NewsTitle = styled(PageTitle)`
  margin: 0;
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
  background: rgba(255, 255, 255, 0.05);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(245, 154, 74, 0.16);
    border-color: ${({ theme }) => theme.colors.border.accent};
    color: ${({ theme }) => theme.colors.text.primary};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const NewsItem = styled(Card).attrs({ variant: 'outlined' })`
  display: grid;
  background: ${({ theme }) =>
    theme.isLight
      ? 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(247,239,229,0.9))'
      : 'linear-gradient(180deg, rgba(18, 22, 27, 0.9), rgba(8, 10, 13, 0.96))'};
  border-radius: 24px;
  margin-bottom: 1.2rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-4px);
      box-shadow: ${({ theme }) => theme.shadows.lg};
      border-color: ${({ theme }) => theme.colors.border.accent};
    }
  }
`;

const NewsItemImage = styled.img`
  width: 100%;
  height: 228px;
  object-fit: cover;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    height: 300px;
  }
`;

const NewsContentWrapper = styled.div`
  display: grid;
  gap: 0.9rem;
  padding: 1.25rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 1.5rem;
  }
`;

const NewsItemTitle = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.18;
`;

const NewsItemContent = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ReadMoreLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  margin-top: 0.85rem;
  color: ${({ theme }) => theme.colors.accent};
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
  color: ${({ $active, theme }) => ($active ? theme.colors.text.primary : theme.colors.text.secondary)};
  background: ${({ $active }) => ($active ? 'rgba(245, 154, 74, 0.18)' : 'rgba(255, 255, 255, 0.04)')};
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.border.accent : theme.colors.border.light)};
  font-size: 0.84rem;
  font-weight: 700;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 0.82rem;
  margin: 0;
`;

const MetaChip = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 0.75rem;
  border-radius: 999px;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  font-size: 0.78rem;
  font-weight: 700;
`;

const ReactionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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

const NewsFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
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
      <PageHero>
        <PageHeroContent style={{ textAlign: 'center' }}>
          <HeaderKicker>Editorial stream</HeaderKicker>
          <NewsTitle>{activeCategory ? `${formatCategoryLabel(activeCategory)} News` : 'Latest News'}</NewsTitle>
          <PageSubtitle style={{ margin: '0.75rem auto 0' }}>
            Follow platform updates, tournament stories and team movement with a cleaner, more readable editorial feed.
          </PageSubtitle>
        </PageHeroContent>
        <SocialLinksHeader>
          <SocialLink href="https://wayesports.space/" target="_blank">
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
      </PageHero>

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
      {isLoading && <PageEmptyState>Loading news...</PageEmptyState>}
      {error && <PageEmptyState>{(error as Error).message}</PageEmptyState>}
      {!isLoading && !error && items.length === 0 && (
        <PageEmptyState>No news published yet.</PageEmptyState>
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
            <NewsFooter>
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
            </NewsFooter>
          </NewsContentWrapper>
        </NewsItem>
      ))}
    </NewsContainer>
  );
};

export default NewsPage;
