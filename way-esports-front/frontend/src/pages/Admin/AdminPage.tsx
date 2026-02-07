import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api, ApiError } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Container = styled.div`
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;

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

const Header = styled.div`
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

const Tab = styled.button<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active ? 'linear-gradient(135deg, #ff6b00, #ff8533)' : 'rgba(42, 42, 42, 0.8)'};
  color: ${({ $active }) => $active ? '#000000' : '#ffffff'};
  border: 1px solid ${({ $active }) => $active ? '#ff6b00' : 'rgba(255, 107, 0, 0.3)'};
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  min-height: 44px;
  white-space: nowrap;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${({ $active }) =>
    $active ? 'linear-gradient(135deg, #ff8533, #ff9f66)' : 'rgba(255, 107, 0, 0.1)'};
      transform: translateY(-2px);
    }
  }
`;

const ContentArea = styled.div`
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

const StatCard = styled.div`
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

const ActionsCell = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' | 'success' }>`
  background: ${({ $variant }) =>
    $variant === 'danger' ? 'linear-gradient(135deg, #ff4757, #ff6b7a)' :
      $variant === 'success' ? 'linear-gradient(135deg, #2ed573, #3ddb7f)' :
        'linear-gradient(135deg, #ff6b00, #ff8533)'};
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    min-height: 40px;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
    }
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

interface Team {
  id: string;
  name: string;
  tag: string;
  logo?: string;
  game: string;
  captain?: any;
  members: any[];
  stats: any;
}

type TabType = 'dashboard' | 'users' | 'tournaments' | 'news' | 'achievements' | 'rewards' | 'analytics' | 'referrals' | 'teams';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName?: string;
  email: string;
  role: string;
  isBanned: boolean;
  isSubscribed: boolean;
  subscriptionExpiresAt?: string;
  freeEntriesCount: number;
  balance: number;
  createdAt: string;
}

interface ReferralLog {
  id: string;
  referrer: string;
  referred: string;
  reward: number;
  date: string;
  status: string;
}

