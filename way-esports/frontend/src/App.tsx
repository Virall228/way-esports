import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import MainLayout from './components/Layout/MainLayout';
import HomePage from './pages/Home/HomePage';
import TournamentsPage from './pages/Tournaments/TournamentsPage';
import NewsPage from './pages/News/NewsPage';
import TeamsPage from './pages/Teams/TeamsPage';
import ProfilePage from './pages/Profile/ProfilePage';
import AdminPage from './pages/Admin/AdminPage';
import SubscriptionPage from './pages/Subscription/SubscriptionPage';
import SimpleTestPage from './pages/TestTournament/SimpleTestPage';
import RewardsSystem from './components/Rewards/RewardsSystem';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/UI/ErrorBoundary';

// React Router future flags to suppress warnings
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
};

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #2a2a2a 30%, #1a1a1a 70%, #0a0a0a 100%);
  color: #ffffff;
  position: relative;
  
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 80%, rgba(128, 128, 128, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(192, 192, 192, 0.05) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
`;

const LoadingScreen = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #0a0a0a, #1a1a1a);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(128, 128, 128, 0.3);
  border-top: 3px solid #c0c0c0;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Mock user data - in real app this would come from authentication
      const mockUser = {
        id: '1',
        username: 'player123',
        role: 'user',
        isAdmin: false
      };
      
      setUser(mockUser);
      setIsAdmin(mockUser.isAdmin);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <LoadingScreen>
        <LoadingSpinner />
      </LoadingScreen>
    );
  }

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Router {...router}>
          <AppContainer>
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/tournaments" element={<TournamentsPage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
                <Route path="/test-tournament" element={<SimpleTestPage />} />
                <Route path="/rewards" element={<RewardsSystem />} />
                {isAdmin && <Route path="/admin" element={<AdminPage />} />}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </AppContainer>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

export default App;
