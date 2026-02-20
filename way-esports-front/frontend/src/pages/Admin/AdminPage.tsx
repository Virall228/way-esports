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
  | 'contacts'
  | 'payments'
  | 'ops';

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

interface WatchlistRow {
  userId: string;
  username: string;
  role: string;
  impactRating: number;
  reason: string;
  addedAt?: string;
}

interface AdminUserRow {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
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

interface AdminTournamentOverview {
  tournament: {
    id: string;
    name: string;
    game: string;
    status: string;
    maxTeams: number;
    participants: number;
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
  const [opsStreamData, setOpsStreamData] = useState<OpsStreamPayload | null>(null);
  const [opsStreamConnected, setOpsStreamConnected] = useState(false);
  const [authLogFilters, setAuthLogFilters] = useState({
    event: '',
    method: '',
    status: '',
    search: ''
  });
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending_withdrawals'>('all');
  const [prospectsFilter, setProspectsFilter] = useState<'all' | 'hidden_gem'>('all');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
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
        queryClient.invalidateQueries({ queryKey: ['admin', 'news'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'achievements'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'rewards'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'teams'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'referrals'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'referral-settings'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'contacts'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'wallet-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'scouting-provider'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'scouting-prospects'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'scouting-anomalies'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'scouting-watchlist'] }),
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

  const fetchUsers = async (): Promise<{ items: AdminUserRow[]; pagination: PaginationMeta | null }> => {
    const params = new URLSearchParams();
    params.set('page', String(usersPage));
    params.set('limit', '25');
    if (usersSearch) params.set('search', usersSearch);

    const result: any = await api.get(`/api/admin/users?${params.toString()}`);
    const items: any[] = (result && (result.data || result.users || result)) || [];
    const pagination: PaginationMeta | null = result?.pagination || null;

    return {
      items: items.map((u: any) => ({
        id: (u._id || u.id || '').toString(),
        username: u.username || '',
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: u.email || '',
        avatarUrl: resolveMediaUrl(u.profileLogo || u.photoUrl || u.avatar || ''),
        role: u.role || 'user',
        isBanned: !!u.isBanned,
        isSubscribed: !!u.isSubscribed,
        subscriptionExpiresAt: u.subscriptionExpiresAt,
        freeEntriesCount: Number(u.freeEntriesCount || 0),
        bonusEntries: Number(u.bonusEntries || 0),
        balance: Number(u.wallet?.balance || 0),
        createdAt: formatDate(u.createdAt)
      })),
      pagination
    };
  };

  const fetchTeams = async () => {
    try {
      const result: any = await api.get('/api/teams');
      const items = result?.data || [];
      return items.map((t: any) => ({
        id: t.id,
        name: t.name,
        tag: t.tag,
        logo: resolveMediaUrl(t.logo || ''),
        game: t.game,
        captain: t.captain,
        members: t.members,
        stats: t.stats
      }));
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

  const fetchContacts = async (): Promise<ContactMessage[]> => {
    try {
      const result: any = await api.get('/api/admin/contacts');
      const items: any[] = Array.isArray(result) ? result : (result?.data || []);
      return items.map((m: any) => ({
        id: (m._id || m.id || '').toString(),
        name: m.name || '',
        email: m.email || '',
        message: m.message || '',
        userId: m.userId?._id?.toString() || m.userId?.toString() || '',
        createdAt: formatDate(m.createdAt)
      }));
    } catch (e) {
      console.error('Failed to fetch contact messages:', e);
      throw e;
    }
  };

  const fetchTournaments = async () => {
    const result: any = await api.get('/api/tournaments');
    const items: any[] = (result && (result.data || result.tournaments)) || [];
    return items.map((t: any) => ({
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
    }));
  };

  const fetchTournamentRequests = async (): Promise<AdminTournamentRequestRow[]> => {
    if (!selectedTournamentId) return [];
    const result: any = await api.get(`/api/tournaments/${selectedTournamentId}/requests?status=pending`);
    const items: any[] = (result && result.data) || [];
    return items.map((item: any) => ({
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
  };

  const fetchTournamentOverview = async (): Promise<AdminTournamentOverview | null> => {
    if (!selectedTournamentId) return null;
    const result: any = await api.get(`/api/tournaments/${selectedTournamentId}/admin-overview`);
    return (result?.data || result || null) as AdminTournamentOverview | null;
  };

  const fetchNews = async () => {
    const result: any = await api.get('/api/news/admin?status=all');
    const items: any[] = (result && result.data) || [];
    return items.map((n: any) => ({
      id: (n._id || n.id || '').toString(),
      title: n.title || '',
      content: n.content || '',
      author: n.author?.username || n.author || '',
      status: n.status || 'draft',
      createdAt: formatDate(n.createdAt)
    }));
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

  const fetchWalletTransactions = async (): Promise<AdminWalletTransaction[]> => {
    const result: any = await api.get('/api/admin/wallet/transactions?limit=300');
    const items: any[] = Array.isArray(result) ? result : (result?.data || []);
    return items.map((tx: any) => ({
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
      method: row?.method || ''
    }));
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

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', usersPage, usersSearch],
    queryFn: fetchUsers,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const tournamentsQuery = useQuery({
    queryKey: ['admin', 'tournaments'],
    queryFn: fetchTournaments,
    enabled: hasAdminAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const tournamentRequestsQuery = useQuery({
    queryKey: ['admin', 'tournament-requests', selectedTournamentId],
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

  const newsQuery = useQuery({
    queryKey: ['admin', 'news'],
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
    queryKey: ['admin', 'teams'],
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
    queryKey: ['admin', 'contacts'],
    queryFn: fetchContacts,
    enabled: hasAdminAccess,
    staleTime: 30000,
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

  const walletTransactionsQuery = useQuery({
    queryKey: ['admin', 'wallet-transactions'],
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

  const users = usersQuery.data?.items || [];
  const usersPagination = usersQuery.data?.pagination || null;
  const tournaments = tournamentsQuery.data || [];
  const tournamentRequests = tournamentRequestsQuery.data || [];
  const tournamentOverview = tournamentOverviewQuery.data || null;
  const news = newsQuery.data || [];
  const achievements = achievementsQuery.data || [];
  const rewards = rewardsQuery.data || [];
  const teams = teamsQuery.data || [];
  const referrals = referralsQuery.data || [];
  const referralSettings = referralSettingsQuery.data || null;
  const contacts = contactsQuery.data || [];
  const walletTransactions = walletTransactionsQuery.data || [];
  const auditLogs = auditLogsQuery.data || [];
  const authLogs = authLogsQuery.data || [];
  const opsMetrics = opsMetricsQuery.data || null;
  const opsQueue = opsQueueQuery.data || null;
  const opsBackups = opsBackupsQuery.data || [];
  const dashboardStats = statsQuery.data || null;
  const analytics = analyticsQuery.data || null;
  const scoutProvider = scoutProviderQuery.data || null;
  const prospects = prospectsQuery.data || [];
  const anomalies = anomaliesQuery.data || [];
  const watchlist = watchlistQuery.data || [];

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

  const queryError =
    usersQuery.error ||
    tournamentsQuery.error ||
    tournamentRequestsQuery.error ||
    tournamentOverviewQuery.error ||
    newsQuery.error ||
    achievementsQuery.error ||
    rewardsQuery.error ||
    teamsQuery.error ||
    referralsQuery.error ||
    referralSettingsQuery.error ||
    contactsQuery.error ||
    walletTransactionsQuery.error ||
    auditLogsQuery.error ||
    authLogsQuery.error ||
    opsMetricsQuery.error ||
    opsQueueQuery.error ||
    opsBackupsQuery.error ||
    statsQuery.error ||
    analyticsQuery.error;

  const isQueryLoading =
    usersQuery.isFetching ||
    tournamentsQuery.isFetching ||
    tournamentRequestsQuery.isFetching ||
    tournamentOverviewQuery.isFetching ||
    newsQuery.isFetching ||
    achievementsQuery.isFetching ||
    rewardsQuery.isFetching ||
    teamsQuery.isFetching ||
    referralsQuery.isFetching ||
    referralSettingsQuery.isFetching ||
    contactsQuery.isFetching ||
    walletTransactionsQuery.isFetching ||
    auditLogsQuery.isFetching ||
    authLogsQuery.isFetching ||
    opsMetricsQuery.isFetching ||
    opsQueueQuery.isFetching ||
    opsBackupsQuery.isFetching ||
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
    try {
      setError(null);
      await api.post(`/api/tournaments/${tournamentId}/requests/${teamId}/approve`, {});
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
    try {
      setError(null);
      await api.post(`/api/tournaments/${tournamentId}/requests/${teamId}/reject`, {});
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-requests', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] })
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

      await invalidateTournamentMatchViews(selectedTournamentId);
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

  const handlePrepareTournamentRooms = async (force = false) => {
    if (!selectedTournamentId) return;
    try {
      setError(null);
      const result: any = await api.post('/api/matches/rooms/prepare', {
        tournamentId: selectedTournamentId,
        statuses: ['scheduled', 'live'],
        force,
        onlyMissing: !force
      });
      const payload = result?.data || result || {};
      const created = Number(payload.created || 0);
      const unchanged = Number(payload.unchanged || 0);
      const failedCount = Array.isArray(payload.failed) ? payload.failed.length : 0;

      await invalidateTournamentMatchViews(selectedTournamentId);
      notify(
        'success',
        force ? 'Rooms regenerated' : 'Rooms prepared',
        `Created: ${created}, unchanged: ${unchanged}, failed: ${failedCount}`
      );
    } catch (e: any) {
      const message = formatApiError(e, 'Failed to prepare tournament rooms');
      setError(message);
      notify('error', 'Room preparation failed', message);
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'auth-logs'] })
    ]);
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
            </ActionsCell>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 420px)', gap: '8px' }}>
            <Input
              placeholder="Search users by username/email/name"
              value={usersSearchInput}
              onChange={(e) => setUsersSearchInput(e.target.value)}
            />
          </div>
        </div>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Avatar</Th>
                <Th>Username</Th>
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
    const filtered = paymentFilter === 'pending_withdrawals'
      ? walletTransactions.filter((tx) => tx.type === 'withdrawal' && tx.status === 'pending')
      : walletTransactions;

    const sorted = [...filtered].sort((a, b) => {
      const left = new Date(a.date).getTime();
      const right = new Date(b.date).getTime();
      return right - left;
    });

    return (
      <div>
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
          </ActionsCell>
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
              {sorted.map((tx) => {
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
    const preparedRoomsCount = Array.isArray(overview?.matches)
      ? overview.matches.filter((match: any) => Boolean(match?.hasRoomCredentials)).length
      : 0;

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <h3>Tournament Management</h3>
          <ActionsCell>
            <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] })}>
              Refresh
            </ActionButton>
            <ActionButton onClick={() => handleCreate('tournament')}>Create Tournament</ActionButton>
          </ActionsCell>
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
                  <Td>{tournament.participants}/{tournament.maxTeams || '—'}</Td>
                  <Td>{tournament.pendingRequestsCount || 0}</Td>
                  <Td>${tournament.prizePool}</Td>
                  <Td>
                    <ActionsCell>
                      <ActionButton
                        $variant="success"
                        onClick={() => setSelectedTournamentId(tournament.id)}
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
                <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-requests', selectedTournamentId] })}>
                  Refresh Requests
                </ActionButton>
                <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'tournament-overview', selectedTournamentId] })}>
                  Refresh Overview
                </ActionButton>
                <ActionButton onClick={() => handlePrepareTournamentRooms(false)}>
                  Prepare Missing Rooms
                </ActionButton>
                <ActionButton onClick={() => handlePrepareTournamentRooms(true)}>
                  Regenerate Rooms
                </ActionButton>
              </ActionsCell>
            </div>

            <div style={{ marginBottom: '16px', color: '#cccccc', fontSize: '14px' }}>
              Approved teams: <strong>{overview?.teams?.length || 0}</strong>
              {' | '}
              Pending requests: <strong>{tournamentRequests.length}</strong>
              {' • '}
              Matches: <strong>{overview?.matches?.length || 0}</strong>
              {' • '}
              Rooms prepared: <strong>{preparedRoomsCount}</strong>
            </div>

            <h5 style={{ marginTop: 0 }}>Pending Tournament Requests</h5>
            {!tournamentRequests.length ? (
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
                    {tournamentRequests.map((request: AdminTournamentRequestRow) => (
                      <tr key={request.id}>
                        <Td>{request.teamName} {request.teamTag ? `(${request.teamTag})` : ''}</Td>
                        <Td>{request.membersCount}</Td>
                        <Td>{request.stats?.wins || 0}W / {request.stats?.losses || 0}L ({Number(request.stats?.winRate || 0).toFixed(1)}%)</Td>
                        <Td>{request.requestedBy?.username || request.requestedBy?.firstName || 'Unknown'}</Td>
                        <Td>{request.requestedAt ? new Date(request.requestedAt).toLocaleString() : '—'}</Td>
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
                          </ActionsCell>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}

            <h5>Approved Teams and Stats</h5>
            {!overview?.teams?.length ? (
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
                    </tr>
                  </thead>
                  <tbody>
                    {overview.teams.map((team: any) => (
                      <tr key={team.id}>
                        <Td>{team.name} {team.tag ? `(${team.tag})` : ''}</Td>
                        <Td>{team.membersCount}</Td>
                        <Td>{team.stats?.totalMatches || 0}</Td>
                        <Td>{team.stats?.wins || 0}</Td>
                        <Td>{team.stats?.losses || 0}</Td>
                        <Td>{Number(team.stats?.winRate || 0).toFixed(1)}%</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}

            <h5>Matches and Results</h5>
            {!overview?.matches?.length ? (
              <div style={{ color: '#999' }}>No matches generated yet</div>
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
                      <Th>Room</Th>
                      <Th>Access Window</Th>
                      <Th>Winner</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.matches.map((match: any) => (
                      <tr key={match.id}>
                        <Td>{match.round || 'Round'}</Td>
                        <Td>{match.team1?.name || 'TBD'}</Td>
                        <Td>{match.team2?.name || 'TBD'}</Td>
                        <Td>{Number(match.score?.team1 || 0)} : {Number(match.score?.team2 || 0)}</Td>
                        <Td>{match.status || 'scheduled'}</Td>
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
                              : '—'}
                        </Td>
                        <Td>
                          <ActionsCell>
                            <ActionButton onClick={() => handlePrepareSingleMatchRoom(match.id, false)}>
                              Prepare Room
                            </ActionButton>
                            <ActionButton onClick={() => handlePrepareSingleMatchRoom(match.id, true)}>
                              Regenerate
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
                          </ActionsCell>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </Card>
        )}
      </div>
    );
  }

  function renderNews() {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <h3>News Management</h3>
          <ActionButton onClick={() => handleCreate('news')}>Create Article</ActionButton>
        </div>

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
      </div>
    );
  }

  function renderTeams() {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <h3>Team Management</h3>
          <ActionButton onClick={() => handleCreate('team')}>Create Team</ActionButton>
        </div>

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
      </div>
    );
  }

  function renderContacts() {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <h3>Contact Messages</h3>
          <ActionButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'contacts'] })}>
            Refresh
          </ActionButton>
        </div>

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

        {!contacts.length && (
          <div style={{ color: '#cccccc', padding: '16px 0' }}>No contact messages yet.</div>
        )}
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

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h3>Analytics Dashboard</h3>
          <ActionButton onClick={refreshScouting}>Refresh AI Insights</ActionButton>
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
              AI: Gemini {scoutProvider?.geminiEnabled ? 'on' : 'off'} · OpenAI {scoutProvider?.openAiEnabled ? 'on' : 'off'}
            </StatLabel>
          </StatCard>
        </StatsGrid>

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
                <tr key={`${row.userId}-${row.type}-${idx}`}>
                  <Td>@{row.username}</Td>
                  <Td>{row.type}</Td>
                  <Td><span style={severityStyle(row.severity)}>{row.severity}</span></Td>
                  <Td>{row.impactRating.toFixed(1)}</Td>
                  <Td>{row.message}</Td>
                  <Td>
                    <ActionButton onClick={() => addToWatchlist(row)}>Promote</ActionButton>
                  </Td>
                </tr>
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
                <option value="Valorant">Valorant</option>
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
                <option value="Valorant">Valorant</option>
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
      case 'contacts':
        return renderContacts();
      case 'payments':
        return renderPayments();
      case 'ops':
        return renderOps();
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
        <Tab $active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')}>
          Contacts
        </Tab>
        <Tab $active={activeTab === 'payments'} onClick={() => setActiveTab('payments')}>
          Payments
        </Tab>
        <Tab $active={activeTab === 'ops'} onClick={() => setActiveTab('ops')}>
          Ops
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
