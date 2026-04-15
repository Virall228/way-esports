import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { Seo } from '../../components/SEO';
import { api } from '../../services/api';
import { getDiscoveryGames } from '../../utils/discovery';
import { resolveMediaUrl, resolveTeamLogoUrl } from '../../utils/media';

const Page = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const Hero = styled(Card).attrs({ variant: 'elevated' })`
  position: relative;
  overflow: hidden;
  padding: 2rem;
  border-radius: 24px;
  border: 1px solid ${({ theme }) => theme.colors.glass.panelBorder};
  background: ${({ theme }) =>
    theme.isLight
      ? `
    radial-gradient(circle at top left, rgba(255, 153, 51, 0.22), transparent 34%),
    radial-gradient(circle at bottom right, rgba(255, 214, 153, 0.28), transparent 26%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(248, 240, 229, 0.94))
  `
      : `
    radial-gradient(circle at top left, rgba(255, 107, 0, 0.28), transparent 34%),
    radial-gradient(circle at bottom right, rgba(255, 214, 10, 0.12), transparent 24%),
    linear-gradient(145deg, rgba(19, 21, 24, 0.94), rgba(9, 10, 12, 0.98))
  `};
`;

const HeroTitle = styled.h1`
  margin: 0 0 0.75rem;
  font-size: clamp(2.2rem, 6vw, 4.5rem);
  line-height: 0.96;
`;

const HeroSubtitle = styled.p`
  margin: 0;
  max-width: 820px;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.7;
  font-size: 1.03rem;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 1.4rem;
`;

const LinkButton = styled(Link)`
  text-decoration: none;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
`;

const StatCard = styled(Card).attrs({ variant: 'outlined' })`
  padding: 1.2rem;
  border-radius: 18px;
  background: ${({ theme }) => (theme.isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.04)')};
`;

const StatValue = styled.div`
  font-size: 1.9rem;
  font-weight: 800;
`;

const StatLabel = styled.div`
  margin-top: 0.4rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.86rem;
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
  font-size: 1.35rem;
`;

const SectionCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
`;

const ContentCard = styled(Card).attrs({ variant: 'outlined' })`
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  border-radius: 18px;
  background: ${({ theme }) => (theme.isLight ? 'rgba(255, 255, 255, 0.82)' : 'rgba(255, 255, 255, 0.03)')};
`;

const Cover = styled.div<{ $image?: string }>`
  height: 148px;
  border-radius: 14px;
  background:
    ${({ $image, theme }) =>
      $image
        ? `linear-gradient(180deg, rgba(0,0,0,${theme.isLight ? '0.02' : '0.08'}), rgba(0,0,0,${theme.isLight ? '0.28' : '0.46'})), url(${$image}) center/cover`
        : theme.isLight
          ? 'linear-gradient(135deg, rgba(255, 174, 92, 0.3), rgba(255,255,255,0.72))'
          : 'linear-gradient(135deg, rgba(255,107,0,0.26), rgba(255,255,255,0.02))'};
  border: 1px solid ${({ theme }) => theme.colors.glass.panelBorder};
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 1.02rem;
  line-height: 1.35;
`;

const CardMeta = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.84rem;
  line-height: 1.5;
`;

const InlineLink = styled(Link)`
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;
  font-weight: 700;

  &:hover {
    text-decoration: underline;
  }
`;

const GameGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
`;

const GameCard = styled(Link)`
  display: grid;
  gap: 0.6rem;
  text-decoration: none;
  color: inherit;
  padding: 1rem;
  border-radius: 18px;
  background: ${({ theme }) => (theme.isLight ? 'rgba(255, 255, 255, 0.82)' : 'rgba(255, 255, 255, 0.04)')};
  border: 1px solid ${({ theme }) => theme.colors.glass.panelBorder};
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
  background: ${({ theme }) => (theme.isLight ? 'rgba(245, 234, 220, 0.9)' : 'rgba(255, 255, 255, 0.08)')};
`;

const Cta = styled(Card).attrs({ variant: 'elevated' })`
  padding: 1.5rem;
  border-radius: 22px;
  background: ${({ theme }) =>
    theme.isLight
      ? `
    radial-gradient(circle at top right, rgba(255, 153, 51, 0.22), transparent 30%),
    linear-gradient(145deg, rgba(255,255,255,0.96), rgba(247, 237, 224, 0.92))
  `
      : `
    radial-gradient(circle at top right, rgba(255, 107, 0, 0.24), transparent 30%),
    linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))
  `};
