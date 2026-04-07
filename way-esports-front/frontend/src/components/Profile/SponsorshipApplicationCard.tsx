import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  sponsorshipService,
  SponsorshipApplicantType,
  SponsorshipApplication,
  SponsorshipApplicationStatus,
  SponsorshipTeamOption
} from '../../services/sponsorshipService';
import { resolveMediaUrl } from '../../utils/media';

const Container = styled(Card).attrs({ variant: 'outlined' })`
  padding: 24px;
  margin-bottom: 30px;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
  flex-wrap: wrap;
`;

const Title = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Subtitle = styled.p`
  margin: 8px 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.5;
`;

const RulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 10px;
  margin-bottom: 18px;
`;

const RuleItem = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.92rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
`;

const Field = styled.label`
  display: grid;
  gap: 6px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const Input = styled.input`
  min-height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(14, 15, 18, 0.75);
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Select = styled.select`
  min-height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(14, 15, 18, 0.75);
  color: ${({ theme }) => theme.colors.text.primary};
`;

const TextArea = styled.textarea`
  min-height: 110px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(14, 15, 18, 0.75);
  color: ${({ theme }) => theme.colors.text.primary};
  resize: vertical;
`;

const EligibilityPanel = styled.div<{ $eligible: boolean }>`
  margin: 18px 0;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid ${({ $eligible }) => ($eligible ? 'rgba(80, 200, 120, 0.45)' : 'rgba(255, 107, 107, 0.45)')};
  background: ${({ $eligible }) => ($eligible ? 'rgba(80, 200, 120, 0.08)' : 'rgba(255, 107, 107, 0.08)')};
`;

const EligibilityTitle = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
  margin-bottom: 8px;
`;

const MetricsRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
`;

const MetricBadge = styled.div`
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.06);
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.82rem;
`;

const ReasonList = styled.ul`
  margin: 8px 0 0;
  padding-left: 20px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const TeamPreview = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 12px 0 0;
`;

const TeamLogo = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.12);
`;

const TeamLogoFallback = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 107, 0, 0.18);
  color: #ffb98a;
  font-weight: 700;
`;

const TeamMeta = styled.div`
  min-width: 0;
`;

const TeamName = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
`;

const TeamSub = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.85rem;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 18px;
`;

const HistoryList = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 22px;
`;

const HistoryCard = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
`;

const StatusBadge = styled.span<{ $status: SponsorshipApplicationStatus }>`
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  border: 1px solid
    ${({ $status }) =>
      $status === 'approved'
        ? 'rgba(80, 200, 120, 0.5)'
        : $status === 'rejected'
          ? 'rgba(255, 107, 107, 0.5)'
          : $status === 'in_review'
            ? 'rgba(90, 170, 255, 0.5)'
            : 'rgba(255, 183, 77, 0.5)'};
  color:
    ${({ $status }) =>
      $status === 'approved'
        ? '#9af0b5'
        : $status === 'rejected'
          ? '#ffb0b0'
          : $status === 'in_review'
            ? '#a9d6ff'
            : '#ffd48a'};
  background:
    ${({ $status }) =>
      $status === 'approved'
        ? 'rgba(80, 200, 120, 0.12)'
        : $status === 'rejected'
          ? 'rgba(255, 107, 107, 0.12)'
          : $status === 'in_review'
            ? 'rgba(90, 170, 255, 0.12)'
            : 'rgba(255, 183, 77, 0.12)'};
`;

const HistoryMeta = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.84rem;
  line-height: 1.5;
`;

const EmptyState = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: 14px 0 4px;
`;

const normalizeDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : '-';
};

const getStatusLabel = (status: SponsorshipApplicationStatus): string => {
  if (status === 'in_review') return 'In review';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Pending';
};

const pickDefaultTeam = (teams: SponsorshipTeamOption[], applicantType: SponsorshipApplicantType): string => {
  const firstEligible = teams.find((team) => (
    applicantType === 'team'
      ? team.eligibility.team.eligible
      : team.eligibility.player.eligible
  ));
  return firstEligible?.id || teams[0]?.id || '';
};

const getEligibilityBranch = (
  team: SponsorshipTeamOption | undefined,
  applicantType: SponsorshipApplicantType
) => (applicantType === 'team' ? team?.eligibility.team : team?.eligibility.player);

