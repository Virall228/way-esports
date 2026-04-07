import mongoose from 'mongoose';
import SponsorshipApplication, {
  SponsorshipApplicantType,
  SponsorshipApplicationStatus
} from '../models/SponsorshipApplication';
import Team from '../models/Team';
import User from '../models/User';

export const SPONSORSHIP_REVIEW_WINDOW_DAYS = 14;
export const SPONSORSHIP_MIN_PLAYER_TOURNAMENT_WINS = 2;
export const SPONSORSHIP_MIN_TEAM_TOURNAMENT_WINS = 2;
export const SPONSORSHIP_TOP_TEAM_LIMIT = 20;
export const SPONSORSHIP_MIN_TEAM_AGE_MONTHS = 3;
export const SPONSORSHIP_OPEN_STATUSES: SponsorshipApplicationStatus[] = ['pending', 'in_review'];

const TEAM_RANK_SORT = {
  'stats.winRate': -1 as const,
  'stats.totalPrizeMoney': -1 as const,
  'stats.wins': -1 as const,
  createdAt: 1 as const
};

const toObjectId = (value: string): mongoose.Types.ObjectId | null => (
  mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null
);

const getDisplayName = (user: any): string => {
  const username = String(user?.username || '').trim();
  const firstName = String(user?.firstName || '').trim();
  const lastName = String(user?.lastName || '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return fullName || username || String(user?.email || '').trim() || 'User';
};

const addMonths = (value: Date, months: number): Date => {
  const next = new Date(value);
  next.setMonth(next.getMonth() + months);
  return next;
};

const calculateAgeDays = (createdAt?: Date | string | null): number => {
  if (!createdAt) return 0;
  const createdTs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdTs)) return 0;
  return Math.max(0, Math.floor((Date.now() - createdTs) / (24 * 60 * 60 * 1000)));
};

const countTeamTournamentWins = (team: any): number => (
  Array.isArray(team?.achievements)
    ? team.achievements.filter((item: any) => Number(item?.position || 0) === 1).length
    : 0
);

const getTeamMembershipFlags = (team: any, userId: string) => {
  const normalizedUserId = String(userId);
  const captainId = String(team?.captain?._id || team?.captain || '');
  const members = Array.isArray(team?.members) ? team.members : [];
  const players = Array.isArray(team?.players) ? team.players : [];
  const isMember = [...members, ...players].some((value: any) => String(value?._id || value || '') === normalizedUserId)
    || captainId === normalizedUserId;
  const isCaptain = captainId === normalizedUserId;

  return { isMember, isCaptain };
};

export const buildTeamRankMap = async (): Promise<Map<string, number>> => {
  const rankedTeams: any[] = await Team.find({ status: 'active' })
    .select('_id')
    .sort(TEAM_RANK_SORT)
    .lean();

  return new Map(
    rankedTeams.map((team: any, index: number) => [String(team?._id || ''), index + 1])
  );
};

