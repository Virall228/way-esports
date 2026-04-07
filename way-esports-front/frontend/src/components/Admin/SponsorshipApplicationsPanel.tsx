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
  SponsorshipApplicationStatus
} from '../../services/sponsorshipService';
import { resolveMediaUrl } from '../../utils/media';

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
`;

const StatCard = styled(Card).attrs({ variant: 'outlined' })`
  padding: 14px;
`;

const StatValue = styled.div`
  color: #ff6b00;
  font-size: 1.5rem;
  font-weight: 700;
`;

const StatLabel = styled.div`
  color: #cccccc;
  font-size: 0.84rem;
`;

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
`;

const Input = styled.input`
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(20, 20, 20, 0.86);
  color: #ffffff;
  padding: 0 12px;
`;

const Select = styled.select`
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(20, 20, 20, 0.86);
  color: #ffffff;
  padding: 0 12px;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 16px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: #ffffff;
`;

const Th = styled.th`
  text-align: left;
  padding: 10px 12px;
  font-size: 0.82rem;
  color: #ffb280;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Td = styled.td`
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  vertical-align: top;
  font-size: 0.9rem;
`;

const ClickableRow = styled.tr<{ $selected: boolean }>`
  background: ${({ $selected }) => ($selected ? 'rgba(255, 107, 0, 0.12)' : 'transparent')};
  cursor: pointer;

  &:hover {
    background: rgba(255, 107, 0, 0.08);
  }
`;

const StatusBadge = styled.span<{ $status: SponsorshipApplicationStatus }>`
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
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

const DetailsCard = styled(Card).attrs({ variant: 'outlined' })`
  padding: 16px;
  min-height: 100%;
`;

const DetailLabel = styled.div`
  color: #8f8f8f;
  font-size: 0.8rem;
  margin-bottom: 4px;
`;

const DetailValue = styled.div`
  color: #ffffff;
  margin-bottom: 12px;
  line-height: 1.5;
  word-break: break-word;
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 16px 0;
`;

const TeamRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const TeamLogo = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.12);
`;

const TeamFallback = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(255, 107, 0, 0.16);
  color: #ffb280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
`;

const MetricsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
`;

const MetricCard = styled.div`
  border-radius: 10px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
`;

const MetricLabel = styled.div`
  color: #9a9a9a;
  font-size: 0.75rem;
`;

const MetricValue = styled.div`
  color: #ffffff;
  font-weight: 600;
  margin-top: 6px;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(20, 20, 20, 0.86);
  color: #ffffff;
  resize: vertical;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