interface Tournament {
  id: string;
  name: string;
  game: string;
  status: string;
  participants: number;
  prizePool: number;
}

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  author: string;
  status: string;
  createdAt: string;
}

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  criteriaType: string;
  criteriaValue: number;
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
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [referrals, setReferrals] = useState<ReferralLog[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'user' | 'tournament' | 'news' | 'reward' | 'achievement' | 'team'>('user');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const newsImageRef = useRef<HTMLInputElement>(null);
  const tournamentImageRef = useRef<HTMLInputElement>(null);
  const teamImageRef = useRef<HTMLInputElement>(null);
  const userImageRef = useRef<HTMLInputElement>(null);

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

  const setField = (key: string, value: any) => {
    setModalData((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const load = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchUsers(),
        fetchTournaments(),
        fetchNews(),
        fetchAchievements(),
        fetchTeams(),
        fetchReferrals(),
        fetchDashboardStats(),
        fetchAnalytics()
      ]);
    } catch (e: any) {
      setError(formatApiError(e, 'Failed to load admin data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isAuthenticated, activeTab]);

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
  const fetchDashboardStats = async () => {
    try {
      const result = await api.get('/api/admin/stats');
      setDashboardStats(result.data);
    } catch (e) {
      console.error('Failed to fetch dashboard stats:', e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const result = await api.get('/api/admin/analytics');
      setAnalytics(result.data);
    } catch (e) {
      console.error('Failed to fetch analytics:', e);
    }
  };

  const fetchUsers = async () => {
    const result: any[] = await api.get('/api/auth/users');
    setUsers(
      (result || []).map((u: any) => ({
        id: (u._id || u.id || '').toString(),
        username: u.username || '',
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: u.email || '',
        role: u.role || 'user',
        isBanned: !!u.isBanned,
        isSubscribed: !!u.isSubscribed,
        subscriptionExpiresAt: u.subscriptionExpiresAt,
        freeEntriesCount: Number(u.freeEntriesCount || 0),
        balance: Number(u.wallet?.balance || 0),
        createdAt: formatDate(u.createdAt)
      }))
    );
  };

  const fetchTeams = async () => {
    try {
      const result: any = await api.get('/api/teams');
      setTeams((result?.data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        tag: t.tag,
        logo: t.logo,
        game: t.game,
        captain: t.captain,
        members: t.members,
        stats: t.stats
      })));
    } catch (e) {
      console.error('Failed to fetch teams:', e);
    }
  };

  const fetchReferrals = async () => {
    try {
      const result: any = await api.get('/api/referrals/all');
      setReferrals(
        (result || []).map((r: any) => ({
          id: (r._id || r.id || '').toString(),
          referrer: r.referrer?.username || r.referrer?.toString() || 'Unknown',
          referred: r.referred?.username || r.referred?.toString() || 'Unknown',
          reward: r.rewardAmount || 0,
          date: formatDate(r.createdAt),
          status: r.status || 'completed'
        }))
      );
    } catch (e) {
      console.error('Failed to fetch referrals:', e);
    }
  };

  const fetchTournaments = async () => {
    const result: any = await api.get('/api/tournaments');
    const items: any[] = (result && (result.data || result.tournaments)) || [];
    setTournaments(
      items.map((t: any) => ({
        id: (t.id || t._id || '').toString(),
        name: t.name || t.title || '',
        game: t.game || '',
        status: t.status || 'upcoming',
        participants: Number(t.participants ?? t.currentParticipants ?? 0),
        prizePool: Number(t.prizePool ?? 0)
      }))
    );
  };

  const fetchNews = async () => {
    const result: any = await api.get('/api/news/admin?status=all');
    const items: any[] = (result && result.data) || [];
    setNews(
      items.map((n: any) => ({
        id: (n._id || n.id || '').toString(),
        title: n.title || '',
        content: n.content || '',
        author: n.author?.username || n.author || '',
        status: n.status || 'draft',
        createdAt: formatDate(n.createdAt)
      }))
    );
  };

  const fetchAchievements = async () => {
    const result: any = await api.get('/api/achievements/admin');
    const items: any[] = (result && result.data) || [];
    setAchievements(
      items.map((a: any) => ({
        id: (a._id || a.id || '').toString(),
        key: a.key || '',
        name: a.name || '',
        description: a.description || '',
        icon: a.icon || '',
        isActive: !!a.isActive,
        criteriaType: a.criteria?.type || '',
        criteriaValue: Number(a.criteria?.value || 0)
      }))
    );
  };

  const buildInitialModalData = (type: string, item: any | null) => {
    if (type === 'tournament') {
      const now = new Date();
      const start = item?.startDate ? new Date(item.startDate) : now;
      const end = item?.endDate ? new Date(item.endDate) : new Date(now.getTime() + 2 * 60 * 60 * 1000);
      return {
        name: item?.name || '',
        game: item?.game || 'CS2',
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
        if (type === 'tournament') await fetchTournaments();
        if (type === 'news') await fetchNews();
        if (type === 'achievement') await fetchAchievements();
        if (type === 'user') await fetchUsers();
        if (type === 'team') await load(); // Full refresh for teams/others

        toast.success(`${type} deleted successfully`);
      } catch (e: any) {
        setError(formatApiError(e, 'Delete failed'));
        toast.error('Delete failed');
      }
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
        await fetchTournaments();
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
        await fetchNews();
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
        await fetchAchievements();
        setIsModalOpen(false);
        return;
      }

      if (modalType === 'user') {
        const payload: any = {
          username: modalData.username,
          firstName: modalData.firstName,
          lastName: modalData.lastName,
          role: modalData.role,
          bio: modalData.bio,
          balance: Number(modalData.balance || 0),
          freeEntriesCount: Number(modalData.freeEntriesCount || 0),
          isBanned: !!modalData.isBanned
        };
        if (editingItem?.id) {
          await api.patch(`/api/admin/users/${editingItem.id}`, payload);
          await fetchUsers();
          setIsModalOpen(false);
          toast.success('User updated successfully');
          return;
        }
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
        setIsModalOpen(false);
        toast.success(`Team ${editingItem ? 'updated' : 'created'} successfully`);
        return;
      }

      setIsModalOpen(false);
    } catch (e: any) {
      setError(formatApiError(e, 'Save failed'));
      toast.error('Save failed');
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
          <p>• Dashboard operational</p>
          <p>• Data synced with MongoDB Atlas</p>
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
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <h3>User Management</h3>
          <ActionButton onClick={() => handleCreate('user')}>Add User</ActionButton>
        </div>

        <TableWrap>
          <Table>
            <thead>
              <tr>
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
                  <Td>{user.username}</Td>
                  <Td>{user.role}</Td>
                  <Td>{user.isSubscribed ? '✅ Active' : '❌ None'} {user.freeEntriesCount > 0 ? `(${user.freeEntriesCount} free)` : ''}</Td>
                  <Td>${user.balance}</Td>
                  <Td>{user.isBanned ? '🚫 Banned' : '🟢 Active'}</Td>
                  <Td>
                    <ActionsCell>
                      <ActionButton onClick={() => handleEdit(user, 'user')}>Edit</ActionButton>
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

  function renderReferrals() {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Referral Logs</h3>
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
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <h3>Tournament Management</h3>
          <ActionButton onClick={() => handleCreate('tournament')}>Create Tournament</ActionButton>
        </div>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Game</Th>
                <Th>Status</Th>
                <Th>Participants</Th>
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
                  <Td>{tournament.participants}</Td>
                  <Td>${tournament.prizePool}</Td>
                  <Td>
                    <ActionsCell>
                      <ActionButton onClick={() => handleEdit(tournament, 'tournament')}>Edit</ActionButton>
                      <ActionButton $variant="danger" onClick={() => handleDelete(tournament.id, 'tournament')}>Delete</ActionButton>
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
                <Th>Name</Th>
                <Th>Tag</Th>
                <Th>Game</Th>
                <Th>Members</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team.id}>
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

  function renderRewards() {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Rewards Management</h3>
          <ActionButton onClick={() => handleCreate('reward')}>Create Reward</ActionButton>
        </div>

        <div style={{ color: '#cccccc', textAlign: 'center', padding: '40px' }}>
          <h4>Rewards System</h4>
          <p>Manage player rewards, achievements, and incentives</p>
          <p>Coming soon...</p>
        </div>
      </div>
    );
  }

  function renderAnalytics() {
    return (
      <div>
        <h3>Analytics Dashboard</h3>
        <div style={{ color: '#cccccc', textAlign: 'center', padding: '40px' }}>
          <h4>Detailed Analytics</h4>
          <p>User engagement, tournament performance, revenue metrics</p>
          <p>Coming soon...</p>
        </div>
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
                <option value="moderator">Moderator</option>
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
              <Input placeholder="Reward Name" />
              <Input placeholder="Points Required" type="number" />
              <Select>
                <option value="currency">Currency</option>
                <option value="badge">Badge</option>
                <option value="item">Item</option>
              </Select>
              <TextArea placeholder="Description" />
            </Form>
          );
        default:
          return null;
      }
    }

    return (
      <Modal $isOpen={isModalOpen} onClick={() => setIsModalOpen(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <CloseButton onClick={() => setIsModalOpen(false)} aria-label="Close">×</CloseButton>
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
      default:
        return renderDashboard();
    }
  }

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title>Admin Panel</Title>
            <p style={{ color: '#cccccc', margin: '8px 0 0 0' }}>
              Manage users, tournaments, news, and system settings
            </p>
          </div>
          <ActionButton onClick={() => load()}>
            {loading ? '...' : 'Refresh'}
          </ActionButton>
        </div>
      </Header>

      {!isAuthenticated && (
        <div style={{ marginBottom: '20px', color: '#cccccc' }}>
          <p>Authentication required.</p>
          <ActionButton onClick={() => login()}>
            {authLoading ? 'Loading...' : 'Login (Telegram)'}
          </ActionButton>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: '16px', color: '#ff4757', padding: '12px', background: 'rgba(255, 71, 87, 0.1)', border: '1px solid #ff4757', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {isAuthenticated && user?.role !== 'admin' && user?.role !== 'developer' && (
        <div style={{ marginBottom: '16px', color: '#ff6b00', padding: '12px', background: 'rgba(255, 107, 0, 0.1)', border: '1px solid #ff6b00', borderRadius: '8px' }}>
          <strong>Access Restricted:</strong> You are logged in with role "{user?.role}".
          To activate Admin rights, please open this app inside Telegram on your phone at least once.
        </div>
      )}

      {loading && (
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
      </TabContainer>

      <ContentArea>
        {isAuthenticated ? renderContent() : null}
      </ContentArea>

      {renderModal()}
    </Container>
  );
};

export default AdminPage; 