export const buildTeamEligibility = (
  params: {
    user: any;
    team: any;
    teamRankMap: Map<string, number>;
  }
) => {
  const { user, team, teamRankMap } = params;
  const userId = String(user?._id || user?.id || '');
  const teamId = String(team?._id || team?.id || '');
  const rank = teamRankMap.get(teamId) ?? null;
  const createdAt = team?.createdAt ? new Date(team.createdAt) : null;
  const teamAgeEligibleAt = createdAt ? addMonths(createdAt, SPONSORSHIP_MIN_TEAM_AGE_MONTHS) : null;
  const teamAgeDays = calculateAgeDays(createdAt);
  const isTeamOldEnough = Boolean(teamAgeEligibleAt && Date.now() >= teamAgeEligibleAt.getTime());
  const teamTournamentWins = countTeamTournamentWins(team);
  const userTournamentWins = Number(user?.stats?.tournamentsWon || 0);
  const { isCaptain, isMember } = getTeamMembershipFlags(team, userId);
  const isTop20 = typeof rank === 'number' && rank > 0 && rank <= SPONSORSHIP_TOP_TEAM_LIMIT;

  const playerReasons: string[] = [];
  if (!isMember) playerReasons.push('Player must be an active member of the selected team.');
  if (userTournamentWins < SPONSORSHIP_MIN_PLAYER_TOURNAMENT_WINS) {
    playerReasons.push(`Player must have at least ${SPONSORSHIP_MIN_PLAYER_TOURNAMENT_WINS} tournament wins.`);
  }
  if (!isTop20) {
    playerReasons.push(`Player team must be in the platform-wide top ${SPONSORSHIP_TOP_TEAM_LIMIT}.`);
  }
  if (!isTeamOldEnough) {
    playerReasons.push(`Team must exist for at least ${SPONSORSHIP_MIN_TEAM_AGE_MONTHS} months.`);
  }

  const teamReasons: string[] = [];
  if (!isCaptain) teamReasons.push('Only a team captain can submit a team sponsorship application.');
  if (teamTournamentWins < SPONSORSHIP_MIN_TEAM_TOURNAMENT_WINS) {
    teamReasons.push(`Team must have at least ${SPONSORSHIP_MIN_TEAM_TOURNAMENT_WINS} tournament wins.`);
  }
  if (!isTop20) {
    teamReasons.push(`Team must be in the platform-wide top ${SPONSORSHIP_TOP_TEAM_LIMIT}.`);
  }
  if (!isTeamOldEnough) {
    teamReasons.push(`Team must exist for at least ${SPONSORSHIP_MIN_TEAM_AGE_MONTHS} months.`);
  }

  return {
    id: teamId,
    name: String(team?.name || ''),
    tag: String(team?.tag || ''),
    game: String(team?.game || ''),
    logo: String(team?.logo || ''),
    createdAt: createdAt ? createdAt.toISOString() : null,
    isCaptain,
    isMember,
    metrics: {
      userTournamentWins,
      teamTournamentWins,
      teamRank: rank,
      isTop20,
      teamAgeDays,
      teamAgeEligibleAt: teamAgeEligibleAt ? teamAgeEligibleAt.toISOString() : null,
      isTeamOldEnough
    },
    eligibility: {
      player: {
        eligible: playerReasons.length === 0,
        reasons: playerReasons
      },
      team: {
        eligible: teamReasons.length === 0,
        reasons: teamReasons
      }
    }
  };
};

const loadUserTeams = async (user: any): Promise<any[]> => {
  const userId = String(user?._id || user?.id || '');
  const rawTeamIds = Array.isArray(user?.teams) ? user.teams : [];
  const knownTeamIds = rawTeamIds
    .map((value: any) => String(value?._id || value || ''))
    .filter(Boolean)
    .map((value: string) => toObjectId(value))
    .filter(Boolean) as mongoose.Types.ObjectId[];

  const membershipClauses: any[] = [
    { captain: userId },
    { members: userId },
    { players: userId }
  ];

  if (knownTeamIds.length > 0) {
    membershipClauses.push({ _id: { $in: knownTeamIds } });
  }

  return Team.find({
    status: 'active',
    $or: membershipClauses
  })
    .select('name tag game logo captain members players achievements stats createdAt status')
    .sort({ createdAt: 1, name: 1 })
    .lean();
};

const serializeUserBrief = (user: any) => {
  if (!user) return null;
  return {
    id: String(user?._id || user?.id || ''),
    username: String(user?.username || ''),
    firstName: String(user?.firstName || ''),
    lastName: String(user?.lastName || ''),
    email: String(user?.email || ''),
    telegramId: Number(user?.telegramId || 0),
    displayName: getDisplayName(user),
    role: String(user?.role || 'user')
  };
};

const serializeTeamBrief = (team: any) => {
  if (!team) return null;
  return {
    id: String(team?._id || team?.id || ''),
    name: String(team?.name || ''),
    tag: String(team?.tag || ''),
    game: String(team?.game || ''),
    logo: String(team?.logo || ''),
    createdAt: team?.createdAt ? new Date(team.createdAt).toISOString() : null
  };
};

