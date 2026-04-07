import { api } from './api';

export type SponsorshipApplicantType = 'player' | 'team';
export type SponsorshipApplicationStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

export interface SponsorshipEligibilityBranch {
  eligible: boolean;
  reasons: string[];
}

export interface SponsorshipTeamOption {
  id: string;
  name: string;
  tag: string;
  game: string;
  logo: string;
  createdAt: string | null;
  isCaptain: boolean;
  isMember: boolean;
  metrics: {
    userTournamentWins: number;
    teamTournamentWins: number;
    teamRank: number | null;
    isTop20: boolean;
    teamAgeDays: number;
    teamAgeEligibleAt: string | null;
    isTeamOldEnough: boolean;
  };
  eligibility: {
    player: SponsorshipEligibilityBranch;
    team: SponsorshipEligibilityBranch;
  };
}

export interface SponsorshipApplication {
  id: string;
  applicantType: SponsorshipApplicantType;
  status: SponsorshipApplicationStatus;
  contactName: string;
  contactEmail: string;
  contactTelegram: string;
  contactDiscord: string;
  nicknames: string[];
  requestSummary: string;
  comment: string;
  reviewComment: string;
  createdAt: string | null;
  updatedAt: string | null;
  reviewDeadlineAt: string | null;
  isOverdue: boolean;
  submittedBy: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    telegramId: number;
    displayName: string;
    role: string;
  } | null;
  team: {
    id: string;
    name: string;
    tag: string;
    game: string;
    logo: string;
    createdAt: string | null;
  } | null;
  review: {
    reviewedAt: string | null;
    reviewer: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      email: string;
      telegramId: number;
      displayName: string;
      role: string;
    } | null;
    comment: string;
  };
  eligibilitySnapshot: {
    checkedAt: string | null;
    userTournamentWins: number;
    teamTournamentWins: number;
    teamRank: number | null;
    isTop20: boolean;
    topRankLimit: number;
    teamCreatedAt: string | null;
    teamAgeDays: number;
    teamAgeEligibleAt: string | null;
    minTeamAgeMonths: number;
    isTeamOldEnough: boolean;
    applicantEligible: boolean;
    reasons: string[];
  } | null;
  statusTimeline: Array<{
    status: SponsorshipApplicationStatus;
    note: string;
    createdAt: string | null;
    actorId: string | null;
  }>;
}

export interface SponsorshipOverview {
  reviewWindowDays: number;
  requirements: {
    playerTournamentWins: number;
    teamTournamentWins: number;
    teamTopRank: number;
    teamAgeMonths: number;
  };
  defaults: {
    contactName: string;
    contactEmail: string;
    nicknames: string[];
  };
  teams: SponsorshipTeamOption[];
  applications: SponsorshipApplication[];
}

export interface SponsorshipAdminSummary {
  filteredTotal: number;
  pendingCount: number;
  inReviewCount: number;
  approvedCount: number;
  rejectedCount: number;
  overdueCount: number;
}