`;

const normalizeDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : '-';
};

const getStatusLabel = (status: SponsorshipApplicationStatus) => {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  if (status === 'in_review') return 'In Review';
  return 'Pending';
};

const getTypeLabel = (type: SponsorshipApplicantType) => (type === 'team' ? 'Team' : 'Player');

const SponsorshipApplicationsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SponsorshipApplicationStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | SponsorshipApplicantType>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  const applicationsQuery = useQuery({
    queryKey: ['admin', 'sponsorship-applications', page, search, statusFilter, typeFilter],
    queryFn: () => sponsorshipService.getAdminApplications({
      page,
      limit: 25,
      search,
      status: statusFilter,
      type: typeFilter
    }),
    staleTime: 10000,
    refetchOnWindowFocus: false
  });

  const items = applicationsQuery.data?.items || [];
  const pagination = applicationsQuery.data?.pagination || null;
  const summary = applicationsQuery.data?.summary || null;

  const selectedApplication = useMemo(
    () => items.find((item) => item.id === selectedId) || items[0] || null,
    [items, selectedId]
  );

  useEffect(() => {
    if (!selectedApplication && items[0]) {
      setSelectedId(items[0].id);
    }
    if (selectedApplication && selectedId !== selectedApplication.id) {
      setSelectedId(selectedApplication.id);
    }
  }, [items, selectedApplication, selectedId]);

  useEffect(() => {
    setReviewComment(selectedApplication?.reviewComment || '');
  }, [selectedApplication?.id, selectedApplication?.reviewComment]);

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { id: string; status: SponsorshipApplicationStatus; reviewComment?: string }) => (
      sponsorshipService.updateApplicationStatus(payload.id, {
        status: payload.status,
        reviewComment: payload.reviewComment
      })
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'sponsorship-applications'] });
      addNotification({
        type: 'success',
        title: 'Status updated',
        message: 'Sponsorship application status was updated.'
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update failed',
        message: error?.message || 'Failed to update sponsorship application'
      });
    }
  });

  const applyStatus = async (status: SponsorshipApplicationStatus) => {
    if (!selectedApplication) return;
    await updateStatusMutation.mutateAsync({
      id: selectedApplication.id,
      status,
      reviewComment
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0 }}>Sponsorship Applications</h3>
          <div style={{ color: '#cccccc', marginTop: 6, fontSize: 13 }}>
            Manage player and team sponsorship requests with built-in eligibility snapshots and 14-day review deadlines.
          </div>
        </div>
        <Button onClick={() => applicationsQuery.refetch()} disabled={applicationsQuery.isFetching}>
          {applicationsQuery.isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <StatGrid>
        <StatCard><StatValue>{Number(summary?.filteredTotal || items.length)}</StatValue><StatLabel>Filtered total</StatLabel></StatCard>
        <StatCard><StatValue>{Number(summary?.pendingCount || 0)}</StatValue><StatLabel>Pending</StatLabel></StatCard>
        <StatCard><StatValue>{Number(summary?.inReviewCount || 0)}</StatValue><StatLabel>In review</StatLabel></StatCard>
        <StatCard><StatValue>{Number(summary?.overdueCount || 0)}</StatValue><StatLabel>Overdue</StatLabel></StatCard>
      </StatGrid>

      <FilterRow>
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search applicant, team, email, request"
        />
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_review">In review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
        <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1); }}>
          <option value="all">All types</option>
          <option value="player">Player</option>
          <option value="team">Team</option>
        </Select>
        <Button
          onClick={() => {
            setSearch(searchInput.trim());
            setPage(1);
          }}
        >
          Search
        </Button>
      </FilterRow>

      <Layout>
        <Card variant="outlined" style={{ padding: 0 }}>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Applicant</Th>
                  <Th>Type</Th>
                  <Th>Team</Th>
                  <Th>Status</Th>
                  <Th>Deadline</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <ClickableRow
                    key={item.id}
                    $selected={selectedApplication?.id === item.id}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <Td>
                      <div style={{ fontWeight: 600 }}>{item.submittedBy?.displayName || item.contactName}</div>
                      <div style={{ color: '#a0a0a0', fontSize: 12 }}>{item.contactEmail}</div>
                    </Td>
                    <Td>{getTypeLabel(item.applicantType)}</Td>
                    <Td>
                      <div>{item.team?.name || '-'}</div>
                      <div style={{ color: '#a0a0a0', fontSize: 12 }}>{item.team?.tag ? `[${item.team.tag}]` : ''}</div>
                    </Td>
                    <Td><StatusBadge $status={item.status}>{getStatusLabel(item.status)}</StatusBadge></Td>
                    <Td style={{ color: item.isOverdue ? '#ff9d9d' : '#cccccc' }}>{normalizeDate(item.reviewDeadlineAt)}</Td>
                  </ClickableRow>
                ))}
              </tbody>
            </Table>
          </TableWrap>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 14, flexWrap: 'wrap' }}>
            <div style={{ color: '#cccccc', fontSize: 13 }}>
              Page {pagination?.page || page} of {pagination?.totalPages || 1}
              {pagination ? ` - total ${pagination.total}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                variant="outline"
                size="small"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={(pagination?.page || page) <= 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={() => setPage((prev) => {
                  const totalPages = pagination?.totalPages || 1;
                  return Math.min(totalPages, prev + 1);
                })}
                disabled={(pagination?.page || page) >= (pagination?.totalPages || 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>

        <DetailsCard>
          {!selectedApplication ? (
            <div style={{ color: '#cccccc' }}>Select an application to inspect details.</div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <div>
                  <div style={{ color: '#ffffff', fontSize: 20, fontWeight: 700 }}>
                    {selectedApplication.submittedBy?.displayName || selectedApplication.contactName}
                  </div>
                  <div style={{ color: '#cccccc', marginTop: 4 }}>
                    {getTypeLabel(selectedApplication.applicantType)} sponsorship request
                  </div>
                </div>
                <StatusBadge $status={selectedApplication.status}>{getStatusLabel(selectedApplication.status)}</StatusBadge>
              </div>

              <TeamRow>
                {resolveMediaUrl(selectedApplication.team?.logo || '') ? (
                  <TeamLogo src={resolveMediaUrl(selectedApplication.team?.logo || '')} alt={selectedApplication.team?.name || 'Team'} />
                ) : (
                  <TeamFallback>{selectedApplication.team?.tag || selectedApplication.team?.name?.slice(0, 2).toUpperCase() || 'TM'}</TeamFallback>
                )}
                <div>
                  <div style={{ color: '#ffffff', fontWeight: 600 }}>{selectedApplication.team?.name || 'No team'}</div>
                  <div style={{ color: '#a0a0a0', fontSize: 13 }}>
                    {selectedApplication.team?.tag ? `[${selectedApplication.team.tag}] ` : ''}{selectedApplication.team?.game || ''}
                  </div>
                </div>
              </TeamRow>

              <Divider />

              <DetailLabel>Request summary</DetailLabel>
              <DetailValue>{selectedApplication.requestSummary}</DetailValue>

              <DetailLabel>Comment</DetailLabel>
              <DetailValue>{selectedApplication.comment || '-'}</DetailValue>

              <DetailLabel>Nicknames</DetailLabel>
              <DetailValue>{selectedApplication.nicknames.length ? selectedApplication.nicknames.join(', ') : '-'}</DetailValue>

              <DetailLabel>Contacts</DetailLabel>
              <DetailValue>
                Email: {selectedApplication.contactEmail || '-'}<br />
                Telegram: {selectedApplication.contactTelegram || '-'}<br />
                Discord: {selectedApplication.contactDiscord || '-'}
              </DetailValue>

              <DetailLabel>Timeline</DetailLabel>
              <DetailValue>
                Submitted: {normalizeDate(selectedApplication.createdAt)}<br />
                Deadline: {normalizeDate(selectedApplication.reviewDeadlineAt)}<br />
                Last review: {normalizeDate(selectedApplication.review.reviewedAt)}
              </DetailValue>

              <Divider />

              <DetailLabel>Eligibility snapshot</DetailLabel>
              <MetricsList>
                <MetricCard><MetricLabel>Player wins</MetricLabel><MetricValue>{selectedApplication.eligibilitySnapshot?.userTournamentWins ?? 0}</MetricValue></MetricCard>
                <MetricCard><MetricLabel>Team wins</MetricLabel><MetricValue>{selectedApplication.eligibilitySnapshot?.teamTournamentWins ?? 0}</MetricValue></MetricCard>
                <MetricCard><MetricLabel>Team rank</MetricLabel><MetricValue>{selectedApplication.eligibilitySnapshot?.teamRank ? `#${selectedApplication.eligibilitySnapshot.teamRank}` : 'Unranked'}</MetricValue></MetricCard>
                <MetricCard><MetricLabel>Team age</MetricLabel><MetricValue>{selectedApplication.eligibilitySnapshot?.teamAgeDays ?? 0} days</MetricValue></MetricCard>
              </MetricsList>

              {selectedApplication.eligibilitySnapshot?.reasons?.length ? (
                <>
                  <DetailLabel>Eligibility notes</DetailLabel>
                  <DetailValue>{selectedApplication.eligibilitySnapshot.reasons.join(' ')}</DetailValue>
                </>
              ) : null}

              <Divider />

              <DetailLabel>Review comment</DetailLabel>
              <TextArea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Write an admin comment that explains the decision or current review state."
              />

              <ActionRow>
                <Button
                  variant="outline"
                  onClick={() => applyStatus('pending')}
                  disabled={updateStatusMutation.isPending}
                >
                  Move to Pending
                </Button>
                <Button
                  variant="outline"
                  onClick={() => applyStatus('in_review')}
                  disabled={updateStatusMutation.isPending}
                >
                  Mark In Review
                </Button>
                <Button
                  variant="success"
                  onClick={() => applyStatus('approved')}
                  disabled={updateStatusMutation.isPending}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => applyStatus('rejected')}
                  disabled={updateStatusMutation.isPending}
                >
                  Reject
                </Button>
              </ActionRow>
            </>
          )}
        </DetailsCard>
      </Layout>
    </div>
  );
};

export default SponsorshipApplicationsPanel;