export const serializeSponsorshipApplication = (application: any) => {
  const statusTimeline = Array.isArray(application?.statusTimeline)
    ? application.statusTimeline.map((entry: any) => ({
        status: String(entry?.status || 'pending') as SponsorshipApplicationStatus,
        note: entry?.note ? String(entry.note) : '',
        createdAt: entry?.createdAt ? new Date(entry.createdAt).toISOString() : null,
        actorId: entry?.actor ? String(entry.actor?._id || entry.actor || '') : null
      }))
    : [];

  return {
    id: String(application?._id || application?.id || ''),
    applicantType: String(application?.applicantType || 'player') as SponsorshipApplicantType,
    status: String(application?.status || 'pending') as SponsorshipApplicationStatus,
    contactName: String(application?.contactName || ''),
    contactEmail: String(application?.contactEmail || ''),
    contactTelegram: String(application?.contactTelegram || ''),
    contactDiscord: String(application?.contactDiscord || ''),
    nicknames: Array.isArray(application?.nicknames)
      ? application.nicknames.map((value: any) => String(value || '')).filter(Boolean)
      : [],
    requestSummary: String(application?.requestSummary || ''),
    comment: String(application?.comment || ''),
    reviewComment: String(application?.reviewComment || ''),
    createdAt: application?.createdAt ? new Date(application.createdAt).toISOString() : null,
    updatedAt: application?.updatedAt ? new Date(application.updatedAt).toISOString() : null,
    reviewDeadlineAt: application?.reviewDeadlineAt ? new Date(application.reviewDeadlineAt).toISOString() : null,
    isOverdue:
      SPONSORSHIP_OPEN_STATUSES.includes(application?.status) &&
      Boolean(application?.reviewDeadlineAt) &&
      new Date(application.reviewDeadlineAt).getTime() < Date.now(),
    submittedBy: serializeUserBrief(application?.submittedBy),
    team: serializeTeamBrief(application?.team),
    review: {
      reviewedAt: application?.reviewedAt ? new Date(application.reviewedAt).toISOString() : null,
      reviewer: serializeUserBrief(application?.reviewedBy),
      comment: String(application?.reviewComment || '')
    },
    eligibilitySnapshot: application?.eligibilitySnapshot
      ? {
          checkedAt: application.eligibilitySnapshot?.checkedAt
            ? new Date(application.eligibilitySnapshot.checkedAt).toISOString()
            : null,
          userTournamentWins: Number(application.eligibilitySnapshot?.userTournamentWins || 0),
          teamTournamentWins: Number(application.eligibilitySnapshot?.teamTournamentWins || 0),
          teamRank:
            application.eligibilitySnapshot?.teamRank === undefined || application.eligibilitySnapshot?.teamRank === null
              ? null
              : Number(application.eligibilitySnapshot.teamRank),
          isTop20: Boolean(application.eligibilitySnapshot?.isTop20),
          topRankLimit: Number(application.eligibilitySnapshot?.topRankLimit || SPONSORSHIP_TOP_TEAM_LIMIT),
          teamCreatedAt: application.eligibilitySnapshot?.teamCreatedAt
            ? new Date(application.eligibilitySnapshot.teamCreatedAt).toISOString()
            : null,
          teamAgeDays: Number(application.eligibilitySnapshot?.teamAgeDays || 0),
          teamAgeEligibleAt: application.eligibilitySnapshot?.teamAgeEligibleAt
            ? new Date(application.eligibilitySnapshot.teamAgeEligibleAt).toISOString()
            : null,
          minTeamAgeMonths: Number(application.eligibilitySnapshot?.minTeamAgeMonths || SPONSORSHIP_MIN_TEAM_AGE_MONTHS),
          isTeamOldEnough: Boolean(application.eligibilitySnapshot?.isTeamOldEnough),
          applicantEligible: Boolean(application.eligibilitySnapshot?.applicantEligible),
          reasons: Array.isArray(application.eligibilitySnapshot?.reasons)
            ? application.eligibilitySnapshot.reasons.map((value: any) => String(value || '')).filter(Boolean)
            : []
        }
      : null,
    statusTimeline
  };
};

export const loadUserApplications = async (userId: string) => {
  const rows: any[] = await SponsorshipApplication.find({ submittedBy: userId })
    .populate('submittedBy', 'username firstName lastName email telegramId role')
    .populate('team', 'name tag game logo createdAt')
    .populate('reviewedBy', 'username firstName lastName email telegramId role')
    .sort({ createdAt: -1 })
    .lean();

  return rows.map(serializeSponsorshipApplication);
};

export const getSponsorshipOverview = async (userId: string) => {
  const user: any = await User.findById(userId)
    .select('username firstName lastName email stats teams')
    .lean();

  if (!user) {
    const error: any = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const [teamRankMap, teams, applications] = await Promise.all([
    buildTeamRankMap(),
    loadUserTeams(user),
    loadUserApplications(userId)
  ]);

  return {
    reviewWindowDays: SPONSORSHIP_REVIEW_WINDOW_DAYS,
    requirements: {
      playerTournamentWins: SPONSORSHIP_MIN_PLAYER_TOURNAMENT_WINS,
      teamTournamentWins: SPONSORSHIP_MIN_TEAM_TOURNAMENT_WINS,
      teamTopRank: SPONSORSHIP_TOP_TEAM_LIMIT,
      teamAgeMonths: SPONSORSHIP_MIN_TEAM_AGE_MONTHS
    },
    defaults: {
      contactName: getDisplayName(user),
      contactEmail: String(user?.email || ''),
      nicknames: [String(user?.username || '').trim()].filter(Boolean)
    },
    teams: teams.map((team) => buildTeamEligibility({ user, team, teamRankMap })),
    applications
  };
};
