import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

const Container = styled.div`
  max-width: 760px;
  margin: 0 auto;
  display: grid;
  gap: 1rem;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.6rem;
`;

const Subtitle = styled.p`
  margin: 0.4rem 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Grid = styled.div`
  display: grid;
  gap: 1rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Block = styled(Card).attrs({ variant: 'outlined' })`
  display: grid;
  gap: 0.75rem;
`;

const Label = styled.label`
  display: grid;
  gap: 0.35rem;
  font-size: 0.82rem;
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

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, fetchProfile, isLoading } = useAuth();
  const { addNotification } = useNotifications();

  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [registerEmail, setRegisterEmail] = React.useState('');
  const [registerPassword, setRegisterPassword] = React.useState('');
  const [registerUsername, setRegisterUsername] = React.useState('');
  const [registerFirstName, setRegisterFirstName] = React.useState('');
  const [telegramId, setTelegramId] = React.useState('');

  const finalizeLogin = async () => {
    const profile = await fetchProfile();
    const role = profile?.role || 'user';
    if (role === 'admin' || role === 'developer') {
      navigate('/admin');
      return;
    }
    navigate('/');
  };

  const handleEmailLogin = async () => {
    try {
      await login({
        method: 'email',
        identifier: identifier.trim(),
        password: password.trim()
      });
      await finalizeLogin();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Login failed',
        message: error?.message || 'Unable to login'
      });
    }
  };

  const handleRegister = async () => {
    try {
      await login({
        method: 'register',
        email: registerEmail.trim(),
        password: registerPassword.trim(),
        username: registerUsername.trim() || undefined,
        firstName: registerFirstName.trim() || undefined
      });
      await finalizeLogin();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Registration failed',
        message: error?.message || 'Unable to register'
      });
    }
  };

  const handleTelegramLogin = async () => {
    try {
      await login({
        method: 'telegram',
        telegramId: telegramId.trim()
      });
      await finalizeLogin();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Telegram login failed',
        message: error?.message || 'Unable to login by Telegram ID'
      });
    }
  };

  return (
    <Container>
      <Card variant="elevated">
        <Title>Account Access</Title>
        <Subtitle>Login or register. Admin dashboard remains hidden for non-admin roles.</Subtitle>
        <Row style={{ marginTop: '0.75rem' }}>
          <Button variant="outline" onClick={() => navigate('/control-access')}>
            Privileged Access
          </Button>
        </Row>
      </Card>

      <Grid>
        <Block>
          <h3 style={{ margin: 0 }}>Login</h3>
          <Label>
            Email or Username
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="name@email.com or username"
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
          <Row>
            <Button onClick={handleEmailLogin} disabled={isLoading}>
              {isLoading ? 'Please wait...' : 'Login'}
            </Button>
          </Row>
        </Block>

        <Block>
          <h3 style={{ margin: 0 }}>Register</h3>
          <Label>
            Email
            <Input
              type="email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              placeholder="player@email.com"
            />
          </Label>
          <Label>
            Password
            <Input
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              placeholder="minimum 8 chars"
            />
          </Label>
          <Label>
            Username (optional)
            <Input
              value={registerUsername}
              onChange={(e) => setRegisterUsername(e.target.value)}
              placeholder="nickname"
            />
          </Label>
          <Label>
            First Name (optional)
            <Input
              value={registerFirstName}
              onChange={(e) => setRegisterFirstName(e.target.value)}
              placeholder="Player"
            />
          </Label>
          <Row>
            <Button onClick={handleRegister} disabled={isLoading}>
              {isLoading ? 'Please wait...' : 'Create Account'}
            </Button>
          </Row>
        </Block>
      </Grid>

      <Block>
        <h3 style={{ margin: 0 }}>Telegram ID Login</h3>
        <Subtitle>Use this if your role is bound to Telegram ID (admin/support).</Subtitle>
        <Label>
          Telegram ID
          <Input
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            placeholder="123456789"
            inputMode="numeric"
          />
        </Label>
        <Row>
          <Button onClick={handleTelegramLogin} disabled={isLoading}>
            {isLoading ? 'Please wait...' : 'Login by Telegram ID'}
          </Button>
        </Row>
      </Block>
    </Container>
  );
};

export default AuthPage;