export interface SponsorshipAdminListResponse {
  items: SponsorshipApplication[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  summary: SponsorshipAdminSummary | null;
}

export interface CreateSponsorshipApplicationPayload {
  applicantType: SponsorshipApplicantType;
  teamId: string;
  contactName: string;
  contactEmail: string;
  contactTelegram?: string;
  contactDiscord?: string;
  nicknames: string[] | string;
  requestSummary: string;
  comment?: string;
}

const normalizeApplication = (row: any): SponsorshipApplication => ({
  id: String(row?.id || row?._id || ''),
  applicantType: (row?.applicantType || 'player') as SponsorshipApplicantType,
  status: (row?.status || 'pending') as SponsorshipApplicationStatus,
  contactName: String(row?.contactName || ''),
  contactEmail: String(row?.contactEmail || ''),
  contactTelegram: String(row?.contactTelegram || ''),
  contactDiscord: String(row?.contactDiscord || ''),
  nicknames: Array.isArray(row?.nicknames) ? row.nicknames.map((value: any) => String(value || '')).filter(Boolean) : [],
  requestSummary: String(row?.requestSummary || ''),
  comment: String(row?.comment || ''),
  reviewComment: String(row?.reviewComment || ''),
  createdAt: row?.createdAt ? String(row.createdAt) : null,
  updatedAt: row?.updatedAt ? String(row.updatedAt) : null,
  reviewDeadlineAt: row?.reviewDeadlineAt ? String(row.reviewDeadlineAt) : null,
  isOverdue: Boolean(row?.isOverdue),
  submittedBy: row?.submittedBy
    ? {
        id: String(row.submittedBy.id || row.submittedBy._id || ''),
        username: String(row.submittedBy.username || ''),
        firstName: String(row.submittedBy.firstName || ''),
        lastName: String(row.submittedBy.lastName || ''),
        email: String(row.submittedBy.email || ''),
        telegramId: Number(row.submittedBy.telegramId || 0),
        displayName: String(row.submittedBy.displayName || row.submittedBy.username || ''),
        role: String(row.submittedBy.role || 'user')
      }
    : null,
  team: row?.team
    ? {
        id: String(row.team.id || row.team._id || ''),
        name: String(row.team.name || ''),
        tag: String(row.team.tag || ''),
        game: String(row.team.game || ''),
        logo: String(row.team.logo || ''),
        createdAt: row.team.createdAt ? String(row.team.createdAt) : null
      }
    : null,
  review: {
    reviewedAt: row?.review?.reviewedAt ? String(row.review.reviewedAt) : null,
    reviewer: row?.review?.reviewer
      ? {
          id: String(row.review.reviewer.id || row.review.reviewer._id || ''),
          username: String(row.review.reviewer.username || ''),
          firstName: String(row.review.reviewer.firstName || ''),
          lastName: String(row.review.reviewer.lastName || ''),
          email: String(row.review.reviewer.email || ''),
          telegramId: Number(row.review.reviewer.telegramId || 0),
          displayName: String(row.review.reviewer.displayName || row.review.reviewer.username || ''),
          role: String(row.review.reviewer.role || 'user')
        }
      : null,
    comment: String(row?.review?.comment || '')
  },
  eligibilitySnapshot: row?.eligibilitySnapshot
    ? {
        checkedAt: row.eligibilitySnapshot.checkedAt ? String(row.eligibilitySnapshot.checkedAt) : null,
        userTournamentWins: Number(row.eligibilitySnapshot.userTournamentWins || 0),
        teamTournamentWins: Number(row.eligibilitySnapshot.teamTournamentWins || 0),
        teamRank:
          row.eligibilitySnapshot.teamRank === undefined || row.eligibilitySnapshot.teamRank === null
            ? null
            : Number(row.eligibilitySnapshot.teamRank),
        isTop20: Boolean(row.eligibilitySnapshot.isTop20),
        topRankLimit: Number(row.eligibilitySnapshot.topRankLimit || 20),
        teamCreatedAt: row.eligibilitySnapshot.teamCreatedAt ? String(row.eligibilitySnapshot.teamCreatedAt) : null,
        teamAgeDays: Number(row.eligibilitySnapshot.teamAgeDays || 0),
        teamAgeEligibleAt: row.eligibilitySnapshot.teamAgeEligibleAt ? String(row.eligibilitySnapshot.teamAgeEligibleAt) : null,
        minTeamAgeMonths: Number(row.eligibilitySnapshot.minTeamAgeMonths || 3),
        isTeamOldEnough: Boolean(row.eligibilitySnapshot.isTeamOldEnough),
        applicantEligible: Boolean(row.eligibilitySnapshot.applicantEligible),
        reasons: Array.isArray(row.eligibilitySnapshot.reasons)
          ? row.eligibilitySnapshot.reasons.map((value: any) => String(value || '')).filter(Boolean)
          : []
      }
    : null,
  statusTimeline: Array.isArray(row?.statusTimeline)
    ? row.statusTimeline.map((entry: any) => ({
        status: (entry?.status || 'pending') as SponsorshipApplicationStatus,
        note: String(entry?.note || ''),
        createdAt: entry?.createdAt ? String(entry.createdAt) : null,
        actorId: entry?.actorId ? String(entry.actorId) : null
      }))
    : []
});

export const sponsorshipService = {
  getOverview: async (): Promise<SponsorshipOverview> => {
    const result: any = await api.get('/api/sponsorship/overview');
    const data = result?.data || result || {};

    return {
      reviewWindowDays: Number(data?.reviewWindowDays || 14),
      requirements: {
        playerTournamentWins: Number(data?.requirements?.playerTournamentWins || 2),
        teamTournamentWins: Number(data?.requirements?.teamTournamentWins || 2),
        teamTopRank: Number(data?.requirements?.teamTopRank || 20),
        teamAgeMonths: Number(data?.requirements?.teamAgeMonths || 3)
      },
      defaults: {
        contactName: String(data?.defaults?.contactName || ''),
        contactEmail: String(data?.defaults?.contactEmail || ''),
        nicknames: Array.isArray(data?.defaults?.nicknames)
          ? data.defaults.nicknames.map((value: any) => String(value || '')).filter(Boolean)
          : []
      },
      teams: Array.isArray(data?.teams)
        ? data.teams.map((team: any) => ({
            id: String(team?.id || ''),
            name: String(team?.name || ''),
            tag: String(team?.tag || ''),
            game: String(team?.game || ''),
            logo: String(team?.logo || ''),
            createdAt: team?.createdAt ? String(team.createdAt) : null,
            isCaptain: Boolean(team?.isCaptain),
            isMember: Boolean(team?.isMember),
            metrics: {
              userTournamentWins: Number(team?.metrics?.userTournamentWins || 0),
              teamTournamentWins: Number(team?.metrics?.teamTournamentWins || 0),
              teamRank:
                team?.metrics?.teamRank === undefined || team?.metrics?.teamRank === null
                  ? null
                  : Number(team.metrics.teamRank),
              isTop20: Boolean(team?.metrics?.isTop20),
              teamAgeDays: Number(team?.metrics?.teamAgeDays || 0),
              teamAgeEligibleAt: team?.metrics?.teamAgeEligibleAt ? String(team.metrics.teamAgeEligibleAt) : null,
              isTeamOldEnough: Boolean(team?.metrics?.isTeamOldEnough)
            },
            eligibility: {
              player: {
                eligible: Boolean(team?.eligibility?.player?.eligible),
                reasons: Array.isArray(team?.eligibility?.player?.reasons)
                  ? team.eligibility.player.reasons.map((value: any) => String(value || '')).filter(Boolean)
                  : []
              },
              team: {
                eligible: Boolean(team?.eligibility?.team?.eligible),
                reasons: Array.isArray(team?.eligibility?.team?.reasons)
                  ? team.eligibility.team.reasons.map((value: any) => String(value || '')).filter(Boolean)
                  : []
              }
            }
          }))
        : [],
      applications: Array.isArray(data?.applications)
        ? data.applications.map(normalizeApplication)
        : []
    };
  },

  submitApplication: async (payload: CreateSponsorshipApplicationPayload) => {
    return api.post('/api/sponsorship/applications', payload);
  },

  getAdminApplications: async (params: {
    page?: number;
    limit?: number;
    status?: 'all' | SponsorshipApplicationStatus;
    type?: 'all' | SponsorshipApplicantType;
    search?: string;
  }): Promise<SponsorshipAdminListResponse> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params.type && params.type !== 'all') searchParams.set('type', params.type);
    if (params.search) searchParams.set('search', params.search);

    const result: any = await api.get(`/api/admin/sponsorship/applications?${searchParams.toString()}`);
    const items = Array.isArray(result?.data) ? result.data.map(normalizeApplication) : [];

    return {
      items,
      pagination: result?.pagination || null,
      summary: result?.summary
        ? {
            filteredTotal: Number(result.summary.filteredTotal || 0),
            pendingCount: Number(result.summary.pendingCount || 0),
            inReviewCount: Number(result.summary.inReviewCount || 0),
            approvedCount: Number(result.summary.approvedCount || 0),
            rejectedCount: Number(result.summary.rejectedCount || 0),
            overdueCount: Number(result.summary.overdueCount || 0)
          }
        : null
    };
  },

  updateApplicationStatus: async (
    id: string,
    payload: { status: SponsorshipApplicationStatus; reviewComment?: string }
  ): Promise<SponsorshipApplication> => {
    const result: any = await api.patch(`/api/admin/sponsorship/applications/${id}/status`, payload);
    return normalizeApplication(result?.data || result || {});
  }
};
