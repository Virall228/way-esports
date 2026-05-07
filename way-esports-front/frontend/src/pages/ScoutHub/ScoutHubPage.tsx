import React from 'react';
import styled from 'styled-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../services/api';
import { playerPromotionService, PlayerPromotionDashboard } from '../../services/playerPromotionService';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Hero = styled.section`
  padding: 1.5rem;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.08), transparent 40%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h1`
  margin: 0 0 0.5rem;
  font-size: clamp(1.8rem, 3vw, 2.6rem);
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 760px;
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
  font-size: 1.9rem;
  font-weight: 700;
`;

const Form = styled.form`
  display: grid;
  gap: 1rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
`;

const Field = styled.label`
  display: grid;
  gap: 0.45rem;
  font-size: 0.92rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(7, 10, 16, 0.8);
  color: inherit;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(7, 10, 16, 0.8);
  color: inherit;
  resize: vertical;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(7, 10, 16, 0.8);
  color: inherit;
`;

const Toggle = styled.label`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const Button = styled.button<{ $secondary?: boolean }>`
  padding: 0.9rem 1.2rem;
  border-radius: 14px;
  border: 1px solid ${({ $secondary }) => ($secondary ? 'rgba(255,255,255,0.12)' : 'rgba(255, 107, 0, 0.45)')};
  background: ${({ $secondary }) => ($secondary ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, #ff6b00, #ff8d3a)')};
  color: white;
  cursor: pointer;
  font-weight: 700;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`;

const Chip = styled.span`
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 107, 0, 0.12);
  border: 1px solid rgba(255, 107, 0, 0.22);
  font-size: 0.85rem;
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

const EmptyState = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
`;

const parseCsv = (value: string): string[] => (
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
);

const buildInitialForm = (dashboard?: PlayerPromotionDashboard | null) => ({
  slug: dashboard?.settings?.slug || '',
  headline: dashboard?.settings?.headline || '',
  scoutPitch: dashboard?.settings?.scoutPitch || '',
  targetGames: (dashboard?.settings?.targetGames || []).join(', '),
  targetRoles: (dashboard?.settings?.targetRoles || []).join(', '),
  targetTeams: (dashboard?.settings?.targetTeams || []).join(', '),
  visibility: dashboard?.settings?.visibility || 'scouts',
  focus: dashboard?.settings?.focus || 'balanced',
  enabled: Boolean(dashboard?.settings?.enabled)
});

const ScoutHubPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery<PlayerPromotionDashboard>({
    queryKey: ['player-promotion-dashboard'],
    queryFn: () => playerPromotionService.getDashboard(),
    staleTime: 30_000
  });
  const { data: leaderboard } = useQuery<any[]>({
    queryKey: ['player-promotion-public-leaderboard-preview'],
    queryFn: () => playerPromotionService.getPublicLeaderboard({ limit: 5 }),
    staleTime: 30_000
  });

  const [form, setForm] = React.useState(buildInitialForm());

  React.useEffect(() => {
    if (data) {
      setForm(buildInitialForm(data));
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: () => playerPromotionService.updateSettings({
      slug: form.slug,
      headline: form.headline,
      scoutPitch: form.scoutPitch,
      targetGames: parseCsv(form.targetGames),
      targetRoles: parseCsv(form.targetRoles),
      targetTeams: parseCsv(form.targetTeams),
      visibility: form.visibility,
      focus: form.focus,
      enabled: form.enabled
    }),
    onSuccess: (nextDashboard) => {
      queryClient.setQueryData(['player-promotion-dashboard'], nextDashboard);
    }
  });

  const refreshMutation = useMutation({
    mutationFn: () => playerPromotionService.refresh(),
    onSuccess: (nextDashboard) => {
      queryClient.setQueryData(['player-promotion-dashboard'], nextDashboard);
    }
  });

  if (isLoading) {
    return <Page>Loading Scout Hub...</Page>;
  }

  if (error) {
    return <Page>Failed to load Scout Hub: {(error as Error).message}</Page>;
  }

  const dashboard = data as PlayerPromotionDashboard;
  const snapshot = dashboard?.snapshot || {};
  const trainingPlan = snapshot?.trainingPlan;

  const mutationError = updateMutation.error as ApiError | undefined;
  const mutationMessage = mutationError?.message || '';

  return (
    <Page>
      <Hero>
        <Title>Scout Hub</Title>
        <Subtitle>
          Subscriber-only player promotion for scouts, team owners and public discovery.
          This dashboard turns your current stats into a scout-facing pitch, leaderboard score and training plan.
        </Subtitle>
      </Hero>

      <Grid>
        <Panel>
          <Label>Scout Score</Label>
          <Value>{Math.round(snapshot?.leaderboardScore || 0)}</Value>
        </Panel>
        <Panel>
          <Label>Best Game</Label>
          <Value>{snapshot?.bestGame || 'Unknown'}</Value>
        </Panel>
        <Panel>
          <Label>Best Role</Label>
          <Value>{snapshot?.bestRole || 'Flex'}</Value>
        </Panel>
        <Panel>
          <Label>Public URL</Label>
          <Value style={{ fontSize: '1rem', wordBreak: 'break-word' }}>{snapshot?.publicUrl || '/scouts/...'}</Value>
        </Panel>
      </Grid>

      <Panel>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            updateMutation.mutate();
          }}
        >
          <Label>Promotion Settings</Label>
          <FormGrid>
            <Field>
              Public slug
              <Input value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
            </Field>
            <Field>
              Visibility
              <Select value={form.visibility} onChange={(event) => setForm((prev) => ({ ...prev, visibility: event.target.value as any }))}>
                <option value="private">Private</option>
                <option value="scouts">Scouts</option>
                <option value="public">Public</option>
              </Select>
            </Field>
            <Field>
              Focus mode
              <Select value={form.focus} onChange={(event) => setForm((prev) => ({ ...prev, focus: event.target.value as any }))}>
                <option value="balanced">Balanced</option>
                <option value="ranked">Ranked grind</option>
                <option value="tournament">Tournament prep</option>
                <option value="trial">Team trial</option>
              </Select>
            </Field>
            <Field>
              Target games
              <Input value={form.targetGames} onChange={(event) => setForm((prev) => ({ ...prev, targetGames: event.target.value }))} placeholder="CS2, Critical Ops, Mobile Legends: Bang Bang" />
            </Field>
            <Field>
              Target roles
              <Input value={form.targetRoles} onChange={(event) => setForm((prev) => ({ ...prev, targetRoles: event.target.value }))} placeholder="Entry, Flex" />
            </Field>
            <Field>
              Target teams
              <Input value={form.targetTeams} onChange={(event) => setForm((prev) => ({ ...prev, targetTeams: event.target.value }))} placeholder="academy, semi-pro, org owners" />
            </Field>
          </FormGrid>

          <Field>
            Headline
            <Input value={form.headline} onChange={(event) => setForm((prev) => ({ ...prev, headline: event.target.value }))} />
          </Field>

          <Field>
            Scout pitch
            <TextArea value={form.scoutPitch} onChange={(event) => setForm((prev) => ({ ...prev, scoutPitch: event.target.value }))} />
          </Field>

          <Toggle>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => setForm((prev) => ({ ...prev, enabled: event.target.checked }))}
            />
            Publish my scout profile to the leaderboard
          </Toggle>
          {mutationMessage ? <EmptyState>{mutationMessage}</EmptyState> : null}

          <ButtonRow>
            <Button type="submit" disabled={updateMutation.isPending}>Save settings</Button>
            <Button
              type="button"
              $secondary
              disabled={refreshMutation.isPending}
              onClick={() => refreshMutation.mutate()}
            >
              Refresh insights
            </Button>
          </ButtonRow>
        </Form>
      </Panel>

      <Grid>
        <Panel>
          <Label>Scout Pitch</Label>
          <Value style={{ fontSize: '1.1rem', lineHeight: 1.5 }}>{snapshot?.scoutPitch || 'No pitch yet.'}</Value>
        </Panel>
        <Panel>
          <Label>Best Fits</Label>
          <ChipRow>
            {(snapshot?.recommendations?.bestFits || []).map((item: string) => (
              <Chip key={item}>{item}</Chip>
            ))}
          </ChipRow>
        </Panel>
      </Grid>

      <Grid>
        <Panel>
          <Label>Training Plan</Label>
          {trainingPlan?.focusAreas?.length ? (
            <List>
              {trainingPlan.focusAreas.map((item: any) => (
                <ListItem key={item.key}>
                  <strong>{item.label}</strong>
                  <div>Current: {item.currentScore} / Target: {item.targetScore}</div>
                  <div>{item.recommendation}</div>
                </ListItem>
              ))}
            </List>
          ) : (
            <EmptyState>No training plan available yet.</EmptyState>
          )}
          <div style={{ marginTop: '0.75rem', color: '#b7bcc7' }}>
            {trainingPlan?.dailyHours || 0}h per day | {trainingPlan?.weeklyHours || 0}h per week | {trainingPlan?.sessionsPerWeek || 0} sessions
          </div>
        </Panel>

        <Panel>
          <Label>Recommended Tournaments</Label>
          {(snapshot?.recommendations?.tournaments || []).length ? (
            <List>
              {snapshot.recommendations.tournaments.map((item: any) => (
                <ListItem key={item.id}>
                  <strong>{item.name}</strong>
                  <div>{item.game} | ${Number(item.prizePool || 0).toLocaleString()}</div>
                  <div>{item.reason}</div>
                </ListItem>
              ))}
            </List>
          ) : (
            <EmptyState>No matching tournaments yet.</EmptyState>
          )}
        </Panel>
      </Grid>

      <Panel>
        <Label>Public Leaderboard Preview</Label>
        {(leaderboard || []).length ? (
          <List>
            {(leaderboard || []).map((item: any) => (
              <ListItem key={item.slug}>
                <strong>#{item.rank} {item.username}</strong>
                <div>{item.bestGame} | {item.bestRole}</div>
                <div>Scout score {Math.round(item.leaderboardScore || 0)} | {item.headline}</div>
              </ListItem>
            ))}
          </List>
        ) : (
          <EmptyState>No public leaderboard entries yet.</EmptyState>
        )}
      </Panel>
    </Page>
  );
};

export default ScoutHubPage;