`;

const gameCards = getDiscoveryGames().slice(0, 4).map((item) => ({
  slug: item.slug,
  title: `${item.label} Hub`,
  description: item.description
}));

const PublicLandingPage: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['landing', 'stats'],
    queryFn: async () => {
      const result: any = await api.get('/api/stats');
      return result?.data || result || {};
    },
    staleTime: 60_000
  });

  const { data: news = [] } = useQuery({
    queryKey: ['landing', 'news'],
    queryFn: async () => {
      const result: any = await api.get('/api/news?limit=4');
      return result?.data || result || [];
    },
    staleTime: 60_000
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ['landing', 'tournaments'],
    queryFn: async () => {
      const result: any = await api.get('/api/tournaments?limit=6');
      return result?.data || result?.tournaments || result || [];
    },
    staleTime: 60_000
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['landing', 'teams'],
    queryFn: async () => {
      const result: any = await api.get('/api/teams?limit=6');
      return result?.data || result || [];
    },
    staleTime: 60_000
  });

  return (
    <Page>
      <Seo
        title="WAY Esports | Tournaments, Teams, Rankings and Player Discovery"
        description="WAY Esports platform for tournaments, teams, live matches, rankings, player profiles and public scouting."
        canonicalPath="/"
        type="website"
        keywords={['esports platform', 'mobile esports', 'esports tournaments', 'esports teams', 'WAY Esports']}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'WAY Esports',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://wayesports.org'
        }}
      />

      <Hero>
        <HeroTitle>Competitive esports platform built to be found.</HeroTitle>
        <HeroSubtitle>
          WAY Esports brings together tournament pages, team directories, player profiles, rankings, live matches and scout discovery so people can find your platform, your events and your players from search, social previews and direct links.
        </HeroSubtitle>
        <ButtonRow>
          <LinkButton to="/tournaments"><Button variant="brand">Browse Tournaments</Button></LinkButton>
          <LinkButton to="/teams"><Button variant="outline">Explore Teams</Button></LinkButton>
          <LinkButton to="/news"><Button variant="outline">Read News</Button></LinkButton>
          <LinkButton to="/auth"><Button variant="ghost">Open Platform</Button></LinkButton>
        </ButtonRow>
      </Hero>

      <StatsGrid>
        <StatCard>
          <StatValue>{Number(stats?.totalUsers || 0).toLocaleString()}</StatValue>
          <StatLabel>Registered players</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{Number(stats?.activeTournaments || 0)}</StatValue>
          <StatLabel>Active tournaments</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{Number(stats?.activeTeams || 0)}</StatValue>
          <StatLabel>Active teams</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>${Number(stats?.totalPrizePool || 0).toLocaleString()}</StatValue>
          <StatLabel>Total prize pool</StatLabel>
        </StatCard>
      </StatsGrid>

      <Section>
        <SectionHead>
          <div>
            <SectionTitle>Popular Game Hubs</SectionTitle>
            <SectionCopy>Indexable entry points for game-specific searches and traffic.</SectionCopy>
          </div>
        </SectionHead>
        <GameGrid>
          {gameCards.map((item) => (
            <GameCard key={item.slug} to={`/games/${item.slug}`}>
              <CardTitle>{item.title}</CardTitle>
              <CardMeta>{item.description}</CardMeta>
            </GameCard>
          ))}
        </GameGrid>
      </Section>

      <Section>
        <SectionHead>
          <div>
            <SectionTitle>Featured Tournaments</SectionTitle>
            <SectionCopy>Public tournament pages are your strongest search and share assets.</SectionCopy>
          </div>
          <InlineLink to="/tournaments">See all tournaments</InlineLink>
        </SectionHead>
        <Grid>
          {(tournaments as any[]).slice(0, 4).map((item: any) => (
            <ContentCard key={item.id || item._id}>
              <Cover $image={resolveMediaUrl(item.coverImage || item.image || '')} />
              <CardTitle>{item.title || item.name}</CardTitle>
              <CardMeta>
                {item.game || 'Esports'} · {item.status || 'upcoming'} · ${Number(item.prizePool || 0).toLocaleString()}
              </CardMeta>
              <InlineLink to={`/tournaments/${item.id || item._id}`}>Open tournament page</InlineLink>
            </ContentCard>
          ))}
        </Grid>
      </Section>

      <Section>
        <SectionHead>
          <div>
            <SectionTitle>Latest News</SectionTitle>
            <SectionCopy>News detail pages help you capture long-tail search and social shares.</SectionCopy>
          </div>
          <InlineLink to="/news">Open news hub</InlineLink>
        </SectionHead>
        <Grid>
          {(news as any[]).slice(0, 4).map((item: any) => (
            <ContentCard key={item._id || item.id}>
              <Cover $image={resolveMediaUrl(item.coverImage || '')} />
              <CardTitle>{item.title}</CardTitle>
              <CardMeta>{String(item.summary || item.content || '').slice(0, 150)}</CardMeta>
              <InlineLink to={`/news/${item._id || item.id}`}>Read article</InlineLink>
            </ContentCard>
          ))}
        </Grid>
      </Section>

      <Section>
        <SectionHead>
          <div>
            <SectionTitle>Team Directory</SectionTitle>
            <SectionCopy>Public team pages create more entry points from branded and game-specific search.</SectionCopy>
          </div>
          <InlineLink to="/teams">View all teams</InlineLink>
        </SectionHead>
        <Grid>
          {(teams as any[]).slice(0, 4).map((item: any) => (
            <ContentCard key={item.id || item._id}>
              <TeamRow>
                <TeamLogo src={resolveTeamLogoUrl(item.logo || '') || '/images/main.png'} alt={item.name} />
                <div>
                  <CardTitle>{item.name}{item.tag ? ` (${item.tag})` : ''}</CardTitle>
                  <CardMeta>{item.game || 'Esports'} · {Math.round(Number(item.stats?.winRate || 0))}% win rate</CardMeta>
                </div>
              </TeamRow>
              <InlineLink to={`/teams/${item.id || item._id}`}>Open team profile</InlineLink>
            </ContentCard>
          ))}
        </Grid>
      </Section>

      <Cta>
        <SectionTitle>Public pages that keep feeding discovery</SectionTitle>
        <SectionCopy>
          Rankings, matches, teams, tournaments, profiles and scout pages now cross-link into each other so your platform has more paths for search engines and social crawlers to understand and index.
        </SectionCopy>
        <ButtonRow>
          <LinkButton to="/rankings"><Button variant="outline">Open Rankings</Button></LinkButton>
          <LinkButton to="/matches"><Button variant="outline">Open Matches</Button></LinkButton>
          <LinkButton to="/games/critical-ops"><Button variant="ghost">Game Hubs</Button></LinkButton>
        </ButtonRow>
      </Cta>
    </Page>
  );
};

export default PublicLandingPage;
