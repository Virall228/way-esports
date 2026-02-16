import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

const Wrapper = styled.div`
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Header = styled(Card).attrs({ variant: 'elevated' })`
  border: 1px solid ${({ theme }) => theme.colors.border.strong};
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
`;

const Description = styled.p`
  margin: 0.5rem 0 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Form = styled(Card).attrs({ variant: 'outlined' })`
  display: grid;
  gap: 0.75rem;
`;

const Label = styled.label`
  display: grid;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Input = styled.input`
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  background: ${({ theme }) => theme.colors.bg.elevated};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0.6rem 0.75rem;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`;

const AdminAccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, login, logout, fetchProfile } = useAuth();
  const { addNotification } = useNotifications();
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');

  const role = user?.role || 'guest';
  const hasAdminAccess = role === 'admin' || role === 'developer';

  React.useEffect(() => {
    if (hasAdminAccess) {
      navigate('/admin', { replace: true });
    }
  }, [hasAdminAccess, navigate]);

  const handleContinue = async () => {
    try {
      const cleanIdentifier = identifier.trim();
      const cleanPassword = password.trim();

      if (!cleanIdentifier) {
        addNotification({
          type: 'error',
          title: 'Missing identifier',
          message: 'Enter Telegram ID or email/username'
        });
        return;
      }

      const isTelegramId = /^[0-9]+$/.test(cleanIdentifier);

      if (isTelegramId && !cleanPassword) {
        await login({ method: 'telegram', telegramId: cleanIdentifier });
      } else {
        if (!cleanPassword) {
          addNotification({
            type: 'error',
            title: 'Missing password',
            message: 'Password is required for email/username login'
          });
          return;
        }
        await login({ method: 'email', identifier: cleanIdentifier, password: cleanPassword });
      }

      const profile = await fetchProfile();
      const profileRole = profile?.role || 'user';

      if (profileRole === 'admin' || profileRole === 'developer') {
        navigate('/admin', { replace: true });
        return;
      }

      addNotification({
        type: 'warning',
        title: 'Logged in as non-admin',
        message: `Current role: ${profileRole}`
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Login failed',
        message: error?.message || 'Unable to login'
      });
    }
  };

  const handleLogout = () => {
    logout();
    setIdentifier('');
    setPassword('');
    addNotification({
      type: 'info',
      title: 'Session cleared',
      message: 'Login with required account'
    });
  };

  return (
    <Wrapper>
      <Header>
        <Title>Control Access</Title>
        <Description>
          Login to open the control dashboard. Regular users do not see this navigation.
        </Description>
      </Header>

      <Form>
        <Label>
          Identifier (Telegram ID or Email/Username)
          <Input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="123456789 or admin@example.com"
            inputMode="text"
          />
        </Label>

        <Label>
          Password (optional for Telegram ID)
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />
        </Label>

        <Actions>
          <Button onClick={handleContinue} disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Continue'}
          </Button>
          {isAuthenticated && (
            <Button variant="outline" onClick={handleLogout} disabled={isLoading}>
              Logout
            </Button>
          )}
        </Actions>
      </Form>

      <Card variant="outlined">
        <Description>
          Session status: <strong>{isAuthenticated ? 'authenticated' : 'guest'}</strong>.
        </Description>
        <Description>
          Current role: <strong>{role}</strong>.
        </Description>
      </Card>
    </Wrapper>
  );
};

export default AdminAccessPage;
