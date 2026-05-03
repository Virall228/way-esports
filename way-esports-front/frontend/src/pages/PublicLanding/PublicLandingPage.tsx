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
  gap: 1.35rem;
`;

const Hero = styled(Card).attrs({ variant: 'elevated' })`
  position: relative;
  overflow: hidden;
  padding: clamp(1.5rem, 4vw, 3rem);
  border-radius: 28px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: ${({ theme }) =>
    theme.isLight
      ? `
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.28), transparent 34%),
    radial-gradient(circle at bottom right, rgba(226, 232, 240, 0.24), transparent 26%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(246, 248, 251, 0.94))
  `
      : `
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.09), transparent 34%),
    radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.06), transparent 24%),
    linear-gradient(145deg, rgba(17, 20, 24, 0.96), rgba(8, 10, 13, 0.98))
  `};
`;

const HeroLayout = styled.div`
  display: grid;
  gap: 1.5rem;

  @media (min-width: 980px) {
    grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
    align-items: end;
  }
`;

const HeroBody = styled.div`
  display: grid;
  gap: 1rem;
  justify-items: start;

  @media (max-width: 768px) {
    justify-items: center;
    text-align: center;
  }
`;

const HeroEyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: ${({ theme }) => theme.fonts.accent};
  font-size: 0.72rem;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: -0.01em;
`;

const HeroLogo = styled.div`
  width: 92px;
  height: 92px;
  border-radius: 24px;
  background: #050608 url('/images/way-main-logo-metal-v2.jpg?v=20260428') center/cover no-repeat;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28);

  @media (max-width: 768px) {
    width: 78px;
    height: 78px;
  }
`;

const HeroTitle = styled.h1`
  font-family: ${({ theme }) => theme.fonts.brand || theme.fonts.title};
  margin: 0;
  font-size: clamp(2.2rem, 6vw, 4.5rem);
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  line-height: 0.9;
  letter-spacing: 0.045em;
  text-wrap: balance;

  @media (max-width: 768px) {
    line-height: 0.92;
    letter-spacing: 0.03em;
  }
`;

