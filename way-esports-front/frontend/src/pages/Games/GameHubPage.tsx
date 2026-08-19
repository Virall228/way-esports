import React, { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { Seo } from '../../components/SEO';
import { api } from '../../services/api';
import { tournamentService } from '../../services/tournamentService';
import { resolveMediaUrl, resolveTeamLogoUrl } from '../../utils/media';
import { getDiscoveryGames, getGameDiscoveryConfigBySlug } from '../../utils/discovery';

const Page = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const Hero = styled(Card).attrs({ variant: 'elevated' })`
  display: grid;
  gap: 1rem;
  padding: 1.8rem;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(255, 107, 0, 0.24), transparent 34%),
    radial-gradient(circle at bottom right, rgba(255, 214, 10, 0.1), transparent 24%),
    linear-gradient(145deg, rgba(19, 21, 24, 0.94), rgba(9, 10, 12, 0.98));
`;

const Breadcrumbs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  font-size: 0.84rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const BreadcrumbLink = styled(Link)`
  color: #ff9d4d;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.4rem);
  line-height: 0.98;
`;

const Copy = styled.p`
  margin: 0;
  max-width: 820px;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.7;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
`;

const ButtonLink = styled(Link)`
  text-decoration: none;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
`;

const StatCard = styled(Card).attrs({ variant: 'outlined' })`
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
`;

const StatValue = styled.div`
  font-size: 1.75rem;
  font-weight: 800;
`;

const StatLabel = styled.div`
  margin-top: 0.35rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.84rem;
`;

const Section = styled.section`
  display: grid;
  gap: 1rem;
`;

const SectionHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
  flex-wrap: wrap;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.3rem;
`;

const SectionCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const Surface = styled(Card).attrs({ variant: 'outlined' })`
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
`;

const Cover = styled.div<{ $image?: string }>`
  height: 150px;
  border-radius: 14px;
  background:
    ${({ $image }) => ($image ? `linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.45)), url(${$image}) center/cover` : 'linear-gradient(135deg, rgba(255,107,0,0.26), rgba(255,255,255,0.02))')};
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const TeamRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

const TeamLogo = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.08);
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  line-height: 1.35;
`;

const CardMeta = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.84rem;
  line-height: 1.55;
`;

const InlineLink = styled(Link)`
  color: #ff9d4d;
  text-decoration: none;
  font-weight: 700;

  &:hover {
    text-decoration: underline;
  }
`;

const ExploreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
`;

const ExploreCard = styled(Link)`
  display: grid;
  gap: 0.45rem;
  padding: 1rem;
  border-radius: 18px;
  text-decoration: none;
  color: inherit;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const EmptyState = styled(Card).attrs({ variant: 'outlined' })`
  padding: 1rem;
  border-radius: 18px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const GameHubPage: React.FC = () => {
  const { game } = useParams<{ game: string }>();
  const config = useMemo(() => getGameDiscoveryConfigBySlug(game), [game]);

  const { data: tournaments = [] } = useQuery({
    queryKey: ['game-hub', config?.slug, 'tournaments'],
    queryFn: async () => {
      if (!config) return [];
      const result: any = await tournamentService.list({ game: config.query });
      return result?.data || result?.tournaments || result || [];
    },
    enabled: Boolean(config),
    staleTime: 60_000
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['game-hub', config?.slug, 'teams'],
    queryFn: async () => {
      if (!config) return [];
      const result: any = await api.get(`/api/teams?game=${encodeURIComponent(config.query)}&limit=6`);
      return result?.data || result || [];
    },
    enabled: Boolean(config),
    staleTime: 60_000
  });

  const { data: news = [] } = useQuery({
    queryKey: ['game-hub', config?.slug, 'news'],
    queryFn: async () => {
      if (!config) return [];
      const result: any = await api.get(`/api/news?game=${encodeURIComponent(config.query)}&limit=6`);
      return result?.data || result || [];
    },
    enabled: Boolean(config),
    staleTime: 60_000
  });

  if (!config) {
    return <Navigate to="/" replace />;
  }

  const relatedGames = getDiscoveryGames().filter((item) => item.slug !== config.slug).slice(0, 3);

  return (
    <Page>
      <Seo
        title={`${config.label} Tournaments, Teams and News | WAY Esports`}
        description={config.description}
        canonicalPath={`/games/${config.slug}`}
        type="website"
        keywords={[config.label, ...config.keywords, 'WAY Esports']}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${config.label} Hub`,
          description: config.description
        }}
      />

      <Hero>
        <Breadcrumbs>
          <BreadcrumbLink to="/">WAY Esports</BreadcrumbLink>
          <span>/</span>
          <BreadcrumbLink to="/tournaments">Tournaments</BreadcrumbLink>
          <span>/</span>
          <span>{config.label}</span>
        </Breadcrumbs>
        <Title>{config.label} Hub</Title>
        <Copy>
          {config.description} This page brings together current tournaments, searchable teams, recent coverage and public routes that help search engines understand your game ecosystem inside the platform.
        </Copy>
        <ButtonRow>
          <ButtonLink to="/tournaments"><Button variant="brand">Browse all tournaments</Button></ButtonLink>
          <ButtonLink to="/teams"><Button variant="outline">Explore teams</Button></ButtonLink>
          <ButtonLink to="/news"><Button variant="outline">Read news</Button></ButtonLink>
        </ButtonRow>
      </Hero>

      <StatsGrid>
        <StatCard>
          <StatValue>{Array.isArray(tournaments) ? tournaments.length : 0}</StatValue>
          <StatLabel>{config.label} tournaments</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{Array.isArray(teams) ? teams.length : 0}</StatValue>
          <StatLabel>{config.label} teams</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{Array.isArray(news) ? news.length : 0}</StatValue>
          <StatLabel>{config.label} articles</StatLabel>
        </StatCard>
      </StatsGrid>

      <Section>
        <SectionHead>
          <div>
            <SectionTitle>{config.label} Tournaments</SectionTitle>
            <SectionCopy>High-intent pages for players, teams and people searching for active events.</SectionCopy>
          </div>
          <InlineLink to="/tournaments">Open tournament index</InlineLink>
        </SectionHead>
        {Array.isArray(tournaments) && tournaments.length > 0 ? (
          <Grid>
            {tournaments.slice(0, 6).map((item: any) => (
              <Surface key={item.id || item._id}>
                <Cover $image={resolveMediaUrl(item.coverImage || item.image || '')} />
                <CardTitle>{item.title || item.name}</CardTitle>
                <CardMeta>
                  {item.status || 'upcoming'} · ${Number(item.prizePool || 0).toLocaleString()} prize pool
                </CardMeta>
                <InlineLink to={`/tournaments/${item.id || item._id}`}>Open tournament page</InlineLink>
              </Surface>
            ))}
          </Grid>
        ) : (
          <EmptyState>No {config.label} tournaments are published yet. This hub is still indexable and ready for new content.</EmptyState>
        )}
      </Section>

      <Section>
        <SectionHead>
          <div>
            <SectionTitle>{config.label} Teams</SectionTitle>
            <SectionCopy>Public team pages add branded search coverage and more internal authority for this game.</SectionCopy>
          </div>
          <InlineLink to="/teams">See the team directory</InlineLink>
        </SectionHead>
        {Array.isArray(teams) && teams.length > 0 ? (
          <Grid>
            {teams.slice(0, 6).map((item: any) => (
              <Surface key={item.id || item._id}>
                <TeamRow>
                  <TeamLogo src={resolveTeamLogoUrl(item.logo || '') || '/images/main.png'} alt={item.name || 'Team'} />
                  <div>
                    <CardTitle>{item.name}{item.tag ? ` (${item.tag})` : ''}</CardTitle>
                    <CardMeta>{item.game || config.label} · {Math.round(Number(item.stats?.winRate || 0))}% win rate</CardMeta>
                  </div>
                </TeamRow>
                <InlineLink to={`/teams/${item.id || item._id}`}>Open team profile</InlineLink>
              </Surface>
            ))}
          </Grid>
        ) : (
          <EmptyState>No public {config.label} teams yet. Team pages will appear here once they are created.</EmptyState>
        )}
      </Section>

      <Section>
        <SectionHead>
          <div>
            <SectionTitle>{config.label} News</SectionTitle>
            <SectionCopy>Fresh articles support long-tail discovery and stronger social previews for this title.</SectionCopy>
          </div>
          <InlineLink to="/news">Open news hub</InlineLink>
        </SectionHead>
        {Array.isArray(news) && news.length > 0 ? (
          <Grid>
            {news.slice(0, 6).map((item: any) => (
              <Surface key={item._id || item.id}>
                <Cover $image={resolveMediaUrl(item.coverImage || '')} />
                <CardTitle>{item.title}</CardTitle>
                <CardMeta>{String(item.summary || item.content || '').replace(/<[^>]+>/g, ' ').slice(0, 150)}</CardMeta>
                <InlineLink to={`/news/${item._id || item.id}`}>Read article</InlineLink>
              </Surface>
            ))}
          </Grid>
        ) : (
          <EmptyState>No published {config.label} articles yet. News coverage will strengthen this hub as content grows.</EmptyState>
        )}
      </Section>

      <Section>
        <SectionHead>
          <div>
            <SectionTitle>Explore More Routes</SectionTitle>
            <SectionCopy>Related internal paths that help people and crawlers keep moving through the platform.</SectionCopy>
          </div>
        </SectionHead>
        <ExploreGrid>
          <ExploreCard to="/rankings">
            <CardTitle>Rankings</CardTitle>
            <CardMeta>Connect this game hub to performance ladders and competitive standings.</CardMeta>
          </ExploreCard>
          <ExploreCard to="/matches">
            <CardTitle>Matches</CardTitle>
            <CardMeta>Surface live and recent match activity around published tournaments.</CardMeta>
          </ExploreCard>
          {relatedGames.map((item) => (
            <ExploreCard key={item.slug} to={`/games/${item.slug}`}>
              <CardTitle>{item.label}</CardTitle>
              <CardMeta>{item.description}</CardMeta>
            </ExploreCard>
          ))}
        </ExploreGrid>
      </Section>
    </Page>
  );
};

export default GameHubPage;
