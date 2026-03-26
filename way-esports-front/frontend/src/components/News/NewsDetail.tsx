import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { ThumbsDown, ThumbsUp } from 'react-feather';
import { Seo } from '../SEO';
import { formatCategoryLabel, getGameHubPath, slugifyCategory } from '../../utils/discovery';

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
        content: '\\2190';
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

const TagLink = styled(Link)`
    display: inline-flex;
    align-items: center;
    background: rgba(255, 107, 0, 0.1);
    color: #FF6B00;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.9rem;
    text-decoration: none;
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

const ReactionsRow = styled.div`
    display: flex;
    gap: 10px;
    margin: 8px 0 22px;
`;

const ReactionButton = styled.button<{ $active?: boolean; $tone: 'like' | 'dislike' }>`
    border-radius: 999px;
    min-height: 36px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid ${({ $active, $tone }) =>
        $active
            ? ($tone === 'like' ? 'rgba(76,175,80,0.8)' : 'rgba(244,67,54,0.8)')
            : 'rgba(255,255,255,0.2)'};
    background: ${({ $active, $tone }) =>
        $active
            ? ($tone === 'like' ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)')
            : 'rgba(255,255,255,0.06)'};
    color: #fff;
    cursor: pointer;
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

const LinkCluster = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin: 1rem 0 2rem;
`;

const ClusterLink = styled(Link)`
    display: inline-flex;
    align-items: center;
    min-height: 38px;
    padding: 0 0.95rem;
    border-radius: 999px;
    text-decoration: none;
    color: #ffb27a;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.12);
`;

const RelatedSection = styled.div`
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 107, 0, 0.14);
`;

const RelatedGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
`;

const RelatedCard = styled(Link)`
    display: grid;
    gap: 0.6rem;
    padding: 1rem;
    border-radius: 16px;
    text-decoration: none;
    color: inherit;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
`;

const RelatedTitle = styled.h3`
    margin: 0;
    color: #ffffff;
    font-size: 1rem;
`;

const RelatedCopy = styled.p`
    margin: 0;
    color: #b7b7b7;
    font-size: 0.88rem;
    line-height: 1.5;
`;

const NewsDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(false);
    const [reactionBusy, setReactionBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newsItem, setNewsItem] = useState<any>(null);
    const [relatedNews, setRelatedNews] = useState<any[]>([]);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!id) return;
            try {
                setLoading(true);
                setError(null);
                const result: any = await api.get(`/api/news/${id}`);
                const data = (result && result.data) || null;
                if (!mounted) return;
                setNewsItem(data);
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
    }, [id]);

    useEffect(() => {
        let mounted = true;

        const loadRelated = async () => {
            if (!newsItem?.category) {
                setRelatedNews([]);
                return;
            }

            try {
                const result: any = await api.get(`/api/news?category=${encodeURIComponent(String(newsItem.category).trim().toLowerCase())}&limit=4`);
                const items = ((result && result.data) || [])
                    .filter((item: any) => String(item?._id || item?.id || '') !== String(id || ''))
                    .slice(0, 3);
                if (mounted) {
                    setRelatedNews(items);
                }
            } catch {
                if (mounted) {
                    setRelatedNews([]);
                }
            }
        };

        loadRelated();
        return () => {
            mounted = false;
        };
    }, [id, newsItem?.category]);

    const handleShare = (platform: string) => {
        const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
        const shareTitle = encodeURIComponent(newsItem?.title || 'WAY Esports News');
        const encodedUrl = encodeURIComponent(shareUrl);

        const urls: Record<string, string> = {
            telegram: `https://t.me/share/url?url=${encodedUrl}&text=${shareTitle}`,
            twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareTitle}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        };

        const target = urls[platform];
        if (target && typeof window !== 'undefined') {
            window.open(target, '_blank', 'noopener,noreferrer');
        }
    };

    const handleReaction = async (value: 'like' | 'dislike') => {
        if (!id || !newsItem || reactionBusy) return;
        const current = newsItem?.myReaction === 'like' || newsItem?.myReaction === 'dislike'
            ? newsItem.myReaction
            : null;
        const next = current === value ? null : value;

        const nextLike = Math.max(
            0,
            Number(newsItem?.likeCount ?? newsItem?.likes ?? 0) + (next === 'like' ? 1 : 0) - (current === 'like' ? 1 : 0)
        );
        const nextDislike = Math.max(
            0,
            Number(newsItem?.dislikeCount ?? 0) + (next === 'dislike' ? 1 : 0) - (current === 'dislike' ? 1 : 0)
        );

        setNewsItem((prev: any) => ({
            ...prev,
            myReaction: next,
            likeCount: nextLike,
            dislikeCount: nextDislike,
            likes: nextLike
        }));

        try {
            setReactionBusy(true);
            await api.post(`/api/news/${id}/reaction`, { value });
        } catch (e: any) {
            setNewsItem((prev: any) => ({
                ...prev,
                myReaction: current,
                likeCount: Number(newsItem?.likeCount ?? newsItem?.likes ?? 0),
                dislikeCount: Number(newsItem?.dislikeCount ?? 0),
                likes: Number(newsItem?.likeCount ?? newsItem?.likes ?? 0)
            }));
            setError(e?.message || 'Failed to set reaction');
        } finally {
            setReactionBusy(false);
        }
    };

    const gameHubPath = getGameHubPath(newsItem?.game);

    return (
        <Container>
            {newsItem ? (
                <Seo
                    title={`${newsItem.title || 'News'} | WAY Esports`}
                    description={String(newsItem.summary || newsItem.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)}
                    canonicalPath={`/news/${id || ''}`}
                    image={newsItem.coverImage || newsItem.imageUrl || ''}
                    type="article"
                    keywords={[newsItem.category || 'esports', newsItem.game || 'WAY Esports', newsItem.title || 'news']}
                    jsonLd={{
                        '@context': 'https://schema.org',
                        '@type': 'NewsArticle',
                        headline: newsItem.title || 'WAY Esports News',
                        description: String(newsItem.summary || newsItem.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160),
                        image: newsItem.coverImage || newsItem.imageUrl || undefined,
                        datePublished: newsItem.publishDate || newsItem.createdAt || undefined,
                        dateModified: newsItem.updatedAt || newsItem.publishDate || newsItem.createdAt || undefined,
                        author: newsItem.author?.username || 'WAY Esports',
                        publisher: {
                            '@type': 'Organization',
                            name: 'WAY Esports'
                        }
                    }}
                />
            ) : null}
            <BackButton onClick={() => navigate('/news')}>{t('back')}</BackButton>

            {error && (
                <div style={{ color: '#ff4757', marginBottom: '16px' }}>{error}</div>
            )}

            {loading && !error && (
                <div style={{ color: '#cccccc', marginBottom: '16px' }}>Loading...</div>
            )}

            {!loading && !error && newsItem && (
                <>
                    <Header>
                        {(newsItem.coverImage || newsItem.imageUrl) && <HeroImage src={newsItem.coverImage || newsItem.imageUrl} alt={newsItem.title} />}
                        <Title>{newsItem.title || ''}</Title>
                        <Meta>
                            <span>{new Date(newsItem.publishDate || newsItem.createdAt || Date.now()).toLocaleDateString()}</span>
                            {newsItem.category ? (
                                <TagLink to={`/news/category/${slugifyCategory(newsItem.category)}`}>
                                    {formatCategoryLabel(newsItem.category)}
                                </TagLink>
                            ) : (
                                <Tag>{newsItem.category || 'other'}</Tag>
                            )}
                        </Meta>
                        <ReactionsRow>
                            <ReactionButton
                                $tone="like"
                                $active={newsItem?.myReaction === 'like'}
                                onClick={() => handleReaction('like')}
                                disabled={reactionBusy}
                            >
                                <ThumbsUp size={14} /> {Number(newsItem?.likeCount ?? newsItem?.likes ?? 0)}
                            </ReactionButton>
                            <ReactionButton
                                $tone="dislike"
                                $active={newsItem?.myReaction === 'dislike'}
                                onClick={() => handleReaction('dislike')}
                                disabled={reactionBusy}
                            >
                                <ThumbsDown size={14} /> {Number(newsItem?.dislikeCount ?? 0)}
                            </ReactionButton>
                        </ReactionsRow>
                    </Header>

                    <LinkCluster>
                        {newsItem.relatedTournament?._id ? (
                            <ClusterLink to={`/tournaments/${newsItem.relatedTournament._id}`}>
                                Tournament: {newsItem.relatedTournament.name || 'Open event'}
                            </ClusterLink>
                        ) : null}
                        {newsItem.relatedTeam?._id ? (
                            <ClusterLink to={`/teams/${newsItem.relatedTeam._id}`}>
                                Team: {newsItem.relatedTeam.name || newsItem.relatedTeam.tag || 'Open team'}
                            </ClusterLink>
                        ) : null}
                        {gameHubPath ? (
                            <ClusterLink to={gameHubPath}>
                                {newsItem.game || 'Game'} hub
                            </ClusterLink>
                        ) : null}
                        <ClusterLink to="/news">More news</ClusterLink>
                    </LinkCluster>

                    <Content dangerouslySetInnerHTML={{ __html: newsItem.content || '' }} />

                    <ShareSection>
                        <ShareTitle>{t('share')}</ShareTitle>
                        <ShareButtons>
                            <ShareButton onClick={() => handleShare('telegram')}>Telegram</ShareButton>
                            <ShareButton onClick={() => handleShare('twitter')}>Twitter</ShareButton>
                            <ShareButton onClick={() => handleShare('facebook')}>Facebook</ShareButton>
                        </ShareButtons>
                    </ShareSection>

                    {relatedNews.length > 0 && (
                        <RelatedSection>
                            <ShareTitle>Related coverage</ShareTitle>
                            <RelatedGrid>
                                {relatedNews.map((item: any) => (
                                    <RelatedCard key={item._id || item.id} to={`/news/${item._id || item.id}`}>
                                        <RelatedTitle>{item.title}</RelatedTitle>
                                        <RelatedCopy>
                                            {String(item.summary || item.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 130)}
                                        </RelatedCopy>
                                    </RelatedCard>
                                ))}
                            </RelatedGrid>
                        </RelatedSection>
                    )}
                </>
            )}
        </Container>
    );
};

export default NewsDetail;
