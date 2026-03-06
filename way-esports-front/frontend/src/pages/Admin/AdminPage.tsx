import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { api, ApiError } from '../../services/api';
import { getFullUrl } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

const Container = styled.div`
  padding: 1rem;
  width: 100%;
  max-width: 100%;
  margin: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 1.5rem;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    padding: 2rem;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.35);
  color: #ffffff;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: rgba(0, 0, 0, 0.5);
    }
  }
`;

const Header = styled(Card).attrs({ variant: 'elevated' })`
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  border: 2px solid #ff6b00;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    padding: 1.75rem;
    margin-bottom: 1.75rem;
  }
`;

const Title = styled.h1`
  color: #ffffff;
  margin: 0;
  font-size: clamp(1.5rem, 4vw, 2rem);
  background: linear-gradient(135deg, #ff6b00, #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin-bottom: 1.5rem;
  }
`;

const Tab = styled(Button).attrs<{ $active: boolean }>((props) => ({
  variant: props.$active ? 'brand' : 'outline',
  size: 'small'
}))<{ $active: boolean }>`
  padding: 0.75rem 1.25rem;
  min-height: 44px;
  white-space: nowrap;
`;

const ContentArea = styled(Card).attrs({ variant: 'outlined' })`
  background: rgba(42, 42, 42, 0.9);
  border-radius: 12px;
  padding: 1rem;
  min-height: 600px;
  backdrop-filter: blur(10px);

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 1.25rem;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    padding: 1.5rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

const StatCard = styled(Card).attrs({ variant: 'outlined' })`
  background: linear-gradient(145deg, rgba(26, 26, 26, 0.9), rgba(42, 42, 42, 0.9));
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 107, 0, 0.3);
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #ff6b00;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  color: #cccccc;
  font-size: 14px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;

const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const Th = styled.th`
  background: rgba(255, 107, 0, 0.1);
  color: #ffffff;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #ff6b00;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
`;

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UserAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(255, 107, 0, 0.45);
`;

const UserAvatarFallback = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 107, 0, 0.45);
  background: rgba(255, 107, 0, 0.18);
  color: #ffb680;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
`;

const TeamAvatar = styled(UserAvatar)`
  border-radius: 8px;
`;

const TeamAvatarFallback = styled(UserAvatarFallback)`
  border-radius: 8px;
`;

const ActionsCell = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`;

const ActionButton = styled(Button).attrs<{ $variant?: 'primary' | 'danger' | 'success' }>((props) => ({
  variant: props.$variant === 'danger' ? 'danger' : props.$variant === 'success' ? 'success' : 'brand',
  size: 'small'
}))<{ $variant?: 'primary' | 'danger' | 'success' }>`
  font-size: 12px;
  min-height: 44px;
  white-space: nowrap;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    min-height: 40px;
  }
`;

const Modal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${({ $isOpen }) => $isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: calc(16px + var(--sat, 0px)) calc(16px + var(--sar, 0px)) calc(16px + var(--sab, 0px)) calc(16px + var(--sal, 0px));
`;

const ModalContent = styled.div`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.95), rgba(26, 26, 26, 0.95));
  border-radius: 16px;
  position: relative;
  padding: 1rem;
  width: min(92vw, 600px);
  max-height: 86vh;
  overflow-y: auto;
  border: 2px solid #ff6b00;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 1.5rem;
    max-height: 80vh;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    padding: 2rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  min-height: 44px;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }
`;

const TextArea = styled.textarea`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  min-height: 160px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }
`;

const Select = styled.select`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  min-height: 44px;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }

  option {
    background: #1a1a1a;
    color: #ffffff;
  }
`;

type TabType =
  | 'dashboard'
  | 'users'
  | 'tournaments'
  | 'news'
  | 'achievements'
  | 'rewards'
  | 'analytics'
  | 'referrals'
  | 'teams'
  | 'support'
  | 'contacts'
  | 'payments'
  | 'ops'
  | 'system';

interface Reward {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  value: number;
  icon?: string;
  isActive: boolean;
  gameId?: string;
  requirementsType?: string;
  requirementsValue?: number;
  expiresAt?: string | null;
  createdAt?: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  userId?: string;
  createdAt: string;
}

interface SupportConversationRow {
  id: string;
  userId: string;
  username: string;
  email: string;
  teamId?: string | null;
  teamName?: string | null;
  subject: string;
  source: string;
  status: 'open' | 'waiting_user' | 'waiting_admin' | 'resolved';
  priority: 'normal' | 'high' | 'urgent';
  unreadForUser: number;
  unreadForAdmin: number;
  lastMessagePreview: string;
  lastMessageAt?: string | null;
  expiresAt?: string | null;
}

interface SupportMessageRow {
  id: string;
  conversationId: string;
  senderType: 'user' | 'ai' | 'admin' | 'system';
  senderId?: string | null;
  content: string;
  provider?: string | null;
  createdAt?: string | null;
}

interface SupportSettings {
  aiEnabled: boolean;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

interface SupportAiRuntimeStatus {
  provider: string;
  geminiEnabled: boolean;
  openAiEnabled: boolean;
  aiEnabled: boolean;
  configUpdatedAt?: string | null;
  circuit?: Record<string, { open: boolean; failures: number; retryInMs: number }>;
}

interface IntelligenceReadiness {
  timestamp?: string;
  providers?: {
    scouting?: {
      provider?: string;
      geminiEnabled?: boolean;
      openAiEnabled?: boolean;
      circuit?: Record<string, { open: boolean; failures: number; retryInMs: number }>;
    };
    support?: {
      provider?: string;
      geminiEnabled?: boolean;
      openAiEnabled?: boolean;
      aiEnabled?: boolean;
      circuit?: Record<string, { open: boolean; failures: number; retryInMs: number }>;
    };
  };
  integrations?: {
    telegramBotUsernameConfigured?: boolean;
    hallOfFameCronTokenConfigured?: boolean;
  };
  infrastructure?: {
    mongoConnected?: boolean;
    redisConnected?: boolean;
    mongoState?: number;
  };
  realtime?: {
    rankUpdatesSse?: string;
    opsSse?: string;
  };
  checks?: Array<{ key: string; ok: boolean; message: string }>;
  readinessScore?: number;
}

interface ReadinessSmoke {
  timestamp?: string;
  durationMs?: number;
  checks?: Array<{ key: string; ok: boolean; message: string }>;
  summary?: {
    mongoOk?: boolean;
    redisOk?: boolean;
    usersCount?: number;
    teamsCount?: number;
    tournamentsCount?: number;
  };
}

interface SupportAuditEvent {
  id: string;
  createdAt: string;
  method: string;
  statusCode: number;
  actorRole: string;
  path: string;
  payloadAiEnabled: boolean | null;
}

interface SupportAuditResponse {
  items: SupportAuditEvent[];
  pagination: PaginationMeta | null;
}

interface SystemSmokeAuditEvent {
  id: string;
  createdAt: string;
  actorRole: string;
  actorTelegramId?: number | null;
  actorId?: string | null;
  durationMs: number;
  mongoOk: boolean;
  redisOk: boolean;
  usersCount: number;
  teamsCount: number;
  tournamentsCount: number;
}

interface BotOutboxRow {
  id: string;
  userId?: string | null;
  telegramId: number;
  chatId: number;
  eventType: string;
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | string;
  attempts: number;
  sendAt?: string | null;
  sentAt?: string | null;
  lastError?: string;
  createdAt?: string | null;
}

interface AdminWalletTransaction {
  id: string;
  userId: string;
  source: 'user' | 'wallet';
  username: string;
  email: string;
  telegramId: number;
  type: string;
  amount: number;
  status: string;
  description: string;
  date: string;
  reference?: string;
  walletAddress?: string;
  network?: string;
  txHash?: string;
  processedAt?: string | null;
  balance: number;
}

interface AdminAuthLog {
  id: string;
  createdAt: string;
  userId?: string;
  username?: string;
  email?: string;
  telegramId?: number;
  role?: string;
  event: string;
  status: string;
  method: string;
  identifier?: string;
  reason?: string;
  ip?: string;
  userAgent?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PagedResult<T> {
  data: T[];
  pagination: PaginationMeta | null;
}

interface UsersSummary {
  filteredTotal: number;
  filteredSubscribed: number;
  filteredBanned: number;
}

interface TeamsSummary {
  filteredTotal: number;
}

interface ContactsSummary {
  filteredTotal: number;
}

interface NewsSummary {
  filteredTotal: number;
}

interface OpsMetrics {
  status: string;
  uptimeSeconds: number;
  mongo?: { status?: string };
  requests?: { total?: number; errors?: number; errorRate?: number };
  eventLoop?: { p95Ms?: number };
  memory?: { heapUsed?: number; heapTotal?: number };
}

interface OpsQueue {
  enabled: boolean;
  queue?: string;
  reason?: string;
  counts?: Record<string, number>;
}

interface OpsBackup {
  id: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  collections: number;
}

interface OpsStreamPayload {
  timestamp: string;
  metrics?: OpsMetrics;
  queue?: OpsQueue;
  error?: string;
}

interface OpsAuditTimelinePoint {
  ts: string;
  total: number;
  success: number;
  clientError: number;
  serverError: number;
}

interface OpsAuditTimeline {
  hours: number;
  bucketMinutes: number;
  since: string;
  totals: {
    total: number;
    success: number;
    clientError: number;
    serverError: number;
  };
  points: OpsAuditTimelinePoint[];
}

interface OpsTopErrorRow {
  method: string;
  path: string;
  statusCode: number;
  count: number;
  lastSeenAt: string | null;
}

interface OpsErrorSampleRow {
  id: string;
  createdAt: string | null;
  actorRole: string;
  statusCode: number;
  method: string;
  path: string;
  entity: string;
  entityId: string;
  ip: string;
  payload: any;
}

interface SupportStreamPayload {
  timestamp: string;
  totalConversations: number;
  waitingAdmin: number;
  open: number;
  unresolved: number;
  unreadForAdmin: number;
  latestUpdatedAt?: string | null;
}

interface MatchRoomLogRow {
  id: string;
  source: 'match_room' | 'admin_prepare_single' | 'admin_prepare_bulk';
  status: 'success' | 'denied' | 'error';
  reason?: string;
  roomId?: string | null;
  requesterRole?: string;
  requestedBy?: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    telegramId?: number | null;
    role?: string;
  } | null;
  ip?: string;
  createdAt?: string | null;
}

interface MatchRoomLogsStreamPayload {
  timestamp: string;
  matchId: string;
  total: number;
  logs: MatchRoomLogRow[];
}

interface MatchOpsSummary {
  hours: number;
  since: string;
  tournamentId: string | null;
  total: number;
  byEntity: Array<{ entity: string; count: number }>;
  byStatusCode: Array<{ statusCode: number; count: number }>;
}

interface ReferralSettingsRow {
  referralBonusThreshold: number;
  refereeBonus: number;
  referrerBonus: number;
  subscriptionPrice: number;
}

interface ScoutProviderStatus {
  provider: string;
  geminiEnabled: boolean;
  openAiEnabled: boolean;
}

interface ProspectRow {
  id: string;
  userId: string;
  username: string;
  role: string;
  score: number;
  impactRating: number;
  tag: string;
  summary: string;
  weekKey: string;
}

interface AnomalyAlertRow {
  userId: string;
  username: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  impactRating: number;
}

interface ScoutingExplainRow {
  userId: string;
  username: string;
  role: string;
  rank: string;
  impactRating: number;
  topDrivers: Array<{ key: string; value: number; contribution: number }>;
  narrative: string;
}

interface WatchlistRow {
  userId: string;
  username: string;
  role: string;
  impactRating: number;
  reason: string;
  addedAt?: string;
}

interface HallOfFameAdminRow {
  id: string;
  userId: string;
  username: string;
  consecutiveDaysRank1: number;
  firstRank1At?: string;
  lastRank1At?: string;
}

interface AdminUserRow {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  wallpaperUrl?: string;
  wallpaperStatus?: 'active' | 'removed' | string;
  role: string;
  isBanned: boolean;
  isSubscribed: boolean;
  subscriptionExpiresAt?: string;
  freeEntriesCount: number;
  bonusEntries: number;
  balance: number;
  createdAt: string;
}

interface AdminTournamentRequestRow {
  id: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  teamLogo?: string;
  membersCount: number;
  stats?: {
    wins: number;
    losses: number;
    winRate: number;
  };
  requestedBy?: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    telegramId?: number | null;
  } | null;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt?: string | null;
}

interface AdminTournamentRequestHistoryRow {
  id: string;
  tournamentId: string;
  tournamentName: string;
  game: string;
  tournamentStatus: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  status: 'approved' | 'rejected';
  note?: string;
  requestedAt?: string | null;
  reviewedAt?: string | null;
  requestedBy?: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    telegramId?: number | null;
  } | null;
  reviewedBy?: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    telegramId?: number | null;
    role?: string;
  } | null;
}

interface AdminTournamentOverview {
  tournament: {
    id: string;
    name: string;
    game: string;
    status: string;
    maxTeams: number;
    participants: number;
  };
  summary?: {
    teamsApproved: number;
    requestsPending: number;
    matchesTotal: number;
    roomsPrepared: number;
    liveWithoutRoom: number;
    completedWithoutWinner: number;
    byStatus: {
      scheduled: number;
      live: number;
      completed: number;
      cancelled: number;
    };
  };
  teams: Array<{
    id: string;
    name: string;
    tag: string;
    logo?: string;
    membersCount: number;
    stats: {
      wins: number;
      losses: number;
      winRate: number;
      totalMatches: number;
    };
  }>;
  requests: Array<{
    teamId: string;
    teamName: string;
    teamTag: string;
    teamLogo?: string;
    status: string;
    requestedAt?: string | null;
  }>;
  matches: Array<{
    id: string;
    status: string;
    round?: string;
    startTime?: string | null;
    team1?: { id: string; name: string; tag?: string; logo?: string } | null;
    team2?: { id: string; name: string; tag?: string; logo?: string } | null;
    score: { team1: number; team2: number };
    winnerId?: string | null;
    eventsSummary?: {
      totalEvents: number;
      participants: { players: number; teams: number };
      byType: {
        kill: number;
        death: number;
        assist: number;
        utility: number;
        clutch: number;
        objective: number;
      };
    };
    hasRoomCredentials?: boolean;
    roomCredentials?: {
      roomId: string;
      password: string;
      generatedAt?: string | null;
      visibleAt?: string | null;
      expiresAt?: string | null;
    } | null;
  }>;
}

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;

  & > button {
    width: 100%;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    flex-wrap: nowrap;

    & > button {
      width: auto;
    }
  }