const SponsorshipApplicationCard: React.FC = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const { data: overview, isLoading } = useQuery({
    queryKey: ['sponsorship', 'overview'],
    queryFn: sponsorshipService.getOverview,
    staleTime: 15000,
    refetchOnWindowFocus: false
  });

  const teams = overview?.teams || [];
  const applications = overview?.applications || [];
  const [applicantType, setApplicantType] = useState<SponsorshipApplicantType>('player');
  const [teamId, setTeamId] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactTelegram, setContactTelegram] = useState('');
  const [contactDiscord, setContactDiscord] = useState('');
  const [nicknamesInput, setNicknamesInput] = useState('');
  const [requestSummary, setRequestSummary] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!overview) return;
    if (!contactName) setContactName(overview.defaults.contactName || '');
    if (!contactEmail) setContactEmail(overview.defaults.contactEmail || '');
    if (!nicknamesInput) setNicknamesInput((overview.defaults.nicknames || []).join(', '));
  }, [overview, contactName, contactEmail, nicknamesInput]);

  useEffect(() => {
    if (!teams.length) {
      setTeamId('');
      return;
    }

    const exists = teams.some((team) => team.id === teamId);
    if (!exists) {
      setTeamId(pickDefaultTeam(teams, applicantType));
    }
  }, [teams, teamId, applicantType]);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === teamId),
    [teams, teamId]
  );
  const eligibility = getEligibilityBranch(selectedTeam, applicantType);
  const activeApplication = useMemo(
    () => applications.find((item) => (
      item.status !== 'approved'
      && item.status !== 'rejected'
      && item.applicantType === applicantType
      && item.team?.id === teamId
    )),
    [applications, applicantType, teamId]
  );

  const submitMutation = useMutation({
    mutationFn: sponsorshipService.submitApplication,
    onSuccess: async () => {
      setRequestSummary('');
      setComment('');
      await queryClient.invalidateQueries({ queryKey: ['sponsorship', 'overview'] });
      addNotification({
        type: 'success',
        title: 'Application sent',
        message: 'Your sponsorship application was created and moved to the admin review queue.'
      });
    },
    onError: (error: any) => {
      const details = Array.isArray(error?.payload?.details) ? error.payload.details.join(' ') : '';
      addNotification({
        type: 'error',
        title: 'Submission failed',
        message: details || error?.message || 'Failed to submit sponsorship application'
      });
    }
  });

  const handleSubmit = async () => {
    if (!teamId) {
      addNotification({
        type: 'warning',
        title: 'Team required',
        message: 'Select a team before sending the application.'
      });
      return;
    }

    await submitMutation.mutateAsync({
      applicantType,
      teamId,
      contactName,
      contactEmail,
      contactTelegram,
      contactDiscord,
      nicknames: nicknamesInput,
      requestSummary,
      comment
    });
  };

  return (
    <Container>
      <HeaderRow>
        <div>
          <Title>Sponsorship Request</Title>
          <Subtitle>
            Send a player or team sponsorship request from your profile. Review time is up to {overview?.reviewWindowDays || 14} days.
          </Subtitle>
        </div>
      </HeaderRow>

      <RulesGrid>
        <RuleItem>Player application: at least {overview?.requirements.playerTournamentWins || 2} tournament wins.</RuleItem>
        <RuleItem>Team application: at least {overview?.requirements.teamTournamentWins || 2} tournament wins.</RuleItem>
        <RuleItem>Team must be in the platform-wide top {overview?.requirements.teamTopRank || 20}.</RuleItem>
        <RuleItem>Team age must be at least {overview?.requirements.teamAgeMonths || 3} months.</RuleItem>
      </RulesGrid>

      {isLoading ? (
        <EmptyState>Loading sponsorship conditions...</EmptyState>
      ) : !teams.length ? (
        <EmptyState>Join or create an active team first. Team sponsorship requests are available only for active rosters linked to your profile.</EmptyState>
      ) : (
        <>
          <Grid>
            <Field>
              <span>Application type</span>
              <Select
                value={applicantType}
                onChange={(e) => setApplicantType(e.target.value as SponsorshipApplicantType)}
              >
                <option value="player">Player</option>
                <option value="team">Team</option>
              </Select>
            </Field>

            <Field>
              <span>Team</span>
              <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} [{team.tag}] - {team.game}
                  </option>
                ))}
              </Select>
            </Field>

            <Field>
              <span>Contact name</span>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} maxLength={120} />
            </Field>

            <Field>
              <span>Email</span>
              <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} maxLength={180} />
            </Field>

            <Field>
              <span>Telegram</span>
              <Input value={contactTelegram} onChange={(e) => setContactTelegram(e.target.value)} maxLength={120} />
            </Field>

            <Field>
              <span>Discord</span>
              <Input value={contactDiscord} onChange={(e) => setContactDiscord(e.target.value)} maxLength={120} />
            </Field>
          </Grid>

          {selectedTeam ? (
            <TeamPreview>
              {resolveMediaUrl(selectedTeam.logo) ? (
                <TeamLogo src={resolveMediaUrl(selectedTeam.logo)} alt={selectedTeam.name} />
              ) : (
                <TeamLogoFallback>{selectedTeam.tag || selectedTeam.name.slice(0, 2).toUpperCase()}</TeamLogoFallback>
              )}
                <TeamMeta>
                  <TeamName>{selectedTeam.name} [{selectedTeam.tag}]</TeamName>
                  <TeamSub>
                  {selectedTeam.game} - {selectedTeam.isCaptain ? 'Captain access' : 'Member access'}
                  </TeamSub>
                </TeamMeta>
            </TeamPreview>
          ) : null}

          <EligibilityPanel $eligible={Boolean(eligibility?.eligible) && !activeApplication}>
            <EligibilityTitle>
              {activeApplication
                ? 'An active request for this team and type already exists.'
                : eligibility?.eligible
                  ? 'Eligibility confirmed. You can submit this request.'
                  : 'Conditions are not met yet.'}
            </EligibilityTitle>

            {selectedTeam ? (
              <MetricsRow>
                <MetricBadge>Player wins: {selectedTeam.metrics.userTournamentWins}</MetricBadge>
                <MetricBadge>Team wins: {selectedTeam.metrics.teamTournamentWins}</MetricBadge>
                <MetricBadge>Team rank: {selectedTeam.metrics.teamRank ? `#${selectedTeam.metrics.teamRank}` : 'Unranked'}</MetricBadge>
                <MetricBadge>Team age: {selectedTeam.metrics.teamAgeDays} days</MetricBadge>
              </MetricsRow>
            ) : null}

            {activeApplication ? (
              <ReasonList>
                <li>Status: {getStatusLabel(activeApplication.status)}</li>
                <li>Submitted: {normalizeDate(activeApplication.createdAt)}</li>
                <li>Review deadline: {normalizeDate(activeApplication.reviewDeadlineAt)}</li>
              </ReasonList>
            ) : !eligibility?.eligible ? (
              <ReasonList>
                {(eligibility?.reasons || []).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ReasonList>
            ) : null}
          </EligibilityPanel>

          <Grid>
            <Field>
              <span>Nicknames</span>
              <TextArea
                value={nicknamesInput}
                onChange={(e) => setNicknamesInput(e.target.value)}
                placeholder="One nickname per line or comma separated"
              />
            </Field>

            <Field>
              <span>Request</span>
              <Input
                value={requestSummary}
                onChange={(e) => setRequestSummary(e.target.value)}
                maxLength={200}
                placeholder="What kind of sponsorship support do you need?"
              />
            </Field>
          </Grid>

          <Field style={{ marginTop: 14 }}>
            <span>Comment</span>
            <TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              placeholder="Add goals, achievements, social links, tournament plans, or any context for the admin team."
            />
          </Field>

          <ActionRow>
            <Button
              onClick={handleSubmit}
              disabled={!teamId || !eligibility?.eligible || Boolean(activeApplication) || submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Sending...' : 'Send application'}
            </Button>
          </ActionRow>
        </>
      )}

      <Title style={{ marginTop: 28, fontSize: '1.05rem' }}>My Applications</Title>
      {!applications.length ? (
        <EmptyState>No sponsorship applications yet.</EmptyState>
      ) : (
        <HistoryList>
          {applications.map((item: SponsorshipApplication) => (
            <HistoryCard key={item.id}>
              <HistoryHeader>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600 }}>
                    {item.applicantType === 'team' ? 'Team' : 'Player'} request
                    {item.team?.name ? ` - ${item.team.name}` : ''}
                  </div>
                  <HistoryMeta>
                    Submitted {normalizeDate(item.createdAt)} - Review until {normalizeDate(item.reviewDeadlineAt)}
                  </HistoryMeta>
                </div>
                <StatusBadge $status={item.status}>{getStatusLabel(item.status)}</StatusBadge>
              </HistoryHeader>

              <HistoryMeta>
                Request: {item.requestSummary}
              </HistoryMeta>
              {item.comment ? <HistoryMeta>Comment: {item.comment}</HistoryMeta> : null}
              {item.reviewComment ? <HistoryMeta>Admin note: {item.reviewComment}</HistoryMeta> : null}
            </HistoryCard>
          ))}
        </HistoryList>
      )}
    </Container>
  );
};

export default SponsorshipApplicationCard;
