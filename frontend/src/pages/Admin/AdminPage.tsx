import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 2px solid #ff6b00;
`;

const Title = styled.h1`
  color: #ffffff;
  margin: 0;
  font-size: 32px;
  background: linear-gradient(135deg, #ff6b00, #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => 
    $active ? 'linear-gradient(135deg, #ff6b00, #ff8533)' : 'rgba(42, 42, 42, 0.8)'};
  color: ${({ $active }) => $active ? '#000000' : '#ffffff'};
  border: 1px solid ${({ $active }) => $active ? '#ff6b00' : 'rgba(255, 107, 0, 0.3)'};
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: ${({ $active }) => 
      $active ? 'linear-gradient(135deg, #ff8533, #ff9f66)' : 'rgba(255, 107, 0, 0.1)'};
    transform: translateY(-2px);
  }
`;

const ContentArea = styled.div`
  background: rgba(42, 42, 42, 0.9);
  border-radius: 12px;
  padding: 24px;
  min-height: 600px;
  backdrop-filter: blur(10px);
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

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' | 'success' }>`
  background: ${({ $variant }) => 
    $variant === 'danger' ? 'linear-gradient(135deg, #ff4757, #ff6b7a)' :
    $variant === 'success' ? 'linear-gradient(135deg, #2ed573, #3ddb7f)' :
    'linear-gradient(135deg, #ff6b00, #ff8533)'};
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 8px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
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
  padding: 32px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 2px solid #ff6b00;
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
  min-height: 120px;
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

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'user' | 'tournament' | 'news' | 'reward'>('user');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Mock data - в реальном приложении это будет загружаться с сервера
  useEffect(() => {
    // Загрузка данных
    setUsers([
      { id: '1', username: 'player1', email: 'player1@example.com', role: 'user', status: 'active', createdAt: '2024-01-01' },
      { id: '2', username: 'admin1', email: 'admin1@example.com', role: 'admin', status: 'active', createdAt: '2024-01-02' },
    ]);

    setTournaments([
      { id: '1', name: 'Valorant Championship', game: 'Valorant', status: 'active', participants: 16, prizePool: 10000 },
      { id: '2', name: 'CS:GO Tournament', game: 'CS:GO', status: 'upcoming', participants: 8, prizePool: 5000 },
    ]);

    setNews([
      { id: '1', title: 'New Tournament Announced', content: 'Exciting news about upcoming tournaments...', author: 'admin', status: 'published', createdAt: '2024-01-01' },
    ]);
  }, []);

  const handleCreate = (type: 'user' | 'tournament' | 'news' | 'reward') => {
    setModalType(type);
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any, type: 'user' | 'tournament' | 'news' | 'reward') => {
    setModalType(type);
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, type: 'user' | 'tournament' | 'news') => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      // API call to delete
      console.log(`Deleting ${type} with id: ${id}`);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>User Management</h3>
        <ActionButton onClick={() => handleCreate('user')}>Add User</ActionButton>
      </div>
      
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
                <ActionButton onClick={() => handleEdit(user, 'user')}>Edit</ActionButton>
                <ActionButton $variant="danger" onClick={() => handleDelete(user.id, 'user')}>Delete</ActionButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  const renderTournaments = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Tournament Management</h3>
        <ActionButton onClick={() => handleCreate('tournament')}>Create Tournament</ActionButton>
      </div>
      
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
                <ActionButton onClick={() => handleEdit(tournament, 'tournament')}>Edit</ActionButton>
                <ActionButton $variant="danger" onClick={() => handleDelete(tournament.id, 'tournament')}>Delete</ActionButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  const renderNews = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>News Management</h3>
        <ActionButton onClick={() => handleCreate('news')}>Create Article</ActionButton>
      </div>
      
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
                <ActionButton onClick={() => handleEdit(article, 'news')}>Edit</ActionButton>
                <ActionButton $variant="danger" onClick={() => handleDelete(article.id, 'news')}>Delete</ActionButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
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
              <Input placeholder="Username" defaultValue={editingItem?.username || ''} />
              <Input placeholder="Email" type="email" defaultValue={editingItem?.email || ''} />
              <Select defaultValue={editingItem?.role || 'user'}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
              </Select>
              <Select defaultValue={editingItem?.status || 'active'}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </Select>
            </Form>
          );
        case 'tournament':
          return (
            <Form>
              <Input placeholder="Tournament Name" defaultValue={editingItem?.name || ''} />
              <Select defaultValue={editingItem?.game || 'valorant'}>
                <option value="valorant">Valorant</option>
                <option value="csgo">CS:GO</option>
                <option value="criticalops">Critical Ops</option>
              </Select>
              <Input placeholder="Prize Pool" type="number" defaultValue={editingItem?.prizePool || ''} />
              <Input placeholder="Max Participants" type="number" defaultValue={editingItem?.participants || ''} />
              <Select defaultValue={editingItem?.status || 'upcoming'}>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </Select>
            </Form>
          );
        case 'news':
          return (
            <Form>
              <Input placeholder="Title" defaultValue={editingItem?.title || ''} />
              <TextArea placeholder="Content" defaultValue={editingItem?.content || ''} />
              <Select defaultValue={editingItem?.status || 'draft'}>
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
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <ActionButton onClick={() => setIsModalOpen(false)}>Cancel</ActionButton>
            <ActionButton $variant="success">Save</ActionButton>
          </div>
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
        {renderContent()}
      </ContentArea>

      {renderModal()}
    </Container>
  );
};

export default AdminPage; 