`;

const AdminPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { addNotification } = useNotifications();
  const hasAdminAccess = isAuthenticated && (user?.role === 'admin' || user?.role === 'developer');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'user' | 'tournament' | 'news' | 'reward' | 'achievement' | 'team'>('user');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [modalData, setModalData] = useState<any>({});
  const newsImageRef = useRef<HTMLInputElement>(null);
  const tournamentImageRef = useRef<HTMLInputElement>(null);
  const teamImageRef = useRef<HTMLInputElement>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearchInput, setUsersSearchInput] = useState('');
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState<'all' | 'user' | 'admin' | 'developer'>('all');
  const [usersSubscribedFilter, setUsersSubscribedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [usersBannedFilter, setUsersBannedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [teamsPage, setTeamsPage] = useState(1);
  const [teamsSearchInput, setTeamsSearchInput] = useState('');
  const [teamsSearch, setTeamsSearch] = useState('');
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsSearchInput, setContactsSearchInput] = useState('');
  const [contactsSearch, setContactsSearch] = useState('');
  const [newsPage, setNewsPage] = useState(1);
  const [newsSearchInput, setNewsSearchInput] = useState('');
  const [newsSearch, setNewsSearch] = useState('');
  const [newsStatusFilter, setNewsStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [tournamentsPage, setTournamentsPage] = useState(1);
  const [tournamentsSearchInput, setTournamentsSearchInput] = useState('');
  const [tournamentsSearch, setTournamentsSearch] = useState('');
  const [tournamentsStatusFilter, setTournamentsStatusFilter] = useState<'all' | 'upcoming' | 'live' | 'completed' | 'cancelled' | 'open'>('all');
  const [tournamentsGameFilter, setTournamentsGameFilter] = useState<'all' | 'CS2' | 'Critical Ops' | 'PUBG Mobile' | 'Valorant Mobile' | 'Dota 2' | 'Standoff 2'>('all');
  const [opsStreamData, setOpsStreamData] = useState<OpsStreamPayload | null>(null);
  const [opsStreamConnected, setOpsStreamConnected] = useState(false);
  const [tournamentStreamConnected, setTournamentStreamConnected] = useState(false);
  const [tournamentStreamUpdatedAt, setTournamentStreamUpdatedAt] = useState<string | null>(null);
  const [tournamentRequestsStreamConnected, setTournamentRequestsStreamConnected] = useState(false);
  const [globalPendingTournamentRequests, setGlobalPendingTournamentRequests] = useState(0);
  const [tournamentRequestsStreamUpdatedAt, setTournamentRequestsStreamUpdatedAt] = useState<string | null>(null);
  const [authLogFilters, setAuthLogFilters] = useState({
    event: '',
    method: '',
    status: '',
    search: ''
  });
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending_withdrawals'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed' | 'refund_pending' | 'refunded' | 'refund_denied'>('all');
  const [paymentSearchInput, setPaymentSearchInput] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [tournamentRequestSearchInput, setTournamentRequestSearchInput] = useState('');
  const [tournamentRequestSearch, setTournamentRequestSearch] = useState('');
  const [tournamentRequestsPage, setTournamentRequestsPage] = useState(1);
  const [matchesPage, setMatchesPage] = useState(1);
  const [recentDecisionsSearchInput, setRecentDecisionsSearchInput] = useState('');
  const [recentDecisionsSearch, setRecentDecisionsSearch] = useState('');
  const [recentDecisionsPage, setRecentDecisionsPage] = useState(1);
  const [pendingQueuePage, setPendingQueuePage] = useState(1);
  const [recentRequestsStatusFilter, setRecentRequestsStatusFilter] = useState<'all' | 'approved' | 'rejected'>('all');
  const [prospectsFilter, setProspectsFilter] = useState<'all' | 'hidden_gem'>('all');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [supportStatusFilter, setSupportStatusFilter] = useState<'all' | 'open' | 'waiting_user' | 'waiting_admin' | 'resolved'>('all');
  const [selectedSupportConversationId, setSelectedSupportConversationId] = useState<string | null>(null);
  const [supportReply, setSupportReply] = useState('');
  const [supportStreamConnected, setSupportStreamConnected] = useState(false);
  const [supportStreamData, setSupportStreamData] = useState<SupportStreamPayload | null>(null);
  const [supportStreamUpdatedAt, setSupportStreamUpdatedAt] = useState<string | null>(null);
  const [supportTtlTick, setSupportTtlTick] = useState<number>(() => Date.now());
  const [supportAuditAiFilter, setSupportAuditAiFilter] = useState<'all' | 'on' | 'off'>('all');
  const [supportAuditRoleFilter, setSupportAuditRoleFilter] = useState('all');
  const [supportAuditDateFrom, setSupportAuditDateFrom] = useState('');
  const [supportAuditDateTo, setSupportAuditDateTo] = useState('');
  const [supportAuditPage, setSupportAuditPage] = useState(1);
  const [supportAuditLimit, setSupportAuditLimit] = useState(12);
  const [matchRoomLogs, setMatchRoomLogs] = useState<Record<string, MatchRoomLogRow[]>>({});
  const [matchRoomLogsLoadingId, setMatchRoomLogsLoadingId] = useState<string | null>(null);
  const [selectedMatchRoomLogsId, setSelectedMatchRoomLogsId] = useState<string | null>(null);
  const [matchRoomLogsStreamConnected, setMatchRoomLogsStreamConnected] = useState(false);
  const [matchRoomLogsStreamUpdatedAt, setMatchRoomLogsStreamUpdatedAt] = useState<string | null>(null);
  const [matchStatusFilter, setMatchStatusFilter] = useState<'all' | 'scheduled' | 'live' | 'completed' | 'cancelled'>('all');
  const [matchRoomFilter, setMatchRoomFilter] = useState<'all' | 'with_room' | 'without_room'>('all');
  const [matchWinnerFilter, setMatchWinnerFilter] = useState<'all' | 'with_winner' | 'without_winner'>('all');
  const [matchSearch, setMatchSearch] = useState('');
  const [participantSearchInput, setParticipantSearchInput] = useState('');
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantPage, setParticipantPage] = useState(1);
  const [matchOpsWindowHours, setMatchOpsWindowHours] = useState<24 | 48 | 168>(48);
  const [opsTimelineHours, setOpsTimelineHours] = useState<24 | 48 | 168>(24);
  const [opsTimelineBucketMinutes, setOpsTimelineBucketMinutes] = useState<15 | 60>(60);
  const [selectedTopError, setSelectedTopError] = useState<OpsTopErrorRow | null>(null);
  const [readinessSmoke, setReadinessSmoke] = useState<ReadinessSmoke | null>(null);
  const [botOutboxPage, setBotOutboxPage] = useState(1);
  const [botOutboxStatusFilter, setBotOutboxStatusFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('pending');
  const [botOutboxSearchInput, setBotOutboxSearchInput] = useState('');
  const [botOutboxSearch, setBotOutboxSearch] = useState('');
  const knownTournamentRequestIdsRef = useRef<Record<string, string[]>>({});
  const supportUnreadForAdminRef = useRef(0);
  const [newTournamentRequestCounts, setNewTournamentRequestCounts] = useState<Record<string, number>>({});
  const [tournamentRequestSoundEnabled, setTournamentRequestSoundEnabled] = useState(true);
  const [pointsInput, setPointsInput] = useState({ playerRating: 1000, opponentRating: 1000, result: 1 });
  const [pointsOutput, setPointsOutput] = useState<{ newPoints: number; pointsDelta: number } | null>(null);
  const [statsInput, setStatsInput] = useState({
    kills: 10,
    deaths: 8,
    assists: 4,
    survivalSeconds: 420,
    utilityUses: 9,
    objectiveActions: 2,
    clutchRoundsWon: 1,
    roundsPlayed: 18
  });
  const [statsOutput, setStatsOutput] = useState<any>(null);
  const [scoutingExplanations, setScoutingExplanations] = useState<Record<string, ScoutingExplainRow>>({});
  const isOpsTab = activeTab === 'ops';

  const formatApiError = (e: any, fallback: string) => {
    if (e instanceof ApiError) {
      const p = e.payload;
      const details =
        typeof p === 'string'
          ? p
          : (p?.error || p?.message || p?.details || (p ? JSON.stringify(p) : ''));

      const msg = details || e.message || fallback;
      return `[${e.status}] ${msg}`;
    }

    return e?.message || fallback;
  };

  const getAuthToken = () => {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  };

  const buildAuthLogQueryString = (limit: number) => {
    const params = new URLSearchParams();
    params.set('limit', String(limit));

    if (authLogFilters.event) params.set('event', authLogFilters.event);
    if (authLogFilters.method) params.set('method', authLogFilters.method);
    if (authLogFilters.status) params.set('status', authLogFilters.status);
    if (authLogFilters.search.trim()) params.set('search', authLogFilters.search.trim());

    return params.toString();
  };

  const notify = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    addNotification({ type, title, message });
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_tournament_alert_sound');
      if (saved === '0') {
        setTournamentRequestSoundEnabled(false);
      } else if (saved === '1') {
        setTournamentRequestSoundEnabled(true);
      }
    } catch {
      // ignore storage issues
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('admin_tournament_alert_sound', tournamentRequestSoundEnabled ? '1' : '0');
    } catch {
      // ignore storage issues
    }
  }, [tournamentRequestSoundEnabled]);

  const playTournamentAlertSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.22);
    } catch {
      // ignore audio failures
    }
  };

  const setField = (key: string, value: any) => {
    setModalData((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const load = async () => {
    if (!hasAdminAccess) return;
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-participants'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'news'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'achievements'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'rewards'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'teams'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'referrals'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'referral-settings'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'support-conversations'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'support-messages'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'contacts'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'wallet-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'scouting-provider'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'scouting-prospects'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'scouting-anomalies'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'scouting-watchlist'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'hall-of-fame'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'ops-metrics'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'ops-queue'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'ops-backups'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'auth-logs'] })
      ]);
    } catch (e: any) {
      setError(formatApiError(e, 'Failed to load admin data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [hasAdminAccess]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUsersPage(1);
      setUsersSearch(usersSearchInput.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [usersSearchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTeamsPage(1);
      setTeamsSearch(teamsSearchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [teamsSearchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setContactsPage(1);
      setContactsSearch(contactsSearchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [contactsSearchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNewsPage(1);
      setNewsSearch(newsSearchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [newsSearchInput]);

  useEffect(() => {
    setNewsPage(1);
  }, [newsStatusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTournamentsPage(1);
      setTournamentsSearch(tournamentsSearchInput.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [tournamentsSearchInput]);

  useEffect(() => {
    setTournamentsPage(1);
  }, [tournamentsStatusFilter, tournamentsGameFilter]);

  useEffect(() => {
    if (!hasAdminAccess || !isOpsTab) {
      setOpsStreamConnected(false);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setOpsStreamConnected(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    let started = false;
    const decoder = new TextDecoder();
    let buffer = '';

    const processChunk = (chunk: string) => {
      buffer += chunk;

      while (true) {
        const boundary = buffer.indexOf('\n\n');
        if (boundary === -1) break;

        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        const lines = block.split('\n');
        const dataLine = lines.find((line) => line.startsWith('data: '));
        if (!dataLine) continue;

        const rawPayload = dataLine.slice(6);
        try {
          const parsed = JSON.parse(rawPayload) as OpsStreamPayload;
          setOpsStreamData(parsed);
          setOpsStreamConnected(true);
        } catch {
          // ignore malformed chunks
        }
      }
    };

    const connect = async () => {
      try {
        const response = await fetch(getFullUrl('/api/admin/ops/stream'), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        });

        if (!response.ok || !response.body) {
          throw new Error(`Ops stream unavailable (${response.status})`);
        }

        started = true;
        const reader = response.body.getReader();

        while (!cancelled) {
          // eslint-disable-next-line no-await-in-loop
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            processChunk(decoder.decode(value, { stream: true }));
          }
        }
      } catch (error) {
        if (!cancelled && started) {
          setOpsStreamConnected(false);
        }
      }
    };

    connect().catch(() => {
      setOpsStreamConnected(false);
    });

    return () => {
      cancelled = true;
      controller.abort();
      setOpsStreamConnected(false);
    };
  }, [hasAdminAccess, isOpsTab]);

  useEffect(() => {
    if (!selectedTournamentId) return;
    setNewTournamentRequestCounts((prev) => ({ ...prev, [selectedTournamentId]: 0 }));
  }, [selectedTournamentId]);

  useEffect(() => {
    if (!hasAdminAccess || activeTab !== 'tournaments' || !selectedTournamentId) {
      setTournamentStreamConnected(false);
      setTournamentStreamUpdatedAt(null);
      return;
    }

    const endpoint = getFullUrl(`/api/tournaments/${selectedTournamentId}/stream`);
    let source: EventSource | null = null;

    try {
      source = new EventSource(endpoint);
      source.addEventListener('open', () => {
        setTournamentStreamConnected(true);
      });

      source.addEventListener('error', () => {
        setTournamentStreamConnected(false);
      });

      source.addEventListener('tournament_update', async () => {
        setTournamentStreamConnected(true);
        setTournamentStreamUpdatedAt(new Date().toISOString());
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-requests', selectedTournamentId] }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', selectedTournamentId] }),
          queryClient.invalidateQueries({ queryKey: ['tournament', selectedTournamentId] }),
          queryClient.invalidateQueries({ queryKey: ['tournament', selectedTournamentId, 'matches'] }),
          queryClient.invalidateQueries({ queryKey: ['tournament', String(selectedTournamentId), 'bracket'] })
        ]);
      });
    } catch {
      setTournamentStreamConnected(false);
    }

    return () => {
      source?.close();
      setTournamentStreamConnected(false);
    };
  }, [hasAdminAccess, activeTab, selectedTournamentId, queryClient]);

  useEffect(() => {
    if (!hasAdminAccess || activeTab !== 'tournaments') {
      setTournamentRequestsStreamConnected(false);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setTournamentRequestsStreamConnected(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    const decoder = new TextDecoder();
    let buffer = '';

    const processChunk = (chunk: string) => {
      buffer += chunk;

      while (true) {
        const boundary = buffer.indexOf('\n\n');
        if (boundary === -1) break;

        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        const lines = block.split('\n');
        const dataLine = lines.find((line) => line.startsWith('data: '));
        if (!dataLine) continue;

        try {
          const payload = JSON.parse(dataLine.slice(6));
          const totalPending = Number(payload?.totalPending || 0);
          setGlobalPendingTournamentRequests(totalPending);
          setTournamentRequestsStreamConnected(true);
          setTournamentRequestsStreamUpdatedAt(new Date().toISOString());

          queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] });
          if (selectedTournamentId) {
            queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-requests', selectedTournamentId] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', selectedTournamentId] });
          }
        } catch {
          // ignore malformed stream payloads
        }
      }
    };

    const connect = async () => {
      if (cancelled) return;
      try {
        const response = await fetch(getFullUrl('/api/admin/tournaments/requests/stream'), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        });

        if (!response.ok || !response.body) {
          throw new Error(`Tournament requests stream unavailable (${response.status})`);
        }

        setTournamentRequestsStreamConnected(true);
        const reader = response.body.getReader();
        while (!cancelled) {
          // eslint-disable-next-line no-await-in-loop
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            processChunk(decoder.decode(value, { stream: true }));
          }
        }
      } catch {
        if (!cancelled) {
          setTournamentRequestsStreamConnected(false);
          reconnectTimer = setTimeout(() => {
            connect().catch(() => {});
          }, 3000);
        }
      }
    };

    connect().catch(() => {
      setTournamentRequestsStreamConnected(false);
    });

    return () => {
      cancelled = true;
      controller.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      setTournamentRequestsStreamConnected(false);
    };
  }, [hasAdminAccess, activeTab, selectedTournamentId, queryClient]);

  useEffect(() => {
    if (!hasAdminAccess || activeTab !== 'support') {
      setSupportStreamConnected(false);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setSupportStreamConnected(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    const decoder = new TextDecoder();
    let buffer = '';

    const processChunk = (chunk: string) => {
      buffer += chunk;

      while (true) {
        const boundary = buffer.indexOf('\n\n');
        if (boundary === -1) break;

        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        const lines = block.split('\n');
        const dataLine = lines.find((line) => line.startsWith('data: '));
        if (!dataLine) continue;

        try {
          const payload = JSON.parse(dataLine.slice(6)) as SupportStreamPayload;
          setSupportStreamData(payload);
          setSupportStreamConnected(true);
          setSupportStreamUpdatedAt(new Date().toISOString());

          if (Number(payload?.unreadForAdmin || 0) > Number(supportUnreadForAdminRef.current || 0)) {
            notify('info', 'New support messages', 'Support inbox has new unread messages');
          }
          supportUnreadForAdminRef.current = Number(payload?.unreadForAdmin || 0);

          queryClient.invalidateQueries({ queryKey: ['admin', 'support-conversations'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'support-ai-runtime'] });
          if (selectedSupportConversationId) {
            queryClient.invalidateQueries({ queryKey: ['admin', 'support-messages', selectedSupportConversationId] });
          }
        } catch {
          // ignore malformed payloads
        }
      }
    };

    const connect = async () => {
      if (cancelled) return;
      try {
        const response = await fetch(getFullUrl('/api/support/admin/stream'), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        });

        if (!response.ok || !response.body) {
          throw new Error(`Support stream unavailable (${response.status})`);
        }

        setSupportStreamConnected(true);
        const reader = response.body.getReader();
        while (!cancelled) {
          // eslint-disable-next-line no-await-in-loop
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            processChunk(decoder.decode(value, { stream: true }));
          }
        }
      } catch {
        if (!cancelled) {
          setSupportStreamConnected(false);
          reconnectTimer = setTimeout(() => {
            connect().catch(() => {});
          }, 3000);
        }
      }
    };

    connect().catch(() => {
      setSupportStreamConnected(false);
    });

    return () => {
      cancelled = true;
      controller.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      setSupportStreamConnected(false);
    };
  }, [hasAdminAccess, activeTab, selectedSupportConversationId, queryClient]);

  useEffect(() => {
    if (!hasAdminAccess || activeTab !== 'tournaments' || !selectedMatchRoomLogsId) {
      setMatchRoomLogsStreamConnected(false);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setMatchRoomLogsStreamConnected(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    const decoder = new TextDecoder();
    let buffer = '';

    const processChunk = (chunk: string) => {
      buffer += chunk;

      while (true) {
        const boundary = buffer.indexOf('\n\n');
        if (boundary === -1) break;

        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        const lines = block.split('\n');
        const eventLine = lines.find((line) => line.startsWith('event: '));
        const eventName = eventLine ? eventLine.slice(7).trim() : '';
        const dataLine = lines.find((line) => line.startsWith('data: '));
        if (!dataLine || eventName !== 'room_logs') continue;

        try {
          const payload = JSON.parse(dataLine.slice(6)) as MatchRoomLogsStreamPayload;
          const rows = Array.isArray(payload?.logs) ? payload.logs : [];
          setMatchRoomLogs((prev) => ({ ...prev, [selectedMatchRoomLogsId]: rows }));
          setMatchRoomLogsStreamConnected(true);
          setMatchRoomLogsStreamUpdatedAt(new Date().toISOString());
        } catch {
          // ignore malformed payloads
        }
      }
    };

    const connect = async () => {
      if (cancelled) return;
      try {
        const response = await fetch(getFullUrl(`/api/matches/${selectedMatchRoomLogsId}/room/logs/stream`), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        });

        if (!response.ok || !response.body) {
          throw new Error(`Room logs stream unavailable (${response.status})`);
        }

        setMatchRoomLogsStreamConnected(true);
        const reader = response.body.getReader();
        while (!cancelled) {
          // eslint-disable-next-line no-await-in-loop
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            processChunk(decoder.decode(value, { stream: true }));
          }
        }
      } catch {
        if (!cancelled) {
          setMatchRoomLogsStreamConnected(false);
          reconnectTimer = setTimeout(() => {
            connect().catch(() => {});
          }, 3000);
        }
      }
    };

    connect().catch(() => {
      setMatchRoomLogsStreamConnected(false);
    });

    return () => {
      cancelled = true;
      controller.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      setMatchRoomLogsStreamConnected(false);
    };
  }, [hasAdminAccess, activeTab, selectedMatchRoomLogsId]);

  const formatDateForInput = (value: any) => {
    try {
      if (!value) return '';
      const d = new Date(value);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const formatDate = (value: any) => {
    try {
      const d = value ? new Date(value) : new Date();
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const formatDateTime = (value: any) => {
    try {
      if (!value) return '-';
      const d = new Date(value);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleString();
    } catch {
      return '-';
    }
  };

  const resolveMediaUrl = (value?: string | null) => {
    if (!value) return '';
    if (value.startsWith('http')) return value;
    const normalized = value.startsWith('/') ? value : `/${value}`;
    if (normalized.startsWith('/api/uploads/')) return getFullUrl(normalized);
    if (normalized.startsWith('/uploads/')) return getFullUrl(`/api${normalized}`);
    return normalized;
  };

  const fetchDashboardStats = async () => {
    try {
      const result = await api.get('/api/admin/stats');
      return result?.data ?? result;
    } catch (e) {
      console.error('Failed to fetch dashboard stats:', e);
      throw e;
    }
  };

  const fetchAnalytics = async () => {
    try {
      const result = await api.get('/api/admin/analytics');
      return result?.data ?? result;
    } catch (e) {
      console.error('Failed to fetch analytics:', e);
      throw e;
    }
  };

  const fetchScoutProviderStatus = async (): Promise<ScoutProviderStatus> => {
    const result: any = await api.get('/api/scouting/provider-status');
    return result?.data || result;
  };

  const fetchTopProspects = async (): Promise<ProspectRow[]> => {
    const result: any = await api.get('/api/scouting/top-prospects?limit=10');
    const rows = result?.data || result || [];
    return Array.isArray(rows)
      ? rows.map((row: any) => ({
        id: String(row.id || ''),
        userId: String(row.userId || ''),
        username: row.username || 'unknown',
        role: row.role || 'Flex',
        score: Number(row.score || 0),
        impactRating: Number(row.impactRating || 0),
        tag: row.tag || 'Prospect',
        summary: row.summary || '',
        weekKey: row.weekKey || ''
      }))
      : [];
  };

  const fetchAnomalyAlerts = async (): Promise<AnomalyAlertRow[]> => {
    const result: any = await api.get('/api/scouting/anomalies?limit=20');
    const rows = result?.data || result || [];
    return Array.isArray(rows)
      ? rows.map((row: any) => ({
        userId: String(row.userId || ''),
        username: row.username || 'unknown',
        type: row.type || 'unknown',
        severity: row.severity || 'low',
        message: row.message || '',
        impactRating: Number(row.impactRating || 0)
      }))
      : [];
  };

  const fetchWatchlist = async (): Promise<WatchlistRow[]> => {
    const result: any = await api.get('/api/scouting/watchlist?limit=100');
    const rows = result?.data || result || [];
    return Array.isArray(rows)
      ? rows.map((row: any) => ({
        userId: String(row.userId || ''),
        username: row.username || 'unknown',
        role: row.role || 'Flex',
        impactRating: Number(row.impactRating || 0),
        reason: row.reason || '',
        addedAt: row.addedAt
      }))
      : [];
  };

  const fetchHallOfFame = async (): Promise<HallOfFameAdminRow[]> => {
    const result: any = await api.get('/api/intelligence/hall-of-fame');
    const rows = result?.data || result || [];
    return Array.isArray(rows)
      ? rows.map((row: any) => ({
        id: String(row._id || row.id || ''),
        userId: String(row.userId || ''),
        username: row.username || 'unknown',
        consecutiveDaysRank1: Number(row.consecutiveDaysRank1 || 0),
        firstRank1At: row.firstRank1At,
        lastRank1At: row.lastRank1At
      }))
      : [];
  };

  const fetchUsers = async (): Promise<{ items: AdminUserRow[]; pagination: PaginationMeta | null; summary: UsersSummary | null }> => {
    const params = new URLSearchParams();
    params.set('page', String(usersPage));
    params.set('limit', '25');
    if (usersSearch) params.set('search', usersSearch);
    if (usersRoleFilter !== 'all') params.set('role', usersRoleFilter);
    if (usersSubscribedFilter !== 'all') params.set('subscribed', usersSubscribedFilter);
    if (usersBannedFilter !== 'all') params.set('banned', usersBannedFilter);

    const result: any = await api.get(`/api/admin/users?${params.toString()}`);
    const items: any[] = (result && (result.data || result.users || result)) || [];
    const pagination: PaginationMeta | null = result?.pagination || null;
    const summary: UsersSummary | null = result?.summary
      ? {
        filteredTotal: Number(result.summary.filteredTotal || 0),
        filteredSubscribed: Number(result.summary.filteredSubscribed || 0),
        filteredBanned: Number(result.summary.filteredBanned || 0)
      }
      : null;

    return {
      items: items.map((u: any) => ({
        id: (u._id || u.id || '').toString(),
        username: u.username || '',
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: u.email || '',
        avatarUrl: resolveMediaUrl(u.profileLogo || u.photoUrl || u.avatar || ''),
        wallpaperUrl: resolveMediaUrl(u.profileWallpaper?.url || ''),
        wallpaperStatus: u.profileWallpaper?.status || 'removed',
        role: u.role || 'user',
        isBanned: !!u.isBanned,
        isSubscribed: !!u.isSubscribed,
        subscriptionExpiresAt: u.subscriptionExpiresAt,
        freeEntriesCount: Number(u.freeEntriesCount || 0),
        bonusEntries: Number(u.bonusEntries || 0),
        balance: Number(u.wallet?.balance || 0),
        createdAt: formatDate(u.createdAt)
      })),
      pagination,
      summary
    };
  };

  const formatSupportTtl = (expiresAt?: string | null) => {
    try {
      if (!expiresAt) return 'TTL: -';
      const expiryTs = new Date(expiresAt).getTime();
      if (!Number.isFinite(expiryTs)) return 'TTL: -';
      const diff = expiryTs - supportTtlTick;
      if (diff <= 0) return 'TTL: expired';
      const hours = Math.floor(diff / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      return `TTL: ${hours}h ${minutes}m`;
    } catch {
      return 'TTL: -';
    }
  };

  useEffect(() => {
    if (activeTab !== 'support') return;
    const timer = setInterval(() => {
      setSupportTtlTick(Date.now());
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, [activeTab]);

  const handleRemoveUserWallpaper = async (targetUser: AdminUserRow) => {
    try {
      if (!targetUser.wallpaperUrl) {
        notify('info', 'No wallpaper', 'User has no active wallpaper');
        return;
      }
      const confirmed = window.confirm(`Remove wallpaper for ${targetUser.username}?`);
      if (!confirmed) return;
      await api.delete(`/api/admin/users/${targetUser.id}/wallpaper`);
      await usersQuery.refetch();
      notify('success', 'Wallpaper removed', `Wallpaper removed for ${targetUser.username}`);
    } catch (e: any) {
      notify('error', 'Failed', formatApiError(e, 'Failed to remove wallpaper'));
    }
  };

  const fetchTeams = async (): Promise<{ items: any[]; pagination: PaginationMeta | null; summary: TeamsSummary | null }> => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(teamsPage));
      params.set('limit', '25');
      if (teamsSearch) params.set('search', teamsSearch);
      const result: any = await api.get(`/api/admin/teams?${params.toString()}`);
      const items = result?.data || [];
      const pagination: PaginationMeta | null = result?.pagination || null;
      const summary: TeamsSummary | null = result?.summary
        ? { filteredTotal: Number(result.summary.filteredTotal || 0) }
        : null;
      return {
        items: items.map((t: any) => ({
        id: String(t.id || t._id || ''),
        name: t.name,
        tag: t.tag,
        logo: resolveMediaUrl(t.logo || ''),
        game: t.game,
        captain: t.captain,
        members: t.members,
        stats: t.stats
      })),
        pagination,
        summary
      };
    } catch (e) {
      console.error('Failed to fetch teams:', e);
      throw e;
    }
  };

  const fetchReferrals = async () => {
    try {
      const result: any = await api.get('/api/referrals/all');
      const items: any[] = Array.isArray(result) ? result : (result?.data || []);
      return items.map((r: any) => ({
        id: (r._id || r.id || '').toString(),
        referrer: r.referrer?.username || r.referrer?.toString() || 'Unknown',
        referred: r.referred?.username || r.referee?.username || r.referred?.toString() || r.referee?.toString() || 'Unknown',
        reward: r.rewardAmount || 0,
        date: formatDate(r.createdAt),
        status: r.status || 'completed'
      }));
    } catch (e) {
      console.error('Failed to fetch referrals:', e);
      throw e;
    }
  };

  const fetchReferralSettings = async (): Promise<ReferralSettingsRow> => {
    const result: any = await api.get('/api/referrals/settings');
    const data = result?.data || result || {};

    return {
      referralBonusThreshold: Number(data.referralBonusThreshold || 3),
      refereeBonus: Number(data.refereeBonus || 1),
      referrerBonus: Number(data.referrerBonus || 1),
      subscriptionPrice: Number(data.subscriptionPrice || 9.99)
    };
  };

  const fetchContacts = async (): Promise<{ items: ContactMessage[]; pagination: PaginationMeta | null; summary: ContactsSummary | null }> => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(contactsPage));
      params.set('limit', '25');
      if (contactsSearch) params.set('search', contactsSearch);
      const result: any = await api.get(`/api/admin/contacts?${params.toString()}`);
      const items: any[] = Array.isArray(result) ? result : (result?.data || []);
      const pagination: PaginationMeta | null = result?.pagination || null;
      const summary: ContactsSummary | null = result?.summary
        ? { filteredTotal: Number(result.summary.filteredTotal || 0) }
        : null;
      return {
        items: items.map((m: any) => ({
        id: (m._id || m.id || '').toString(),
        name: m.name || '',
        email: m.email || '',
        message: m.message || '',
        userId: m.userId?._id?.toString() || m.userId?.toString() || '',
        createdAt: formatDate(m.createdAt)
      })),
        pagination,
        summary
      };
    } catch (e) {
      console.error('Failed to fetch contact messages:', e);
      throw e;
    }
  };

  const fetchSupportConversations = async (): Promise<SupportConversationRow[]> => {
    const params = new URLSearchParams();
    if (supportStatusFilter !== 'all') params.set('status', supportStatusFilter);
    const result: any = await api.get(`/api/support/admin/conversations?${params.toString()}`);
    const items: any[] = Array.isArray(result) ? result : (result?.data || []);

    return items.map((row: any) => ({
      id: String(row?.id || row?._id || ''),
      userId: String(row?.userId || ''),
      username: String(row?.username || ''),
      email: String(row?.email || ''),
      teamId: row?.teamId ? String(row.teamId) : null,
      teamName: row?.teamName || null,
      subject: String(row?.subject || 'Emergency Support'),
      source: String(row?.source || 'settings'),
      status: (row?.status || 'open') as SupportConversationRow['status'],
      priority: (row?.priority || 'normal') as SupportConversationRow['priority'],
      unreadForUser: Number(row?.unreadForUser || 0),
      unreadForAdmin: Number(row?.unreadForAdmin || 0),
      lastMessagePreview: String(row?.lastMessagePreview || ''),
      lastMessageAt: row?.lastMessageAt || null,
      expiresAt: row?.expiresAt || null
    }));
  };

  const fetchSupportMessages = async (): Promise<SupportMessageRow[]> => {
    if (!selectedSupportConversationId) return [];
    const result: any = await api.get(`/api/support/admin/conversations/${selectedSupportConversationId}/messages`);
    const items: any[] = Array.isArray(result?.data?.messages)
      ? result.data.messages
      : Array.isArray(result?.messages)
        ? result.messages
        : [];

    return items.map((row: any) => ({
      id: String(row?.id || row?._id || ''),
      conversationId: String(row?.conversationId || selectedSupportConversationId),
      senderType: (row?.senderType || 'system') as SupportMessageRow['senderType'],
      senderId: row?.senderId ? String(row.senderId) : null,
      content: String(row?.content || ''),
      provider: row?.provider || null,
      createdAt: row?.createdAt || null
    }));
  };

  const fetchSupportSettings = async (): Promise<SupportSettings> => {
    const result: any = await api.get('/api/support/admin/settings');
    const data = result?.data || result || {};
    return {
      aiEnabled: Boolean(data?.aiEnabled),
      updatedAt: data?.updatedAt || null,
      updatedBy: data?.updatedBy ? String(data.updatedBy) : null
    };
  };

  const fetchSupportAiRuntimeStatus = async (): Promise<SupportAiRuntimeStatus> => {
    const result: any = await api.get('/api/support/ai-status');
    const data = result?.data || result || {};
    return {
      provider: String(data?.provider || 'auto'),
      geminiEnabled: Boolean(data?.geminiEnabled),
      openAiEnabled: Boolean(data?.openAiEnabled),
      aiEnabled: Boolean(data?.aiEnabled),
      configUpdatedAt: data?.configUpdatedAt || null,
      circuit: data?.circuit || {}
    };
  };

  const fetchIntelligenceReadiness = async (): Promise<IntelligenceReadiness> => {
    const result: any = await api.get('/api/intelligence/readiness');
    return (result?.data || result || {}) as IntelligenceReadiness;
  };

  const fetchSupportAuditEvents = async (): Promise<SupportAuditResponse> => {
    const params = new URLSearchParams();
    params.set('entity', 'support_settings');
    params.set('page', String(supportAuditPage));
    params.set('limit', String(supportAuditLimit));
    if (supportAuditAiFilter === 'on') params.set('aiEnabled', 'true');
    if (supportAuditAiFilter === 'off') params.set('aiEnabled', 'false');
    if (supportAuditRoleFilter !== 'all') params.set('actorRole', supportAuditRoleFilter);
    if (supportAuditDateFrom) params.set('from', `${supportAuditDateFrom}T00:00:00.000Z`);
    if (supportAuditDateTo) params.set('to', `${supportAuditDateTo}T23:59:59.999Z`);

    const result: any = await api.get(`/api/admin/audit?${params.toString()}`);
    const items: any[] = Array.isArray(result) ? result : (result?.data || []);
    const mapped = items.map((row: any) => ({
      id: String(row?._id || ''),
      createdAt: String(row?.createdAt || ''),
      method: String(row?.method || ''),
      statusCode: Number(row?.statusCode || 0),
      actorRole: String(row?.actorRole || ''),
      path: String(row?.path || ''),
      payloadAiEnabled: typeof row?.payload?.aiEnabled === 'boolean' ? row.payload.aiEnabled : null
    }));
    return {
      items: mapped,
      pagination: result?.pagination || null
    };
  };

  const fetchSystemSmokeAuditEvents = async (): Promise<SystemSmokeAuditEvent[]> => {
    const params = new URLSearchParams();
    params.set('entity', 'readiness_smoke');
    params.set('limit', '20');
    const result: any = await api.get(`/api/admin/audit?${params.toString()}`);
    const items: any[] = Array.isArray(result) ? result : (result?.data || []);
    return items.map((row: any) => ({
      id: String(row?._id || ''),
      createdAt: String(row?.createdAt || ''),
      actorRole: String(row?.actorRole || ''),
      actorTelegramId: row?.actorTelegramId ? Number(row.actorTelegramId) : null,
      actorId: row?.actorId ? String(row.actorId) : null,
      durationMs: Number(row?.payload?.durationMs || 0),
      mongoOk: Boolean(row?.payload?.summary?.mongoOk),
      redisOk: Boolean(row?.payload?.summary?.redisOk),
      usersCount: Number(row?.payload?.summary?.usersCount || 0),
      teamsCount: Number(row?.payload?.summary?.teamsCount || 0),
      tournamentsCount: Number(row?.payload?.summary?.tournamentsCount || 0)
    }));
  };

  const fetchTournaments = async (): Promise<PagedResult<any>> => {
    const params = new URLSearchParams({
      page: String(tournamentsPage),
      limit: '20'
    });
    if (tournamentsStatusFilter !== 'all') {
      params.set('status', tournamentsStatusFilter);
    }
    if (tournamentsGameFilter !== 'all') {
      params.set('game', tournamentsGameFilter);
    }
    if (tournamentsSearch.trim()) {
      params.set('search', tournamentsSearch.trim());
    }
    const result: any = await api.get(`/api/tournaments?${params.toString()}`);
    const items: any[] = (result && (result.data || result.tournaments)) || [];
    return {
      data: items.map((t: any) => ({
      id: (t.id || t._id || '').toString(),
      name: t.name || t.title || '',
      game: t.game || '',
      image: t.image || t.coverImage || '',
      status: t.status || 'upcoming',
      maxTeams: Number(t.maxTeams ?? t.maxParticipants ?? 0),
      participants: Number(t.participants ?? t.currentParticipants ?? 0),
      pendingRequestsCount: Number(t.pendingRequestsCount || 0),
      prizePool: Number(t.prizePool ?? 0),
      startDate: t.startDate || null,
      endDate: t.endDate || null
      })),
      pagination: result?.pagination || null
    };
  };

  const fetchBotOutbox = async (): Promise<PagedResult<BotOutboxRow>> => {
    const params = new URLSearchParams({
      page: String(botOutboxPage),
      limit: '20'
    });
    if (botOutboxStatusFilter !== 'all') params.set('status', botOutboxStatusFilter);
    if (botOutboxSearch.trim()) params.set('search', botOutboxSearch.trim());
    const result: any = await api.get(`/api/admin/bot/outbox?${params.toString()}`);
    const items: any[] = Array.isArray(result?.data) ? result.data : [];
    return {
      data: items.map((row: any) => ({
        id: String(row?.id || ''),
        userId: row?.userId ? String(row.userId) : null,
        telegramId: Number(row?.telegramId || 0),
        chatId: Number(row?.chatId || 0),
        eventType: String(row?.eventType || ''),
        title: String(row?.title || ''),
        message: String(row?.message || ''),
        status: String(row?.status || 'pending'),
        attempts: Number(row?.attempts || 0),
        sendAt: row?.sendAt ? String(row.sendAt) : null,
        sentAt: row?.sentAt ? String(row.sentAt) : null,
        lastError: String(row?.lastError || ''),
        createdAt: row?.createdAt ? String(row.createdAt) : null
      })),
      pagination: result?.pagination || null
    };
  };

  const fetchTournamentRequests = async (): Promise<PagedResult<AdminTournamentRequestRow>> => {
    if (!selectedTournamentId) {
      return { data: [], pagination: null };
    }
    const params = new URLSearchParams({
      status: 'pending',
      page: String(tournamentRequestsPage),
      limit: '12'
    });
    if (tournamentRequestSearch.trim()) {
      params.set('search', tournamentRequestSearch.trim());
    }
    const result: any = await api.get(`/api/tournaments/${selectedTournamentId}/requests?${params.toString()}`);
    const items: any[] = (result && result.data) || [];
    const rows = items.map((item: any) => ({
      id: String(item.id || ''),
      teamId: String(item.teamId || ''),
      teamName: String(item.teamName || ''),
      teamTag: String(item.teamTag || ''),
      teamLogo: item.teamLogo || '',
      membersCount: Number(item.membersCount || 0),
      stats: {
        wins: Number(item.stats?.wins || 0),
        losses: Number(item.stats?.losses || 0),
        winRate: Number(item.stats?.winRate || 0)
      },
      requestedBy: item.requestedBy || null,
      status: item.status || 'pending',
      requestedAt: item.requestedAt || null
    }));
    return {
      data: rows,
      pagination: result?.pagination || null
    };
  };

  const fetchTournamentOverview = async (): Promise<AdminTournamentOverview | null> => {
    if (!selectedTournamentId) return null;
    const result: any = await api.get(`/api/tournaments/${selectedTournamentId}/admin-overview`);
    return (result?.data || result || null) as AdminTournamentOverview | null;
  };

  const fetchTournamentMatches = async (): Promise<PagedResult<any> & {
    summary: {
      filteredTotal: number;
      totalAll?: number;
      roomsPreparedFiltered?: number;
      roomsPreparedAll?: number;
      byStatus?: {
        scheduled?: number;
        live?: number;
        completed?: number;
        cancelled?: number;
      };
      liveWithoutRoom?: number;
      completedWithoutWinner?: number;
    } | null
  }> => {
    if (!selectedTournamentId) {
      return { data: [], pagination: null, summary: { filteredTotal: 0, roomsPrepared: 0 } };
    }
    const params = new URLSearchParams({
      page: String(matchesPage),
      limit: '12',
      status: matchStatusFilter,
      room: matchRoomFilter,
      winner: matchWinnerFilter
    });
    if (matchSearch.trim()) {
      params.set('search', matchSearch.trim());
    }
    const result: any = await api.get(`/api/tournaments/${selectedTournamentId}/matches/admin?${params.toString()}`);
    return {
      data: Array.isArray(result?.data) ? result.data : [],
      pagination: result?.pagination || null,
      summary: result?.summary || null
    };
  };

  const fetchPendingTournamentQueue = async (): Promise<PagedResult<any>> => {
    const params = new URLSearchParams({
      limit: '12',
      page: String(pendingQueuePage)
    });
    const result: any = await api.get(`/api/tournaments/admin/requests/pending-overview?${params.toString()}`);
    const items: any[] = (result && result.data) || [];
    const rows = items.map((row: any) => ({
      id: String(row.tournamentId || ''),
      name: String(row.tournamentName || ''),
      game: String(row.game || ''),
      status: String(row.status || 'upcoming'),
      startDate: row.startDate || null,
      pendingRequestsCount: Number(row.pendingRequestsCount || 0),
      firstPendingAt: row.firstPendingAt || null
    }));
    return {
      data: rows,
      pagination: result?.pagination || null
    };
  };

  const fetchRecentTournamentRequests = async (): Promise<PagedResult<AdminTournamentRequestHistoryRow>> => {
    const params = new URLSearchParams({
      limit: '14',
      page: String(recentDecisionsPage),
      status: recentRequestsStatusFilter
    });
    if (recentDecisionsSearch.trim()) {
      params.set('search', recentDecisionsSearch.trim());
    }
    const result: any = await api.get(`/api/tournaments/admin/requests/recent?${params.toString()}`);
    const items: any[] = (result && result.data) || [];
    const rows = items.map((row: any) => ({
      id: String(row.id || ''),
      tournamentId: String(row.tournamentId || ''),
      tournamentName: String(row.tournamentName || ''),
      game: String(row.game || ''),
      tournamentStatus: String(row.tournamentStatus || 'upcoming'),
      teamId: String(row.teamId || ''),
      teamName: String(row.teamName || ''),
      teamTag: String(row.teamTag || ''),
      status: row.status === 'approved' ? 'approved' : 'rejected',
      note: String(row.note || ''),
      requestedAt: row.requestedAt || null,
      reviewedAt: row.reviewedAt || null,
      requestedBy: row.requestedBy || null,
      reviewedBy: row.reviewedBy || null
    }));
    return {
      data: rows,
      pagination: result?.pagination || null
    };
  };

  const fetchTournamentParticipants = async (): Promise<PagedResult<any> & { summary: { filteredTotal: number } | null }> => {
    if (!selectedTournamentId) {
      return { data: [], pagination: null, summary: { filteredTotal: 0 } };
    }
    const params = new URLSearchParams({
      page: String(participantPage),
      limit: '12'
    });
    if (participantSearch.trim()) {
      params.set('search', participantSearch.trim());
    }
    const result: any = await api.get(`/api/tournaments/${selectedTournamentId}/participants?${params.toString()}`);
    return {
      data: Array.isArray(result?.data) ? result.data : [],
      pagination: result?.pagination || null,
      summary: result?.summary || null
    };
  };

  const fetchNews = async (): Promise<{ items: any[]; pagination: PaginationMeta | null; summary: NewsSummary | null }> => {
    const params = new URLSearchParams({
      page: String(newsPage),
      limit: '20',
      status: newsStatusFilter
    });
    if (newsSearch.trim()) {
      params.set('search', newsSearch.trim());
    }
    const result: any = await api.get(`/api/news/admin?${params.toString()}`);
    const items: any[] = (result && result.data) || [];
    return {
      items: items.map((n: any) => ({
      id: (n._id || n.id || '').toString(),
      title: n.title || '',
      content: n.content || '',
      author: n.author?.username || n.author || '',
      status: n.status || 'draft',
      createdAt: formatDate(n.createdAt)
      })),
      pagination: result?.pagination || null,
      summary: result?.summary || null
    };
  };

  const fetchAchievements = async () => {
    const result: any = await api.get('/api/achievements/admin');
    const items: any[] = (result && result.data) || [];
    return items.map((a: any) => ({
      id: (a._id || a.id || '').toString(),
      key: a.key || '',
      name: a.name || '',
      description: a.description || '',
      icon: a.icon || '',
      isActive: !!a.isActive,
      criteriaType: a.criteria?.type || '',
      criteriaValue: Number(a.criteria?.value || 0)
    }));
  };

  const fetchRewards = async (): Promise<Reward[]> => {
    const result: any = await api.get('/api/rewards/admin');
    const items: any[] = Array.isArray(result) ? result : (result?.data || []);
    return items.map((r: any) => ({
      id: (r._id || r.id || '').toString(),
      name: r.name || '',
      description: r.description || '',
      type: r.type || 'currency',
      rarity: r.rarity || 'common',
      value: Number(r.value || 0),
      icon: r.icon || '',
      isActive: !!r.isActive,
      gameId: r.gameId || '',
      requirementsType: r.requirements?.type || '',
      requirementsValue: Number(r.requirements?.value || 0),
      expiresAt: r.expiresAt || null,
      createdAt: r.createdAt || ''
    }));
  };

  const fetchWalletTransactions = async (): Promise<PagedResult<AdminWalletTransaction>> => {
    const params = new URLSearchParams({
      page: String(paymentsPage),
      limit: '20'
    });
    if (paymentStatusFilter !== 'all') {
      params.set('status', paymentStatusFilter);
    }
    if (paymentFilter === 'pending_withdrawals') {
      params.set('type', 'withdrawal');
      if (paymentStatusFilter === 'all') {
        params.set('status', 'pending');
      }
    }
    if (paymentSearch.trim()) {
      params.set('search', paymentSearch.trim());
    }
    const result: any = await api.get(`/api/admin/wallet/transactions?${params.toString()}`);
    const items: any[] = Array.isArray(result) ? result : (result?.data || []);
    const rows = items.map((tx: any) => ({
      id: (tx.id || tx._id || '').toString(),
      userId: (tx.userId || '').toString(),
      source: tx.source === 'wallet' ? 'wallet' : 'user',
      username: tx.username || '',
      email: tx.email || '',
      telegramId: Number(tx.telegramId || 0),
      type: tx.type || '',
      amount: Number(tx.amount || 0),
      status: tx.status || '',
      description: tx.description || '',
      date: tx.date ? new Date(tx.date).toISOString() : new Date().toISOString(),
      reference: tx.reference || '',
      walletAddress: tx.walletAddress || '',
      network: tx.network || '',
      txHash: tx.txHash || '',
      processedAt: tx.processedAt || null,
      balance: Number(tx.balance || 0)
    }));
    return {
      data: rows,
      pagination: result?.pagination || null
    };
  };

  const fetchAuditLogs = async () => {
    const result: any = await api.get('/api/admin/audit?limit=100');
    const items: any[] = Array.isArray(result) ? result : (result?.data || []);
    return items.map((row: any) => ({
      id: String(row?._id || ''),
      createdAt: row?.createdAt || '',
      action: row?.action || '',
      entity: row?.entity || '',
      entityId: row?.entityId || '',
      statusCode: Number(row?.statusCode || 0),
      actorRole: row?.actorRole || '',
      path: row?.path || '',
      method: row?.method || '',
      payload: row?.payload || null,
      payloadAiEnabled: typeof row?.payload?.aiEnabled === 'boolean' ? row.payload.aiEnabled : null
    }));
  };

  const fetchMatchOpsSummary = async (): Promise<MatchOpsSummary | null> => {
    if (!selectedTournamentId) return null;
    const params = new URLSearchParams({
      tournamentId: selectedTournamentId,
      hours: String(matchOpsWindowHours)
    });
    const result: any = await api.get(`/api/matches/ops/summary?${params.toString()}`);
    const payload = result?.data || result || null;
    if (!payload) return null;
    return {
      hours: Number(payload?.hours || 48),
      since: String(payload?.since || ''),
      tournamentId: payload?.tournamentId ? String(payload.tournamentId) : null,
      total: Number(payload?.total || 0),
      byEntity: Array.isArray(payload?.byEntity)
        ? payload.byEntity.map((row: any) => ({
          entity: String(row?.entity || ''),
          count: Number(row?.count || 0)
        }))
        : [],
      byStatusCode: Array.isArray(payload?.byStatusCode)
        ? payload.byStatusCode.map((row: any) => ({
          statusCode: Number(row?.statusCode || 0),
          count: Number(row?.count || 0)
        }))
        : []
    };
  };

  const fetchAuthLogs = async (): Promise<AdminAuthLog[]> => {
    const result: any = await api.get(`/api/admin/auth-logs?${buildAuthLogQueryString(150)}`);
    const items: any[] = Array.isArray(result) ? result : (result?.data || []);

    return items.map((row: any) => {
      const userData = row?.userId || {};
      return {
        id: String(row?._id || row?.id || ''),
        createdAt: row?.createdAt || '',
        userId: String(userData?._id || row?.userId || ''),
        username: userData?.username || '',
        email: userData?.email || '',
        telegramId: Number(userData?.telegramId || 0),
        role: userData?.role || '',
        event: row?.event || '',
        status: row?.status || '',
        method: row?.method || '',
        identifier: row?.identifier || '',
        reason: row?.reason || '',
        ip: row?.ip || '',
        userAgent: row?.userAgent || ''
      };
    });
  };

  const fetchOpsMetrics = async (): Promise<OpsMetrics | null> => {
    const result: any = await api.get('/api/admin/ops/metrics');
    return (result?.data || result || null) as OpsMetrics | null;
  };

  const fetchOpsQueue = async (): Promise<OpsQueue | null> => {
    const result: any = await api.get('/api/admin/ops/queue');
    return (result?.data || result || null) as OpsQueue | null;
  };

  const fetchOpsBackups = async (): Promise<OpsBackup[]> => {
    const result: any = await api.get('/api/admin/ops/backups');
    const items: any[] = Array.isArray(result) ? result : (result?.data || []);
    return items.map((entry: any) => ({
      id: String(entry?.id || ''),
      path: String(entry?.path || ''),
      createdAt: String(entry?.createdAt || ''),
      updatedAt: String(entry?.updatedAt || ''),
      collections: Number(entry?.collections || 0)
    }));
  };

  const fetchOpsAuditTimeline = async (): Promise<OpsAuditTimeline | null> => {
    const params = new URLSearchParams({
      hours: String(opsTimelineHours),
      bucketMinutes: String(opsTimelineBucketMinutes)
    });
    const result: any = await api.get(`/api/admin/ops/audit-timeline?${params.toString()}`);
    const payload = result?.data || result || null;
    if (!payload) return null;
    return {
      hours: Number(payload?.hours || opsTimelineHours),
      bucketMinutes: Number(payload?.bucketMinutes || opsTimelineBucketMinutes),
      since: String(payload?.since || ''),
      totals: {
        total: Number(payload?.totals?.total || 0),
        success: Number(payload?.totals?.success || 0),
        clientError: Number(payload?.totals?.clientError || 0),
        serverError: Number(payload?.totals?.serverError || 0)
      },
      points: Array.isArray(payload?.points)
        ? payload.points.map((row: any) => ({
          ts: String(row?.ts || ''),
          total: Number(row?.total || 0),
          success: Number(row?.success || 0),
          clientError: Number(row?.clientError || 0),
          serverError: Number(row?.serverError || 0)
        }))
        : []
    };
  };

  const fetchOpsTopErrors = async (): Promise<OpsTopErrorRow[]> => {
    const params = new URLSearchParams({
      hours: String(opsTimelineHours),
      limit: '12'
    });
    const result: any = await api.get(`/api/admin/ops/errors-top?${params.toString()}`);
    const payload = result?.data || result || null;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return items.map((row: any) => ({
      method: String(row?.method || 'GET'),
      path: String(row?.path || '/unknown'),
      statusCode: Number(row?.statusCode || 500),
      count: Number(row?.count || 0),
      lastSeenAt: row?.lastSeenAt ? String(row.lastSeenAt) : null
    }));
  };

  const fetchOpsErrorSamples = async (): Promise<OpsErrorSampleRow[]> => {
    if (!selectedTopError) return [];
    const params = new URLSearchParams({
      hours: String(opsTimelineHours),
      limit: '25',
      method: selectedTopError.method,
      path: selectedTopError.path,
      statusCode: String(selectedTopError.statusCode)
    });
    const result: any = await api.get(`/api/admin/ops/errors-samples?${params.toString()}`);
    const payload = result?.data || result || null;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return items.map((row: any) => ({
      id: String(row?.id || ''),
      createdAt: row?.createdAt ? String(row.createdAt) : null,
      actorRole: String(row?.actorRole || ''),
      statusCode: Number(row?.statusCode || 0),
      method: String(row?.method || ''),
      path: String(row?.path || ''),
      entity: String(row?.entity || ''),
      entityId: String(row?.entityId || ''),
      ip: String(row?.ip || ''),
      payload: row?.payload || null
    }));
  };

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', usersPage, usersSearch, usersRoleFilter, usersSubscribedFilter, usersBannedFilter],
    queryFn: fetchUsers,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const tournamentsQuery = useQuery({
    queryKey: ['admin', 'tournaments', tournamentsPage, tournamentsSearch, tournamentsStatusFilter, tournamentsGameFilter],
    queryFn: fetchTournaments,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const tournamentRequestsQuery = useQuery({
    queryKey: ['admin', 'tournament-requests', selectedTournamentId, tournamentRequestsPage, tournamentRequestSearch],
    queryFn: fetchTournamentRequests,
    enabled: hasAdminAccess && activeTab === 'tournaments' && Boolean(selectedTournamentId),
    staleTime: 5000,
    refetchOnWindowFocus: false
  });

  const tournamentOverviewQuery = useQuery({
    queryKey: ['admin', 'tournament-overview', selectedTournamentId],
    queryFn: fetchTournamentOverview,
    enabled: hasAdminAccess && activeTab === 'tournaments' && Boolean(selectedTournamentId),
    staleTime: 5000,
    refetchOnWindowFocus: false
  });

  const tournamentMatchesQuery = useQuery({
    queryKey: [
      'admin',
      'tournament-matches',
      selectedTournamentId,
      matchesPage,
      matchStatusFilter,
      matchRoomFilter,
      matchWinnerFilter,
      matchSearch
    ],
    queryFn: fetchTournamentMatches,
    enabled: hasAdminAccess && activeTab === 'tournaments' && Boolean(selectedTournamentId),
    staleTime: 5000,
    refetchOnWindowFocus: false
  });

  const pendingTournamentQueueQuery = useQuery({
    queryKey: ['admin', 'pending-tournament-queue', pendingQueuePage],
    queryFn: fetchPendingTournamentQueue,
    enabled: hasAdminAccess && activeTab === 'tournaments',
    staleTime: 5000,
    refetchOnWindowFocus: false
  });

  const recentTournamentRequestsQuery = useQuery({
    queryKey: ['admin', 'recent-tournament-requests', recentRequestsStatusFilter, recentDecisionsPage, recentDecisionsSearch],
    queryFn: fetchRecentTournamentRequests,
    enabled: hasAdminAccess && activeTab === 'tournaments',
    staleTime: 15000,
    refetchOnWindowFocus: false
  });

  const tournamentParticipantsQuery = useQuery({
    queryKey: ['admin', 'tournament-participants', selectedTournamentId, participantPage, participantSearch],
    queryFn: fetchTournamentParticipants,
    enabled: hasAdminAccess && activeTab === 'tournaments' && Boolean(selectedTournamentId),
    staleTime: 5000,
    refetchOnWindowFocus: false
  });

  const newsQuery = useQuery({
    queryKey: ['admin', 'news', newsPage, newsSearch, newsStatusFilter],
    queryFn: fetchNews,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const achievementsQuery = useQuery({
    queryKey: ['admin', 'achievements'],
    queryFn: fetchAchievements,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const rewardsQuery = useQuery({
    queryKey: ['admin', 'rewards'],
    queryFn: fetchRewards,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const teamsQuery = useQuery({
    queryKey: ['admin', 'teams', teamsPage, teamsSearch],
    queryFn: fetchTeams,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const referralsQuery = useQuery({
    queryKey: ['admin', 'referrals'],
    queryFn: fetchReferrals,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const referralSettingsQuery = useQuery({
    queryKey: ['admin', 'referral-settings'],
    queryFn: fetchReferralSettings,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const contactsQuery = useQuery({
    queryKey: ['admin', 'contacts', contactsPage, contactsSearch],
    queryFn: fetchContacts,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const supportConversationsQuery = useQuery({
    queryKey: ['admin', 'support-conversations', supportStatusFilter],
    queryFn: fetchSupportConversations,
    enabled: hasAdminAccess,
    staleTime: 10000,
    refetchOnWindowFocus: false
  });

  const supportMessagesQuery = useQuery({
    queryKey: ['admin', 'support-messages', selectedSupportConversationId],
    queryFn: fetchSupportMessages,
    enabled: hasAdminAccess && Boolean(selectedSupportConversationId),
    staleTime: 5000,
    refetchOnWindowFocus: false
  });

  const supportSettingsQuery = useQuery({
    queryKey: ['admin', 'support-settings'],
    queryFn: fetchSupportSettings,
    enabled: hasAdminAccess,
    staleTime: 10000,
    refetchOnWindowFocus: false
  });

  const supportAiRuntimeQuery = useQuery({
    queryKey: ['admin', 'support-ai-runtime'],
    queryFn: fetchSupportAiRuntimeStatus,
    enabled: hasAdminAccess,
    staleTime: 10000,
    refetchOnWindowFocus: false
  });

  const intelligenceReadinessQuery = useQuery({
    queryKey: ['admin', 'intelligence-readiness'],
    queryFn: fetchIntelligenceReadiness,
    enabled: hasAdminAccess,
    staleTime: 10000,
    refetchOnWindowFocus: false
  });

  const supportAuditEventsQuery = useQuery({
    queryKey: [
      'admin',
      'support-audit-events',
      supportAuditPage,
      supportAuditLimit,
      supportAuditAiFilter,
      supportAuditRoleFilter,
      supportAuditDateFrom,
      supportAuditDateTo
    ],
    queryFn: fetchSupportAuditEvents,
    enabled: hasAdminAccess,
    staleTime: 10000,
    refetchOnWindowFocus: false
  });

  const systemSmokeAuditEventsQuery = useQuery({
    queryKey: ['admin', 'system-smoke-audit-events'],
    queryFn: fetchSystemSmokeAuditEvents,
    enabled: hasAdminAccess,
    staleTime: 10000,
    refetchOnWindowFocus: false
  });

  const botOutboxQuery = useQuery({
    queryKey: ['admin', 'bot-outbox', botOutboxPage, botOutboxStatusFilter, botOutboxSearch],
    queryFn: fetchBotOutbox,
    enabled: hasAdminAccess,
    staleTime: 5000,
    refetchOnWindowFocus: false
  });

  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchDashboardStats,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const analyticsQuery = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: fetchAnalytics,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const scoutProviderQuery = useQuery({
    queryKey: ['admin', 'scouting-provider'],
    queryFn: fetchScoutProviderStatus,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const prospectsQuery = useQuery({
    queryKey: ['admin', 'scouting-prospects'],
    queryFn: fetchTopProspects,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const anomaliesQuery = useQuery({
    queryKey: ['admin', 'scouting-anomalies'],
    queryFn: fetchAnomalyAlerts,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const watchlistQuery = useQuery({
    queryKey: ['admin', 'scouting-watchlist'],
    queryFn: fetchWatchlist,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const hallOfFameQuery = useQuery({
    queryKey: ['admin', 'hall-of-fame'],
    queryFn: fetchHallOfFame,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const walletTransactionsQuery = useQuery({
    queryKey: ['admin', 'wallet-transactions', paymentsPage, paymentStatusFilter, paymentFilter, paymentSearch],
    queryFn: fetchWalletTransactions,
    enabled: hasAdminAccess,
    staleTime: 15000,
    refetchOnWindowFocus: false
  });

  const auditLogsQuery = useQuery({
    queryKey: ['admin', 'audit-logs'],
    queryFn: fetchAuditLogs,
    enabled: hasAdminAccess,
    staleTime: 15000,
    refetchOnWindowFocus: false,
    refetchInterval: isOpsTab ? 15000 : false
  });

  const authLogsQuery = useQuery({
    queryKey: ['admin', 'auth-logs', authLogFilters.event, authLogFilters.method, authLogFilters.status, authLogFilters.search],
    queryFn: fetchAuthLogs,
    enabled: hasAdminAccess,
    staleTime: 15000,
    refetchOnWindowFocus: false,
    refetchInterval: isOpsTab ? 15000 : false
  });

  const opsMetricsQuery = useQuery({
    queryKey: ['admin', 'ops-metrics'],
    queryFn: fetchOpsMetrics,
    enabled: hasAdminAccess,
    staleTime: 10000,
    refetchOnWindowFocus: false,
    refetchInterval: isOpsTab ? 10000 : false
  });

  const opsQueueQuery = useQuery({
    queryKey: ['admin', 'ops-queue'],
    queryFn: fetchOpsQueue,
    enabled: hasAdminAccess,
    staleTime: 10000,
    refetchOnWindowFocus: false,
    refetchInterval: isOpsTab ? 10000 : false
  });

  const opsBackupsQuery = useQuery({
    queryKey: ['admin', 'ops-backups'],
    queryFn: fetchOpsBackups,
    enabled: hasAdminAccess,
    staleTime: 15000,
    refetchOnWindowFocus: false,
    refetchInterval: isOpsTab ? 30000 : false
  });

  const opsAuditTimelineQuery = useQuery({
    queryKey: ['admin', 'ops-audit-timeline', opsTimelineHours, opsTimelineBucketMinutes],
    queryFn: fetchOpsAuditTimeline,
    enabled: hasAdminAccess && isOpsTab,
    staleTime: 10000,
    refetchOnWindowFocus: false,
    refetchInterval: isOpsTab ? 15000 : false
  });

  const opsTopErrorsQuery = useQuery({
    queryKey: ['admin', 'ops-top-errors', opsTimelineHours],
    queryFn: fetchOpsTopErrors,
    enabled: hasAdminAccess && isOpsTab,
    staleTime: 10000,
    refetchOnWindowFocus: false,
    refetchInterval: isOpsTab ? 15000 : false
  });

  const opsErrorSamplesQuery = useQuery({
    queryKey: [
      'admin',
      'ops-error-samples',
      opsTimelineHours,
      selectedTopError?.method || '',
      selectedTopError?.path || '',
      selectedTopError?.statusCode || 0
    ],
    queryFn: fetchOpsErrorSamples,
    enabled: hasAdminAccess && isOpsTab && Boolean(selectedTopError),
    staleTime: 10000,
    refetchOnWindowFocus: false,
    refetchInterval: isOpsTab && Boolean(selectedTopError) ? 15000 : false
  });

  const matchOpsSummaryQuery = useQuery({
    queryKey: ['admin', 'match-ops-summary', selectedTournamentId, matchOpsWindowHours],
    queryFn: fetchMatchOpsSummary,
    enabled: hasAdminAccess && activeTab === 'tournaments' && Boolean(selectedTournamentId),
    staleTime: 15000,
    refetchOnWindowFocus: false,
    refetchInterval: activeTab === 'tournaments' && Boolean(selectedTournamentId) ? 15000 : false
  });

  const users = usersQuery.data?.items || [];
  const usersPagination = usersQuery.data?.pagination || null;
  const usersSummary = usersQuery.data?.summary || null;
  const tournaments = tournamentsQuery.data?.data || [];
  const tournamentsPagination = tournamentsQuery.data?.pagination || null;
  const pendingTournamentQueue = pendingTournamentQueueQuery.data?.data || [];
  const pendingTournamentQueuePagination = pendingTournamentQueueQuery.data?.pagination || null;
  const recentTournamentRequests = recentTournamentRequestsQuery.data?.data || [];
  const recentTournamentRequestsPagination = recentTournamentRequestsQuery.data?.pagination || null;
  const tournamentRequests = tournamentRequestsQuery.data?.data || [];
  const tournamentRequestsPagination = tournamentRequestsQuery.data?.pagination || null;
  const tournamentParticipants = tournamentParticipantsQuery.data?.data || [];
  const tournamentParticipantsPagination = tournamentParticipantsQuery.data?.pagination || null;
  const tournamentParticipantsSummary = tournamentParticipantsQuery.data?.summary || null;
  const tournamentMatches = tournamentMatchesQuery.data?.data || [];
  const tournamentMatchesPagination = tournamentMatchesQuery.data?.pagination || null;
  const tournamentMatchesSummary = tournamentMatchesQuery.data?.summary || null;
  const tournamentOverview = tournamentOverviewQuery.data || null;
  const news = newsQuery.data?.items || [];
  const newsPagination = newsQuery.data?.pagination || null;
  const newsSummary = newsQuery.data?.summary || null;
  const achievements = achievementsQuery.data || [];
  const rewards = rewardsQuery.data || [];
  const teams = teamsQuery.data?.items || [];
  const teamsPagination = teamsQuery.data?.pagination || null;
  const teamsSummary = teamsQuery.data?.summary || null;
  const referrals = referralsQuery.data || [];
  const referralSettings = referralSettingsQuery.data || null;
  const contacts = contactsQuery.data?.items || [];
  const contactsPagination = contactsQuery.data?.pagination || null;
  const contactsSummary = contactsQuery.data?.summary || null;
  const botOutboxRows = botOutboxQuery.data?.data || [];
  const botOutboxPagination = botOutboxQuery.data?.pagination || null;
  const supportConversations = supportConversationsQuery.data || [];
  const supportMessages = supportMessagesQuery.data || [];
  const supportSettings = supportSettingsQuery.data || null;
  const supportAiRuntime = supportAiRuntimeQuery.data || null;
  const intelligenceReadiness = intelligenceReadinessQuery.data || null;
  const supportAuditEvents = supportAuditEventsQuery.data?.items || [];
  const supportAuditPagination = supportAuditEventsQuery.data?.pagination || null;
  const systemSmokeAuditEvents = systemSmokeAuditEventsQuery.data || [];
  const walletTransactions = walletTransactionsQuery.data?.data || [];
  const walletTransactionsPagination = walletTransactionsQuery.data?.pagination || null;
  const auditLogs = auditLogsQuery.data || [];
  const authLogs = authLogsQuery.data || [];
  const opsMetrics = opsMetricsQuery.data || null;
  const opsQueue = opsQueueQuery.data || null;
  const opsBackups = opsBackupsQuery.data || [];
  const opsAuditTimeline = opsAuditTimelineQuery.data || null;
  const opsTopErrors = opsTopErrorsQuery.data || [];
  const opsErrorSamples = opsErrorSamplesQuery.data || [];
  const dashboardStats = statsQuery.data || null;
  const analytics = analyticsQuery.data || null;
  const scoutProvider = scoutProviderQuery.data || null;
  const prospects = prospectsQuery.data || [];
  const anomalies = anomaliesQuery.data || [];
  const watchlist = watchlistQuery.data || [];
  const hallOfFame = hallOfFameQuery.data || [];
  const matchOpsSummary = matchOpsSummaryQuery.data || null;

  useEffect(() => {
    if (!hasAdminAccess || activeTab !== 'tournaments' || !selectedTournamentId) return;

    const currentIds = Array.isArray(tournamentRequests)
      ? tournamentRequests
        .map((row: AdminTournamentRequestRow) => String(row.id || row.teamId || ''))
        .filter(Boolean)
      : [];

    const prevIds = knownTournamentRequestIdsRef.current[selectedTournamentId];
    if (!prevIds) {
      knownTournamentRequestIdsRef.current[selectedTournamentId] = currentIds;
      return;
    }

    const prevSet = new Set(prevIds);
    const added = currentIds.filter((id) => !prevSet.has(id));
    if (added.length > 0) {
      setNewTournamentRequestCounts((prev) => ({
        ...prev,
        [selectedTournamentId]: (prev[selectedTournamentId] || 0) + added.length
      }));

      if (tournamentRequestSoundEnabled) {
        playTournamentAlertSound();
      }

      notify(
        'info',
        'New tournament requests',
        `${added.length} new request${added.length > 1 ? 's' : ''} in tournament ${selectedTournamentId}`
      );
    }

    knownTournamentRequestIdsRef.current[selectedTournamentId] = currentIds;
  }, [hasAdminAccess, activeTab, selectedTournamentId, tournamentRequests, tournamentRequestSoundEnabled, notify]);

  useEffect(() => {
    if (activeTab !== 'tournaments') return;
    if (!Array.isArray(tournaments) || !tournaments.length) {
      setSelectedTournamentId(null);
      return;
    }

    const stillExists = selectedTournamentId
      ? tournaments.some((item: any) => item.id === selectedTournamentId)
      : false;

    if (!stillExists) {
      setSelectedTournamentId(tournaments[0].id);
    }
  }, [activeTab, tournaments, selectedTournamentId]);

  useEffect(() => {
    setTournamentRequestsPage(1);
    setMatchesPage(1);
    setRecentDecisionsPage(1);
    setParticipantPage(1);
  }, [selectedTournamentId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTournamentRequestsPage(1);
      setTournamentRequestSearch(tournamentRequestSearchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [tournamentRequestSearchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRecentDecisionsPage(1);
      setRecentDecisionsSearch(recentDecisionsSearchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [recentDecisionsSearchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPaymentsPage(1);
      setPaymentSearch(paymentSearchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [paymentSearchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setParticipantSearch(participantSearchInput.trim().toLowerCase());
      setParticipantPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [participantSearchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBotOutboxPage(1);
      setBotOutboxSearch(botOutboxSearchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [botOutboxSearchInput]);

  useEffect(() => {
    if (activeTab !== 'support') return;
    if (!supportConversations.length) {
      setSelectedSupportConversationId(null);
      return;
    }
    const exists = selectedSupportConversationId
      ? supportConversations.some((row: SupportConversationRow) => row.id === selectedSupportConversationId)
      : false;
    if (!exists) {
      setSelectedSupportConversationId(supportConversations[0].id);
    }
  }, [activeTab, supportConversations, selectedSupportConversationId]);

  useEffect(() => {
    if (!selectedTopError) return;
    const exists = opsTopErrors.some((row) =>
      row.method === selectedTopError.method &&
      row.path === selectedTopError.path &&
      row.statusCode === selectedTopError.statusCode
    );
    if (!exists) {
      setSelectedTopError(null);
    }
  }, [opsTopErrors, selectedTopError]);

  useEffect(() => {
    setSupportAuditPage(1);
  }, [supportAuditAiFilter, supportAuditRoleFilter, supportAuditDateFrom, supportAuditDateTo, supportAuditLimit]);

  const queryError =
    usersQuery.error ||
    tournamentsQuery.error ||
    tournamentRequestsQuery.error ||
    tournamentOverviewQuery.error ||
    tournamentMatchesQuery.error ||
    tournamentParticipantsQuery.error ||
    newsQuery.error ||
    achievementsQuery.error ||
    rewardsQuery.error ||
    teamsQuery.error ||
    referralsQuery.error ||
    referralSettingsQuery.error ||
    supportSettingsQuery.error ||
    supportAiRuntimeQuery.error ||
    intelligenceReadinessQuery.error ||
    supportAuditEventsQuery.error ||
    systemSmokeAuditEventsQuery.error ||
    botOutboxQuery.error ||
    supportConversationsQuery.error ||
    supportMessagesQuery.error ||
    contactsQuery.error ||
    walletTransactionsQuery.error ||
    auditLogsQuery.error ||
    authLogsQuery.error ||
    opsMetricsQuery.error ||
    opsQueueQuery.error ||
    opsBackupsQuery.error ||
    opsAuditTimelineQuery.error ||
    opsTopErrorsQuery.error ||
    opsErrorSamplesQuery.error ||
    matchOpsSummaryQuery.error ||
    statsQuery.error ||
    analyticsQuery.error;

  const isQueryLoading =
    usersQuery.isFetching ||
    tournamentsQuery.isFetching ||
    tournamentRequestsQuery.isFetching ||
    tournamentOverviewQuery.isFetching ||
    tournamentMatchesQuery.isFetching ||
    tournamentParticipantsQuery.isFetching ||
    newsQuery.isFetching ||
    achievementsQuery.isFetching ||
    rewardsQuery.isFetching ||
    teamsQuery.isFetching ||
    referralsQuery.isFetching ||
    referralSettingsQuery.isFetching ||
    supportSettingsQuery.isFetching ||
    supportAiRuntimeQuery.isFetching ||
    intelligenceReadinessQuery.isFetching ||
    supportAuditEventsQuery.isFetching ||
    systemSmokeAuditEventsQuery.isFetching ||
    botOutboxQuery.isFetching ||
    supportConversationsQuery.isFetching ||
    supportMessagesQuery.isFetching ||
    contactsQuery.isFetching ||
    walletTransactionsQuery.isFetching ||
    auditLogsQuery.isFetching ||
    authLogsQuery.isFetching ||
    opsMetricsQuery.isFetching ||
    opsQueueQuery.isFetching ||
    opsBackupsQuery.isFetching ||
    opsAuditTimelineQuery.isFetching ||
    opsTopErrorsQuery.isFetching ||
    opsErrorSamplesQuery.isFetching ||
    matchOpsSummaryQuery.isFetching ||
    statsQuery.isFetching ||
    analyticsQuery.isFetching;

  const derivedError = queryError ? formatApiError(queryError, 'Failed to load admin data') : null;
  const effectiveError = error || derivedError;
  const isBusy = loading || isQueryLoading;

  const buildInitialModalData = (type: string, item: any | null) => {
    if (type === 'tournament') {
      const now = new Date();
      const start = item?.startDate ? new Date(item.startDate) : now;
      const end = item?.endDate ? new Date(item.endDate) : new Date(now.getTime() + 2 * 60 * 60 * 1000);
      return {
        name: item?.name || '',
        game: item?.game || 'CS2',
        image: item?.image || item?.coverImage || '',
        prizePool: item?.prizePool ?? 0,
        maxTeams: item?.maxTeams ?? item?.maxParticipants ?? 16,
        status: item?.status || 'upcoming',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        format: item?.format || 'single_elimination',
        type: item?.type || 'team',
        description: item?.description || 'TBD',
        rules: item?.rules || 'TBD'
      };
    }

    if (type === 'news') {
      const content = item?.content || '';
      return {
        title: item?.title || '',
        content,
        summary: item?.summary || content.slice(0, 200),
        category: item?.category || 'announcement',
        status: item?.status || 'published'
      };
    }

    if (type === 'achievement') {
      return {
        key: item?.key || '',
        name: item?.name || '',
        description: item?.description || '',
        icon: item?.icon || '',
        isActive: item?.isActive ?? true,
        criteriaType: item?.criteriaType || item?.criteria?.type || 'wins_gte',
        criteriaValue: item?.criteriaValue ?? item?.criteria?.value ?? 1
      };
    }

    if (type === 'reward') {
      return {
        name: item?.name || '',
        description: item?.description || '',
        type: item?.type || 'currency',
        rarity: item?.rarity || 'common',
        value: item?.value ?? 0,
        icon: item?.icon || '',
        isActive: item?.isActive ?? true,
        gameId: item?.gameId || '',
        requirementsType: item?.requirementsType || item?.requirements?.type || '',
        requirementsValue: item?.requirementsValue ?? item?.requirements?.value ?? 0,
        expiresAt: item?.expiresAt || ''
      };
    }

    if (type === 'user') {
      return {
        username: item?.username || '',
        firstName: item?.firstName || '',
        lastName: item?.lastName || '',
        email: item?.email || '',
        role: item?.role || 'user',
        bio: item?.bio || '',
        balance: item?.balance ?? 0,
        freeEntriesCount: item?.freeEntriesCount ?? 0,
        bonusEntries: item?.bonusEntries ?? 0,
        isSubscribed: item?.isSubscribed ?? false,
        subscriptionExpiresAt: item?.subscriptionExpiresAt || '',
        isBanned: item?.isBanned ?? false
      };
    }

    return item || {};
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string = 'coverImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const result = await api.uploadImage(file);
      setField(fieldName, result.url);
    } catch (e: any) {
      setError(formatApiError(e, 'Image upload failed'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = (type: 'user' | 'tournament' | 'news' | 'reward' | 'achievement' | 'team') => {
    setModalType(type);
    setEditingItem(null);
    setModalData(buildInitialModalData(type, null));
    setIsModalOpen(true);
  };

  const handleEdit = (item: any, type: 'user' | 'tournament' | 'news' | 'reward' | 'achievement' | 'team') => {
    setModalType(type);
    setEditingItem(item);
    setModalData(buildInitialModalData(type, item));
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, type: string) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        setError(null);
        if (type === 'reward') {
          await api.delete(`/api/rewards/admin/${id}`);
          await queryClient.invalidateQueries({ queryKey: ['admin', 'rewards'] });
          await queryClient.invalidateQueries({ queryKey: ['rewards'] });
          notify('success', 'Deleted', 'Reward deleted successfully');
          return;
        }
        if (type === 'achievement') {
          await api.delete(`/api/achievements/admin/${id}`);
          await queryClient.invalidateQueries({ queryKey: ['admin', 'achievements'] });
          notify('success', 'Deleted', 'Achievement deleted successfully');
          return;
        }

        const entityMap: Record<string, string> = {
          'tournament': 'tournaments',
          'news': 'news',
          'achievement': 'achievements',
          'user': 'users',
          'team': 'teams'
        };

        const entity = entityMap[type] || type;
        await api.delete(`/api/admin/${entity}/${id}`);

        // Refresh based on type
        if (type === 'tournament') await queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] });
        if (type === 'news') await queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
        if (type === 'achievement') await queryClient.invalidateQueries({ queryKey: ['admin', 'achievements'] });
        if (type === 'user') await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        if (type === 'team') await load(); // Full refresh for teams/others
        if (type === 'tournament') await queryClient.invalidateQueries({ queryKey: ['tournaments'] });
        if (type === 'team') await queryClient.invalidateQueries({ queryKey: ['teams'] });
        if (type === 'news') await queryClient.invalidateQueries({ queryKey: ['news'] });

        if (type === 'tournament' && selectedTournamentId === id) {
          setSelectedTournamentId(null);
        }

        notify('success', 'Deleted', `${type} deleted successfully`);
      } catch (e: any) {
        setError(formatApiError(e, 'Delete failed'));
        notify('error', 'Delete failed', formatApiError(e, 'Delete failed'));
      }
    }
  };

  const handleStartTournament = async (id: string) => {
    try {
      await api.post(`/api/tournaments/${id}/start`, {});
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['matches'] }),
        queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      ]);
      notify('success', 'Tournament started', 'Bracket matches generated');
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to start tournament');
      setError(message);
      notify('error', 'Start failed', message);
    }
  };

  const handleApproveTournamentRequest = async (tournamentId: string, teamId: string) => {
    const noteInput = window.prompt('Approval note (optional)', '') || '';
    const note = noteInput.trim();
    try {
      setError(null);
      await api.post(`/api/tournaments/${tournamentId}/requests/${teamId}/approve`, note ? { note } : {});
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-requests', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['matches'] })
      ]);
      notify('success', 'Request approved', 'Team has been added to tournament participants');
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to approve request');
      setError(message);
      notify('error', 'Approve failed', message);
    }
  };

  const handleRejectTournamentRequest = async (tournamentId: string, teamId: string) => {
    const noteInput = window.prompt('Reject reason (optional)', '') || '';
    const note = noteInput.trim();
    try {
      setError(null);
      await api.post(`/api/tournaments/${tournamentId}/requests/${teamId}/reject`, note ? { note } : {});
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-requests', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'recent-tournament-requests'] })
      ]);
      notify('success', 'Request rejected', 'Team request was rejected');
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to reject request');
      setError(message);
      notify('error', 'Reject failed', message);
    }
  };

  const handleSaveMatchScore = async (match: any, team1ScoreRaw: string, team2ScoreRaw: string) => {
    const team1Score = Number(team1ScoreRaw);
    const team2Score = Number(team2ScoreRaw);

    if (!Number.isFinite(team1Score) || !Number.isFinite(team2Score) || team1Score < 0 || team2Score < 0) {
      notify('warning', 'Invalid score', 'Scores must be zero or positive numbers');
      return;
    }

    const winnerId = team1Score === team2Score
      ? null
      : (team1Score > team2Score ? match?.team1?.id : match?.team2?.id);

    try {
      setError(null);
      await api.put(`/api/matches/${match.id}/score`, {
        score: {
          team1: team1Score,
          team2: team2Score
        },
        ...(winnerId ? { winner: winnerId } : {})
      });

      if (selectedTournamentId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', selectedTournamentId] }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
          queryClient.invalidateQueries({ queryKey: ['tournaments'] }),
          queryClient.invalidateQueries({ queryKey: ['matches'] })
        ]);
      }
      notify('success', 'Match updated', 'Match score and winner were updated');
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to update match');
      setError(message);
      notify('error', 'Match update failed', message);
    }
  };

  const copyText = async (value: string, successTitle: string) => {
    const text = String(value || '').trim();
    if (!text) {
      notify('warning', 'Nothing to copy', 'Value is empty');
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement('textarea');
        input.value = text;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      notify('success', successTitle, 'Copied to clipboard');
    } catch (e) {
      notify('error', 'Copy failed', formatApiError(e, 'Failed to copy value'));
    }
  };

  const invalidateTournamentMatchViews = async (tournamentId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', tournamentId] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-matches', tournamentId] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
      queryClient.invalidateQueries({ queryKey: ['matches'] }),
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId, 'matches', 'schedule'] }),
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId, 'matches', 'live'] }),
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId, 'matches', 'results'] }),
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId, 'matches', 'bracket'] })
    ]);
  };

  const handlePrepareSingleMatchRoom = async (matchId: string, force = false) => {
    if (!selectedTournamentId) return;
    try {
      setError(null);
      const result: any = await api.post(`/api/matches/${matchId}/room`, { force });
      const payload = result?.data || result || {};

      await Promise.all([
        invalidateTournamentMatchViews(selectedTournamentId),
        queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'match-ops-summary', selectedTournamentId] })
      ]);
      notify(
        'success',
        force ? 'Room regenerated' : 'Room prepared',
        payload?.roomId ? `Room ${payload.roomId} is ready` : 'Room credentials updated'
      );
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to prepare room');
      setError(message);
      notify('error', 'Room preparation failed', message);
    }
  };

  const handleLoadMatchRoomLogs = async (matchId: string) => {
    try {
      setMatchRoomLogsLoadingId(matchId);
      setSelectedMatchRoomLogsId(matchId);
      const result: any = await api.get(`/api/matches/${matchId}/room/logs?limit=20`);
      const rows = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : []);
      setMatchRoomLogs((prev) => ({ ...prev, [matchId]: rows }));
      if (!rows.length) {
        notify('info', 'Room logs', 'No room events for this match yet');
      }
    } catch (e: any) {
      notify('error', 'Room logs failed', formatApiError(e, 'Failed to load room logs'));
    } finally {
      setMatchRoomLogsLoadingId(null);
    }
  };

  const handlePrepareTournamentRooms = async (force = false, dryRun = false) => {
    if (!selectedTournamentId) return;
    try {
      setError(null);
      const result: any = await api.post('/api/matches/rooms/prepare', {
        tournamentId: selectedTournamentId,
        statuses: ['scheduled', 'live'],
        force,
        dryRun,
        onlyMissing: !force
      });
      const payload = result?.data || result || {};
      const created = Number(payload.created || 0);
      const unchanged = Number(payload.unchanged || 0);
      const failedCount = Array.isArray(payload.failed) ? payload.failed.length : 0;

      if (!dryRun) {
        await Promise.all([
          invalidateTournamentMatchViews(selectedTournamentId),
          queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'match-ops-summary', selectedTournamentId] })
        ]);
      }
      notify(
        dryRun ? 'info' : 'success',
        dryRun ? 'Room dry-run preview' : (force ? 'Rooms regenerated' : 'Rooms prepared'),
        `Created: ${created}, unchanged: ${unchanged}, failed: ${failedCount}`
      );
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to prepare tournament rooms');
      setError(message);
      notify('error', 'Room preparation failed', message);
    }
  };

  const handleUpdateMatchStatus = async (matchId: string, status: 'scheduled' | 'live' | 'completed' | 'cancelled') => {
    try {
      setError(null);
      await api.put(`/api/matches/${matchId}/status`, { status });
      if (selectedTournamentId) {
        await Promise.all([
          invalidateTournamentMatchViews(selectedTournamentId),
          queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'match-ops-summary', selectedTournamentId] })
        ]);
      }
      notify('success', 'Match status updated', `Status changed to ${status}`);
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to update match status');
      setError(message);
      notify('error', 'Status update failed', message);
    }
  };

  const fetchFilteredTournamentMatchIds = async (): Promise<{ matchIds: string[]; filteredTotal: number; totalAll: number }> => {
    if (!selectedTournamentId) return { matchIds: [], filteredTotal: 0, totalAll: 0 };
    const params = new URLSearchParams({
      status: matchStatusFilter,
      room: matchRoomFilter,
      winner: matchWinnerFilter
    });
    if (matchSearch.trim()) {
      params.set('search', matchSearch.trim());
    }
    const result: any = await api.get(`/api/tournaments/${selectedTournamentId}/matches/admin/ids?${params.toString()}`);
    const payload = result?.data || result || {};
    return {
      matchIds: Array.isArray(payload?.matchIds) ? payload.matchIds.map((id: any) => String(id)).filter(Boolean) : [],
      filteredTotal: Number(payload?.filteredTotal || 0),
      totalAll: Number(payload?.totalAll || 0)
    };
  };

  const handlePrepareFilteredMatchRooms = async (force = false, dryRun = false) => {
    if (!selectedTournamentId) return;
    const { matchIds } = await fetchFilteredTournamentMatchIds();
    if (!matchIds.length) {
      notify('info', 'No matches', 'No matches in current filter to prepare rooms');
      return;
    }

    if (!dryRun) {
      const confirmed = window.confirm(
        `${force ? 'Regenerate' : 'Prepare'} rooms for ${matchIds.length} filtered matches?`
      );
      if (!confirmed) return;
    }

    try {
      setError(null);
      const result: any = await api.post('/api/matches/rooms/prepare', {
        tournamentId: selectedTournamentId,
        matchIds,
        force,
        dryRun,
        onlyMissing: !force
      });
      const payload = result?.data || result || {};
      const created = Number(payload.created || 0);
      const unchanged = Number(payload.unchanged || 0);
      const failedCount = Array.isArray(payload.failed) ? payload.failed.length : 0;

      if (!dryRun) {
        await Promise.all([
          invalidateTournamentMatchViews(selectedTournamentId),
          queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'match-ops-summary', selectedTournamentId] })
        ]);
      }
      notify(
        'success',
        dryRun ? 'Room dry-run preview' : (force ? 'Filtered rooms regenerated' : 'Filtered rooms prepared'),
        `Created: ${created}, unchanged: ${unchanged}, failed: ${failedCount}`
      );
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to prepare filtered match rooms');
      setError(message);
      notify('error', 'Room preparation failed', message);
    }
  };

  const handleBulkMatchStatus = async (status: 'scheduled' | 'live' | 'completed' | 'cancelled') => {
    if (!selectedTournamentId) return;
    const { matchIds: ids } = await fetchFilteredTournamentMatchIds();
    if (!ids.length) {
      notify('info', 'No matches', 'Nothing to update for current filters');
      return;
    }

    const confirmed = window.confirm(`Set status "${status}" for ${ids.length} matches?`);
    if (!confirmed) return;

    try {
      setError(null);
      const result: any = await api.post('/api/matches/status/bulk', {
        status,
        tournamentId: selectedTournamentId,
        matchIds: ids
      });
      const payload = result?.data || result || {};
      const success = Number(payload.updated || 0);
      const failed = Number(payload.failed || 0);
      const skipped = Number(payload.skipped || 0);

      await Promise.all([
        invalidateTournamentMatchViews(selectedTournamentId),
        queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'match-ops-summary', selectedTournamentId] })
      ]);
      notify('success', 'Bulk status update complete', `Updated: ${success}, skipped: ${skipped}, failed: ${failed}`);
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to update match statuses');
      setError(message);
      notify('error', 'Bulk update failed', message);
    }
  };

  const handlePreviewFilteredMatches = async () => {
    if (!selectedTournamentId) return;
    const { matchIds, filteredTotal, totalAll } = await fetchFilteredTournamentMatchIds();
    const summary = `Matched: ${filteredTotal}/${totalAll}`;
    if (!matchIds.length) {
      notify('info', 'Preview', summary);
      return;
    }
    const rawStatus = window.prompt('Preview target status: scheduled/live/completed/cancelled', 'completed');
    if (!rawStatus) return;
    const status = rawStatus.trim().toLowerCase();
    if (!['scheduled', 'live', 'completed', 'cancelled'].includes(status)) {
      notify('warning', 'Preview', 'Invalid status');
      return;
    }
    api.post('/api/matches/status/bulk', {
      status,
      tournamentId: selectedTournamentId,
      matchIds,
      dryRun: true
    }).then((result: any) => {
      const payload = result?.data || result || {};
      notify(
        'info',
        'Dry-run preview',
        `${summary}. To "${status}": update ${Number(payload.updated || 0)}, skip ${Number(payload.skipped || 0)}, fail ${Number(payload.failed || 0)}`
      );
    }).catch((e: any) => {
      notify('error', 'Preview failed', formatApiError(e, 'Dry-run failed'));
    });
  };

  const handleBulkInferWinners = async () => {
    if (!selectedTournamentId) return;
    const { matchIds } = await fetchFilteredTournamentMatchIds();
    if (!matchIds.length) {
      notify('info', 'No matches', 'No matches in current filter');
      return;
    }

    const confirmed = window.confirm(`Infer winners by score for ${matchIds.length} filtered matches?`);
    if (!confirmed) return;

    try {
      setError(null);
      const result: any = await api.post('/api/matches/winner/bulk-infer', {
        tournamentId: selectedTournamentId,
        matchIds,
        markCompleted: true
      });
      const payload = result?.data || result || {};
      await Promise.all([
        invalidateTournamentMatchViews(selectedTournamentId),
        queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'match-ops-summary', selectedTournamentId] })
      ]);
      notify(
        'success',
        'Winners inferred',
        `Updated: ${Number(payload.updated || 0)}, skipped: ${Number(payload.skipped || 0)}, failed: ${Number(payload.failed || 0)}`
      );
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to infer winners');
      setError(message);
      notify('error', 'Infer winners failed', message);
    }
  };

  const handleSetCustomMatchRoom = async (match: any) => {
    if (!selectedTournamentId) return;
    const defaultRoomId = String(match?.roomCredentials?.roomId || '');
    const defaultPassword = String(match?.roomCredentials?.password || '');
    const roomIdInput = window.prompt('Custom Room ID', defaultRoomId);
    if (roomIdInput === null) return;
    const passwordInput = window.prompt('Custom Room Password', defaultPassword);
    if (passwordInput === null) return;

    const roomId = roomIdInput.trim().toUpperCase();
    const password = passwordInput.trim();
    if (!roomId || !password) {
      notify('warning', 'Invalid room', 'Room ID and password are required');
      return;
    }

    try {
      setError(null);
      const result: any = await api.post(`/api/matches/${match.id}/room`, {
        force: true,
        roomId,
        password
      });
      const payload = result?.data || result || {};
      await Promise.all([
        invalidateTournamentMatchViews(selectedTournamentId),
        queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'match-ops-summary', selectedTournamentId] })
      ]);
      notify(
        'success',
        'Custom room set',
        payload?.roomId ? `Room ${payload.roomId} updated` : 'Room credentials updated'
      );
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to set custom room');
      setError(message);
      notify('error', 'Custom room failed', message);
    }
  };

  const handleEditMatchMeta = async (match: any) => {
    const currentRound = String(match?.round || '');
    const currentMap = String(match?.map || '');
    const currentStart = match?.startTime ? new Date(match.startTime).toISOString().slice(0, 16) : '';

    const nextRound = window.prompt('Round', currentRound);
    if (nextRound === null) return;
    const nextMap = window.prompt('Map', currentMap);
    if (nextMap === null) return;
    const nextStart = window.prompt('Start time (YYYY-MM-DDTHH:mm)', currentStart);
    if (nextStart === null) return;

    const payload: any = {
      round: nextRound.trim(),
      map: nextMap.trim()
    };

    if (nextStart.trim()) {
      const asIso = new Date(nextStart.trim());
      if (Number.isNaN(asIso.getTime())) {
        notify('warning', 'Invalid date', 'Use format YYYY-MM-DDTHH:mm');
        return;
      }
      payload.startTime = asIso.toISOString();
    }

    try {
      setError(null);
      await api.patch(`/api/matches/${match.id}/meta`, payload);
      if (selectedTournamentId) {
        await Promise.all([
          invalidateTournamentMatchViews(selectedTournamentId),
          queryClient.invalidateQueries({ queryKey: ['admin', 'match-ops-summary', selectedTournamentId] })
        ]);
      }
      notify('success', 'Match meta updated', 'Round, map and schedule were updated');
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to update match meta');
      setError(message);
      notify('error', 'Match meta update failed', message);
    }
  };

  const handleSetMatchWinner = async (match: any, winnerId: string) => {
    if (!winnerId) return;
    try {
      setError(null);
      await api.put(`/api/matches/${match.id}/winner`, { winner: winnerId, markCompleted: true });
      if (selectedTournamentId) {
        await Promise.all([
          invalidateTournamentMatchViews(selectedTournamentId),
          queryClient.invalidateQueries({ queryKey: ['admin', 'match-ops-summary', selectedTournamentId] })
        ]);
      }
      notify('success', 'Winner set', 'Match winner has been updated');
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to set winner');
      setError(message);
      notify('error', 'Winner update failed', message);
    }
  };

  const handleBulkTournamentRequests = async (action: 'approve' | 'reject', teamIds?: string[]) => {
    if (!selectedTournamentId) return;
    const pendingRows = Array.isArray(tournamentRequests) ? tournamentRequests : [];
    const selectedTeamIds = Array.isArray(teamIds) && teamIds.length
      ? teamIds
      : pendingRows.map((row) => row.teamId).filter(Boolean);
    if (!selectedTeamIds.length) {
      notify('info', 'No requests', 'No pending requests to process');
      return;
    }

    const noteInput = window.prompt(
      action === 'approve' ? 'Bulk approval note (optional)' : 'Bulk reject reason (optional)',
      ''
    ) || '';
    const note = noteInput.trim();

    const result: any = await api.post(`/api/tournaments/${selectedTournamentId}/requests/bulk`, {
      action,
      teamIds: selectedTeamIds,
      ...(note ? { note } : {})
    });
    const payload = result?.data || result || {};
    const ok = Number(payload?.processed || 0);
    const failed = Number(payload?.failed || 0);

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-requests', selectedTournamentId] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', selectedTournamentId] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'recent-tournament-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['tournaments'] }),
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    ]);

    notify(
      failed === 0 ? 'success' : 'warning',
      action === 'approve' ? 'Bulk approve done' : 'Bulk reject done',
      `Processed: ${ok}, failed: ${failed}`
    );
  };

  const exportTournamentRequestsCsv = async (tournamentId: string, searchText?: string) => {
    try {
      const token = getAuthToken();
      if (!token) {
        notify('warning', 'Export failed', 'Admin token missing');
        return;
      }

      const params = new URLSearchParams();
      if ((searchText || '').trim()) params.set('search', String(searchText).trim());

      const response = await fetch(
        getFullUrl(`/api/tournaments/${tournamentId}/requests/export.csv?${params.toString()}`),
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tournament_requests_${tournamentId}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify('success', 'Export complete', 'Pending requests CSV downloaded');
    } catch (e: any) {
      notify('error', 'Export failed', formatApiError(e, 'Failed to export tournament requests'));
    }
  };

  const handleBulkTournamentRequestsForTournament = async (tournamentId: string, action: 'approve' | 'reject') => {
    const noteInput = window.prompt(
      action === 'approve' ? 'Bulk approval note (optional)' : 'Bulk reject reason (optional)',
      ''
    ) || '';
    const note = noteInput.trim();
    try {
      setError(null);
      const result: any = await api.post(`/api/tournaments/${tournamentId}/requests/bulk`, note ? { action, note } : { action });
      const payload = result?.data || result || {};
      const ok = Number(payload?.processed || 0);
      const failed = Number(payload?.failed || 0);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-requests', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-participants', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'pending-tournament-queue'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'recent-tournament-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['matches'] })
      ]);

      notify(
        failed === 0 ? 'success' : 'warning',
        action === 'approve' ? 'Tournament queue approved' : 'Tournament queue rejected',
        `Processed: ${ok}, failed: ${failed}`
      );

      if (selectedTournamentId === tournamentId) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-requests', selectedTournamentId] });
      }
    } catch (e: any) {
      const message = formatApiError(e, `Failed to ${action} tournament requests`);
      setError(message);
      notify('error', action === 'approve' ? 'Approve failed' : 'Reject failed', message);
    }
  };

  const handleRefreshTournamentAdminPanels = async () => {
    if (!selectedTournamentId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-tournament-queue'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'recent-tournament-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-requests', selectedTournamentId] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', selectedTournamentId] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'match-ops-summary', selectedTournamentId] }),
      queryClient.invalidateQueries({ queryKey: ['matches'] }),
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
    ]);
    notify('success', 'Tournament panels refreshed', 'Queue, decisions, requests and overview updated');
  };

  const handleResetTournamentFilters = () => {
    setPendingQueuePage(1);
    setRecentRequestsStatusFilter('all');
    setRecentDecisionsSearchInput('');
    setRecentDecisionsSearch('');
    setRecentDecisionsPage(1);
    setTournamentRequestSearchInput('');
    setTournamentRequestSearch('');
    setTournamentRequestsPage(1);
    setMatchStatusFilter('all');
    setMatchRoomFilter('all');
    setMatchWinnerFilter('all');
    setMatchSearch('');
    setMatchesPage(1);
    setPaymentSearchInput('');
    setPaymentSearch('');
    setPaymentsPage(1);
    notify('info', 'Filters reset', 'Tournament queue, requests, decisions and matches filters are default now');
  };

  const handleReopenTournamentRequest = async (row: AdminTournamentRequestHistoryRow) => {
    const noteInput = window.prompt('Reopen note (optional)', row.note || '') || '';
    const note = noteInput.trim();
    try {
      setError(null);
      await api.post(
        `/api/tournaments/${row.tournamentId}/requests/${row.teamId}/reopen`,
        note ? { note } : {}
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'pending-tournament-queue'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'recent-tournament-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-requests', row.tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', row.tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['matches'] })
      ]);
      notify('success', 'Request reopened', 'Moved back to pending queue');
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to reopen request');
      setError(message);
      notify('error', 'Reopen failed', message);
    }
  };

  const handleForceAddTournamentParticipant = async (tournamentId: string, teamId: string) => {
    try {
      setError(null);
      await api.post(`/api/tournaments/${tournamentId}/participants/${teamId}/add`, {});
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-requests', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-participants', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'recent-tournament-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['matches'] })
      ]);
      notify('success', 'Participant added', 'Team has been added to tournament participants');
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to add participant');
      setError(message);
      notify('error', 'Add participant failed', message);
    }
  };

  const handleRemoveTournamentParticipant = async (tournamentId: string, teamId: string) => {
    try {
      setError(null);
      await api.delete(`/api/tournaments/${tournamentId}/participants/${teamId}/remove`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-requests', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-participants', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'recent-tournament-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['matches'] })
      ]);
      notify('success', 'Participant removed', 'Team has been removed from tournament participants');
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to remove participant');
      setError(message);
      notify('error', 'Remove participant failed', message);
    }
  };

  const handleBulkRemoveTournamentParticipants = async (tournamentId: string, teamIds: string[]) => {
    const uniqueTeamIds = Array.from(new Set((teamIds || []).map((id) => String(id || '').trim()).filter(Boolean)));
    if (!uniqueTeamIds.length) {
      notify('info', 'No teams selected', 'No visible teams to remove');
      return;
    }

    const confirmed = window.confirm(`Remove ${uniqueTeamIds.length} visible team(s) from participants?`);
    if (!confirmed) return;

    try {
      setError(null);
      const result: any = await api.post(`/api/tournaments/${tournamentId}/participants/bulk-remove`, {
        teamIds: uniqueTeamIds
      });
      const payload = result?.data || result || {};
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-requests', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'recent-tournament-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['matches'] })
      ]);
      notify(
        'success',
        'Participants removed',
        `Removed: ${Number(payload?.removed || 0)}, skipped: ${Number(payload?.skipped || 0)}`
      );
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to bulk remove participants');
      setError(message);
      notify('error', 'Bulk remove failed', message);
    }
  };

  const handleEditParticipantStats = async (tournamentId: string, team: any) => {
    const currentWins = Number(team?.stats?.wins || 0);
    const currentLosses = Number(team?.stats?.losses || 0);
    const currentPoints = Number(team?.stats?.points || 0);
    const currentRank = Number(team?.stats?.rank || 0);

    const nextWinsRaw = window.prompt(`Wins for ${team?.name || 'team'}`, String(currentWins));
    if (nextWinsRaw === null) return;
    const nextLossesRaw = window.prompt(`Losses for ${team?.name || 'team'}`, String(currentLosses));
    if (nextLossesRaw === null) return;
    const nextPointsRaw = window.prompt(`Points for ${team?.name || 'team'}`, String(currentPoints));
    if (nextPointsRaw === null) return;
    const nextRankRaw = window.prompt(`Rank for ${team?.name || 'team'}`, String(currentRank));
    if (nextRankRaw === null) return;

    const wins = Number(nextWinsRaw);
    const losses = Number(nextLossesRaw);
    const points = Number(nextPointsRaw);
    const rank = Number(nextRankRaw);

    if (
      !Number.isFinite(wins) ||
      !Number.isFinite(losses) ||
      !Number.isFinite(points) ||
      !Number.isFinite(rank) ||
      wins < 0 ||
      losses < 0 ||
      points < 0 ||
      rank < 0
    ) {
      notify('warning', 'Invalid values', 'Wins, losses, points and rank must be non-negative numbers');
      return;
    }

    try {
      setError(null);
      await api.patch(`/api/tournaments/${tournamentId}/participants/${team.id}/stats`, {
        wins,
        losses,
        points,
        rank
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['rankings'] }),
        queryClient.invalidateQueries({ queryKey: ['teams'] })
      ]);
      notify('success', 'Stats updated', `Updated stats for ${team?.name || 'team'}`);
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to update participant stats');
      setError(message);
      notify('error', 'Stats update failed', message);
    }
  };

  const handleRecalculateParticipantStats = async (tournamentId: string) => {
    const confirmed = window.confirm('Recalculate all participant stats from completed matches for this tournament?');
    if (!confirmed) return;

    try {
      setError(null);
      const result: any = await api.post(`/api/tournaments/${tournamentId}/participants/recalculate-stats`, {});
      const payload = result?.data || result || {};
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['rankings'] }),
        queryClient.invalidateQueries({ queryKey: ['teams'] })
      ]);
      notify(
        'success',
        'Stats recalculated',
        `Updated teams: ${Number(payload?.updatedTeams || 0)}, matches: ${Number(payload?.completedMatches || 0)}`
      );
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to recalculate participant stats');
      setError(message);
      notify('error', 'Recalculate failed', message);
    }
  };

  const handleWalletAdjust = async (targetUserId: string, username: string) => {
    const amountRaw = window.prompt(`Adjust balance for ${username}. Use + for credit, - for debit`, '0');
    if (!amountRaw) return;

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount === 0) {
      notify('warning', 'Invalid amount', 'Enter a non-zero numeric amount');
      return;
    }

    const reason = window.prompt('Reason (optional)', 'Manual admin adjustment') || 'Manual admin adjustment';

    try {
      setError(null);
      await api.post(`/api/admin/users/${targetUserId}/wallet/adjust`, {
        amount,
        reason
      });

      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'wallet-transactions'] });
      notify('success', 'Wallet updated', `Balance adjusted by ${amount > 0 ? '+' : ''}${amount}`);
    } catch (e: any) {
      setError(formatApiError(e, 'Failed to adjust wallet'));
      notify('error', 'Wallet update failed', formatApiError(e, 'Failed to adjust wallet'));
    }
  };

  const handleSubscriptionToggle = async (targetUser: AdminUserRow, nextState: boolean) => {
    try {
      setError(null);
      const expiresAt = nextState
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      await api.patch(`/api/admin/users/${targetUser.id}/subscription`, {
        isSubscribed: nextState,
        subscriptionExpiresAt: expiresAt
      });

      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      notify(
        'success',
        'Subscription updated',
        `${targetUser.username}: ${nextState ? 'enabled for 30 days' : 'disabled'}`
      );
    } catch (e: any) {
      setError(formatApiError(e, 'Failed to update subscription'));
      notify('error', 'Subscription update failed', formatApiError(e, 'Failed to update subscription'));
    }
  };

  const handleUpdateReferralSettings = async () => {
    const current = referralSettings || {
      referralBonusThreshold: 3,
      refereeBonus: 1,
      referrerBonus: 1,
      subscriptionPrice: 9.99
    };

    const thresholdInput = window.prompt('Referrals needed for referrer bonus', String(current.referralBonusThreshold));
    if (thresholdInput === null) return;
    const refereeBonusInput = window.prompt('Bonus entries for invited user', String(current.refereeBonus));
    if (refereeBonusInput === null) return;
    const referrerBonusInput = window.prompt('Bonus entries for referrer', String(current.referrerBonus));
    if (referrerBonusInput === null) return;
    const subscriptionPriceInput = window.prompt('Subscription price (USD)', String(current.subscriptionPrice));
    if (subscriptionPriceInput === null) return;

    const payload = {
      referralBonusThreshold: Number(thresholdInput),
      refereeBonus: Number(refereeBonusInput),
      referrerBonus: Number(referrerBonusInput),
      subscriptionPrice: Number(subscriptionPriceInput)
    };

    if (
      !Number.isFinite(payload.referralBonusThreshold) ||
      payload.referralBonusThreshold < 1 ||
      !Number.isFinite(payload.refereeBonus) ||
      payload.refereeBonus < 0 ||
      !Number.isFinite(payload.referrerBonus) ||
      payload.referrerBonus < 0 ||
      !Number.isFinite(payload.subscriptionPrice) ||
      payload.subscriptionPrice <= 0
    ) {
      notify('warning', 'Invalid values', 'Please enter valid numeric values');
      return;
    }

    try {
      setError(null);
      await api.put('/api/referrals/settings', payload);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'referral-settings'] });
      notify('success', 'Referral settings updated', 'Changes saved successfully');
    } catch (e: any) {
      setError(formatApiError(e, 'Failed to update referral settings'));
      notify('error', 'Update failed', formatApiError(e, 'Failed to update referral settings'));
    }
  };

  const handleGrantReferralEntries = async () => {
    const userId = (window.prompt('Target user ID') || '').trim();
    if (!userId) return;

    const countRaw = window.prompt('How many free entries to add?', '1');
    if (countRaw === null) return;
    const count = Number(countRaw);
    if (!Number.isFinite(count) || count <= 0) {
      notify('warning', 'Invalid count', 'Count must be a positive number');
      return;
    }

    const reason = (window.prompt('Reason for manual bonus', 'Manual admin referral bonus') || '').trim() || 'Manual admin referral bonus';

    try {
      setError(null);
      await api.post('/api/referrals/add-free-entries', {
        userId,
        count: Math.floor(count),
        reason
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'referrals'] })
      ]);
      notify('success', 'Entries added', `Added ${Math.floor(count)} entries to user ${userId}`);
    } catch (e: any) {
      setError(formatApiError(e, 'Failed to add free entries'));
      notify('error', 'Add entries failed', formatApiError(e, 'Failed to add free entries'));
    }
  };

  const handleWalletTransactionStatus = async (
    tx: AdminWalletTransaction,
    nextStatus: 'completed' | 'failed' | 'refunded' | 'refund_denied'
  ) => {
    try {
      setError(null);
      let subscriptionDays: number | undefined;
      let txHash: string | undefined;

      if (tx.type === 'subscription' && nextStatus === 'completed') {
        const daysRaw = window.prompt('Subscription duration in days', '30');
        if (daysRaw === null) return;
        const parsed = Number(daysRaw);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          notify('warning', 'Invalid duration', 'Subscription days must be a positive number');
          return;
        }
        subscriptionDays = Math.trunc(parsed);
      }

      if (tx.type === 'withdrawal' && nextStatus === 'completed') {
        const hashInput = window.prompt('Blockchain TX hash (optional but recommended)', tx.txHash || '');
        if (hashInput !== null) {
          txHash = hashInput.trim() || undefined;
        }
      }

      await api.patch(`/api/admin/wallet/transactions/${tx.userId}/${tx.id}`, {
        status: nextStatus,
        source: tx.source,
        subscriptionDays,
        txHash
      });

      await queryClient.invalidateQueries({ queryKey: ['admin', 'wallet-transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      notify('success', 'Transaction updated', `Status changed to ${nextStatus}`);
    } catch (e: any) {
      setError(formatApiError(e, 'Failed to update transaction'));
      notify('error', 'Update failed', formatApiError(e, 'Failed to update transaction'));
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      if (modalType === 'tournament') {
        const statusMap: Record<string, string> = {
          in_progress: 'ongoing',
          ongoing: 'ongoing',
          upcoming: 'upcoming',
          completed: 'completed'
        };

        const now = new Date();
        const parsedStart = modalData.startDate ? new Date(modalData.startDate) : now;
        const startDate = Number.isFinite(parsedStart.getTime()) ? parsedStart : now;
        const parsedEnd = modalData.endDate
          ? new Date(modalData.endDate)
          : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
        const endDate = Number.isFinite(parsedEnd.getTime())
          ? parsedEnd
          : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

        const payload: any = {
          name: modalData.name,
          game: modalData.game,
          image: modalData.image || '',
          prizePool: Number(modalData.prizePool || 0),
          maxTeams: Number(modalData.maxTeams || 0),
          teamSize: modalData.teamSize ? Number(modalData.teamSize) : undefined,
          status: statusMap[modalData.status] || modalData.status || 'upcoming',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          format: modalData.format,
          type: modalData.type,
          description: modalData.description,
          rules: modalData.rules
        };

        if (editingItem?.id) {
          await api.put(`/api/tournaments/${editingItem.id}`, payload);
        } else {
          await api.post('/api/tournaments', payload);
        }
        await queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] });
        await queryClient.invalidateQueries({ queryKey: ['tournaments'] });
        setIsModalOpen(false);
        return;
      }

      if (modalType === 'news') {
        const payload: any = {
          title: modalData.title,
          content: modalData.content,
          summary: modalData.summary || (modalData.content || '').slice(0, 200),
          category: modalData.category,
          status: modalData.status,
          coverImage: modalData.coverImage
        };

        if (payload.status === 'published') {
          payload.publishDate = new Date().toISOString();
        }

        if (editingItem?.id) {
          await api.put(`/api/news/${editingItem.id}`, payload);
        } else {
          await api.post('/api/news', payload);
        }
        await queryClient.invalidateQueries({ queryKey: ['admin', 'news'] });
        await queryClient.invalidateQueries({ queryKey: ['news'] });
        setIsModalOpen(false);
        return;
      }

      if (modalType === 'achievement') {
        const payload: any = {
          key: modalData.key,
          name: modalData.name,
          description: modalData.description,
          icon: modalData.icon,
          isActive: !!modalData.isActive,
          criteria: {
            type: modalData.criteriaType,
            value: Number(modalData.criteriaValue || 0)
          }
        };

        if (editingItem?.id) {
          await api.put(`/api/achievements/admin/${editingItem.id}`, payload);
        } else {
          await api.post('/api/achievements/admin', payload);
        }
        await queryClient.invalidateQueries({ queryKey: ['admin', 'achievements'] });
        setIsModalOpen(false);
        return;
      }

      if (modalType === 'reward') {
        const parsedExpires = modalData.expiresAt ? new Date(modalData.expiresAt) : null;
        const expiresAt = parsedExpires && Number.isFinite(parsedExpires.getTime())
          ? parsedExpires.toISOString()
          : null;

        const payload: any = {
          name: modalData.name,
          description: modalData.description,
          type: modalData.type || 'currency',
          rarity: modalData.rarity || 'common',
          value: Number(modalData.value || 0),
          icon: modalData.icon || undefined,
          isActive: !!modalData.isActive,
          gameId: modalData.gameId || undefined,
          expiresAt
        };

        if (modalData.requirementsType) {
          payload.requirements = {
            type: modalData.requirementsType,
            value: Number(modalData.requirementsValue || 0)
          };
        }

        if (editingItem?.id) {
          await api.put(`/api/rewards/admin/${editingItem.id}`, payload);
        } else {
          await api.post('/api/rewards/admin', payload);
        }

        await queryClient.invalidateQueries({ queryKey: ['admin', 'rewards'] });
        await queryClient.invalidateQueries({ queryKey: ['rewards'] });
        setIsModalOpen(false);
        notify('success', 'Reward saved', `Reward ${editingItem ? 'updated' : 'created'} successfully`);
        return;
      }

      if (modalType === 'user') {
        const payload: any = {
          username: modalData.username,
          firstName: modalData.firstName,
          lastName: modalData.lastName,
          email: modalData.email,
          role: modalData.role,
          bio: modalData.bio,
          balance: Number(modalData.balance || 0),
          freeEntriesCount: Number(modalData.freeEntriesCount || 0),
          bonusEntries: Number(modalData.bonusEntries || 0),
          isSubscribed: !!modalData.isSubscribed,
          subscriptionExpiresAt: modalData.isSubscribed ? modalData.subscriptionExpiresAt : null,
          isBanned: !!modalData.isBanned
        };
        if (editingItem?.id) {
          await api.patch(`/api/admin/users/${editingItem.id}`, payload);
          await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
          setIsModalOpen(false);
          notify('success', 'User updated', 'User updated successfully');
          return;
        }
        await api.post('/api/admin/users', payload);
        await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        setIsModalOpen(false);
        notify('success', 'User created', 'User created successfully');
        return;
      }

      if (modalType === 'team') {
        const payload: any = {
          name: modalData.name,
          tag: modalData.tag,
          game: modalData.game,
          logo: modalData.logo,
          status: modalData.status
        };
        if (editingItem?.id) {
          await api.patch(`/api/admin/teams/${editingItem.id}`, payload);
        } else {
          await api.post('/api/teams', payload);
        }
        await load();
        await queryClient.invalidateQueries({ queryKey: ['teams'] });
        setIsModalOpen(false);
        notify('success', 'Team saved', `Team ${editingItem ? 'updated' : 'created'} successfully`);
        return;
      }

      setIsModalOpen(false);
    } catch (e: any) {
      setError(formatApiError(e, 'Save failed'));
      notify('error', 'Save failed', formatApiError(e, 'Save failed'));
    }
  };

  const refreshOps = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'ops-metrics'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'ops-queue'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'ops-backups'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'ops-audit-timeline'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'ops-top-errors'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'ops-error-samples'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'auth-logs'] })
    ]);
  };

  const handleBulkPendingWithdrawals = async (nextStatus: 'completed' | 'failed') => {
    const pending = walletTransactions.filter((tx) => tx.type === 'withdrawal' && tx.status === 'pending');
    if (!pending.length) {
      notify('info', 'No pending withdrawals', 'Nothing to process');
      return;
    }

    const confirmText =
      nextStatus === 'completed'
        ? `Approve ${pending.length} pending withdrawals on this page?`
        : `Reject ${pending.length} pending withdrawals on this page?`;
    const confirmed = window.confirm(confirmText);
    if (!confirmed) return;

    let done = 0;
    let failed = 0;
    const chunkSize = 6;
    const chunks: AdminWalletTransaction[][] = [];
    for (let i = 0; i < pending.length; i += chunkSize) {
      chunks.push(pending.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      const results = await Promise.allSettled(
        chunk.map((tx) => api.patch(`/api/admin/wallet/transactions/${tx.userId}/${tx.id}`, {
          status: nextStatus,
          source: tx.source
        }))
      );
      for (const result of results) {
        if (result.status === 'fulfilled') done += 1;
        else failed += 1;
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['admin', 'wallet-transactions'] });
    await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

    notify(
      failed === 0 ? 'success' : 'warning',
      nextStatus === 'completed' ? 'Bulk withdrawal approve complete' : 'Bulk withdrawal reject complete',
      `Updated: ${done}, failed: ${failed}`
    );
  };

  const handleRunBackup = async () => {
    try {
      await api.post('/api/admin/ops/backups/run', {});
      notify('success', 'Backup created', 'New backup snapshot was created');
      await refreshOps();
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to create backup');
      setError(message);
      notify('error', 'Backup failed', message);
    }
  };

  const handleExportAuditCsv = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        notify('error', 'Export failed', 'Login required');
        return;
      }

      const response = await fetch(getFullUrl('/api/admin/audit/export.csv?limit=5000'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      notify('success', 'Export complete', 'Audit CSV downloaded');
    } catch (e: any) {
      const message = e?.message || 'Failed to export audit CSV';
      setError(message);
      notify('error', 'Export failed', message);
    }
  };

  const handleExportTopErrorsCsv = () => {
    if (!opsTopErrors.length) {
      notify('info', 'Export skipped', 'No error endpoints for selected window');
      return;
    }

    const csvCell = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = ['count', 'statusCode', 'method', 'path', 'lastSeenAt'];
    const rows = opsTopErrors.map((row) => [
      row.count,
      row.statusCode,
      row.method,
      row.path,
      row.lastSeenAt ? new Date(row.lastSeenAt).toISOString() : ''
    ]);
    const csv = [header, ...rows].map((line) => line.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ops_top_errors_${opsTimelineHours}h_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('success', 'Export complete', `Downloaded ${opsTopErrors.length} rows`);
  };

  const handleExportAuthCsv = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        notify('error', 'Export failed', 'Login required');
        return;
      }

      const queryString = buildAuthLogQueryString(5000);
      const response = await fetch(getFullUrl(`/api/admin/auth-logs/export.csv?${queryString}`), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auth_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      notify('success', 'Export complete', 'Auth log CSV downloaded');
    } catch (e: any) {
      const message = e?.message || 'Failed to export auth log CSV';
      setError(message);
      notify('error', 'Export failed', message);
    }
  };

  const handleExportUsersCsv = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        notify('error', 'Export failed', 'Login required');
        return;
      }

      const params = new URLSearchParams();
      if (usersSearch) params.set('search', usersSearch);
      if (usersRoleFilter !== 'all') params.set('role', usersRoleFilter);
      if (usersSubscribedFilter !== 'all') params.set('subscribed', usersSubscribedFilter);
      if (usersBannedFilter !== 'all') params.set('banned', usersBannedFilter);

      const response = await fetch(getFullUrl(`/api/admin/users/export.csv?${params.toString()}`), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      notify('success', 'Export complete', 'Users CSV downloaded');
    } catch (e: any) {
      const message = e?.message || 'Failed to export users CSV';
      setError(message);
      notify('error', 'Export failed', message);
    }
  };

  function renderDashboard() {
    const stats = dashboardStats || {
      totalUsers: users.length,
      activeTournaments: tournaments.filter(t => t.status === 'ongoing' || t.status === 'in_progress').length,
      newsArticles: news.length,
      prizePoolSummary: [{ total: tournaments.reduce((acc, t) => acc + (t.prizePool || 0), 0) }]
    };

    return (
      <div>
        <StatsGrid>
          <StatCard>
            <StatValue>{stats.totalUsers}</StatValue>
            <StatLabel>Total Users</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.activeTournaments}</StatValue>
            <StatLabel>Active Tournaments</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.newsArticles}</StatValue>
            <StatLabel>News Articles</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>${stats.prizePoolSummary?.[0]?.total || 0}</StatValue>
            <StatLabel>Total Prize Pool</StatLabel>
          </StatCard>
        </StatsGrid>

        {analytics && (
          <div style={{ marginTop: '30px' }}>
            <h3>Analytics Summary</h3>
            <StatsGrid>
              <StatCard>
                <StatValue>{analytics.activeSubscriptions}</StatValue>
                <StatLabel>Active Subscriptions</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{analytics.userGrowth?.length || 0}</StatValue>
                <StatLabel>Growth Data Points</StatLabel>
              </StatCard>
            </StatsGrid>
          </div>
        )}

        <h3 style={{ marginTop: '30px' }}>Recent Activity</h3>
        <div style={{ color: '#cccccc' }}>
          <p>{'\u2022'} Dashboard operational</p>
          <p>{'\u2022'} Data synced with MongoDB Atlas</p>
        </div>
      </div>
    );
  }

  function renderAchievements() {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <h3>Achievements</h3>
          <ActionButton onClick={() => handleCreate('achievement')}>Create Achievement</ActionButton>
        </div>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Key</Th>
                <Th>Name</Th>
                <Th>Active</Th>
                <Th>Criteria</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {achievements.map((a) => (
                <tr key={a.id}>
                  <Td>{a.key}</Td>
                  <Td>{a.icon ? `${a.icon} ` : ''}{a.name}</Td>
                  <Td>{a.isActive ? 'yes' : 'no'}</Td>
                  <Td>{a.criteriaType}:{a.criteriaValue}</Td>
                  <Td>
                    <ActionsCell>
                      <ActionButton onClick={() => handleEdit(a, 'achievement')}>Edit</ActionButton>
                      <ActionButton $variant="danger" onClick={() => handleDelete(a.id, 'achievement')}>Delete</ActionButton>
                    </ActionsCell>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </div>
    );
  }

  function renderUsers() {
    const totalPages = usersPagination?.totalPages || 1;
    const currentPage = usersPagination?.page || usersPage;

    return (
      <div>
        <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h3>User Management</h3>
            <ActionsCell>
              <ActionButton onClick={() => handleCreate('user')}>Add User</ActionButton>
              <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })}>
                Refresh
              </ActionButton>
              <ActionButton onClick={handleExportUsersCsv}>
                Export CSV
              </ActionButton>
              <ActionButton
                onClick={() => {
                  setUsersPage(1);
                  setUsersSearchInput('');
                  setUsersSearch('');
                  setUsersRoleFilter('all');
                  setUsersSubscribedFilter('all');
                  setUsersBannedFilter('all');
                }}
              >
                Reset Filters
              </ActionButton>
            </ActionsCell>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 420px)', gap: '8px' }}>
            <Input
              placeholder="Search users by username/email/name/telegram"
              value={usersSearchInput}
              onChange={(e) => setUsersSearchInput(e.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 220px))', gap: '8px' }}>
            <Select
              value={usersRoleFilter}
              onChange={(e) => {
                setUsersPage(1);
                setUsersRoleFilter(e.target.value as typeof usersRoleFilter);
              }}
            >
              <option value="all">All roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
            </Select>
            <Select
              value={usersSubscribedFilter}
              onChange={(e) => {
                setUsersPage(1);
                setUsersSubscribedFilter(e.target.value as typeof usersSubscribedFilter);
              }}
            >
              <option value="all">All subs</option>
              <option value="yes">Subscribed</option>
              <option value="no">Not subscribed</option>
            </Select>
            <Select
              value={usersBannedFilter}
              onChange={(e) => {
                setUsersPage(1);
                setUsersBannedFilter(e.target.value as typeof usersBannedFilter);
              }}
            >
              <option value="all">All status</option>
              <option value="no">Active</option>
              <option value="yes">Banned</option>
            </Select>
          </div>
        </div>

        <StatsGrid style={{ marginBottom: '16px' }}>
          <StatCard>
            <StatValue>{Number(usersSummary?.filteredTotal || usersPagination?.total || users.length)}</StatValue>
            <StatLabel>Filtered Users</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{Number(usersSummary?.filteredSubscribed || users.filter((u) => u.isSubscribed).length)}</StatValue>
            <StatLabel>Subscribed</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{Number(usersSummary?.filteredBanned || users.filter((u) => u.isBanned).length)}</StatValue>
            <StatLabel>Banned</StatLabel>
          </StatCard>
        </StatsGrid>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Avatar</Th>
                <Th>Username</Th>
                <Th>Wallpaper</Th>
                <Th>Role</Th>
                <Th>Subscription</Th>
                <Th>Balance</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <Td>
                    <UserCell>
                      {user.avatarUrl ? (
                        <UserAvatar src={user.avatarUrl} alt={user.username} />
                      ) : (
                        <UserAvatarFallback>
                          {(user.username || '?').charAt(0).toUpperCase()}
                        </UserAvatarFallback>
                      )}
                    </UserCell>
                  </Td>
                  <Td>{user.username}</Td>
                  <Td>
                    {user.wallpaperUrl ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <a href={user.wallpaperUrl} target="_blank" rel="noreferrer" style={{ color: '#ff6b00', fontSize: 12 }}>
                          View
                        </a>
                        <span style={{ color: user.wallpaperStatus === 'active' ? '#81c784' : '#ffab91', fontSize: 11 }}>
                          {user.wallpaperStatus}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#888', fontSize: 12 }}>None</span>
                    )}
                  </Td>
                  <Td>{user.role}</Td>
                  <Td>{user.isSubscribed ? '\u2705 Active' : '\u274C None'} {user.freeEntriesCount > 0 ? `(${user.freeEntriesCount} free)` : ''}</Td>
                  <Td>${user.balance}</Td>
                  <Td>{user.isBanned ? '\u26D4 Banned' : '\u{1F7E2} Active'}</Td>
                  <Td>
                    <ActionsCell>
                      <ActionButton onClick={() => handleEdit(user, 'user')}>Edit</ActionButton>
                      <ActionButton
                        $variant={user.isSubscribed ? 'danger' : 'success'}
                        onClick={() => handleSubscriptionToggle(user, !user.isSubscribed)}
                      >
                        {user.isSubscribed ? 'Disable sub' : 'Enable sub'}
                      </ActionButton>
                      <ActionButton $variant="success" onClick={() => handleWalletAdjust(user.id, user.username)}>
                        Adjust $
                      </ActionButton>
                      <ActionButton onClick={() => setActiveTab('payments')}>
                        Payments
                      </ActionButton>
                      {user.wallpaperUrl ? (
                        <ActionButton $variant="danger" onClick={() => handleRemoveUserWallpaper(user)}>
                          Remove wallpaper
                        </ActionButton>
                      ) : null}
                    </ActionsCell>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>

        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ color: '#cccccc', fontSize: '13px' }}>
            Page {currentPage} of {totalPages} {usersPagination ? `• total ${usersPagination.total}` : ''}
          </div>
          <ActionsCell>
            <ActionButton
              onClick={() => setUsersPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              Prev
            </ActionButton>
            <ActionButton
              onClick={() => setUsersPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </ActionButton>
          </ActionsCell>
        </div>
      </div>
    );
  }

  function renderPayments() {
    const pageRows = walletTransactions;
    const totalFiltered = Number(walletTransactionsPagination?.total || pageRows.length || 0);
    const pageLimit = Number(walletTransactionsPagination?.limit || 20);
    const currentPage = Number(walletTransactionsPagination?.page || paymentsPage || 1);
    const totalPages = Number(walletTransactionsPagination?.totalPages || 1);
    const pageStart = (Math.max(1, currentPage) - 1) * pageLimit;

    const pendingWithdrawals = walletTransactions.filter((tx) => tx.type === 'withdrawal' && tx.status === 'pending');
    const completedWithdrawals = walletTransactions.filter((tx) => tx.type === 'withdrawal' && tx.status === 'completed');
    const pendingWithdrawAmount = pendingWithdrawals.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const completedWithdrawAmount = completedWithdrawals.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const exportPaymentsCsv = () => {
      if (!pageRows.length) {
        notify('info', 'Export skipped', 'No transactions to export');
        return;
      }
      const csvCell = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const header = ['username', 'email', 'telegramId', 'source', 'type', 'amount', 'status', 'walletAddress', 'network', 'txHash', 'description', 'date'];
      const rows = pageRows.map((tx) => [
        tx.username || '',
        tx.email || '',
        tx.telegramId || '',
        tx.source || '',
        tx.type || '',
        Number(tx.amount || 0).toFixed(2),
        tx.status || '',
        tx.walletAddress || '',
        tx.network || '',
        tx.txHash || '',
        tx.description || '',
        tx.date || ''
      ]);
      const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallet_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify('success', 'Export complete', `Downloaded ${pageRows.length} transactions`);
    };

    return (
      <div>
        <StatsGrid style={{ marginBottom: '16px' }}>
          <StatCard>
            <StatValue>{pendingWithdrawals.length}</StatValue>
            <StatLabel>Pending Withdrawals</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>${pendingWithdrawAmount.toFixed(2)}</StatValue>
            <StatLabel>Pending Amount</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{completedWithdrawals.length}</StatValue>
            <StatLabel>Completed Withdrawals</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>${completedWithdrawAmount.toFixed(2)}</StatValue>
            <StatLabel>Paid Amount</StatLabel>
          </StatCard>
        </StatsGrid>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <h3>Payments & Wallet Transactions</h3>
          <ActionsCell>
            <ActionButton
              onClick={() => setPaymentFilter((prev) => (prev === 'pending_withdrawals' ? 'all' : 'pending_withdrawals'))}
            >
              {paymentFilter === 'pending_withdrawals' ? 'Show All' : 'Pending Withdrawals'}
            </ActionButton>
            <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'wallet-transactions'] })}>
              Refresh
            </ActionButton>
            <ActionButton $variant="success" onClick={() => handleBulkPendingWithdrawals('completed')}>
              Approve Visible Pending
            </ActionButton>
            <ActionButton $variant="danger" onClick={() => handleBulkPendingWithdrawals('failed')}>
              Reject Visible Pending
            </ActionButton>
            <ActionButton onClick={exportPaymentsCsv}>
              Export CSV
            </ActionButton>
          </ActionsCell>
        </div>
        <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '14px' }}>
          <label style={{ display: 'grid', gap: '6px', color: '#cccccc', fontSize: '13px' }}>
            Status
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value as typeof paymentStatusFilter);
                setPaymentsPage(1);
              }}
              style={{ minHeight: '40px', borderRadius: '10px', background: '#151515', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '0 10px' }}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refund_pending">Refund pending</option>
              <option value="refunded">Refunded</option>
              <option value="refund_denied">Refund denied</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: '6px', color: '#cccccc', fontSize: '13px' }}>
            Search
            <input
              value={paymentSearchInput}
              onChange={(e) => {
                setPaymentSearchInput(e.target.value);
              }}
              placeholder="username, email, wallet, tx hash..."
              style={{ minHeight: '40px', borderRadius: '10px', background: '#151515', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '0 10px' }}
            />
          </label>
        </div>
        <div style={{ color: '#999', fontSize: '12px', marginBottom: '10px' }}>
          Showing {totalFiltered ? pageStart + 1 : 0}-{Math.min(pageStart + pageRows.length, totalFiltered)} of {totalFiltered} filtered transactions
        </div>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Source</Th>
                <Th>Type</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Wallet</Th>
                <Th>Network</Th>
                <Th>TX Hash</Th>
                <Th>Description</Th>
                <Th>Date</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((tx) => {
                const canApprove = tx.status === 'pending';
                const canReviewRefund = tx.status === 'refund_pending';

                return (
                  <tr key={tx.id}>
                    <Td>
                      <div>{tx.username || 'Unknown'}</div>
                      <div style={{ color: '#999', fontSize: '12px' }}>{tx.email || `TG: ${tx.telegramId}`}</div>
                    </Td>
                    <Td>{tx.source}</Td>
                    <Td>{tx.type}</Td>
                    <Td>${tx.amount.toFixed(2)}</Td>
                    <Td>{tx.status}</Td>
                    <Td>{tx.walletAddress || '-'}</Td>
                    <Td>{tx.network || '-'}</Td>
                    <Td>{tx.txHash || '-'}</Td>
                    <Td>{tx.description || '-'}</Td>
                    <Td>{formatDate(tx.date)}</Td>
                    <Td>
                      <ActionsCell>
                        {tx.walletAddress && (
                          <ActionButton onClick={() => copyText(tx.walletAddress || '', 'Wallet address copied')}>
                            Copy Address
                          </ActionButton>
                        )}
                        {tx.txHash && (
                          <ActionButton onClick={() => copyText(tx.txHash || '', 'TX hash copied')}>
                            Copy Hash
                          </ActionButton>
                        )}
                        {canApprove && (
                          <ActionButton $variant="success" onClick={() => handleWalletTransactionStatus(tx, 'completed')}>
                            Approve
                          </ActionButton>
                        )}
                        {canApprove && (
                          <ActionButton $variant="danger" onClick={() => handleWalletTransactionStatus(tx, 'failed')}>
                            Reject
                          </ActionButton>
                        )}
                        {canReviewRefund && (
                          <ActionButton $variant="success" onClick={() => handleWalletTransactionStatus(tx, 'refunded')}>
                            Refund
                          </ActionButton>
                        )}
                        {canReviewRefund && (
                          <ActionButton $variant="danger" onClick={() => handleWalletTransactionStatus(tx, 'refund_denied')}>
                            Deny Refund
                          </ActionButton>
                        )}
                        {!canApprove && !canReviewRefund && (
                          <span style={{ color: '#999', fontSize: '12px' }}>No actions</span>
                        )}
                      </ActionsCell>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ color: '#cccccc', fontSize: '13px' }}>
            Page {currentPage} of {totalPages}
          </div>
          <ActionsCell>
            <ActionButton
              onClick={() => setPaymentsPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              Prev
            </ActionButton>
            <ActionButton
              onClick={() => setPaymentsPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </ActionButton>
          </ActionsCell>
        </div>

      </div>
    );
  }

  function renderReferrals() {
    return (
      <div>
        <div style={{ display: 'grid', gap: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h3>Referral Logs</h3>
            <ActionsCell>
              <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'referrals'] })}>
                Refresh
              </ActionButton>
              <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'referral-settings'] })}>
                Reload settings
              </ActionButton>
            </ActionsCell>
          </div>

          <Card variant="outlined">
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0 }}>Referral Program Settings</h4>
                <ActionsCell>
                  <ActionButton onClick={handleUpdateReferralSettings}>Edit Settings</ActionButton>
                  <ActionButton $variant="success" onClick={handleGrantReferralEntries}>
                    Add Free Entries
                  </ActionButton>
                </ActionsCell>
              </div>
              <div style={{ color: '#cccccc', fontSize: '14px' }}>
                Bonus threshold: <strong>{referralSettings?.referralBonusThreshold ?? 3}</strong> referrals
                {' • '}
                Invited user bonus: <strong>{referralSettings?.refereeBonus ?? 1}</strong>
                {' • '}
                Referrer bonus: <strong>{referralSettings?.referrerBonus ?? 1}</strong>
                {' • '}
                Subscription price: <strong>${Number(referralSettings?.subscriptionPrice ?? 9.99).toFixed(2)}</strong>
              </div>
            </div>
          </Card>
        </div>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Referrer</Th>
                <Th>Referred User</Th>
                <Th>Reward</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(r => (
                <tr key={r.id}>
                  <Td>{r.referrer}</Td>
                  <Td>{r.referred}</Td>
                  <Td>{r.reward} entries</Td>
                  <Td>{r.status}</Td>
                  <Td>{r.date}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </div>
    );
  }

  function renderTournaments() {
    const selectedTournament = tournaments.find((item: any) => item.id === selectedTournamentId) || null;
    const overview = tournamentOverview;
    const allMatchesTotal = Number(
      tournamentMatchesSummary?.totalAll ||
      (Array.isArray((overview as any)?.matches) ? (overview as any).matches.length : 0)
    );
    const filteredTournamentRequests = tournamentRequests;
    const sortedTournamentRequests = tournamentRequests;
    const pendingRequestsTotal = Number(tournamentRequestsPagination?.total || sortedTournamentRequests.length || 0);
    const tournamentsTotalPages = Number(tournamentsPagination?.totalPages || 1);
    const tournamentsCurrentPage = Number(tournamentsPagination?.page || tournamentsPage || 1);
    const exportTournamentsCsv = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          notify('warning', 'Export failed', 'Admin token missing');
          return;
        }

        const params = new URLSearchParams();
        if (tournamentsStatusFilter !== 'all') params.set('status', tournamentsStatusFilter);
        if (tournamentsGameFilter !== 'all') params.set('game', tournamentsGameFilter);
        if (tournamentsSearch.trim()) params.set('search', tournamentsSearch.trim());

        const response = await fetch(
          getFullUrl(`/api/tournaments/admin/export.csv?${params.toString()}`),
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Export failed (${response.status})`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tournaments_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        notify('success', 'Export complete', 'Tournaments CSV downloaded');
      } catch (e: any) {
        notify('error', 'Export failed', formatApiError(e, 'Failed to export tournaments'));
      }
    };
    const tournamentRequestsTotalPages = Number(tournamentRequestsPagination?.totalPages || 1);
    const tournamentRequestsCurrentPage = Number(tournamentRequestsPagination?.page || tournamentRequestsPage || 1);
    const tournamentRequestsStart = tournamentRequestsPagination
      ? (Math.max(1, tournamentRequestsCurrentPage) - 1) * Number(tournamentRequestsPagination.limit || 12)
      : 0;
    const paginatedTournamentRequests = tournamentRequests;

    const matchesTotalPages = Number(tournamentMatchesPagination?.totalPages || 1);
    const matchesCurrentPage = Number(tournamentMatchesPagination?.page || matchesPage || 1);
    const matchesPageLimit = Number(tournamentMatchesPagination?.limit || 12);
    const matchesStart = (Math.max(1, matchesCurrentPage) - 1) * matchesPageLimit;
    const paginatedFilteredMatches = tournamentMatches;
    const matchesFilteredTotal = Number(tournamentMatchesSummary?.filteredTotal || tournamentMatchesPagination?.total || paginatedFilteredMatches.length);
    const filteredRecentDecisions = recentTournamentRequests;
    const recentDecisionsTotalPages = Number(recentTournamentRequestsPagination?.totalPages || 1);
    const recentDecisionsCurrentPage = Number(recentTournamentRequestsPagination?.page || recentDecisionsPage || 1);
    const recentDecisionsStart = recentTournamentRequestsPagination
      ? (Math.max(1, recentDecisionsCurrentPage) - 1) * Number(recentTournamentRequestsPagination.limit || 14)
      : 0;
    const paginatedRecentDecisions = recentTournamentRequests;

    const trackedEntities = new Set([
      'match_status_update',
      'match_status_bulk_update',
      'match_room_prepare_single',
      'match_room_bulk_prepare'
    ]);
    const recentMatchOps = (auditLogs || [])
      .filter((log: any) => trackedEntities.has(String(log?.entity || '')))
      .filter((log: any) => {
        if (!selectedTournamentId) return true;
        const payloadTournamentId = String(log?.payload?.tournamentId || '');
        const entityId = String(log?.entityId || '');
        return payloadTournamentId === selectedTournamentId || entityId === selectedTournamentId;
      })
      .slice(0, 8);
    const statusCodeSummary = Array.isArray(matchOpsSummary?.byStatusCode) ? matchOpsSummary.byStatusCode : [];
    const successfulOps = statusCodeSummary
      .filter((item) => item.statusCode >= 200 && item.statusCode < 300)
      .reduce((sum, item) => sum + Number(item.count || 0), 0);
    const failedOps = statusCodeSummary
      .filter((item) => item.statusCode >= 400)
      .reduce((sum, item) => sum + Number(item.count || 0), 0);
    const successRate = matchOpsSummary?.total
      ? Math.round((successfulOps / Math.max(matchOpsSummary.total, 1)) * 100)
      : 0;
    const exportRecentMatchOpsCsv = () => {
      if (!recentMatchOps.length) {
        notify('info', 'Export skipped', 'No recent match operations to export');
        return;
      }
      const csvCell = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const header = ['time', 'entity', 'statusCode', 'method', 'path', 'targetStatus', 'updated', 'skipped', 'failed', 'createdRooms'];
      const rows = recentMatchOps.map((log: any) => [
        log.createdAt ? new Date(log.createdAt).toISOString() : '',
        log.entity || '',
        log.statusCode || '',
        log.method || '',
        log.path || '',
        log?.payload?.targetStatus || '',
        typeof log?.payload?.updated === 'number' ? log.payload.updated : '',
        typeof log?.payload?.skipped === 'number' ? log.payload.skipped : '',
        typeof log?.payload?.failed === 'number' ? log.payload.failed : '',
        typeof log?.payload?.created === 'number' ? log.payload.created : ''
      ]);
      const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `match_ops_${selectedTournamentId || 'global'}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify('success', 'Export complete', `Downloaded ${recentMatchOps.length} operations`);
    };
    const preparedRoomsCount = Number(
      tournamentMatchesSummary?.roomsPreparedAll ||
      (Array.isArray(overview?.matches)
        ? overview.matches.filter((match: any) => Boolean(match?.hasRoomCredentials)).length
        : 0)
    );
    const approvedTeams = tournamentParticipants;
    const participantsTotalPages = Number(tournamentParticipantsPagination?.totalPages || 1);
    const participantsCurrentPage = Number(tournamentParticipantsPagination?.page || participantPage || 1);

    const exportRecentTournamentDecisionsCsv = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          notify('warning', 'Export failed', 'Admin token missing');
          return;
        }

        const params = new URLSearchParams({
          status: recentRequestsStatusFilter
        });
        if (recentDecisionsSearch.trim()) {
          params.set('search', recentDecisionsSearch.trim());
        }

        const response = await fetch(
          getFullUrl(`/api/tournaments/admin/requests/recent/export.csv?${params.toString()}`),
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Export failed (${response.status})`);
        }

        const blob = await response.blob();
        if (!blob.size) {
          notify('info', 'Export skipped', 'No recent decisions to export');
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tournament_decisions_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        notify('success', 'Export complete', 'Recent decisions CSV downloaded');
      } catch (e: any) {
        notify('error', 'Export failed', formatApiError(e, 'Failed to export recent decisions'));
      }
    };

    const exportFilteredMatchesCsv = async () => {
      if (!selectedTournamentId) {
        notify('warning', 'Export skipped', 'Select tournament first');
        return;
      }
      try {
      const token = getAuthToken();
      if (!token) {
        notify('warning', 'Export failed', 'Admin token missing');
        return;
      }

      const params = new URLSearchParams({
        status: matchStatusFilter,
        room: matchRoomFilter,
        winner: matchWinnerFilter
      });
      if (matchSearch.trim()) params.set('search', matchSearch.trim());

      const response = await fetch(
        getFullUrl(`/api/tournaments/${selectedTournamentId}/matches/admin/export.csv?${params.toString()}`),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }

      const blob = await response.blob();
      if (!blob.size) {
        notify('info', 'Export skipped', 'No matches for current filters');
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tournament_matches_${selectedTournamentId}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notify('success', 'Export complete', 'Filtered matches CSV downloaded');
      } catch (e: any) {
        notify('error', 'Export failed', formatApiError(e, 'Failed to export filtered matches'));
      }
    };

    const exportParticipantsCsv = async () => {
      if (!selectedTournamentId) {
        notify('warning', 'Export skipped', 'Select tournament first');
        return;
      }
      try {
        const token = getAuthToken();
        if (!token) {
          notify('warning', 'Export failed', 'Admin token missing');
          return;
        }

        const params = new URLSearchParams();
        if (participantSearch.trim()) params.set('search', participantSearch.trim());

        const response = await fetch(
          getFullUrl(`/api/tournaments/${selectedTournamentId}/participants/export.csv?${params.toString()}`),
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Export failed (${response.status})`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tournament_participants_${selectedTournamentId}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        notify('success', 'Export complete', 'Participants CSV downloaded');
      } catch (e: any) {
        notify('error', 'Export failed', formatApiError(e, 'Failed to export participants'));
      }
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <h3>Tournament Management</h3>
          <div style={{ fontSize: '12px', color: tournamentRequestsStreamConnected ? '#81c784' : '#ffab91' }}>
            Requests Stream: {tournamentRequestsStreamConnected ? 'LIVE' : 'OFFLINE'} • Global pending: {globalPendingTournamentRequests}
            {tournamentRequestsStreamUpdatedAt ? ` • Last: ${formatDateTime(tournamentRequestsStreamUpdatedAt)}` : ''}
          </div>
          <ActionsCell>
            <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] })}>
              Refresh
            </ActionButton>
            <ActionButton onClick={exportTournamentsCsv}>
              Export CSV
            </ActionButton>
            <ActionButton onClick={() => handleCreate('tournament')}>Create Tournament</ActionButton>
          </ActionsCell>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 360px) minmax(160px, 220px) minmax(160px, 220px)', gap: '8px', marginBottom: '12px' }}>
          <Input
            value={tournamentsSearchInput}
            onChange={(e) => setTournamentsSearchInput(e.target.value)}
            placeholder="Search tournaments by name"
          />
          <Select value={tournamentsStatusFilter} onChange={(e) => setTournamentsStatusFilter(e.target.value as any)}>
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select value={tournamentsGameFilter} onChange={(e) => setTournamentsGameFilter(e.target.value as any)}>
            <option value="all">All games</option>
            <option value="CS2">CS2</option>
            <option value="Critical Ops">Critical Ops</option>
            <option value="PUBG Mobile">PUBG Mobile</option>
            <option value="Valorant Mobile">Valorant Mobile</option>
            <option value="Dota 2">Dota 2</option>
            <option value="Standoff 2">Standoff 2</option>
          </Select>
        </div>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Game</Th>
                <Th>Status</Th>
                <Th>Dates</Th>
                <Th>Participants</Th>
                <Th>Pending</Th>
                <Th>Prize Pool</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map(tournament => (
                <tr key={tournament.id}>
                  <Td>{tournament.name}</Td>
                  <Td>{tournament.game}</Td>
                  <Td>{tournament.status}</Td>
                  <Td>
                    <div style={{ display: 'grid', gap: '4px' }}>
                      <span>Start: {formatDateTime(tournament.startDate)}</span>
                      <span>End: {formatDateTime(tournament.endDate)}</span>
                    </div>
                  </Td>
                  <Td>{tournament.participants}/{tournament.maxTeams || '-'}</Td>
                  <Td>
                    {tournament.pendingRequestsCount || 0}
                    {(newTournamentRequestCounts[tournament.id] || 0) > 0 ? (
                      <span style={{ marginLeft: 8, color: '#ff6b00', fontSize: 12, fontWeight: 700 }}>
                        +{newTournamentRequestCounts[tournament.id]} new
                      </span>
                    ) : null}
                  </Td>
                  <Td>${tournament.prizePool}</Td>
                  <Td>
                    <ActionsCell>
                      <ActionButton
                        $variant="success"
                        onClick={() => {
                          setSelectedTournamentId(tournament.id);
                          setNewTournamentRequestCounts((prev) => ({ ...prev, [tournament.id]: 0 }));
                        }}
                      >
                        Manage
                      </ActionButton>
                      {(tournament.status === 'upcoming' || tournament.status === 'open') && (
                        <ActionButton $variant="success" onClick={() => handleStartTournament(tournament.id)}>
                          Start
                        </ActionButton>
                      )}
                      <ActionButton onClick={() => handleEdit(tournament, 'tournament')}>Edit</ActionButton>
                      <ActionButton $variant="danger" onClick={() => handleDelete(tournament.id, 'tournament')}>Delete</ActionButton>
                    </ActionsCell>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ color: '#cccccc', fontSize: '13px' }}>
            Page {tournamentsCurrentPage} of {tournamentsTotalPages} {tournamentsPagination ? `• total ${tournamentsPagination.total}` : ''}
          </div>
          <ActionsCell>
            <ActionButton
              onClick={() => setTournamentsPage((prev) => Math.max(1, prev - 1))}
              disabled={tournamentsCurrentPage <= 1}
            >
              Prev
            </ActionButton>
            <ActionButton
              onClick={() => setTournamentsPage((prev) => Math.min(tournamentsTotalPages, prev + 1))}
              disabled={tournamentsCurrentPage >= tournamentsTotalPages}
            >
              Next
            </ActionButton>
          </ActionsCell>
        </div>

        {selectedTournamentId && (
          <Card variant="outlined" style={{ marginTop: '20px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <h4 style={{ margin: 0 }}>
                Tournament Control: {selectedTournament?.name || selectedTournamentId}
              </h4>
              {selectedTournament && (
                <div style={{ color: '#cccccc', fontSize: '13px' }}>
                  Start: {formatDateTime((selectedTournament as any).startDate)} | End: {formatDateTime((selectedTournament as any).endDate)}
                </div>
              )}
              <ActionsCell>
                <ActionButton onClick={handleRefreshTournamentAdminPanels}>
                  Refresh All
                </ActionButton>
                <ActionButton onClick={handleResetTournamentFilters}>
                  Reset Filters
                </ActionButton>
                <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-requests', selectedTournamentId] })}>
                  Refresh Requests
                </ActionButton>
                <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', selectedTournamentId] })}>
                  Refresh Overview
                </ActionButton>
                <ActionButton
                  onClick={() => setTournamentRequestSoundEnabled((prev) => !prev)}
                  $variant={tournamentRequestSoundEnabled ? 'success' : undefined}
                >
                  Alert Sound: {tournamentRequestSoundEnabled ? 'ON' : 'OFF'}
                </ActionButton>
                <ActionButton
                  onClick={() => {
                    if (!selectedTournamentId) return;
                    setNewTournamentRequestCounts((prev) => ({ ...prev, [selectedTournamentId]: 0 }));
                  }}
                >
                  Mark New as Seen
                </ActionButton>
                <ActionButton onClick={() => handlePrepareTournamentRooms(false)}>
                  Prepare Missing Rooms
                </ActionButton>
                <ActionButton onClick={() => handlePrepareTournamentRooms(true)}>
                  Regenerate Rooms
                </ActionButton>
                <ActionButton onClick={() => handlePrepareTournamentRooms(false, true)}>
                  Preview Missing Rooms
                </ActionButton>
                <ActionButton onClick={() => handlePrepareTournamentRooms(true, true)}>
                  Preview Regenerate Rooms
                </ActionButton>
              </ActionsCell>
            </div>

            <div style={{ marginBottom: '12px', color: tournamentStreamConnected ? '#81c784' : '#ffab91', fontSize: '12px' }}>
              Realtime Sync: {tournamentStreamConnected ? 'LIVE' : 'OFFLINE'}
              {tournamentStreamUpdatedAt ? ` • last update ${formatDateTime(tournamentStreamUpdatedAt)}` : ''}
            </div>
            {selectedMatchRoomLogsId ? (
              <div style={{ marginBottom: '12px', color: matchRoomLogsStreamConnected ? '#81c784' : '#ffab91', fontSize: '12px' }}>
                Room Logs Stream: {matchRoomLogsStreamConnected ? 'LIVE' : 'OFFLINE'}
                {matchRoomLogsStreamUpdatedAt ? ` • last update ${formatDateTime(matchRoomLogsStreamUpdatedAt)}` : ''}
              </div>
            ) : null}

            <div style={{ marginBottom: '16px', color: '#cccccc', fontSize: '14px' }}>
              Approved teams: <strong>{overview?.teams?.length || 0}</strong>
              {' | '}
              Pending requests: <strong>{tournamentRequests.length}</strong>
              {(newTournamentRequestCounts[selectedTournamentId] || 0) > 0 ? (
                <>
                  {' • '}
                  New: <strong style={{ color: '#ff6b00' }}>{newTournamentRequestCounts[selectedTournamentId]}</strong>
                </>
              ) : null}
              {' • '}
              Matches: <strong>{allMatchesTotal}</strong>
              {' • '}
              Rooms prepared: <strong>{preparedRoomsCount}</strong>
              {' • '}
              Live w/o room: <strong style={{ color: Number((tournamentMatchesSummary?.liveWithoutRoom ?? overview?.summary?.liveWithoutRoom) || 0) > 0 ? '#ff8a65' : '#81c784' }}>{Number((tournamentMatchesSummary?.liveWithoutRoom ?? overview?.summary?.liveWithoutRoom) || 0)}</strong>
              {' • '}
              Completed w/o winner: <strong style={{ color: Number((tournamentMatchesSummary?.completedWithoutWinner ?? overview?.summary?.completedWithoutWinner) || 0) > 0 ? '#ff8a65' : '#81c784' }}>{Number((tournamentMatchesSummary?.completedWithoutWinner ?? overview?.summary?.completedWithoutWinner) || 0)}</strong>
            </div>
            {(tournamentMatchesSummary?.byStatus || overview?.summary?.byStatus) ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', color: '#e0e0e0' }}>
                  scheduled: {Number((tournamentMatchesSummary?.byStatus?.scheduled ?? overview?.summary?.byStatus?.scheduled) || 0)}
                </span>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', color: '#e0e0e0' }}>
                  live: {Number((tournamentMatchesSummary?.byStatus?.live ?? overview?.summary?.byStatus?.live) || 0)}
                </span>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', color: '#e0e0e0' }}>
                  completed: {Number((tournamentMatchesSummary?.byStatus?.completed ?? overview?.summary?.byStatus?.completed) || 0)}
                </span>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', color: '#e0e0e0' }}>
                  cancelled: {Number((tournamentMatchesSummary?.byStatus?.cancelled ?? overview?.summary?.byStatus?.cancelled) || 0)}
                </span>
              </div>
            ) : null}
            <div style={{ marginBottom: 14, padding: 10, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ fontWeight: 700 }}>Recent Match Operations</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    value={String(matchOpsWindowHours)}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value === 24 || value === 48 || value === 168) {
                        setMatchOpsWindowHours(value);
                      }
                    }}
                    style={{
                      background: 'rgba(0,0,0,0.35)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 6,
                      padding: '6px 8px',
                      fontSize: 12
                    }}
                  >
                    <option value="24">24h</option>
                    <option value="48">48h</option>
                    <option value="168">7d</option>
                  </select>
                  <ActionButton onClick={exportRecentMatchOpsCsv}>Export Ops CSV</ActionButton>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 10, color: '#cfcfcf', fontSize: 12 }}>
                <span>Window: {matchOpsSummary?.hours || 48}h</span>
                <span>Total Ops: {Number(matchOpsSummary?.total || 0)}</span>
                <span>Success: {successfulOps}</span>
                <span>Failed: {failedOps}</span>
                <span>Success Rate: {successRate}%</span>
              </div>
              {statusCodeSummary.length ? (
                <div style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
                  {statusCodeSummary.map((row) => {
                    const total = Math.max(Number(matchOpsSummary?.total || 0), 1);
                    const width = Math.min(100, Math.round((Number(row.count || 0) / total) * 100));
                    const isSuccess = row.statusCode >= 200 && row.statusCode < 300;
                    const isError = row.statusCode >= 400;
                    return (
                      <div key={`status-${row.statusCode}`} style={{ display: 'grid', gridTemplateColumns: '72px 1fr 48px', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#bdbdbd' }}>{row.statusCode}</span>
                        <div style={{ height: 8, borderRadius: 6, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${width}%`,
                              background: isSuccess ? '#66bb6a' : isError ? '#ef5350' : '#ffb74d'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: '#bdbdbd', textAlign: 'right' }}>{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              {matchOpsSummary?.byEntity?.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {matchOpsSummary.byEntity.map((row) => (
                    <span
                      key={row.entity}
                      style={{
                        fontSize: 11,
                        color: '#e8e8e8',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 999,
                        padding: '3px 8px'
                      }}
                    >
                      {row.entity}: {row.count}
                    </span>
                  ))}
                </div>
              ) : null}
              {!recentMatchOps.length ? (
                <div style={{ color: '#999', fontSize: 12 }}>No recent match operations in audit log</div>
              ) : (
                <div style={{ display: 'grid', gap: 4 }}>
                  {recentMatchOps.map((log: any) => (
                    <div key={log.id} style={{ fontSize: 12, color: '#cfcfcf' }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'} | {log.entity} | {log.statusCode} | {log.method} {log.path}
                      {log?.payload?.targetStatus ? ` | status: ${String(log.payload.targetStatus)}` : ''}
                      {typeof log?.payload?.updated === 'number' ? ` | updated: ${log.payload.updated}` : ''}
                      {typeof log?.payload?.skipped === 'number' ? ` | skipped: ${log.payload.skipped}` : ''}
                      {typeof log?.payload?.failed === 'number' ? ` | failed: ${log.payload.failed}` : ''}
                      {typeof log?.payload?.created === 'number' ? ` | rooms created: ${log.payload.created}` : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <h5 style={{ marginTop: 0 }}>Pending Requests Across Tournaments</h5>
            {!pendingTournamentQueue.length ? (
              <div style={{ color: '#999', marginBottom: '12px' }}>No tournaments with pending requests</div>
            ) : (
              <TableWrap style={{ marginBottom: '14px' }}>
                <Table>
                  <thead>
                    <tr>
                      <Th>Tournament</Th>
                      <Th>Game</Th>
                      <Th>Pending</Th>
                      <Th>Oldest</Th>
                      <Th>Action</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTournamentQueue.map((row: any) => (
                      <tr key={`pending-tournament-${row.id}`}>
                        <Td>{row.name}</Td>
                        <Td>{row.game || '-'}</Td>
                        <Td>{Number(row.pendingRequestsCount || 0)}</Td>
                        <Td>{row.firstPendingAt ? new Date(row.firstPendingAt).toLocaleString() : '-'}</Td>
                        <Td>
                          <ActionsCell>
                            <ActionButton onClick={() => setSelectedTournamentId(row.id)}>
                              Open
                            </ActionButton>
                            <ActionButton
                              $variant="success"
                              onClick={() => handleBulkTournamentRequestsForTournament(row.id, 'approve')}
                              disabled={Number(row.pendingRequestsCount || 0) <= 0}
                            >
                              Approve All
                            </ActionButton>
                            <ActionButton
                              $variant="danger"
                              onClick={() => handleBulkTournamentRequestsForTournament(row.id, 'reject')}
                              disabled={Number(row.pendingRequestsCount || 0) <= 0}
                            >
                              Reject All
                            </ActionButton>
                          </ActionsCell>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ color: '#cccccc', fontSize: '13px' }}>
                    Page {Number(pendingTournamentQueuePagination?.page || pendingQueuePage)} of {Number(pendingTournamentQueuePagination?.totalPages || 1)}
                    {' • '}
                    Total {Number(pendingTournamentQueuePagination?.total || pendingTournamentQueue.length)}
                  </div>
                  <ActionsCell>
                    <ActionButton
                      onClick={() => setPendingQueuePage((prev) => Math.max(1, prev - 1))}
                      disabled={Number(pendingTournamentQueuePagination?.page || pendingQueuePage) <= 1}
                    >
                      Prev
                    </ActionButton>
                    <ActionButton
                      onClick={() => setPendingQueuePage((prev) => Math.min(Number(pendingTournamentQueuePagination?.totalPages || 1), prev + 1))}
                      disabled={Number(pendingTournamentQueuePagination?.page || pendingQueuePage) >= Number(pendingTournamentQueuePagination?.totalPages || 1)}
                    >
                      Next
                    </ActionButton>
                  </ActionsCell>
                </div>
              </TableWrap>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h5 style={{ marginTop: 0, marginBottom: 0 }}>Recent Decisions (Approved / Rejected)</h5>
              <ActionsCell>
                <Select
                  value={recentRequestsStatusFilter}
                  onChange={(e) => {
                    setRecentRequestsStatusFilter(e.target.value as 'all' | 'approved' | 'rejected');
                    setRecentDecisionsPage(1);
                  }}
                >
                  <option value="all">All</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Select>
                <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'recent-tournament-requests'] })}>
                  Refresh
                </ActionButton>
                <ActionButton onClick={exportRecentTournamentDecisionsCsv}>
                  Export CSV
                </ActionButton>
              </ActionsCell>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              <Input
                value={recentDecisionsSearchInput}
                onChange={(e) => {
                  setRecentDecisionsSearchInput(e.target.value);
                }}
                placeholder="Search by tournament / team / reviewer / note"
                style={{ minWidth: 300 }}
              />
              <span style={{ color: '#aaa', fontSize: 12 }}>
                Showing {filteredRecentDecisions.length ? recentDecisionsStart + 1 : 0}-{Math.min(recentDecisionsStart + paginatedRecentDecisions.length, Number(recentTournamentRequestsPagination?.total || filteredRecentDecisions.length))} of {Number(recentTournamentRequestsPagination?.total || filteredRecentDecisions.length)}
              </span>
            </div>
            {!filteredRecentDecisions.length ? (
              <div style={{ color: '#999', marginBottom: '12px' }}>No recent processed requests</div>
            ) : (
              <TableWrap style={{ marginBottom: '14px' }}>
                <Table>
                  <thead>
                    <tr>
                      <Th>Tournament</Th>
                      <Th>Team</Th>
                      <Th>Status</Th>
                      <Th>Note</Th>
                      <Th>Reviewed By</Th>
                      <Th>Reviewed At</Th>
                      <Th>Action</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecentDecisions.map((row: AdminTournamentRequestHistoryRow) => (
                      <tr key={row.id}>
                        <Td>{row.tournamentName}</Td>
                        <Td>{row.teamName} {row.teamTag ? `(${row.teamTag})` : ''}</Td>
                        <Td style={{ color: row.status === 'approved' ? '#81c784' : '#ffab91' }}>{row.status}</Td>
                        <Td>{row.note || '-'}</Td>
                        <Td>{row.reviewedBy?.username || row.reviewedBy?.firstName || '-'}</Td>
                        <Td>{row.reviewedAt ? new Date(row.reviewedAt).toLocaleString() : '-'}</Td>
                        <Td>
                          <ActionsCell>
                            <ActionButton onClick={() => setSelectedTournamentId(row.tournamentId)}>
                              Open Tournament
                            </ActionButton>
                            <ActionButton
                              $variant="primary"
                              onClick={() => handleReopenTournamentRequest(row)}
                            >
                              Reopen
                            </ActionButton>
                          </ActionsCell>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ color: '#cccccc', fontSize: '13px' }}>
                    Page {recentDecisionsCurrentPage} of {recentDecisionsTotalPages}
                  </div>
                  <ActionsCell>
                    <ActionButton
                      onClick={() => setRecentDecisionsPage((prev) => Math.max(1, prev - 1))}
                      disabled={recentDecisionsCurrentPage <= 1}
                    >
                      Prev
                    </ActionButton>
                    <ActionButton
                      onClick={() => setRecentDecisionsPage((prev) => Math.min(recentDecisionsTotalPages, prev + 1))}
                      disabled={recentDecisionsCurrentPage >= recentDecisionsTotalPages}
                    >
                      Next
                    </ActionButton>
                  </ActionsCell>
                </div>
              </TableWrap>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h5 style={{ marginTop: 0, marginBottom: 0 }}>Pending Tournament Requests</h5>
              <ActionsCell>
                <ActionButton onClick={() => handleBulkTournamentRequests('approve')} disabled={!pendingRequestsTotal}>
                  Approve All
                </ActionButton>
                <ActionButton $variant="danger" onClick={() => handleBulkTournamentRequests('reject')} disabled={!pendingRequestsTotal}>
                  Reject All
                </ActionButton>
                <ActionButton onClick={() => exportTournamentRequestsCsv(selectedTournamentId, tournamentRequestSearch)}>
                  Export Pending CSV
                </ActionButton>
                <ActionButton
                  onClick={() => handleBulkTournamentRequests('approve', paginatedTournamentRequests.map((row) => row.teamId).filter(Boolean))}
                  disabled={!paginatedTournamentRequests.length}
                >
                  Approve Visible
                </ActionButton>
                <ActionButton
                  $variant="danger"
                  onClick={() => handleBulkTournamentRequests('reject', paginatedTournamentRequests.map((row) => row.teamId).filter(Boolean))}
                  disabled={!paginatedTournamentRequests.length}
                >
                  Reject Visible
                </ActionButton>
              </ActionsCell>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              <Input
                value={tournamentRequestSearchInput}
                onChange={(e) => {
                  setTournamentRequestSearchInput(e.target.value);
                }}
                placeholder="Search by team / tag / requester"
                style={{ minWidth: 260 }}
              />
              <span style={{ color: '#aaa', fontSize: 12 }}>
                Showing {sortedTournamentRequests.length ? tournamentRequestsStart + 1 : 0}-{Math.min(tournamentRequestsStart + paginatedTournamentRequests.length, Number(tournamentRequestsPagination?.total || sortedTournamentRequests.length))} of {Number(tournamentRequestsPagination?.total || sortedTournamentRequests.length)}
              </span>
            </div>
            {!sortedTournamentRequests.length ? (
              <div style={{ color: '#999', marginBottom: '18px' }}>No pending requests</div>
            ) : (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>Team</Th>
                      <Th>Members</Th>
                      <Th>Stats</Th>
                      <Th>Requested By</Th>
                      <Th>Requested At</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTournamentRequests.map((request: AdminTournamentRequestRow) => (
                      <tr key={request.id}>
                        <Td>{request.teamName} {request.teamTag ? `(${request.teamTag})` : ''}</Td>
                        <Td>{request.membersCount}</Td>
                        <Td>{request.stats?.wins || 0}W / {request.stats?.losses || 0}L ({Number(request.stats?.winRate || 0).toFixed(1)}%)</Td>
                        <Td>{request.requestedBy?.username || request.requestedBy?.firstName || 'Unknown'}</Td>
                        <Td>{request.requestedAt ? new Date(request.requestedAt).toLocaleString() : '-'}</Td>
                        <Td>
                          <ActionsCell>
                            <ActionButton
                              $variant="success"
                              onClick={() => handleApproveTournamentRequest(selectedTournamentId, request.teamId)}
                            >
                              Approve
                            </ActionButton>
                            <ActionButton
                              $variant="danger"
                              onClick={() => handleRejectTournamentRequest(selectedTournamentId, request.teamId)}
                            >
                              Reject
                            </ActionButton>
                            <ActionButton
                              onClick={() => handleForceAddTournamentParticipant(selectedTournamentId, request.teamId)}
                            >
                              Add Now
                            </ActionButton>
                          </ActionsCell>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ color: '#cccccc', fontSize: '13px' }}>
                    Page {tournamentRequestsCurrentPage} of {tournamentRequestsTotalPages}
                  </div>
                  <ActionsCell>
                    <ActionButton
                      onClick={() => setTournamentRequestsPage((prev) => Math.max(1, prev - 1))}
                      disabled={tournamentRequestsCurrentPage <= 1}
                    >
                      Prev
                    </ActionButton>
                    <ActionButton
                      onClick={() => setTournamentRequestsPage((prev) => Math.min(tournamentRequestsTotalPages, prev + 1))}
                      disabled={tournamentRequestsCurrentPage >= tournamentRequestsTotalPages}
                    >
                      Next
                    </ActionButton>
                  </ActionsCell>
                </div>
              </TableWrap>
            )}

            <h5>Approved Teams and Stats</h5>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <ActionButton onClick={() => handleRecalculateParticipantStats(selectedTournamentId)}>
                Recalculate Stats From Matches
              </ActionButton>
              <ActionButton onClick={exportParticipantsCsv}>
                Export Participants CSV
              </ActionButton>
              <ActionButton
                $variant="danger"
                onClick={() => handleBulkRemoveTournamentParticipants(
                  selectedTournamentId,
                  approvedTeams.map((team: any) => String(team.id || '')).filter(Boolean)
                )}
                disabled={!approvedTeams.length}
              >
                Remove Visible
              </ActionButton>
              <Input
                value={participantSearchInput}
                onChange={(e) => setParticipantSearchInput(e.target.value)}
                placeholder="Filter approved teams by name/tag"
                style={{ minWidth: 260 }}
              />
              <span style={{ color: '#aaa', fontSize: 12, alignSelf: 'center' }}>
                Showing {approvedTeams.length ? ((participantsCurrentPage - 1) * Number(tournamentParticipantsPagination?.limit || 12)) + 1 : 0}
                -{Math.min(((participantsCurrentPage - 1) * Number(tournamentParticipantsPagination?.limit || 12)) + approvedTeams.length, Number(tournamentParticipantsPagination?.total || approvedTeams.length))}
                {' '}of {Number(tournamentParticipantsSummary?.filteredTotal || tournamentParticipantsPagination?.total || approvedTeams.length)}
              </span>
            </div>
            {!approvedTeams.length ? (
              <div style={{ color: '#999', marginBottom: '18px' }}>No approved teams yet</div>
            ) : (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>Team</Th>
                      <Th>Members</Th>
                      <Th>Matches</Th>
                      <Th>Wins</Th>
                      <Th>Losses</Th>
                      <Th>Win Rate</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedTeams.map((team: any) => (
                      <tr key={team.id}>
                        <Td>{team.name} {team.tag ? `(${team.tag})` : ''}</Td>
                        <Td>{team.membersCount}</Td>
                        <Td>{team.stats?.totalMatches || 0}</Td>
                        <Td>{team.stats?.wins || 0}</Td>
                        <Td>{team.stats?.losses || 0}</Td>
                        <Td>{Number(team.stats?.winRate || 0).toFixed(1)}%</Td>
                        <Td>
                          <ActionsCell>
                            <ActionButton
                              onClick={() => handleEditParticipantStats(selectedTournamentId, team)}
                            >
                              Edit Stats
                            </ActionButton>
                            <ActionButton
                              $variant="danger"
                              onClick={() => handleRemoveTournamentParticipant(selectedTournamentId, team.id)}
                            >
                              Remove
                            </ActionButton>
                          </ActionsCell>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ color: '#cccccc', fontSize: '13px' }}>
                    Page {participantsCurrentPage} of {participantsTotalPages}
                  </div>
                  <ActionsCell>
                    <ActionButton
                      onClick={() => setParticipantPage((prev) => Math.max(1, prev - 1))}
                      disabled={participantsCurrentPage <= 1}
                    >
                      Prev
                    </ActionButton>
                    <ActionButton
                      onClick={() => setParticipantPage((prev) => Math.min(participantsTotalPages, prev + 1))}
                      disabled={participantsCurrentPage >= participantsTotalPages}
                    >
                      Next
                    </ActionButton>
                  </ActionsCell>
                </div>
              </TableWrap>
            )}

            <h5>Matches and Results</h5>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              <Select value={matchStatusFilter} onChange={(e) => { setMatchStatusFilter(e.target.value as any); setMatchesPage(1); }}>
                <option value="all">All statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
              <Select value={matchRoomFilter} onChange={(e) => { setMatchRoomFilter(e.target.value as any); setMatchesPage(1); }}>
                <option value="all">All rooms</option>
                <option value="with_room">With room</option>
                <option value="without_room">Without room</option>
              </Select>
              <Select value={matchWinnerFilter} onChange={(e) => { setMatchWinnerFilter(e.target.value as any); setMatchesPage(1); }}>
                <option value="all">All winners</option>
                <option value="with_winner">With winner</option>
                <option value="without_winner">Without winner</option>
              </Select>
              <Input
                value={matchSearch}
                onChange={(e) => { setMatchSearch(e.target.value); setMatchesPage(1); }}
                placeholder="Search by team or round"
                style={{ minWidth: 240 }}
              />
              <ActionButton onClick={handlePreviewFilteredMatches}>Preview</ActionButton>
              <ActionButton onClick={exportFilteredMatchesCsv}>Export CSV</ActionButton>
              <ActionButton onClick={() => handlePrepareFilteredMatchRooms(false, true)}>Preview Rooms (Filtered)</ActionButton>
              <ActionButton onClick={() => handlePrepareFilteredMatchRooms(false)}>Prepare Rooms (Filtered)</ActionButton>
              <ActionButton onClick={() => handlePrepareFilteredMatchRooms(true)}>Regenerate Rooms (Filtered)</ActionButton>
              <ActionButton onClick={handleBulkInferWinners}>Infer Winners (Filtered)</ActionButton>
              <ActionButton onClick={() => handleBulkMatchStatus('live')}>Bulk Live</ActionButton>
              <ActionButton onClick={() => handleBulkMatchStatus('completed')}>Bulk Complete</ActionButton>
              <ActionButton onClick={() => handleBulkMatchStatus('scheduled')}>Bulk Schedule</ActionButton>
              <ActionButton $variant="danger" onClick={() => handleBulkMatchStatus('cancelled')}>Bulk Cancel</ActionButton>
              <span style={{ color: '#aaa', fontSize: 12 }}>
                Showing {matchesFilteredTotal ? matchesStart + 1 : 0}-{Math.min(matchesStart + paginatedFilteredMatches.length, matchesFilteredTotal)} of {matchesFilteredTotal} filtered ({allMatchesTotal} total)
              </span>
            </div>
            {!allMatchesTotal ? (
              <div style={{ color: '#999' }}>No matches generated yet</div>
            ) : !matchesFilteredTotal ? (
              <div style={{ color: '#999' }}>No matches match the selected filters</div>
            ) : (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>Round</Th>
                      <Th>Team 1</Th>
                      <Th>Team 2</Th>
                      <Th>Score</Th>
                      <Th>Status</Th>
                      <Th>Events</Th>
                      <Th>Room</Th>
                      <Th>Access Window</Th>
                      <Th>Winner</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedFilteredMatches.map((match: any) => (
                      <tr key={match.id}>
                        <Td>{match.round || 'Round'}</Td>
                        <Td>{match.team1?.name || 'TBD'}</Td>
                        <Td>{match.team2?.name || 'TBD'}</Td>
                        <Td>{Number(match.score?.team1 || 0)} : {Number(match.score?.team2 || 0)}</Td>
                        <Td>{match.status || 'scheduled'}</Td>
                        <Td>
                          <div style={{ display: 'grid', gap: '4px' }}>
                            <span>Total: {Number(match.eventsSummary?.totalEvents || 0)}</span>
                            <span>Players: {Number(match.eventsSummary?.participants?.players || 0)}</span>
                            <span style={{ color: '#aaa', fontSize: 11 }}>
                              K:{Number(match.eventsSummary?.byType?.kill || 0)} D:{Number(match.eventsSummary?.byType?.death || 0)} A:{Number(match.eventsSummary?.byType?.assist || 0)}
                            </span>
                          </div>
                        </Td>
                        <Td>
                          {match.hasRoomCredentials && match.roomCredentials ? (
                            <div style={{ display: 'grid', gap: '4px' }}>
                              <div>
                                <strong>{match.roomCredentials.roomId}</strong> / {match.roomCredentials.password}
                              </div>
                              <ActionsCell>
                                <ActionButton onClick={() => copyText(match.roomCredentials.roomId, 'Room ID copied')}>
                                  Copy ID
                                </ActionButton>
                                <ActionButton onClick={() => copyText(match.roomCredentials.password, 'Room password copied')}>
                                  Copy Password
                                </ActionButton>
                              </ActionsCell>
                            </div>
                          ) : (
                            <span style={{ color: '#999' }}>Not prepared</span>
                          )}
                        </Td>
                        <Td>
                          {match.hasRoomCredentials && match.roomCredentials ? (
                            <div style={{ display: 'grid', gap: '4px' }}>
                              <div>
                                Visible: {match.roomCredentials.visibleAt ? new Date(match.roomCredentials.visibleAt).toLocaleString() : '-'}
                              </div>
                              <div>
                                Expires: {match.roomCredentials.expiresAt ? new Date(match.roomCredentials.expiresAt).toLocaleString() : '-'}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#999' }}>-</span>
                          )}
                        </Td>
                        <Td>
                          {match.winnerId === match.team1?.id
                            ? (match.team1?.name || 'Team 1')
                            : match.winnerId === match.team2?.id
                              ? (match.team2?.name || 'Team 2')
                              : '-'}
                        </Td>
                        <Td>
                          <ActionsCell>
                            <ActionButton onClick={() => handlePrepareSingleMatchRoom(match.id, false)}>
                              Prepare Room
                            </ActionButton>
                            <ActionButton onClick={() => handlePrepareSingleMatchRoom(match.id, true)}>
                              Regenerate
                            </ActionButton>
                            <ActionButton onClick={() => handleSetCustomMatchRoom(match)}>
                              Custom Room
                            </ActionButton>
                            <ActionButton
                              onClick={() => {
                                const nextTeam1 = window.prompt(`Score: ${match.team1?.name || 'Team 1'}`, String(match.score?.team1 ?? 0));
                                if (nextTeam1 === null) return;
                                const nextTeam2 = window.prompt(`Score: ${match.team2?.name || 'Team 2'}`, String(match.score?.team2 ?? 0));
                                if (nextTeam2 === null) return;
                                handleSaveMatchScore(match, nextTeam1, nextTeam2);
                              }}
                            >
                              Edit Score
                            </ActionButton>
                            <ActionButton onClick={() => handleEditMatchMeta(match)}>
                              Edit Meta
                            </ActionButton>
                            {match.team1?.id ? (
                              <ActionButton onClick={() => handleSetMatchWinner(match, String(match.team1.id))}>
                                Winner: {match.team1?.tag || match.team1?.name || 'Team 1'}
                              </ActionButton>
                            ) : null}
                            {match.team2?.id ? (
                              <ActionButton onClick={() => handleSetMatchWinner(match, String(match.team2.id))}>
                                Winner: {match.team2?.tag || match.team2?.name || 'Team 2'}
                              </ActionButton>
                            ) : null}
                            {String(match.status || '').toLowerCase() !== 'live' ? (
                              <ActionButton onClick={() => handleUpdateMatchStatus(match.id, 'live')}>
                                Mark Live
                              </ActionButton>
                            ) : null}
                            {String(match.status || '').toLowerCase() !== 'completed' ? (
                              <ActionButton onClick={() => handleUpdateMatchStatus(match.id, 'completed')}>
                                Mark Completed
                              </ActionButton>
                            ) : null}
                            {String(match.status || '').toLowerCase() !== 'scheduled' ? (
                              <ActionButton onClick={() => handleUpdateMatchStatus(match.id, 'scheduled')}>
                                Set Scheduled
                              </ActionButton>
                            ) : null}
                            {String(match.status || '').toLowerCase() !== 'cancelled' ? (
                              <ActionButton $variant="danger" onClick={() => handleUpdateMatchStatus(match.id, 'cancelled')}>
                                Cancel
                              </ActionButton>
                            ) : null}
                            <ActionButton onClick={() => handleLoadMatchRoomLogs(match.id)}>
                              {matchRoomLogsLoadingId === match.id ? 'Loading Logs...' : 'Room Logs'}
                            </ActionButton>
                          </ActionsCell>
                          {Array.isArray(matchRoomLogs[match.id]) && matchRoomLogs[match.id].length > 0 && (
                            <div style={{ marginTop: 8, fontSize: 11, color: '#bdbdbd', maxWidth: 520 }}>
                              {matchRoomLogs[match.id].slice(0, 5).map((row) => {
                                const actor =
                                  row.requestedBy?.username ||
                                  row.requestedBy?.firstName ||
                                  row.requesterRole ||
                                  'unknown';
                                return (
                                  <div key={row.id}>
                                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'} | {row.source} | {row.status} | {actor}{row.reason ? ` | ${row.reason}` : ''}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ color: '#cccccc', fontSize: '13px' }}>
                    Page {matchesCurrentPage} of {matchesTotalPages}
                  </div>
                  <ActionsCell>
                    <ActionButton
                      onClick={() => setMatchesPage((prev) => Math.max(1, prev - 1))}
                      disabled={matchesCurrentPage <= 1}
                    >
                      Prev
                    </ActionButton>
                    <ActionButton
                      onClick={() => setMatchesPage((prev) => Math.min(matchesTotalPages, prev + 1))}
                      disabled={matchesCurrentPage >= matchesTotalPages}
                    >
                      Next
                    </ActionButton>
                  </ActionsCell>
                </div>
              </TableWrap>
            )}
          </Card>
        )}
      </div>
    );
  }

  function renderNews() {
    const totalPages = newsPagination?.totalPages || 1;
    const currentPage = newsPagination?.page || newsPage;
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <h3>News Management</h3>
          <ActionsCell>
            <ActionButton onClick={() => handleCreate('news')}>Create Article</ActionButton>
            <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'news'] })}>
              Refresh
            </ActionButton>
          </ActionsCell>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 420px) minmax(180px, 240px)', gap: '8px', marginBottom: '12px' }}>
          <Input
            placeholder="Search by title/content/category/game"
            value={newsSearchInput}
            onChange={(e) => setNewsSearchInput(e.target.value)}
          />
          <Select value={newsStatusFilter} onChange={(e) => setNewsStatusFilter(e.target.value as any)}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
        <StatsGrid style={{ marginBottom: '16px' }}>
          <StatCard>
            <StatValue>{Number(newsSummary?.filteredTotal || newsPagination?.total || news.length)}</StatValue>
            <StatLabel>Filtered Articles</StatLabel>
          </StatCard>
        </StatsGrid>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Author</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {news.map(article => (
                <tr key={article.id}>
                  <Td>{article.title}</Td>
                  <Td>{article.author}</Td>
                  <Td>{article.status}</Td>
                  <Td>{article.createdAt}</Td>
                  <Td>
                    <ActionsCell>
                      <ActionButton onClick={() => handleEdit(article, 'news')}>Edit</ActionButton>
                      <ActionButton $variant="danger" onClick={() => handleDelete(article.id, 'news')}>Delete</ActionButton>
                    </ActionsCell>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ color: '#cccccc', fontSize: '13px' }}>
            Page {currentPage} of {totalPages} {newsPagination ? `• total ${newsPagination.total}` : ''}
          </div>
          <ActionsCell>
            <ActionButton
              onClick={() => setNewsPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              Prev
            </ActionButton>
            <ActionButton
              onClick={() => setNewsPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </ActionButton>
          </ActionsCell>
        </div>
      </div>
    );
  }

  function renderTeams() {
    const totalPages = teamsPagination?.totalPages || 1;
    const currentPage = teamsPagination?.page || teamsPage;
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <h3>Team Management</h3>
          <ActionsCell>
            <ActionButton onClick={() => handleCreate('team')}>Create Team</ActionButton>
            <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'teams'] })}>
              Refresh
            </ActionButton>
          </ActionsCell>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 420px)', gap: '8px', marginBottom: '12px' }}>
          <Input
            placeholder="Search teams by name/tag/game"
            value={teamsSearchInput}
            onChange={(e) => setTeamsSearchInput(e.target.value)}
          />
        </div>
        <StatsGrid style={{ marginBottom: '16px' }}>
          <StatCard>
            <StatValue>{Number(teamsSummary?.filteredTotal || teamsPagination?.total || teams.length)}</StatValue>
            <StatLabel>Filtered Teams</StatLabel>
          </StatCard>
        </StatsGrid>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Logo</Th>
                <Th>Name</Th>
                <Th>Tag</Th>
                <Th>Game</Th>
                <Th>Members</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team: any) => (
                <tr key={team.id}>
                  <Td>
                    {team.logo ? (
                      <TeamAvatar src={team.logo} alt={team.name} />
                    ) : (
                      <TeamAvatarFallback>
                        {(team.tag || team.name || '?').toString().slice(0, 2).toUpperCase()}
                      </TeamAvatarFallback>
                    )}
                  </Td>
                  <Td>{team.name}</Td>
                  <Td>{team.tag}</Td>
                  <Td>{team.game}</Td>
                  <Td>{team.members?.length || 0}</Td>
                  <Td>
                    <ActionsCell>
                      <ActionButton onClick={() => handleEdit(team, 'team')}>Edit</ActionButton>
                      <ActionButton $variant="danger" onClick={() => handleDelete(team.id, 'team')}>Delete</ActionButton>
                    </ActionsCell>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ color: '#cccccc', fontSize: '13px' }}>
            Page {currentPage} of {totalPages} {teamsPagination ? `• total ${teamsPagination.total}` : ''}
          </div>
          <ActionsCell>
            <ActionButton
              onClick={() => setTeamsPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              Prev
            </ActionButton>
            <ActionButton
              onClick={() => setTeamsPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </ActionButton>
          </ActionsCell>
        </div>
      </div>
    );
  }

  function renderContacts() {
    const totalPages = contactsPagination?.totalPages || 1;
    const currentPage = contactsPagination?.page || contactsPage;
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <h3>Contact Messages</h3>
          <ActionsCell>
            <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'contacts'] })}>
              Refresh
            </ActionButton>
            <ActionButton
              onClick={() => {
                setContactsPage(1);
                setContactsSearchInput('');
                setContactsSearch('');
              }}
            >
              Reset Filters
            </ActionButton>
          </ActionsCell>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 420px)', gap: '8px', marginBottom: '12px' }}>
          <Input
            placeholder="Search contacts by name/email/message"
            value={contactsSearchInput}
            onChange={(e) => setContactsSearchInput(e.target.value)}
          />
        </div>
        <StatsGrid style={{ marginBottom: '16px' }}>
          <StatCard>
            <StatValue>{Number(contactsSummary?.filteredTotal || contactsPagination?.total || contacts.length)}</StatValue>
            <StatLabel>Filtered Messages</StatLabel>
          </StatCard>
        </StatsGrid>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Message</Th>
                <Th>User ID</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((msg) => (
                <tr key={msg.id}>
                  <Td>{msg.name}</Td>
                  <Td>{msg.email}</Td>
                  <Td style={{ maxWidth: '360px', whiteSpace: 'pre-wrap' }}>{msg.message}</Td>
                  <Td>{msg.userId || '-'}</Td>
                  <Td>{msg.createdAt}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ color: '#cccccc', fontSize: '13px' }}>
            Page {currentPage} of {totalPages} {contactsPagination ? `• total ${contactsPagination.total}` : ''}
          </div>
          <ActionsCell>
            <ActionButton
              onClick={() => setContactsPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              Prev
            </ActionButton>
            <ActionButton
              onClick={() => setContactsPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </ActionButton>
          </ActionsCell>
        </div>

        {!contacts.length && (
          <div style={{ color: '#cccccc', padding: '16px 0' }}>No contact messages yet.</div>
        )}
      </div>
    );
  }

  function renderSupport() {
    const selectedConversation = supportConversations.find((row: SupportConversationRow) => row.id === selectedSupportConversationId) || null;
    const aiEnabled = Boolean(supportSettings?.aiEnabled);
    const runtimeProvider = supportAiRuntime?.provider || 'auto';
    const runtimeCircuit = supportAiRuntime?.circuit || {};
    const runtimeOpenProviders = Object.entries(runtimeCircuit)
      .filter(([, value]) => Boolean(value?.open))
      .map(([provider, value]) => `${provider} (${Number(value?.retryInMs || 0)}ms)`);
    const supportAuditRoles = Array.from(
      new Set(
        (auditLogs || [])
          .map((row) => String(row.actorRole || '').trim())
          .filter((value) => value.length > 0)
      )
    );
    const supportSettingsAuditLogs = supportAuditEvents.slice(0, 12);

    const sendReply = async () => {
      const message = supportReply.trim();
      if (!selectedSupportConversationId || !message) return;

      try {
        await api.post(`/api/support/admin/conversations/${selectedSupportConversationId}/reply`, { message });
        setSupportReply('');
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['admin', 'support-conversations'] }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'support-messages', selectedSupportConversationId] })
        ]);
        notify('success', 'Support', 'Reply sent');
      } catch (e: any) {
        notify('error', 'Support reply failed', formatApiError(e, 'Failed to send reply'));
      }
    };

    const updateStatus = async (status: 'open' | 'waiting_user' | 'waiting_admin' | 'resolved') => {
      if (!selectedSupportConversationId) return;
      try {
        await api.patch(`/api/support/admin/conversations/${selectedSupportConversationId}/status`, { status });
        await queryClient.invalidateQueries({ queryKey: ['admin', 'support-conversations'] });
        notify('success', 'Support', `Status updated to ${status}`);
      } catch (e: any) {
        notify('error', 'Status update failed', formatApiError(e, 'Failed to update support status'));
      }
    };

    const toggleAiSupport = async () => {
      try {
        await api.patch('/api/support/admin/settings', { aiEnabled: !aiEnabled });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['admin', 'support-settings'] }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'support-ai-runtime'] }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'support-audit-events'] }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'support-conversations'] })
        ]);
        notify('success', 'Support', `AI replies ${!aiEnabled ? 'enabled' : 'disabled'}`);
      } catch (e: any) {
        notify('error', 'Support settings failed', formatApiError(e, 'Failed to update support settings'));
      }
    };

    const exportSupportAuditCsv = async () => {
      try {
        const token = getAuthToken();
        if (!token) throw new Error('Admin token missing');

        const params = new URLSearchParams();
        params.set('entity', 'support_settings');
        params.set('limit', '5000');
        if (supportAuditAiFilter === 'on') params.set('aiEnabled', 'true');
        if (supportAuditAiFilter === 'off') params.set('aiEnabled', 'false');
        if (supportAuditRoleFilter !== 'all') params.set('actorRole', supportAuditRoleFilter);
        if (supportAuditDateFrom) params.set('from', `${supportAuditDateFrom}T00:00:00.000Z`);
        if (supportAuditDateTo) params.set('to', `${supportAuditDateTo}T23:59:59.999Z`);

        const response = await fetch(getFullUrl(`/api/admin/audit/export.csv?${params.toString()}`), {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(text || `Export failed (${response.status})`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `support_ai_audit_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        notify('success', 'Export complete', 'Support audit CSV downloaded');
      } catch (e: any) {
        notify('error', 'Export failed', e?.message || 'Failed to export support audit CSV');
      }
    };

    const applySupportAuditRangePreset = (preset: 'today' | '7d' | '30d' | 'all') => {
      if (preset === 'all') {
        setSupportAuditDateFrom('');
        setSupportAuditDateTo('');
        return;
      }

      const now = new Date();
      const to = now.toISOString().slice(0, 10);
      let fromDate = new Date(now);

      if (preset === 'today') {
        fromDate = new Date(now);
      } else if (preset === '7d') {
        fromDate.setDate(fromDate.getDate() - 6);
      } else {
        fromDate.setDate(fromDate.getDate() - 29);
      }

      const from = fromDate.toISOString().slice(0, 10);
      setSupportAuditDateFrom(from);
      setSupportAuditDateTo(to);
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <h3>Emergency Support Inbox</h3>
          <div style={{ fontSize: 12, color: supportStreamConnected ? '#81c784' : '#ffab91' }}>
            Stream: {supportStreamConnected ? 'LIVE' : 'OFFLINE'}
            {supportStreamData ? ` • Unread: ${supportStreamData.unreadForAdmin} • Waiting admin: ${supportStreamData.waitingAdmin}` : ''}
            {supportStreamUpdatedAt ? ` • Last: ${formatDateTime(supportStreamUpdatedAt)}` : ''}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: aiEnabled ? '#81c784' : '#ffab91' }}>
              AI replies: {aiEnabled ? 'ON' : 'OFF'}
            </span>
            <ActionButton $variant={aiEnabled ? 'danger' : 'success'} onClick={toggleAiSupport}>
              {aiEnabled ? 'Disable AI Replies' : 'Enable AI Replies'}
            </ActionButton>
            <Select value={supportStatusFilter} onChange={(e) => setSupportStatusFilter(e.target.value as any)}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="waiting_admin">Waiting Admin</option>
              <option value="waiting_user">Waiting User</option>
              <option value="resolved">Resolved</option>
            </Select>
            <ActionButton onClick={() => Promise.all([
              queryClient.invalidateQueries({ queryKey: ['admin', 'support-conversations'] }),
              queryClient.invalidateQueries({ queryKey: ['admin', 'support-ai-runtime'] }),
              queryClient.invalidateQueries({ queryKey: ['admin', 'support-settings'] })
            ])}>
              Refresh
            </ActionButton>
          </div>
        </div>

        <div style={{
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10,
          padding: '10px 12px',
          marginBottom: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
          gap: 8
        }}>
          <div style={{ color: '#bbb', fontSize: 12 }}>Provider</div>
          <div style={{ color: '#fff' }}>{runtimeProvider.toUpperCase()}</div>
          <div style={{ color: '#bbb', fontSize: 12 }}>Gemini / OpenAI</div>
          <div style={{ color: '#fff' }}>
            {supportAiRuntime?.geminiEnabled ? 'ON' : 'OFF'} / {supportAiRuntime?.openAiEnabled ? 'ON' : 'OFF'}
          </div>
          <div style={{ color: '#bbb', fontSize: 12 }}>Circuit</div>
          <div style={{ color: runtimeOpenProviders.length ? '#ffab91' : '#81c784' }}>
            {runtimeOpenProviders.length ? `OPEN: ${runtimeOpenProviders.join(', ')}` : 'CLOSED'}
          </div>
        </div>

        <div style={{
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10,
          padding: '10px 12px',
          marginBottom: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong>Support AI Events (Audit)</strong>
            <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'support-audit-events'] })}>
              Refresh Audit
            </ActionButton>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8, marginBottom: 8 }}>
            <Select value={supportAuditAiFilter} onChange={(e) => setSupportAuditAiFilter(e.target.value as any)}>
              <option value="all">AI Enabled: All</option>
              <option value="on">AI Enabled: ON</option>
              <option value="off">AI Enabled: OFF</option>
            </Select>
            <Select value={supportAuditRoleFilter} onChange={(e) => setSupportAuditRoleFilter(e.target.value)}>
              <option value="all">Role: All</option>
              {supportAuditRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </Select>
            <Input
              type="date"
              value={supportAuditDateFrom}
              onChange={(e) => setSupportAuditDateFrom(e.target.value)}
              placeholder="Date from"
            />
            <Input
              type="date"
              value={supportAuditDateTo}
              onChange={(e) => setSupportAuditDateTo(e.target.value)}
              placeholder="Date to"
            />
            <Select value={String(supportAuditLimit)} onChange={(e) => setSupportAuditLimit(Number(e.target.value) || 12)}>
              <option value="12">Rows: 12</option>
              <option value="25">Rows: 25</option>
              <option value="50">Rows: 50</option>
            </Select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <ActionButton onClick={() => applySupportAuditRangePreset('today')}>Today</ActionButton>
            <ActionButton onClick={() => applySupportAuditRangePreset('7d')}>7d</ActionButton>
            <ActionButton onClick={() => applySupportAuditRangePreset('30d')}>30d</ActionButton>
            <ActionButton onClick={() => applySupportAuditRangePreset('all')}>All time</ActionButton>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
            <div style={{ color: '#bbb', fontSize: 12 }}>
              Page {supportAuditPagination?.page || supportAuditPage} / {supportAuditPagination?.totalPages || 1}
              {supportAuditPagination ? ` • total ${supportAuditPagination.total}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <ActionButton
                onClick={() => setSupportAuditPage((prev) => Math.max(1, prev - 1))}
                disabled={(supportAuditPagination?.page || supportAuditPage) <= 1}
              >
                Prev
              </ActionButton>
              <ActionButton
                onClick={() => setSupportAuditPage((prev) => {
                  const totalPages = supportAuditPagination?.totalPages || 1;
                  return Math.min(totalPages, prev + 1);
                })}
                disabled={(supportAuditPagination?.page || supportAuditPage) >= (supportAuditPagination?.totalPages || 1)}
              >
                Next
              </ActionButton>
              <ActionButton onClick={exportSupportAuditCsv}>Export Filtered CSV</ActionButton>
            </div>
          </div>
          {!supportSettingsAuditLogs.length && <div style={{ color: '#999' }}>No support settings events yet</div>}
          {supportSettingsAuditLogs.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: '#ffb280', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>Time</th>
                    <th style={{ padding: '6px 8px' }}>Method</th>
                    <th style={{ padding: '6px 8px' }}>Status</th>
                    <th style={{ padding: '6px 8px' }}>AI Enabled</th>
                    <th style={{ padding: '6px 8px' }}>Role</th>
                    <th style={{ padding: '6px 8px' }}>Path</th>
                  </tr>
                </thead>
                <tbody>
                  {supportSettingsAuditLogs.map((row: any) => (
                    <tr key={row.id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <td style={{ padding: '6px 8px' }}>{row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}</td>
                      <td style={{ padding: '6px 8px' }}>{row.method || '-'}</td>
                      <td style={{ padding: '6px 8px' }}>{row.statusCode || '-'}</td>
                      <td style={{ padding: '6px 8px', color: row.payloadAiEnabled === true ? '#81c784' : row.payloadAiEnabled === false ? '#ffab91' : '#bbb' }}>
                        {row.payloadAiEnabled === null ? '-' : row.payloadAiEnabled ? 'ON' : 'OFF'}
                      </td>
                      <td style={{ padding: '6px 8px' }}>{row.actorRole || '-'}</td>
                      <td style={{ padding: '6px 8px', color: '#bbb' }}>{row.path || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 2fr', gap: '14px' }}>
          <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, maxHeight: 640, overflowY: 'auto' }}>
            {supportConversations.map((row: SupportConversationRow) => (
              <button
                key={row.id}
                onClick={() => setSelectedSupportConversationId(row.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background: row.id === selectedSupportConversationId ? 'rgba(255,107,0,0.18)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  padding: '10px 12px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <strong>{row.username || row.email || row.userId}</strong>
                  <span style={{ fontSize: 12, color: '#ffb280' }}>{row.status}</span>
                </div>
                <div style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>
                  {row.subject} {row.teamName ? `• Team: ${row.teamName}` : ''}
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{row.lastMessagePreview || '-'}</div>
                <div style={{ fontSize: 11, color: '#8fb3ff', marginTop: 4 }}>
                  {formatSupportTtl(row.expiresAt)} {row.expiresAt ? `• Expires: ${formatDateTime(row.expiresAt)}` : ''}
                </div>
              </button>
            ))}
            {!supportConversations.length && (
              <div style={{ color: '#ccc', padding: 12 }}>No support conversations</div>
            )}
          </div>

          <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 12, minHeight: 500, display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
            <div style={{ marginBottom: 10 }}>
              <strong>{selectedConversation ? `${selectedConversation.username || selectedConversation.email}` : 'Select conversation'}</strong>
              {selectedConversation && (
                <div style={{ fontSize: 12, color: '#8fb3ff', marginTop: 6 }}>
                  {formatSupportTtl(selectedConversation.expiresAt)} {selectedConversation.expiresAt ? `• Expires: ${formatDateTime(selectedConversation.expiresAt)}` : ''}
                </div>
              )}
              {selectedConversation && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <ActionButton onClick={() => updateStatus('open')}>Open</ActionButton>
                  <ActionButton onClick={() => updateStatus('waiting_admin')}>Waiting Admin</ActionButton>
                  <ActionButton onClick={() => updateStatus('waiting_user')}>Waiting User</ActionButton>
                  <ActionButton $variant="success" onClick={() => updateStatus('resolved')}>Resolved</ActionButton>
                </div>
              )}
            </div>

            <div style={{ overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, background: 'rgba(0,0,0,0.15)' }}>
              {!selectedSupportConversationId && <div style={{ color: '#999' }}>Choose conversation on the left</div>}
              {selectedSupportConversationId && supportMessages.map((msg: SupportMessageRow) => (
                <div key={msg.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#ffb280' }}>
                    {msg.senderType.toUpperCase()} {msg.provider ? `• ${msg.provider}` : ''} {msg.createdAt ? `• ${new Date(msg.createdAt).toLocaleString()}` : ''}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', color: '#fff' }}>{msg.content}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginTop: 10 }}>
              <TextArea
                value={supportReply}
                onChange={(e) => setSupportReply(e.target.value)}
                placeholder="Reply as admin..."
                style={{ minHeight: 80 }}
              />
              <ActionButton onClick={sendReply} disabled={!selectedSupportConversationId || !supportReply.trim()}>
                Send Reply
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderRewards() {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Rewards Management</h3>
          <ActionButton onClick={() => handleCreate('reward')}>Create Reward</ActionButton>
        </div>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Rarity</Th>
                <Th>Value</Th>
                <Th>Active</Th>
                <Th>Game</Th>
                <Th>Expires</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((reward: Reward) => (
                <tr key={reward.id}>
                  <Td>{reward.name}</Td>
                  <Td>{reward.type}</Td>
                  <Td>{reward.rarity}</Td>
                  <Td>{reward.value}</Td>
                  <Td>{reward.isActive ? 'Yes' : 'No'}</Td>
                  <Td>{reward.gameId || '\u2014'}</Td>
                  <Td>{reward.expiresAt ? formatDate(reward.expiresAt) : '\u2014'}</Td>
                  <Td>
                    <ActionsCell>
                      <ActionButton onClick={() => handleEdit(reward, 'reward')}>Edit</ActionButton>
                      <ActionButton $variant="danger" onClick={() => handleDelete(reward.id, 'reward')}>Delete</ActionButton>
                    </ActionsCell>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>

        {!rewards.length && (
          <div style={{ color: '#cccccc', padding: '16px 0' }}>No rewards yet.</div>
        )}
      </div>
    );
  }

  function renderAnalytics() {
    const growth = Array.isArray(analytics?.userGrowth) ? analytics.userGrowth : [];
    const filteredProspects = prospectsFilter === 'hidden_gem'
      ? prospects.filter((row: ProspectRow) => String(row.tag).toLowerCase() === 'hidden gem')
      : prospects;
    const severityStyle = (severity: string) => {
      if (severity === 'high') return { color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.45)', padding: '4px 8px', borderRadius: 999 };
      if (severity === 'medium') return { color: '#ffb74d', border: '1px solid rgba(255,183,77,0.45)', padding: '4px 8px', borderRadius: 999 };
      return { color: '#b0bec5', border: '1px solid rgba(176,190,197,0.35)', padding: '4px 8px', borderRadius: 999 };
    };
    const providerLabel = scoutProvider?.provider || 'unknown';
    const readinessProviders = intelligenceReadiness?.providers || {};
    const readinessIntegrations = intelligenceReadiness?.integrations || {};
    const readinessChecks = Array.isArray(intelligenceReadiness?.checks) ? intelligenceReadiness.checks : [];
    const readinessScore = Number(intelligenceReadiness?.readinessScore ?? 0);
    const readinessSupportEnabled = Boolean(readinessProviders?.support?.aiEnabled);
    const readinessTelegram = Boolean(readinessIntegrations?.telegramBotUsernameConfigured);
    const readinessCron = Boolean(readinessIntegrations?.hallOfFameCronTokenConfigured);
    const addToWatchlist = async (row: AnomalyAlertRow) => {
      try {
        await api.post('/api/scouting/watchlist', {
          userId: row.userId,
          reason: row.message
        });
        await queryClient.invalidateQueries({ queryKey: ['admin', 'scouting-watchlist'] });
        notify('success', 'Watchlist updated', `@${row.username} added to watchlist`);
      } catch (e: any) {
        notify('error', 'Watchlist update failed', formatApiError(e, 'Failed to update watchlist'));
      }
    };
    const explainScouting = async (row: AnomalyAlertRow) => {
      try {
        const res: any = await api.get(`/api/scouting/explain/${row.userId}`);
        const payload = res?.data || res;
        setScoutingExplanations((prev) => ({ ...prev, [row.userId]: payload }));
      } catch (e: any) {
        notify('error', 'Explainability failed', formatApiError(e, 'Failed to fetch AI explanation'));
      }
    };
    const refreshScouting = async () => {
      try {
        await api.post('/api/scouting/refresh', { limit: 10 });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['admin', 'scouting-prospects'] }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'scouting-provider'] }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'scouting-anomalies'] }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'scouting-watchlist'] })
        ]);
        notify('success', 'AI scouting', 'Prospects refreshed');
      } catch (e: any) {
        notify('error', 'AI scouting failed', formatApiError(e, 'Failed to refresh prospects'));
      }
    };

    const calculatePointsPreview = async () => {
      try {
        const res: any = await api.post('/api/intelligence/points/calculate', {
          playerPoints: Number(pointsInput.playerRating || 1000),
          opponentPoints: Number(pointsInput.opponentRating || 1000),
          playerRating: Number(pointsInput.playerRating || 1000),
          opponentRating: Number(pointsInput.opponentRating || 1000),
          result: Number(pointsInput.result || 0)
        });
        const row = res?.data || res;
        setPointsOutput({
          newPoints: Number(row?.newPoints ?? row?.newRating ?? 0),
          pointsDelta: Number(row?.pointsDelta ?? row?.delta ?? 0)
        });
      } catch (e: any) {
        setPointsOutput(null);
        notify('error', 'Points calculation failed', formatApiError(e, 'Failed to calculate points'));
      }
    };

    const normalizeStatsPreview = async () => {
      try {
        const res: any = await api.post('/api/intelligence/analytics/normalize', {
          kills: Number(statsInput.kills || 0),
          deaths: Number(statsInput.deaths || 0),
          assists: Number(statsInput.assists || 0),
          survivalSeconds: Number(statsInput.survivalSeconds || 0),
          utilityUses: Number(statsInput.utilityUses || 0),
          objectiveActions: Number(statsInput.objectiveActions || 0),
          clutchRoundsWon: Number(statsInput.clutchRoundsWon || 0),
          roundsPlayed: Number(statsInput.roundsPlayed || 1)
        });
        setStatsOutput(res?.data || res || null);
      } catch (e: any) {
        setStatsOutput(null);
        notify('error', 'Analytics normalize failed', formatApiError(e, 'Failed to normalize stats'));
      }
    };

    const updateHallOfFame = async () => {
      try {
        await api.post('/api/intelligence/hall-of-fame/update', {});
        await queryClient.invalidateQueries({ queryKey: ['admin', 'hall-of-fame'] });
        notify('success', 'Hall of Fame', 'Hall of Fame updated');
      } catch (e: any) {
        notify('error', 'Hall of Fame update failed', formatApiError(e, 'Failed to update hall of fame'));
      }
    };

    const copyEnvFixes = async () => {
      try {
        const lines: string[] = [];
        if (!readinessTelegram) lines.push('TELEGRAM_BOT_USERNAME=your_bot_username_without_at');
        if (!readinessCron) lines.push('HALL_OF_FAME_CRON_TOKEN=generate_long_random_token');
        if (!readinessProviders?.support?.geminiEnabled && !readinessProviders?.support?.openAiEnabled) {
          lines.push('GEMINI_API_KEY=your_key_or_set_OPENAI_API_KEY');
        }
        if (!readinessProviders?.scouting?.geminiEnabled && !readinessProviders?.scouting?.openAiEnabled) {
          lines.push('AI_SCOUT_PROVIDER=gemini');
        }
        if (!lines.length) {
          lines.push('# No missing critical env vars detected by readiness');
        }
        const text = lines.join('\n');
        await navigator.clipboard.writeText(text);
        notify('success', 'Copied', 'Env fixes copied to clipboard');
      } catch (e: any) {
        notify('error', 'Copy failed', e?.message || 'Failed to copy env fixes');
      }
    };

    const runReadinessCheck = async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ['admin', 'intelligence-readiness'] });
        notify('success', 'Readiness', 'Readiness check refreshed');
      } catch (e: any) {
        notify('error', 'Readiness check failed', e?.message || 'Failed to refresh readiness');
      }
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h3>Analytics Dashboard</h3>
          <ActionsCell>
            <ActionButton onClick={refreshScouting}>Refresh AI Insights</ActionButton>
            <ActionButton onClick={updateHallOfFame}>Update Hall of Fame</ActionButton>
            <ActionButton onClick={copyEnvFixes}>Copy Env Fixes</ActionButton>
            <ActionButton onClick={runReadinessCheck}>Run Readiness Check</ActionButton>
          </ActionsCell>
        </div>
        <StatsGrid>
          <StatCard>
            <StatValue>{analytics?.activeSubscriptions ?? 0}</StatValue>
            <StatLabel>Active Subscriptions</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{growth.reduce((acc: number, item: any) => acc + (item?.count || 0), 0)}</StatValue>
            <StatLabel>New Users (30d)</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{providerLabel}</StatValue>
            <StatLabel>
              AI: Gemini {scoutProvider?.geminiEnabled ? 'on' : 'off'} • OpenAI {scoutProvider?.openAiEnabled ? 'on' : 'off'}
            </StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: readinessSupportEnabled ? '#81c784' : '#ffab91' }}>
              {readinessSupportEnabled ? 'ON' : 'OFF'}
            </StatValue>
            <StatLabel>Support AI Runtime</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: readinessTelegram ? '#81c784' : '#ffab91' }}>
              {readinessTelegram ? 'OK' : 'MISS'}
            </StatValue>
            <StatLabel>Telegram Bot Username</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: readinessCron ? '#81c784' : '#ffab91' }}>
              {readinessCron ? 'OK' : 'MISS'}
            </StatValue>
            <StatLabel>Hall of Fame Cron Token</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: readinessScore >= 80 ? '#81c784' : readinessScore >= 50 ? '#ffb74d' : '#ff6b6b' }}>
              {readinessScore}%
            </StatValue>
            <StatLabel>Readiness Score</StatLabel>
          </StatCard>
        </StatsGrid>

        <h4 style={{ marginTop: '20px' }}>System Readiness</h4>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Component</Th>
                <Th>Status</Th>
                <Th>Details</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td>Scouting Provider</Td>
                <Td style={{ color: readinessProviders?.scouting?.provider ? '#81c784' : '#ffab91' }}>
                  {readinessProviders?.scouting?.provider ? 'ready' : 'missing'}
                </Td>
                <Td>
                  {String(readinessProviders?.scouting?.provider || 'unknown')} • Gemini {readinessProviders?.scouting?.geminiEnabled ? 'on' : 'off'} • OpenAI {readinessProviders?.scouting?.openAiEnabled ? 'on' : 'off'}
                </Td>
              </tr>
              <tr>
                <Td>Support Provider</Td>
                <Td style={{ color: readinessProviders?.support?.provider ? '#81c784' : '#ffab91' }}>
                  {readinessProviders?.support?.provider ? 'ready' : 'missing'}
                </Td>
                <Td>
                  {String(readinessProviders?.support?.provider || 'unknown')} • Gemini {readinessProviders?.support?.geminiEnabled ? 'on' : 'off'} • OpenAI {readinessProviders?.support?.openAiEnabled ? 'on' : 'off'} • Runtime {readinessProviders?.support?.aiEnabled ? 'on' : 'off'}
                </Td>
              </tr>
              <tr>
                <Td>Telegram Linking</Td>
                <Td style={{ color: readinessTelegram ? '#81c784' : '#ffab91' }}>{readinessTelegram ? 'ready' : 'missing'}</Td>
                <Td>{readinessTelegram ? 'TELEGRAM_BOT_USERNAME configured' : 'Set TELEGRAM_BOT_USERNAME in .env'}</Td>
              </tr>
              <tr>
                <Td>Hall of Fame Cron</Td>
                <Td style={{ color: readinessCron ? '#81c784' : '#ffab91' }}>{readinessCron ? 'ready' : 'missing'}</Td>
                <Td>{readinessCron ? 'HALL_OF_FAME_CRON_TOKEN configured' : 'Set HALL_OF_FAME_CRON_TOKEN in .env'}</Td>
              </tr>
              <tr>
                <Td>Realtime Rank Stream</Td>
                <Td style={{ color: intelligenceReadiness?.realtime?.rankUpdatesSse ? '#81c784' : '#ffab91' }}>
                  {intelligenceReadiness?.realtime?.rankUpdatesSse ? 'ready' : 'missing'}
                </Td>
                <Td>{intelligenceReadiness?.realtime?.rankUpdatesSse || '-'}</Td>
              </tr>
            </tbody>
          </Table>
        </TableWrap>

        <h4 style={{ marginTop: '20px' }}>Readiness Checks</h4>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Check</Th>
                <Th>Status</Th>
                <Th>Message</Th>
              </tr>
            </thead>
            <tbody>
              {readinessChecks.map((check) => (
                <tr key={check.key}>
                  <Td>{check.key}</Td>
                  <Td style={{ color: check.ok ? '#81c784' : '#ffab91' }}>{check.ok ? 'ok' : 'fail'}</Td>
                  <Td>{check.ok ? 'Ready' : check.message}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        {!readinessChecks.length && (
          <div style={{ color: '#cccccc', padding: '16px 0' }}>No readiness check data yet.</div>
        )}

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>New Users</Th>
              </tr>
            </thead>
            <tbody>
              {growth.map((row: any) => (
                <tr key={row._id}>
                  <Td>{row._id}</Td>
                  <Td>{row.count}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>

        {!growth.length && (
          <div style={{ color: '#cccccc', padding: '16px 0' }}>No analytics data yet.</div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h4 style={{ margin: 0 }}>AI Insights (Top Prospects)</h4>
          <Select value={prospectsFilter} onChange={(e) => setProspectsFilter(e.target.value as any)} style={{ minWidth: 180 }}>
            <option value="all">All prospects</option>
            <option value="hidden_gem">Hidden Gem only</option>
          </Select>
        </div>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Player</Th>
                <Th>Role</Th>
                <Th>Tag</Th>
                <Th>Score</Th>
                <Th>Impact</Th>
                <Th>Summary</Th>
              </tr>
            </thead>
            <tbody>
              {filteredProspects.map((row: ProspectRow) => (
                <tr key={row.id || `${row.userId}-${row.username}`}>
                  <Td>@{row.username}</Td>
                  <Td>{row.role}</Td>
                  <Td>{row.tag}</Td>
                  <Td>{row.score.toFixed(1)}</Td>
                  <Td>{row.impactRating.toFixed(1)}</Td>
                  <Td>{row.summary}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>

        {!filteredProspects.length && (
          <div style={{ color: '#cccccc', padding: '16px 0' }}>No AI insights yet.</div>
        )}

        <h4 style={{ marginTop: '20px' }}>AI Anomaly Alerts</h4>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Player</Th>
                <Th>Type</Th>
                <Th>Severity</Th>
                <Th>Impact</Th>
                <Th>Message</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((row: AnomalyAlertRow, idx: number) => (
                <React.Fragment key={`${row.userId}-${row.type}-${idx}`}>
                  <tr>
                    <Td>@{row.username}</Td>
                    <Td>{row.type}</Td>
                    <Td><span style={severityStyle(row.severity)}>{row.severity}</span></Td>
                    <Td>{row.impactRating.toFixed(1)}</Td>
                    <Td>{row.message}</Td>
                    <Td>
                      <ActionsCell>
                        <ActionButton onClick={() => addToWatchlist(row)}>Promote</ActionButton>
                        <ActionButton onClick={() => explainScouting(row)}>Explain</ActionButton>
                      </ActionsCell>
                    </Td>
                  </tr>
                  {scoutingExplanations[row.userId] && (
                    <tr>
                      <Td colSpan={6}>
                        <div style={{ fontSize: 13, color: '#d0d0d0', lineHeight: 1.5 }}>
                          <strong>AI Explain:</strong> {scoutingExplanations[row.userId].narrative}
                          <div style={{ marginTop: 6, opacity: 0.9 }}>
                            Drivers: {scoutingExplanations[row.userId].topDrivers
                              .map((d) => `${d.key}(${d.contribution >= 0 ? '+' : ''}${d.contribution.toFixed(1)})`)
                              .join(', ')}
                          </div>
                        </div>
                      </Td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        {!anomalies.length && (
          <div style={{ color: '#cccccc', padding: '16px 0' }}>No anomaly alerts.</div>
        )}

        <h4 style={{ marginTop: '20px' }}>Watchlist</h4>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Player</Th>
                <Th>Role</Th>
                <Th>Impact</Th>
                <Th>Reason</Th>
                <Th>Added</Th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((row: WatchlistRow, idx: number) => (
                <tr key={`${row.userId}-${idx}`}>
                  <Td>@{row.username}</Td>
                  <Td>{row.role}</Td>
                  <Td>{row.impactRating.toFixed(1)}</Td>
                  <Td>{row.reason || '-'}</Td>
                  <Td>{row.addedAt ? formatDate(row.addedAt) : '-'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        {!watchlist.length && (
          <div style={{ color: '#cccccc', padding: '16px 0' }}>Watchlist is empty.</div>
        )}

        <h4 style={{ marginTop: '20px' }}>Hall of Fame (Longest Reign)</h4>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Player</Th>
                <Th>Days at #1</Th>
                <Th>First Rank #1</Th>
                <Th>Last Rank #1</Th>
              </tr>
            </thead>
            <tbody>
              {hallOfFame.map((row: HallOfFameAdminRow, idx: number) => (
                <tr key={row.id || `${row.userId}-${idx}`}>
                  <Td>{idx + 1}</Td>
                  <Td>@{row.username}</Td>
                  <Td>{row.consecutiveDaysRank1}</Td>
                  <Td>{row.firstRank1At ? formatDate(row.firstRank1At) : '-'}</Td>
                  <Td>{row.lastRank1At ? formatDate(row.lastRank1At) : '-'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        {!hallOfFame.length && (
          <div style={{ color: '#cccccc', padding: '16px 0' }}>Hall of Fame is empty.</div>
        )}

        <h4 style={{ marginTop: '20px' }}>Manual Points Calculator</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <Input
            type="number"
            value={pointsInput.playerRating}
            onChange={(e) => setPointsInput((prev) => ({ ...prev, playerRating: Number(e.target.value) }))}
            placeholder="Player points"
          />
          <Input
            type="number"
            value={pointsInput.opponentRating}
            onChange={(e) => setPointsInput((prev) => ({ ...prev, opponentRating: Number(e.target.value) }))}
            placeholder="Opponent points"
          />
          <Select
            value={String(pointsInput.result)}
            onChange={(e) => setPointsInput((prev) => ({ ...prev, result: Number(e.target.value) }))}
          >
            <option value="1">Win</option>
            <option value="0.5">Draw</option>
            <option value="0">Loss</option>
          </Select>
          <ActionButton onClick={calculatePointsPreview}>Calculate</ActionButton>
        </div>
        {pointsOutput && (
          <div style={{ color: '#ccc', marginTop: 10 }}>
            New points: <strong>{pointsOutput.newPoints}</strong> | Delta: <strong>{pointsOutput.pointsDelta >= 0 ? '+' : ''}{pointsOutput.pointsDelta}</strong>
          </div>
        )}

        <h4 style={{ marginTop: '20px' }}>Manual Stats Normalization</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          <Input type="number" value={statsInput.kills} onChange={(e) => setStatsInput((p) => ({ ...p, kills: Number(e.target.value) }))} placeholder="Kills" />
          <Input type="number" value={statsInput.deaths} onChange={(e) => setStatsInput((p) => ({ ...p, deaths: Number(e.target.value) }))} placeholder="Deaths" />
          <Input type="number" value={statsInput.assists} onChange={(e) => setStatsInput((p) => ({ ...p, assists: Number(e.target.value) }))} placeholder="Assists" />
          <Input type="number" value={statsInput.survivalSeconds} onChange={(e) => setStatsInput((p) => ({ ...p, survivalSeconds: Number(e.target.value) }))} placeholder="Survival sec" />
          <Input type="number" value={statsInput.utilityUses} onChange={(e) => setStatsInput((p) => ({ ...p, utilityUses: Number(e.target.value) }))} placeholder="Utility uses" />
          <Input type="number" value={statsInput.objectiveActions} onChange={(e) => setStatsInput((p) => ({ ...p, objectiveActions: Number(e.target.value) }))} placeholder="Objective actions" />
          <Input type="number" value={statsInput.clutchRoundsWon} onChange={(e) => setStatsInput((p) => ({ ...p, clutchRoundsWon: Number(e.target.value) }))} placeholder="Clutch rounds won" />
          <Input type="number" value={statsInput.roundsPlayed} onChange={(e) => setStatsInput((p) => ({ ...p, roundsPlayed: Number(e.target.value) }))} placeholder="Rounds played" />
          <ActionButton onClick={normalizeStatsPreview}>Normalize</ActionButton>
        </div>
        {statsOutput && (
          <div style={{ color: '#ccc', marginTop: 10, lineHeight: 1.6 }}>
            Impact: <strong>{Number(statsOutput.impactRating || 0).toFixed(1)}</strong> | Aiming:{' '}
            <strong>{Number(statsOutput.skills?.aiming || 0).toFixed(1)}</strong> | Positioning:{' '}
            <strong>{Number(statsOutput.skills?.positioning || 0).toFixed(1)}</strong> | Utility:{' '}
            <strong>{Number(statsOutput.skills?.utility || 0).toFixed(1)}</strong> | Clutch:{' '}
            <strong>{Number(statsOutput.skills?.clutchFactor || 0).toFixed(1)}</strong> | Teamplay:{' '}
            <strong>{Number(statsOutput.skills?.teamplay || 0).toFixed(1)}</strong>
          </div>
        )}
      </div>
    );
  }

  function renderOps() {
    const liveMetrics = opsStreamData?.metrics || null;
    const liveQueue = opsStreamData?.queue || null;
    const effectiveMetrics = liveMetrics || opsMetrics;
    const effectiveQueue = liveQueue || opsQueue;
    const queueCounts = effectiveQueue?.counts || {};
    const streamTimestamp = opsStreamData?.timestamp ? formatDate(opsStreamData.timestamp) : '-';

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <h3>Operations</h3>
          <ActionsCell>
            <ActionButton onClick={refreshOps}>Refresh</ActionButton>
            <ActionButton onClick={handleExportAuditCsv}>Export Audit CSV</ActionButton>
            <ActionButton $variant="success" onClick={handleRunBackup}>Run Backup</ActionButton>
          </ActionsCell>
        </div>

        <StatsGrid>
          <StatCard>
            <StatValue>{effectiveMetrics?.status || 'n/a'}</StatValue>
            <StatLabel>API Status</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{effectiveMetrics?.requests?.total || 0}</StatValue>
            <StatLabel>Total Requests</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{effectiveMetrics?.requests?.errorRate ?? 0}%</StatValue>
            <StatLabel>Error Rate</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{effectiveMetrics?.eventLoop?.p95Ms ?? 0}ms</StatValue>
            <StatLabel>Event Loop p95</StatLabel>
          </StatCard>
        </StatsGrid>
        <div style={{ color: '#cccccc', marginBottom: '12px' }}>
          Stream: {opsStreamConnected ? 'live' : 'polling fallback'} • Last update: {streamTimestamp}
        </div>

        <h4 style={{ marginTop: '16px' }}>Audit Timeline</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <Select
            value={String(opsTimelineHours)}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value === 24 || value === 48 || value === 168) {
                setOpsTimelineHours(value);
              }
            }}
            style={{ minWidth: '100px' }}
          >
            <option value="24">24h</option>
            <option value="48">48h</option>
            <option value="168">7d</option>
          </Select>
          <Select
            value={String(opsTimelineBucketMinutes)}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value === 15 || value === 60) {
                setOpsTimelineBucketMinutes(value);
              }
            }}
            style={{ minWidth: '120px' }}
          >
            <option value="60">1h buckets</option>
            <option value="15">15m buckets</option>
          </Select>
        </div>
        <div style={{ color: '#cccccc', marginBottom: '10px', fontSize: '13px' }}>
          Total: {Number(opsAuditTimeline?.totals?.total || 0)} | Success: {Number(opsAuditTimeline?.totals?.success || 0)} | 4xx: {Number(opsAuditTimeline?.totals?.clientError || 0)} | 5xx: {Number(opsAuditTimeline?.totals?.serverError || 0)}
        </div>
        <div style={{ display: 'grid', gap: 6, marginBottom: '16px' }}>
          {(opsAuditTimeline?.points || []).slice(-20).map((point) => {
            const max = Math.max(...(opsAuditTimeline?.points || []).map((p) => Number(p.total || 0)), 1);
            const totalWidth = Math.round((Number(point.total || 0) / max) * 100);
            const errorCount = Number(point.clientError || 0) + Number(point.serverError || 0);
            const errorWidth = Math.round((errorCount / max) * 100);
            return (
              <div key={point.ts} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', gap: 8, alignItems: 'center' }}>
                <span style={{ color: '#bdbdbd', fontSize: 11 }}>{formatDate(point.ts)}</span>
                <div style={{ height: 8, borderRadius: 6, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ height: '100%', width: `${totalWidth}%`, background: 'rgba(102, 187, 106, 0.7)' }} />
                  <div style={{ height: '100%', width: `${errorWidth}%`, background: 'rgba(239, 83, 80, 0.9)', position: 'absolute', right: 0, top: 0 }} />
                </div>
                <span style={{ color: '#bdbdbd', fontSize: 11, textAlign: 'right' }}>{point.total}</span>
              </div>
            );
          })}
          {!opsAuditTimeline?.points?.length ? (
            <div style={{ color: '#cccccc', padding: '8px 0' }}>No timeline data yet.</div>
          ) : null}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: '16px' }}>
          <h4 style={{ margin: 0 }}>Top Error Endpoints</h4>
          <ActionButton onClick={handleExportTopErrorsCsv}>Export Top Errors CSV</ActionButton>
        </div>
        {opsTopErrors[0] ? (
          <div style={{ color: '#ffb4a8', margin: '8px 0 10px', fontSize: 13 }}>
            Hot endpoint: <strong>{opsTopErrors[0].method} {opsTopErrors[0].path}</strong> ({opsTopErrors[0].statusCode}) • {opsTopErrors[0].count} errors
          </div>
        ) : null}
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Count</Th>
                <Th>Status</Th>
                <Th>Method</Th>
                <Th>Path</Th>
                <Th>Last Seen</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {opsTopErrors.map((row, index) => (
                <tr
                  key={`${row.method}-${row.path}-${row.statusCode}-${index}`}
                  style={{
                    background: selectedTopError &&
                      selectedTopError.method === row.method &&
                      selectedTopError.path === row.path &&
                      selectedTopError.statusCode === row.statusCode
                      ? 'rgba(255,107,0,0.08)'
                      : 'transparent'
                  }}
                >
                  <Td>{row.count}</Td>
                  <Td>{row.statusCode}</Td>
                  <Td>{row.method}</Td>
                  <Td>{row.path}</Td>
                  <Td>{row.lastSeenAt ? formatDate(row.lastSeenAt) : '-'}</Td>
                  <Td>
                    <ActionButton onClick={() => setSelectedTopError(row)}>
                      Inspect
                    </ActionButton>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        {!opsTopErrors.length && (
          <div style={{ color: '#cccccc', padding: '8px 0 12px' }}>No 4xx/5xx endpoints for selected window.</div>
        )}

        {selectedTopError ? (
          <div style={{ marginTop: '14px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ color: '#ffb4a8', fontSize: 13 }}>
                Error samples: <strong>{selectedTopError.method} {selectedTopError.path}</strong> ({selectedTopError.statusCode})
              </div>
              <ActionButton onClick={() => setSelectedTopError(null)}>Clear</ActionButton>
            </div>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Time</Th>
                    <Th>Role</Th>
                    <Th>Entity</Th>
                    <Th>IP</Th>
                    <Th>Details</Th>
                  </tr>
                </thead>
                <tbody>
                  {opsErrorSamples.map((row) => (
                    <tr key={row.id}>
                      <Td>{row.createdAt ? formatDate(row.createdAt) : '-'}</Td>
                      <Td>{row.actorRole || '-'}</Td>
                      <Td>{row.entity}{row.entityId ? `:${row.entityId}` : ''}</Td>
                      <Td>{row.ip || '-'}</Td>
                      <Td style={{ fontSize: 11, color: '#cfcfcf' }}>
                        {row.payload ? JSON.stringify(row.payload).slice(0, 180) : '-'}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
            {!opsErrorSamples.length ? (
              <div style={{ color: '#cccccc', padding: '8px 0 0' }}>No sample rows found.</div>
            ) : null}
          </div>
        ) : null}

        <h4 style={{ marginTop: '16px' }}>Queue</h4>
        <div style={{ color: '#cccccc', marginBottom: '12px' }}>
          {effectiveQueue?.enabled
            ? `Queue "${effectiveQueue?.queue || 'tasks'}" is enabled`
            : `Queue disabled (${effectiveQueue?.reason || 'unknown'})`}
        </div>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>State</Th>
                <Th>Count</Th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(queueCounts).map(([key, value]) => (
                <tr key={key}>
                  <Td>{key}</Td>
                  <Td>{value}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>

        <h4 style={{ marginTop: '24px' }}>Backups</h4>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Snapshot</Th>
                <Th>Collections</Th>
                <Th>Updated</Th>
              </tr>
            </thead>
            <tbody>
              {opsBackups.map((backup) => (
                <tr key={backup.id}>
                  <Td>{backup.id}</Td>
                  <Td>{backup.collections}</Td>
                  <Td>{formatDate(backup.updatedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        {!opsBackups.length && (
          <div style={{ color: '#cccccc', padding: '12px 0' }}>No backups yet.</div>
        )}

        <h4 style={{ marginTop: '24px' }}>Recent Audit Logs</h4>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>Action</Th>
                <Th>Entity</Th>
                <Th>Status</Th>
                <Th>Path</Th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 30).map((log: any) => (
                <tr key={log.id}>
                  <Td>{formatDate(log.createdAt)}</Td>
                  <Td>{log.action}</Td>
                  <Td>{log.entity}{log.entityId ? `:${log.entityId}` : ''}</Td>
                  <Td>{log.statusCode}</Td>
                  <Td>{log.method} {log.path}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>

        <h4 style={{ marginTop: '24px' }}>Recent Auth Logs</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <Select
            value={authLogFilters.event}
            onChange={(e) => setAuthLogFilters((prev) => ({ ...prev, event: e.target.value }))}
            style={{ minWidth: '130px' }}
          >
            <option value="">All Events</option>
            <option value="login">Login</option>
            <option value="register">Register</option>
            <option value="logout">Logout</option>
          </Select>
          <Select
            value={authLogFilters.method}
            onChange={(e) => setAuthLogFilters((prev) => ({ ...prev, method: e.target.value }))}
            style={{ minWidth: '160px' }}
          >
            <option value="">All Methods</option>
            <option value="telegram_id">telegram_id</option>
            <option value="telegram_webapp">telegram_webapp</option>
            <option value="email_password">email_password</option>
            <option value="email_otp">email_otp</option>
            <option value="google">google</option>
            <option value="apple">apple</option>
          </Select>
          <Select
            value={authLogFilters.status}
            onChange={(e) => setAuthLogFilters((prev) => ({ ...prev, status: e.target.value }))}
            style={{ minWidth: '130px' }}
          >
            <option value="">All Statuses</option>
            <option value="success">success</option>
            <option value="failed">failed</option>
          </Select>
          <Input
            value={authLogFilters.search}
            onChange={(e) => setAuthLogFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Search identifier/reason/ip"
            style={{ minWidth: '220px', flex: '1 1 220px' }}
          />
          <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'auth-logs'] })}>
            Refresh Logs
          </ActionButton>
          <ActionButton onClick={handleExportAuthCsv}>
            Export Auth CSV
          </ActionButton>
        </div>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>User</Th>
                <Th>Event</Th>
                <Th>Method</Th>
                <Th>Status</Th>
                <Th>Identifier</Th>
                <Th>Reason</Th>
                <Th>IP</Th>
              </tr>
            </thead>
            <tbody>
              {authLogs.slice(0, 40).map((log: AdminAuthLog) => (
                <tr key={log.id}>
                  <Td>{formatDate(log.createdAt)}</Td>
                  <Td>
                    {log.username || 'unknown'}
                    {log.telegramId ? ` (${log.telegramId})` : ''}
                  </Td>
                  <Td>{log.event}</Td>
                  <Td>{log.method}</Td>
                  <Td>{log.status}</Td>
                  <Td>{log.identifier || '-'}</Td>
                  <Td>{log.reason || '-'}</Td>
                  <Td>{log.ip || '-'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        {!authLogs.length && (
          <div style={{ color: '#cccccc', padding: '12px 0' }}>No auth logs yet.</div>
        )}
      </div>
    );
  }

  function renderSystem() {
    const readinessProviders = intelligenceReadiness?.providers || {};
    const readinessIntegrations = intelligenceReadiness?.integrations || {};
    const readinessInfra = intelligenceReadiness?.infrastructure || {};
    const readinessRealtime = intelligenceReadiness?.realtime || {};
    const readinessChecks = Array.isArray(intelligenceReadiness?.checks) ? intelligenceReadiness.checks : [];
    const readinessScore = Number(intelligenceReadiness?.readinessScore ?? 0);
    const smokeChecks = Array.isArray(readinessSmoke?.checks) ? readinessSmoke.checks : [];
    const systemSmokeRows = Array.isArray(systemSmokeAuditEvents) ? systemSmokeAuditEvents : [];
    const outboxRows = Array.isArray(botOutboxRows) ? botOutboxRows : [];

    const runSmokeTest = async () => {
      try {
        const result: any = await api.post('/api/intelligence/readiness/smoke', {});
        setReadinessSmoke((result?.data || result || null) as ReadinessSmoke);
        await queryClient.invalidateQueries({ queryKey: ['admin', 'system-smoke-audit-events'] });
        notify('success', 'Smoke test', 'System smoke test completed');
      } catch (e: any) {
        notify('error', 'Smoke test failed', formatApiError(e, 'Failed to run smoke test'));
      }
    };

    const retryOutboxItem = async (id: string) => {
      try {
        await api.post(`/api/admin/bot/outbox/${id}/retry`, {});
        await queryClient.invalidateQueries({ queryKey: ['admin', 'bot-outbox'] });
        notify('success', 'Outbox', 'Message queued for resend');
      } catch (e: any) {
        notify('error', 'Outbox retry failed', formatApiError(e, 'Failed to retry outbox item'));
      }
    };

    const retryFailedOutbox = async () => {
      try {
        await api.post('/api/admin/bot/outbox/retry-failed', {});
        await queryClient.invalidateQueries({ queryKey: ['admin', 'bot-outbox'] });
        notify('success', 'Outbox', 'Failed messages re-queued');
      } catch (e: any) {
        notify('error', 'Outbox retry failed', formatApiError(e, 'Failed to re-queue failed outbox messages'));
      }
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <h3>System Readiness</h3>
          <ActionsCell>
            <ActionButton onClick={async () => {
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['admin', 'intelligence-readiness'] }),
                queryClient.invalidateQueries({ queryKey: ['admin', 'system-smoke-audit-events'] })
              ]);
            }}>
              Refresh Readiness
            </ActionButton>
            <ActionButton onClick={runSmokeTest}>Run Smoke Test</ActionButton>
          </ActionsCell>
        </div>

        <StatsGrid>
          <StatCard>
            <StatValue style={{ color: readinessScore >= 80 ? '#81c784' : readinessScore >= 50 ? '#ffb74d' : '#ff6b6b' }}>
              {readinessScore}%
            </StatValue>
            <StatLabel>Readiness Score</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: readinessIntegrations?.telegramBotUsernameConfigured ? '#81c784' : '#ffab91' }}>
              {readinessIntegrations?.telegramBotUsernameConfigured ? 'OK' : 'MISS'}
            </StatValue>
            <StatLabel>Telegram Bot Username</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: readinessIntegrations?.telegramBotTokenConfigured ? '#81c784' : '#ffab91' }}>
              {readinessIntegrations?.telegramBotTokenConfigured ? 'OK' : 'MISS'}
            </StatValue>
            <StatLabel>Telegram Bot Token</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: readinessIntegrations?.botWebhookEnabled ? '#ffb74d' : '#81c784' }}>
              {readinessIntegrations?.botWebhookEnabled ? 'WEBHOOK' : 'POLLING'}
            </StatValue>
            <StatLabel>Bot Delivery Mode</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue
              style={{
                color: readinessIntegrations?.botWebhookEnabled
                  ? (readinessIntegrations?.botWebhookPublicUrlConfigured && readinessIntegrations?.botWebhookPathConfigured
                    ? '#81c784'
                    : '#ffab91')
                  : '#81c784'
              }}
            >
              {readinessIntegrations?.botWebhookEnabled
                ? (readinessIntegrations?.botWebhookPublicUrlConfigured && readinessIntegrations?.botWebhookPathConfigured ? 'OK' : 'MISS')
                : 'N/A'}
            </StatValue>
            <StatLabel>Webhook Routing</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: readinessIntegrations?.hallOfFameCronTokenConfigured ? '#81c784' : '#ffab91' }}>
              {readinessIntegrations?.hallOfFameCronTokenConfigured ? 'OK' : 'MISS'}
            </StatValue>
            <StatLabel>Hall Of Fame Cron Token</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: readinessProviders?.support?.aiEnabled ? '#81c784' : '#ffab91' }}>
              {readinessProviders?.support?.aiEnabled ? 'ON' : 'OFF'}
            </StatValue>
            <StatLabel>Support AI Runtime</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: readinessInfra?.mongoConnected ? '#81c784' : '#ffab91' }}>
              {readinessInfra?.mongoConnected ? 'OK' : 'MISS'}
            </StatValue>
            <StatLabel>Mongo Connection</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue style={{ color: readinessInfra?.redisConnected ? '#81c784' : '#ffab91' }}>
              {readinessInfra?.redisConnected ? 'OK' : 'MISS'}
            </StatValue>
            <StatLabel>Redis Connection</StatLabel>
          </StatCard>
        </StatsGrid>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Component</Th>
                <Th>Status</Th>
                <Th>Details</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td>Scouting Provider</Td>
                <Td style={{ color: readinessProviders?.scouting?.provider ? '#81c784' : '#ffab91' }}>
                  {readinessProviders?.scouting?.provider ? 'ready' : 'missing'}
                </Td>
                <Td>
                  {String(readinessProviders?.scouting?.provider || 'unknown')} • Gemini {readinessProviders?.scouting?.geminiEnabled ? 'on' : 'off'} • OpenAI {readinessProviders?.scouting?.openAiEnabled ? 'on' : 'off'}
                </Td>
              </tr>
              <tr>
                <Td>Support Provider</Td>
                <Td style={{ color: readinessProviders?.support?.provider ? '#81c784' : '#ffab91' }}>
                  {readinessProviders?.support?.provider ? 'ready' : 'missing'}
                </Td>
                <Td>
                  {String(readinessProviders?.support?.provider || 'unknown')} • Gemini {readinessProviders?.support?.geminiEnabled ? 'on' : 'off'} • OpenAI {readinessProviders?.support?.openAiEnabled ? 'on' : 'off'}
                </Td>
              </tr>
              <tr>
                <Td>Telegram Bot Webhook</Td>
                <Td style={{ color: readinessIntegrations?.botWebhookEnabled ? '#ffb74d' : '#81c784' }}>
                  {readinessIntegrations?.botWebhookEnabled ? 'webhook' : 'polling'}
                </Td>
                <Td>
                  URL {readinessIntegrations?.botWebhookPublicUrlConfigured ? 'ok' : 'missing'} • Path {readinessIntegrations?.botWebhookPathConfigured ? 'ok' : 'missing'} • Secret {readinessIntegrations?.botWebhookSecretConfigured ? 'set' : 'missing'}
                </Td>
              </tr>
              <tr>
                <Td>Rank SSE</Td>
                <Td style={{ color: readinessRealtime?.rankUpdatesSse ? '#81c784' : '#ffab91' }}>
                  {readinessRealtime?.rankUpdatesSse ? 'ready' : 'missing'}
                </Td>
                <Td>{readinessRealtime?.rankUpdatesSse || '-'}</Td>
              </tr>
              <tr>
                <Td>Ops SSE</Td>
                <Td style={{ color: readinessRealtime?.opsSse ? '#81c784' : '#ffab91' }}>
                  {readinessRealtime?.opsSse ? 'ready' : 'missing'}
                </Td>
                <Td>{readinessRealtime?.opsSse || '-'}</Td>
              </tr>
            </tbody>
          </Table>
        </TableWrap>

        <h4 style={{ marginTop: '24px' }}>Checks</h4>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Key</Th>
                <Th>Status</Th>
                <Th>Message</Th>
              </tr>
            </thead>
            <tbody>
              {readinessChecks.map((check) => (
                <tr key={check.key}>
                  <Td>{check.key}</Td>
                  <Td style={{ color: check.ok ? '#81c784' : '#ffab91' }}>{check.ok ? 'ok' : 'fail'}</Td>
                  <Td>{check.ok ? 'Ready' : check.message}</Td>
                </tr>
              ))}
            </tbody>
          </Table>

        </TableWrap>

        <h4 style={{ marginTop: '24px' }}>Last Smoke Run</h4>
        {!readinessSmoke && (
          <div style={{ color: '#cccccc', padding: '12px 0' }}>Run smoke test to validate DB/cache and collections.</div>
        )}
        {readinessSmoke && (
          <>
            <div style={{ color: '#cccccc', marginBottom: 10 }}>
              Executed: {readinessSmoke.timestamp ? formatDate(readinessSmoke.timestamp) : '-'} ? Duration: {readinessSmoke.durationMs ?? 0}ms
            </div>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Check</Th>
                    <Th>Status</Th>
                    <Th>Message</Th>
                  </tr>
                </thead>
                <tbody>
                  {smokeChecks.map((check) => (
                    <tr key={check.key}>
                      <Td>{check.key}</Td>
                      <Td style={{ color: check.ok ? '#81c784' : '#ffab91' }}>{check.ok ? 'ok' : 'fail'}</Td>
                      <Td>{check.message}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </>
        )}

        <h4 style={{ marginTop: '24px' }}>Smoke History</h4>
        {!systemSmokeRows.length && (
          <div style={{ color: '#cccccc', padding: '12px 0' }}>No smoke history yet.</div>
        )}
        {systemSmokeRows.length > 0 && (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Time</Th>
                  <Th>Actor</Th>
                  <Th>Duration</Th>
                  <Th>Mongo</Th>
                  <Th>Redis</Th>
                  <Th>Users</Th>
                  <Th>Teams</Th>
                  <Th>Tournaments</Th>
                </tr>
              </thead>
              <tbody>
                {systemSmokeRows.map((row) => (
                  <tr key={row.id}>
                    <Td>{formatDate(row.createdAt)}</Td>
                    <Td>
                      {row.actorRole}
                      {row.actorTelegramId ? ` (${row.actorTelegramId})` : ''}
                    </Td>
                    <Td>{row.durationMs}ms</Td>
                    <Td style={{ color: row.mongoOk ? '#81c784' : '#ffab91' }}>{row.mongoOk ? 'ok' : 'fail'}</Td>
                    <Td style={{ color: row.redisOk ? '#81c784' : '#ffab91' }}>{row.redisOk ? 'ok' : 'fail'}</Td>
                    <Td>{row.usersCount}</Td>
                    <Td>{row.teamsCount}</Td>
                    <Td>{row.tournamentsCount}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}

        <h4 style={{ marginTop: '24px' }}>Bot Outbox</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <Input
            value={botOutboxSearchInput}
            onChange={(e) => setBotOutboxSearchInput(e.target.value)}
            placeholder="Search title/event/telegram id"
          />
          <Select value={botOutboxStatusFilter} onChange={(e) => setBotOutboxStatusFilter(e.target.value as any)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </Select>
          <ActionButton onClick={retryFailedOutbox}>Retry Failed</ActionButton>
          <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'bot-outbox'] })}>Refresh</ActionButton>
        </div>
        {!outboxRows.length && (
          <div style={{ color: '#cccccc', padding: '12px 0' }}>No bot outbox messages.</div>
        )}
        {outboxRows.length > 0 && (
          <>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Time</Th>
                    <Th>Event</Th>
                    <Th>Status</Th>
                    <Th>Telegram</Th>
                    <Th>Attempts</Th>
                    <Th>Title</Th>
                    <Th>Error</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {outboxRows.map((row: BotOutboxRow) => (
                    <tr key={row.id}>
                      <Td>{formatDate(row.createdAt || row.sendAt || '')}</Td>
                      <Td>{row.eventType}</Td>
                      <Td style={{ color: row.status === 'sent' ? '#81c784' : row.status === 'failed' ? '#ffab91' : '#ffb74d' }}>{row.status}</Td>
                      <Td>{row.telegramId || '-'}</Td>
                      <Td>{row.attempts}</Td>
                      <Td>{row.title}</Td>
                      <Td>{row.lastError || '-'}</Td>
                      <Td>
                        <ActionsCell>
                          <ActionButton onClick={() => retryOutboxItem(row.id)}>Retry</ActionButton>
                        </ActionsCell>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
            {botOutboxPagination && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <ActionButton onClick={() => setBotOutboxPage((p) => Math.max(1, p - 1))} disabled={!botOutboxPagination.hasPrev}>
                  Prev
                </ActionButton>
                <span style={{ color: '#cccccc' }}>
                  Page {botOutboxPagination.page} / {botOutboxPagination.totalPages}
                </span>
                <ActionButton onClick={() => setBotOutboxPage((p) => Math.min(botOutboxPagination.totalPages, p + 1))} disabled={!botOutboxPagination.hasNext}>
                  Next
                </ActionButton>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  function renderModal() {
    if (!isModalOpen) return null;

    function renderForm() {
      switch (modalType) {
        case 'user':
          return (
            <Form>
              <Input
                placeholder="Username"
                value={modalData.username || ''}
                onChange={(e) => setField('username', e.target.value)}
              />
              <Input
                placeholder="First Name"
                value={modalData.firstName || ''}
                onChange={(e) => setField('firstName', e.target.value)}
              />
              <Input
                placeholder="Last Name"
                value={modalData.lastName || ''}
                onChange={(e) => setField('lastName', e.target.value)}
              />
              <Input
                placeholder="Email"
                type="email"
                value={modalData.email || ''}
                onChange={(e) => setField('email', e.target.value)}
              />
              <Select
                value={modalData.role || 'user'}
                onChange={(e) => setField('role', e.target.value)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Select>
              <Select
                value={modalData.isBanned ? 'banned' : 'active'}
                onChange={(e) => setField('isBanned', e.target.value === 'banned')}
              >
                <option value="active">Active</option>
                <option value="banned">Banned</option>
              </Select>
              <div style={{ padding: '12px', background: 'rgba(255, 107, 0, 0.05)', border: '1px solid rgba(255, 107, 0, 0.2)', borderRadius: '8px' }}>
                <label style={{ color: '#ff6b00', fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>WALLET & SUBSCRIPTION</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: '#ccc', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Balance ($)</label>
                    <Input
                      placeholder="Balance"
                      type="number"
                      style={{ width: '100%' }}
                      value={modalData.balance ?? 0}
                      onChange={(e) => setField('balance', Number(e.target.value))}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: '#ccc', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Free Entries</label>
                    <Input
                      placeholder="Free Entries"
                      type="number"
                      style={{ width: '100%' }}
                      value={modalData.freeEntriesCount ?? 0}
                      onChange={(e) => setField('freeEntriesCount', Number(e.target.value))}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: '#ccc', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Bonus Entries</label>
                    <Input
                      placeholder="Bonus Entries"
                      type="number"
                      style={{ width: '100%' }}
                      value={modalData.bonusEntries ?? 0}
                      onChange={(e) => setField('bonusEntries', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                  <label style={{ color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      style={{ width: '18px', height: '18px' }}
                      checked={!!modalData.isSubscribed}
                      onChange={(e) => setField('isSubscribed', e.target.checked)}
                    />
                    Active Subscription
                  </label>
                  {modalData.isSubscribed && (
                    <div style={{ marginTop: '10px' }}>
                      <label style={{ color: '#ccc', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Expires At</label>
                      <Input
                        type="datetime-local"
                        style={{ width: '100%' }}
                        value={formatDateForInput(modalData.subscriptionExpiresAt)}
                        onChange={(e) => setField('subscriptionExpiresAt', e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#ccc', fontSize: '12px' }}>Role</label>
                  <Select
                    value={modalData.role || 'user'}
                    onChange={(e) => setField('role', e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="developer">Developer</option>
                  </Select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#ccc', fontSize: '12px' }}>Wallet Balance</label>
                  <Input
                    type="number"
                    value={modalData.balance ?? 0}
                    onChange={(e) => setField('balance', Number(e.target.value))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#ccc', fontSize: '12px' }}>Free Entries</label>
                  <Input
                    type="number"
                    value={modalData.freeEntriesCount ?? 0}
                    onChange={(e) => setField('freeEntriesCount', Number(e.target.value))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#ccc', fontSize: '12px' }}>Bonus Entries</label>
                  <Input
                    type="number"
                    value={modalData.bonusEntries ?? 0}
                    onChange={(e) => setField('bonusEntries', Number(e.target.value))}
                  />
                </div>
              </div>
              <TextArea
                placeholder="Bio"
                value={modalData.bio || ''}
                onChange={(e) => setField('bio', e.target.value)}
              />
            </Form>
          );
        case 'tournament':
          return (
            <Form>
              <Input
                placeholder="Tournament Name"
                value={modalData.name || ''}
                onChange={(e) => setField('name', e.target.value)}
              />
              <Select
                value={modalData.game || 'CS2'}
                onChange={(e) => setField('game', e.target.value)}
              >
                <option value="CS2">CS2</option>
                <option value="Valorant Mobile">Valorant Mobile</option>
                <option value="Dota 2">Dota 2</option>
                <option value="Standoff 2">Standoff 2</option>
                <option value="Critical Ops">Critical Ops</option>
                <option value="PUBG Mobile">PUBG Mobile</option>
              </Select>
              <Input
                placeholder="Prize Pool"
                type="number"
                value={modalData.prizePool ?? 0}
                onChange={(e) => setField('prizePool', Number(e.target.value))}
              />
              <Input
                placeholder="Max Teams"
                type="number"
                value={modalData.maxTeams ?? 16}
                onChange={(e) => setField('maxTeams', Number(e.target.value))}
              />
              <Select
                value={String(modalData.teamSize || '')}
                onChange={(e) => setField('teamSize', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Team Mode (optional)</option>
                <option value="2">2v2</option>
                <option value="5">5v5</option>
              </Select>
              <Select
                value={modalData.status || 'upcoming'}
                onChange={(e) => setField('status', e.target.value)}
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </Select>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#ccc', fontSize: '12px' }}>Start Date</label>
                  <Input
                    type="datetime-local"
                    value={formatDateForInput(modalData.startDate)}
                    onChange={(e) => setField('startDate', e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#ccc', fontSize: '12px' }}>End Date</label>
                  <Input
                    type="datetime-local"
                    value={formatDateForInput(modalData.endDate)}
                    onChange={(e) => setField('endDate', e.target.value)}
                  />
                </div>
              </div>
              <Select
                value={modalData.format || 'single_elimination'}
                onChange={(e) => setField('format', e.target.value)}
              >
                <option value="single_elimination">Single Elimination</option>
                <option value="double_elimination">Double Elimination</option>
                <option value="round_robin">Round Robin</option>
                <option value="swiss">Swiss</option>
              </Select>
              <Select
                value={modalData.type || 'team'}
                onChange={(e) => setField('type', e.target.value)}
              >
                <option value="team">Team</option>
                <option value="solo">Solo</option>
              </Select>
              <TextArea
                placeholder="Description"
                value={modalData.description || ''}
                onChange={(e) => setField('description', e.target.value)}
              />
              <TextArea
                placeholder="Rules"
                value={modalData.rules || ''}
                onChange={(e) => setField('rules', e.target.value)}
              />
              <div style={{ marginTop: '10px' }}>
                <label style={{ color: '#ccc', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Tournament Image</label>
                {modalData.image && (
                  <img
                    src={modalData.image}
                    alt="Tournament Preview"
                    style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
                  />
                )}
                <input
                  type="file"
                  ref={tournamentImageRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'image')}
                />
                <ActionButton
                  type="button"
                  onClick={() => tournamentImageRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : modalData.image ? 'Change Image' : 'Upload Image'}
                </ActionButton>
              </div>
            </Form>
          );
        case 'news':
          return (
            <Form>
              <Input
                placeholder="Title"
                value={modalData.title || ''}
                onChange={(e) => setField('title', e.target.value)}
              />
              <TextArea
                placeholder="Content"
                value={modalData.content || ''}
                onChange={(e) => setField('content', e.target.value)}
              />
              <Select
                value={modalData.status || 'draft'}
                onChange={(e) => setField('status', e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>
              <div style={{ marginTop: '10px' }}>
                <label style={{ color: '#ccc', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Cover Image</label>
                {modalData.coverImage && (
                  <img
                    src={modalData.coverImage}
                    alt="Cover Preview"
                    style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
                  />
                )}
                <input
                  type="file"
                  ref={newsImageRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <ActionButton
                  type="button"
                  onClick={() => newsImageRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : modalData.coverImage ? 'Change Image' : 'Upload Cover Image'}
                </ActionButton>
              </div>
            </Form>
          );
        case 'achievement':
          return (
            <Form>
              <Input
                placeholder="Key"
                value={modalData.key || ''}
                onChange={(e) => setField('key', e.target.value)}
              />
              <Input
                placeholder="Name"
                value={modalData.name || ''}
                onChange={(e) => setField('name', e.target.value)}
              />
              <Input
                placeholder="Icon"
                value={modalData.icon || ''}
                onChange={(e) => setField('icon', e.target.value)}
              />
              <TextArea
                placeholder="Description"
                value={modalData.description || ''}
                onChange={(e) => setField('description', e.target.value)}
              />
              <Select
                value={(modalData.isActive ? 'true' : 'false')}
                onChange={(e) => setField('isActive', e.target.value === 'true')}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
              <Select
                value={modalData.criteriaType || 'wins_gte'}
                onChange={(e) => setField('criteriaType', e.target.value)}
              >
                <option value="wins_gte">wins_gte</option>
                <option value="matches_played_gte">matches_played_gte</option>
                <option value="tournaments_played_gte">tournaments_played_gte</option>
              </Select>
              <Input
                placeholder="Criteria Value"
                type="number"
                value={modalData.criteriaValue ?? 1}
                onChange={(e) => setField('criteriaValue', e.target.value)}
              />
            </Form>
          );
        case 'team':
          return (
            <Form>
              <Input
                placeholder="Team Name"
                value={modalData.name || ''}
                onChange={(e) => setField('name', e.target.value)}
              />
              <Input
                placeholder="Team Tag"
                value={modalData.tag || ''}
                onChange={(e) => setField('tag', e.target.value)}
              />
              <Select
                value={modalData.game || 'CS2'}
                onChange={(e) => setField('game', e.target.value)}
              >
                <option value="CS2">CS2</option>
                <option value="Dota 2">Dota 2</option>
                <option value="Standoff 2">Standoff 2</option>
                <option value="Valorant Mobile">Valorant Mobile</option>
                <option value="Critical Ops">Critical Ops</option>
                <option value="PUBG Mobile">PUBG Mobile</option>
              </Select>
              <div style={{ marginTop: '10px' }}>
                <label style={{ color: '#ccc', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Team Logo</label>
                {modalData.logo && (
                  <img
                    src={modalData.logo}
                    alt="Logo Preview"
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', marginBottom: '10px' }}
                  />
                )}
                <input
                  type="file"
                  ref={teamImageRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'logo')}
                />
                <ActionButton
                  type="button"
                  onClick={() => teamImageRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : modalData.logo ? 'Change Logo' : 'Upload Logo'}
                </ActionButton>
              </div>
              <Select
                value={modalData.status || 'active'}
                onChange={(e) => setField('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="disbanded">Disbanded</option>
              </Select>
            </Form >
          );
        case 'reward':
          return (
            <Form>
              <Input
                placeholder="Reward Name"
                value={modalData.name || ''}
                onChange={(e) => setField('name', e.target.value)}
              />
              <TextArea
                placeholder="Description"
                value={modalData.description || ''}
                onChange={(e) => setField('description', e.target.value)}
              />
              <Select
                value={modalData.type || 'currency'}
                onChange={(e) => setField('type', e.target.value)}
              >
                <option value="currency">Currency</option>
                <option value="badge">Badge</option>
                <option value="item">Item</option>
                <option value="achievement">Achievement</option>
              </Select>
              <Select
                value={modalData.rarity || 'common'}
                onChange={(e) => setField('rarity', e.target.value)}
              >
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </Select>
              <Input
                placeholder="Value"
                type="number"
                value={modalData.value ?? 0}
                onChange={(e) => setField('value', Number(e.target.value))}
              />
              <Input
                placeholder="Icon URL"
                value={modalData.icon || ''}
                onChange={(e) => setField('icon', e.target.value)}
              />
              <Input
                placeholder="Game ID (optional)"
                value={modalData.gameId || ''}
                onChange={(e) => setField('gameId', e.target.value)}
              />
              <Select
                value={(modalData.isActive ? 'true' : 'false')}
                onChange={(e) => setField('isActive', e.target.value === 'true')}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Input
                  placeholder="Requirement Type"
                  value={modalData.requirementsType || ''}
                  onChange={(e) => setField('requirementsType', e.target.value)}
                />
                <Input
                  placeholder="Requirement Value"
                  type="number"
                  value={modalData.requirementsValue ?? 0}
                  onChange={(e) => setField('requirementsValue', Number(e.target.value))}
                />
              </div>
              <div>
                <label style={{ color: '#ccc', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                  Expires At
                </label>
                <Input
                  type="datetime-local"
                  value={formatDateForInput(modalData.expiresAt)}
                  onChange={(e) => setField('expiresAt', e.target.value)}
                />
              </div>
            </Form>
          );
        default:
          return null;
      }
    }

    return (
      <Modal $isOpen={isModalOpen} onClick={() => setIsModalOpen(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <CloseButton onClick={() => setIsModalOpen(false)} aria-label="Close">
            {'\u2715'}
          </CloseButton>
          <h3>{editingItem ? 'Edit' : 'Create'} {modalType}</h3>
          {renderForm()}
          <ModalActions>
            <ActionButton onClick={() => setIsModalOpen(false)}>Cancel</ActionButton>
            <ActionButton $variant="success" onClick={handleSave}>Save</ActionButton>
          </ModalActions>
        </ModalContent>
      </Modal>
    );
  }

  function renderContent() {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
      case 'tournaments':
        return renderTournaments();
      case 'news':
        return renderNews();
      case 'achievements':
        return renderAchievements();
      case 'rewards':
        return renderRewards();
      case 'analytics':
        return renderAnalytics();
      case 'referrals':
        return renderReferrals();
      case 'teams':
        return renderTeams();
      case 'support':
        return renderSupport();
      case 'contacts':
        return renderContacts();
      case 'payments':
        return renderPayments();
      case 'ops':
        return renderOps();
      case 'system':
        return renderSystem();
      default:
        return renderDashboard();
    }
  }

  if (!authLoading && isAuthenticated && !hasAdminAccess) {
    return <Navigate to="/control-access" replace />;
  }

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title>Control Center</Title>
            <p style={{ color: '#cccccc', margin: '8px 0 0 0' }}>
              Manage users, tournaments, news, payments and operations
            </p>
          </div>
          <ActionButton onClick={() => load()}>
            {isBusy ? '...' : 'Refresh'}
          </ActionButton>
        </div>
      </Header>

      {effectiveError && (
        <div style={{ marginBottom: '16px', color: '#ff4757', padding: '12px', background: 'rgba(255, 71, 87, 0.1)', border: '1px solid #ff4757', borderRadius: '8px' }}>
          {effectiveError}
        </div>
      )}


      {isBusy && (
        <div style={{ marginBottom: '16px', color: '#cccccc' }}>
          Loading...
        </div>
      )}

      <TabContainer>
        <Tab $active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>
          Dashboard
        </Tab>
        <Tab $active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
          Users
        </Tab>
        <Tab $active={activeTab === 'tournaments'} onClick={() => setActiveTab('tournaments')}>
          Tournaments
          {globalPendingTournamentRequests > 0 ? (
            <span style={{
              marginLeft: 8,
              background: 'rgba(255, 107, 0, 0.2)',
              border: '1px solid rgba(255, 107, 0, 0.55)',
              color: '#ffb280',
              borderRadius: 999,
              padding: '1px 7px',
              fontSize: 11,
              fontWeight: 700
            }}>
              {globalPendingTournamentRequests}
            </span>
          ) : null}
        </Tab>
        <Tab $active={activeTab === 'news'} onClick={() => setActiveTab('news')}>
          News
        </Tab>
        <Tab $active={activeTab === 'achievements'} onClick={() => setActiveTab('achievements')}>
          Achievements
        </Tab>
        <Tab $active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')}>
          Rewards
        </Tab>
        <Tab $active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
          Analytics
        </Tab>
        <Tab $active={activeTab === 'referrals'} onClick={() => setActiveTab('referrals')}>
          Referrals
        </Tab>
        <Tab $active={activeTab === 'teams'} onClick={() => setActiveTab('teams')}>
          Teams
        </Tab>
        <Tab $active={activeTab === 'support'} onClick={() => setActiveTab('support')}>
          Support
          {Number(supportStreamData?.unreadForAdmin || 0) > 0 ? (
            <span style={{
              marginLeft: 8,
              background: 'rgba(255, 107, 0, 0.2)',
              border: '1px solid rgba(255, 107, 0, 0.55)',
              color: '#ffb280',
              borderRadius: 999,
              padding: '1px 7px',
              fontSize: 11,
              fontWeight: 700
            }}>
              {Number(supportStreamData?.unreadForAdmin || 0)}
            </span>
          ) : null}
        </Tab>
        <Tab $active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')}>
          Contacts
        </Tab>
        <Tab $active={activeTab === 'payments'} onClick={() => setActiveTab('payments')}>
          Payments
        </Tab>
        <Tab $active={activeTab === 'ops'} onClick={() => setActiveTab('ops')}>
          Ops
        </Tab>
        <Tab $active={activeTab === 'system'} onClick={() => setActiveTab('system')}>
          System
        </Tab>
      </TabContainer>

      <ContentArea>
        {hasAdminAccess ? renderContent() : null}
      </ContentArea>

      {renderModal()}
    </Container>
  );
};

export default AdminPage; 





