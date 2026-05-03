import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { playerPromotionService } from '../../services/playerPromotionService';

const Page = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const Hero = styled.section`
  padding: 1.6rem;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.08), transparent 40%),
    linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
`;

const Headline = styled.h1`
  margin: 0 0 0.5rem;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
`;

const Subline = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
`;

const Panel = styled.section`
  padding: 1.2rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const Label = styled.div`
  font-size: 0.78rem;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Value = styled.div`
  margin-top: 0.45rem;
  font-size: 1.7rem;
  font-weight: 700;
`;

const List = styled.div`
  display: grid;
  gap: 0.8rem;
`;

const ListItem = styled.div`
  padding: 0.9rem 1rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`;

const Chip = styled.span`
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 0.85rem;
`;

type PublicScoutProfile = any;

const PublicScoutProfilePage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();

  const { data, isLoading, error } = useQuery<PublicScoutProfile>({
    queryKey: ['public-scout-profile', identifier],
    queryFn: () => playerPromotionService.getPublicProfile(String(identifier || '')),
    enabled: Boolean(identifier),
    staleTime: 30_000
  });

  React.useEffect(() => {
    if (!data?.seo) return;

    const canonicalPath = `/scouts/${data.slug || identifier || ''}`;
    const canonicalHref = typeof window !== 'undefined'
      ? new URL(canonicalPath, window.location.origin).toString()
      : canonicalPath;

    document.title = data.seo.title;
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.setAttribute('name', 'description');
      document.head.appendChild(description);
    }
    description.setAttribute('content', data.seo.description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalHref);
  }, [data, identifier]);

  if (isLoading) return <Page>Loading scout profile...</Page>;
  if (error || !data) return <Page>Scout profile not found.</Page>;

  const canonicalUrl = typeof window !== 'undefined'
    ? new URL(`/scouts/${data.slug || identifier || ''}`, window.location.origin).toString()
    : `/scouts/${data.slug || identifier || ''}`;
  const structuredData = data.structuredData
    ? {
        ...data.structuredData,
        url: canonicalUrl
      }
    : null;

  return (
    <Page>
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      ) : null}
      <Hero>
        <Headline>{data.username}</Headline>
        <Subline>{data.headline}</Subline>
        <Subline style={{ marginTop: '0.75rem' }}>{data.scoutPitch}</Subline>
      </Hero>

      <Grid>
        <Panel>
          <Label>Scout Score</Label>
          <Value>{Math.round(data.leaderboardScore || 0)}</Value>
        </Panel>
        <Panel>
          <Label>Best Game</Label>
          <Value>{data.bestGame}</Value>
        </Panel>
        <Panel>
          <Label>Best Role</Label>
          <Value>{data.bestRole}</Value>
        </Panel>
        <Panel>
          <Label>Momentum</Label>
          <Value>{data.momentum?.label || 'Stable'}</Value>
        </Panel>
      </Grid>

      <Grid>
        <Panel>
          <Label>Metrics</Label>
          <List>
            <ListItem>Impact rating: {Math.round(data.metrics?.impactRating || 0)}</ListItem>
            <ListItem>Win rate: {Math.round(data.metrics?.winRate || 0)}%</ListItem>
            <ListItem>Consistency: {Math.round(data.metrics?.consistencyScore || 0)}</ListItem>
            <ListItem>Leadership: {Math.round(data.metrics?.leadership || 0)}</ListItem>
          </List>
        </Panel>

        <Panel>
          <Label>Best Fits</Label>
          <ChipRow>
            {(data.recommendations?.bestFits || []).map((item: string) => (
              <Chip key={item}>{item}</Chip>
            ))}
          </ChipRow>
        </Panel>
      </Grid>

      <Grid>
        <Panel>
          <Label>Training Plan</Label>
          <List>
            {(data.trainingPlan?.focusAreas || []).map((item: any) => (
              <ListItem key={item.key}>
                <strong>{item.label}</strong>
                <div>Current: {item.currentScore} / Target: {item.targetScore}</div>
                <div>{item.recommendation}</div>
              </ListItem>
            ))}
          </List>
        </Panel>

        <Panel>
          <Label>Recommended Teams</Label>
          <List>
            {(data.recommendations?.teams || []).map((item: any) => (
              <ListItem key={item.id}>
                <strong>{item.name}</strong>
                <div>{item.game} | {Math.round(item.winRate || 0)}% win rate</div>
                <div>{item.reason}</div>
              </ListItem>
            ))}
          </List>
        </Panel>
      </Grid>

      <Grid>
        <Panel>
          <Label>Tournament Matches</Label>
          <List>
            {(data.recommendations?.tournaments || []).map((item: any) => (
              <ListItem key={item.id}>
                <strong>{item.name}</strong>
                <div>{item.game} | ${Number(item.prizePool || 0).toLocaleString()}</div>
                <div>{item.reason}</div>
              </ListItem>
            ))}
          </List>
        </Panel>

        <Panel>
          <Label>Timeline</Label>
          <List>
            {(data.timeline || []).map((item: any, index: number) => (
              <ListItem key={`${item.teamName}-${item.period}-${index}`}>
                <strong>{item.period}</strong>
                <div>{item.teamName}</div>
                <div>Placement #{item.position} | Prize ${Number(item.prize || 0).toLocaleString()}</div>
              </ListItem>
            ))}
          </List>
        </Panel>
      </Grid>
    </Page>
  );
};

export default PublicScoutProfilePage;