const HeroSubtitle = styled.p`
  margin: 0;
  max-width: 820px;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.7;
  font-size: 1rem;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const LinkButton = styled(Link)`
  text-decoration: none;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const HeroCTAButton = styled(Button)`
  font-family: ${({ theme }) => theme.fonts.brand || theme.fonts.accent};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  letter-spacing: 0.035em;
  text-transform: uppercase;

  @media (max-width: 768px) {
    letter-spacing: 0.02em;
  }
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
  border: 1px solid ${({ theme }) => theme.colors.border.light};
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

const HeroMetrics = styled(StatsGrid)`
  align-self: stretch;

  @media (min-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
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
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  transition: transform ${({ theme }) => theme.transitions.fast}, border-color ${({ theme }) => theme.transitions.fast}, box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-3px);
    border-color: ${({ theme }) => theme.colors.border.accent};
    box-shadow: ${({ theme }) => (theme.isLight ? '0 18px 36px rgba(109, 78, 44, 0.14)' : '0 22px 38px rgba(0, 0, 0, 0.24)')};
  }
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
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
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
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  transition: transform ${({ theme }) => theme.transitions.fast}, border-color ${({ theme }) => theme.transitions.fast}, background ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: translateY(-3px);
    border-color: ${({ theme }) => theme.colors.border.accent};
    background: ${({ theme }) => (theme.isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.06)')};
  }
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
    radial-gradient(circle at top right, rgba(245, 154, 74, 0.18), transparent 30%),
    linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))
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
          url: typeof window !== 'undefined' ? window.location.origin : 'https://wayesports.space'
        }}
      />

      <Hero>
        <HeroLayout>
          <HeroBody>
            <HeroEyebrow>Public esports platform</HeroEyebrow>
            <HeroLogo aria-hidden="true" />
            <HeroTitle>WAY ESPORTS</HeroTitle>
            <HeroSubtitle>
              Discover tournaments, teams, rankings, player profiles and match stories in one focused competitive space built to feel premium from the first click.
            </HeroSubtitle>
            <ButtonRow>
              <LinkButton to="/tournaments"><HeroCTAButton variant="brand">Browse Tournaments</HeroCTAButton></LinkButton>
              <LinkButton to="/teams"><HeroCTAButton variant="outline">Explore Teams</HeroCTAButton></LinkButton>
              <LinkButton to="/auth"><HeroCTAButton variant="ghost">Open Platform</HeroCTAButton></LinkButton>
            </ButtonRow>
          </HeroBody>

          <HeroMetrics>
            <StatCard>
              <StatValue>{Number(stats?.totalUsers || 0).toLocaleString()}</StatValue>
              <StatLabel>Registered players inside the ecosystem</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{Number(stats?.activeTournaments || 0)}</StatValue>
              <StatLabel>Active tournaments visible right now</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{Number(stats?.activeTeams || 0)}</StatValue>
              <StatLabel>Teams building their public presence</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>${Number(stats?.totalPrizePool || 0).toLocaleString()}</StatValue>
              <StatLabel>Total prize pool across the platform</StatLabel>
            </StatCard>
          </HeroMetrics>
        </HeroLayout>
      </Hero>

      <Section>
        <SectionHead>
          <div>
            <SectionTitle>Game hubs</SectionTitle>
            <SectionCopy>Start from your game and jump straight into the competitive scene around it.</SectionCopy>
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
            <SectionTitle>Featured tournaments</SectionTitle>
            <SectionCopy>Live and upcoming competitions worth opening first.</SectionCopy>
          </div>
          <InlineLink to="/tournaments">See all tournaments</InlineLink>
        </SectionHead>
        <Grid>
          {(tournaments as any[]).slice(0, 4).map((item: any) => (
            <ContentCard key={item.id || item._id}>
              <Cover $image={resolveMediaUrl(item.coverImage || item.image || '')} />
              <CardTitle>{item.title || item.name}</CardTitle>
              <CardMeta>
                {item.game || 'Esports'} | {item.status || 'upcoming'} | ${Number(item.prizePool || 0).toLocaleString()}
              </CardMeta>
              <InlineLink to={`/tournaments/${item.id || item._id}`}>Open tournament page</InlineLink>
            </ContentCard>
          ))}
        </Grid>
      </Section>

      <Section>
        <SectionHead>
          <div>
            <SectionTitle>Latest news</SectionTitle>
            <SectionCopy>Fresh updates, announcements and storylines around the platform.</SectionCopy>
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
            <SectionTitle>Team directory</SectionTitle>
            <SectionCopy>Explore the teams shaping the current competitive landscape.</SectionCopy>
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
                  <CardMeta>{item.game || 'Esports'} | {Math.round(Number(item.stats?.winRate || 0))}% win rate</CardMeta>
                </div>
              </TeamRow>
              <InlineLink to={`/teams/${item.id || item._id}`}>Open team profile</InlineLink>
            </ContentCard>
          ))}
        </Grid>
      </Section>

      <Cta>
        <SectionTitle>Move deeper into the platform</SectionTitle>
        <SectionCopy>
          Open rankings, matches and game hubs to keep exploring the platform from different angles without losing the same clean visual language.
        </SectionCopy>
        <ButtonRow>
          <LinkButton to="/rankings"><HeroCTAButton variant="outline">Open Rankings</HeroCTAButton></LinkButton>
          <LinkButton to="/matches"><HeroCTAButton variant="outline">Open Matches</HeroCTAButton></LinkButton>
          <LinkButton to="/games/critical-ops"><HeroCTAButton variant="ghost">Game Hubs</HeroCTAButton></LinkButton>
        </ButtonRow>
      </Cta>
    </Page>
  );
};

export default PublicLandingPage;
