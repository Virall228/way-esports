import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';
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
`;

const ModalContent = styled.div`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.95), rgba(26, 26, 26, 0.95));
  border-radius: 16px;
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

type TabType = 'dashboard' | 'users' | 'tournaments' | 'news' | 'rewards' | 'analytics';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
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
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'user' | 'tournament' | 'news' | 'reward'>('user');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalData, setModalData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (key: string, value: any) => {
    setModalData((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated) return;
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchUsers(), fetchTournaments(), fetchNews()]);
      } catch (e: any) {
        setError(e?.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated]);

  const formatDate = (value: any) => {
    try {
      const d = value ? new Date(value) : new Date();
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  const fetchUsers = async () => {
    const result: any[] = await api.get('/api/auth/users');
    setUsers(
      (result || []).map((u: any) => ({
        id: (u._id || u.id || '').toString(),
        username: u.username || '',
        email: u.email || '',
        role: u.role || 'user',
        status: u.isBanned ? 'banned' : 'active',
        createdAt: formatDate(u.createdAt)
      }))
    );
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

  const buildInitialModalData = (type: 'user' | 'tournament' | 'news' | 'reward', item: any | null) => {
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
        status: item?.status || 'draft'
      };
    }

    return item || {};
  };

  const handleCreate = (type: 'user' | 'tournament' | 'news' | 'reward') => {
    setModalType(type);
    setEditingItem(null);
    setModalData(buildInitialModalData(type, null));
    setIsModalOpen(true);
  };

  const handleEdit = (item: any, type: 'user' | 'tournament' | 'news' | 'reward') => {
    setModalType(type);
    setEditingItem(item);
    setModalData(buildInitialModalData(type, item));
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, type: 'user' | 'tournament' | 'news') => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        setError(null);
        if (type === 'tournament') {
          await api.delete(`/api/tournaments/${id}`);
          await fetchTournaments();
          return;
        }
        if (type === 'news') {
          await api.delete(`/api/news/${id}`);
          await fetchNews();
          return;
        }
        setError('User management actions are not implemented yet');
      } catch (e: any) {
        setError(e?.message || 'Delete failed');
      }
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      if (modalType === 'tournament') {
        const payload: any = {
          name: modalData.name,
          game: modalData.game,
          prizePool: Number(modalData.prizePool || 0),
          maxTeams: Number(modalData.maxTeams || 0),
          status: modalData.status,
          startDate: modalData.startDate,
          endDate: modalData.endDate,
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
          status: modalData.status
        };

        if (editingItem?.id) {
          await api.put(`/api/news/${editingItem.id}`, payload);
        } else {
          await api.post('/api/news', payload);
        }
        await fetchNews();
        setIsModalOpen(false);
        return;
      }

      setIsModalOpen(false);
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    }
  };

  const renderDashboard = () => (
    <div>
      <StatsGrid>
        <StatCard>
          <StatValue>1,234</StatValue>
          <StatLabel>Total Users</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>45</StatValue>
          <StatLabel>Active Tournaments</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>89</StatValue>
          <StatLabel>News Articles</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>$50,000</StatValue>
          <StatLabel>Total Prize Pool</StatLabel>
        </StatCard>
      </StatsGrid>
      
      <h3>Recent Activity</h3>
      <div style={{ color: '#cccccc' }}>
        <p>• New user registered: player123</p>
        <p>• Tournament "Valorant Championship" started</p>
        <p>• News article "New Features" published</p>
      </div>
    </div>
  );

  const renderUsers = () => (
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
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <Td>{user.username}</Td>
                <Td>{user.email}</Td>
                <Td>{user.role}</Td>
                <Td>{user.status}</Td>
                <Td>{user.createdAt}</Td>
                <Td>
                  <ActionsCell>
                    <ActionButton onClick={() => handleEdit(user, 'user')}>Edit</ActionButton>
                    <ActionButton $variant="danger" onClick={() => handleDelete(user.id, 'user')}>Delete</ActionButton>
                  </ActionsCell>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );

  const renderTournaments = () => (
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

  const renderNews = () => (
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

  const renderRewards = () => (
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

  const renderAnalytics = () => (
    <div>
      <h3>Analytics Dashboard</h3>
      <div style={{ color: '#cccccc', textAlign: 'center', padding: '40px' }}>
        <h4>Detailed Analytics</h4>
        <p>User engagement, tournament performance, revenue metrics</p>
        <p>Coming soon...</p>
      </div>
    </div>
  );

  const renderModal = () => {
    if (!isModalOpen) return null;

    const renderForm = () => {
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
                value={modalData.status || 'active'}
                onChange={(e) => setField('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </Select>
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
                <option value="Critical Ops">Critical Ops</option>
                <option value="PUBG Mobile">PUBG Mobile</option>
              </Select>
              <Input
                placeholder="Prize Pool"
                type="number"
                value={modalData.prizePool ?? 0}
                onChange={(e) => setField('prizePool', e.target.value)}
              />
              <Input
                placeholder="Max Teams"
                type="number"
                value={modalData.maxTeams ?? 16}
                onChange={(e) => setField('maxTeams', e.target.value)}
              />
              <Select
                value={modalData.status || 'upcoming'}
                onChange={(e) => setField('status', e.target.value)}
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </Select>
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
            </Form>
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
    };

    return (
      <Modal $isOpen={isModalOpen} onClick={() => setIsModalOpen(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <h3>{editingItem ? 'Edit' : 'Create'} {modalType}</h3>
          {renderForm()}
          <ModalActions>
            <ActionButton onClick={() => setIsModalOpen(false)}>Cancel</ActionButton>
            <ActionButton $variant="success" onClick={handleSave}>Save</ActionButton>
          </ModalActions>
        </ModalContent>
      </Modal>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
      case 'tournaments':
        return renderTournaments();
      case 'news':
        return renderNews();
      case 'rewards':
        return renderRewards();
      case 'analytics':
        return renderAnalytics();
      default:
        return renderDashboard();
    }
  };

  return (
    <Container>
      <Header>
        <Title>Admin Panel</Title>
        <p style={{ color: '#cccccc', margin: '8px 0 0 0' }}>
          Manage users, tournaments, news, and system settings
        </p>
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
        <div style={{ marginBottom: '16px', color: '#ff4757' }}>
          {error}
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
        <Tab $active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')}>
          Rewards
        </Tab>
        <Tab $active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
          Analytics
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