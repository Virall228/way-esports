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
  const { user, isAuthenticated, isLoading, login, fetchProfile } = useAuth();
  const { addNotification } = useNotifications();
  const [telegramId, setTelegramId] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const role = user?.role || 'guest';
  const hasAdminAccess = role === 'admin' || role === 'developer';

  React.useEffect(() => {
    if (hasAdminAccess) {
      navigate('/admin', { replace: true });
    }
  }, [hasAdminAccess, navigate]);

  const handleTelegramAdminLogin = async () => {
    try {
      if (!telegramId.trim()) {
        addNotification({
          type: 'error',
          title: 'Missing Telegram ID',
          message: 'Enter your Telegram ID'
        });
        return;
      }

      await login({ method: 'telegram', telegramId: telegramId.trim() });
      const profile = await fetchProfile();
      const profileRole = profile?.role || 'user';

      if (profileRole === 'admin' || profileRole === 'developer') {
        navigate('/admin', { replace: true });
        return;
      }

      addNotification({
        type: 'warning',
        title: 'Role not assigned',
        message: 'This account is logged in, but role is not admin/developer on the server'
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Telegram login failed',
        message: error?.message || 'Unable to login by Telegram ID'
      });
    }
  };

  const handleEmailLogin = async () => {
    try {
      if (!email.trim() || !password.trim()) {
        addNotification({
          type: 'error',
          title: 'Missing credentials',
          message: 'Enter email and password'
        });
        return;
      }

      await login({ method: 'email', identifier: email.trim(), password: password.trim() });

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
        title: 'Email login failed',
        message: error?.message || 'Unable to login with email/password'
      });
    }
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
          Telegram ID (for privileged accounts)
          <Input
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            placeholder="123456789"
            inputMode="numeric"
          />
        </Label>

        <Actions>
          <Button onClick={handleTelegramAdminLogin} disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login by Telegram ID'}
          </Button>
        </Actions>
      </Form>

      <Form>
        <Label>
          Email
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
          />
        </Label>

        <Label>
          Password
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />
        </Label>

        <Actions>
          <Button onClick={handleEmailLogin} disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login with Email'}
          </Button>
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
