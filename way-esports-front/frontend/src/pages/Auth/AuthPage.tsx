import React from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { ApiError } from '../../services/api';

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

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0.5rem 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.border.medium};
  }
`;

const SocialActions = styled.div`
  display: grid;
  gap: 0.6rem;
`;

const SocialButton = styled(Button)`
  width: 100%;
`;

const GoogleHost = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  min-height: 44px;
`;

const InlineLink = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.brand.primary};
  cursor: pointer;
  font: inherit;
  padding: 0;
  margin-left: 0.35rem;
`;

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, fetchProfile, isLoading } = useAuth();
  const { addNotification } = useNotifications();

  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isRegistrationMode, setIsRegistrationMode] = React.useState(false);
  const [socialLoading, setSocialLoading] = React.useState<'google' | 'apple' | null>(null);
  const [isGoogleReady, setIsGoogleReady] = React.useState(false);
  const [isAppleReady, setIsAppleReady] = React.useState(false);
  const googleHostRef = React.useRef<HTMLDivElement | null>(null);
  const googleRenderedRef = React.useRef(false);
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const appleClientId = (import.meta.env.VITE_APPLE_CLIENT_ID || '').trim();
  const appleRedirectUri = (
    import.meta.env.VITE_APPLE_REDIRECT_URI ||
    (typeof window !== 'undefined' ? `${window.location.origin}/auth` : '')
  ).trim();
  const referralCode = React.useMemo(() => {
    const fromQuery = new URLSearchParams(location.search).get('ref') || new URLSearchParams(location.search).get('referral');
    if (fromQuery && fromQuery.trim()) {
      return fromQuery.trim();
    }
    try {
      return localStorage.getItem('referral_code')?.trim() || '';
    } catch {
      return '';
    }
  }, [location.search]);

  React.useEffect(() => {
    if (!referralCode) return;
    try {
      localStorage.setItem('referral_code', referralCode);
    } catch {
      // ignore storage errors
    }
  }, [referralCode]);

  const clearStoredReferral = () => {
    try {
      localStorage.removeItem('referral_code');
    } catch {
      // ignore storage errors
    }
  };

  const finalizeLogin = React.useCallback(async () => {
    const profile = await fetchProfile();
    const role = profile?.role || 'user';
    if (role === 'admin' || role === 'developer') {
      navigate('/admin');
      return;
    }
    navigate('/');
  }, [fetchProfile, navigate]);

  const isEmailLike = (value: string) => /\S+@\S+\.\S+/.test(value);

  const loadScript = React.useCallback((id: string, src: string) => {
    if (typeof document === 'undefined') {
      return Promise.reject(new Error('Document is not available'));
    }

    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === 'true') return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      });
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }, []);

  const handleSocialTokenLogin = React.useCallback(async (provider: 'google' | 'apple', token: string) => {
    if (!token) {
      addNotification({
        type: 'error',
        title: `${provider} login failed`,
        message: 'Token is missing'
      });
      return;
    }

    try {
      setSocialLoading(provider);
      if (provider === 'google') {
        await login({ method: 'google', idToken: token });
      } else {
        await login({ method: 'apple', identityToken: token });
      }
      await finalizeLogin();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: `${provider} login failed`,
        message: error?.message || `Unable to login with ${provider}`
      });
    } finally {
      setSocialLoading(null);
    }
  }, [addNotification, finalizeLogin, login]);

  React.useEffect(() => {
    let cancelled = false;

    const initGoogle = async () => {
      if (!googleClientId || !googleHostRef.current) return;

      try {
        await loadScript('google-identity-services', 'https://accounts.google.com/gsi/client');
        if (cancelled || !googleHostRef.current) return;

        const googleApi = (window as any).google;
        if (!googleApi?.accounts?.id) return;

        googleApi.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            const credential = response?.credential;
            if (credential) {
              handleSocialTokenLogin('google', credential);
            } else {
              addNotification({
                type: 'error',
                title: 'Google login failed',
                message: 'Google did not return credential'
              });
            }
          }
        });

        if (!googleRenderedRef.current) {
          googleHostRef.current.innerHTML = '';
          googleApi.accounts.id.renderButton(googleHostRef.current, {
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            text: 'continue_with',
            width: 320
          });
          googleRenderedRef.current = true;
        }

        setIsGoogleReady(true);
      } catch {
        if (!cancelled) setIsGoogleReady(false);
      }
    };

    initGoogle().catch(() => {
      if (!cancelled) setIsGoogleReady(false);
    });

    return () => {
      cancelled = true;
    };
  }, [addNotification, googleClientId, handleSocialTokenLogin, loadScript]);

  React.useEffect(() => {
    let cancelled = false;

    const initApple = async () => {
      if (!appleClientId) return;

      try {
        await loadScript('apple-signin-js', 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js');
        if (cancelled) return;

        const appleApi = (window as any).AppleID;
        if (!appleApi?.auth?.init) return;

        appleApi.auth.init({
          clientId: appleClientId,
          scope: 'name email',
          redirectURI: appleRedirectUri,
          usePopup: true
        });

        setIsAppleReady(true);
      } catch {
        if (!cancelled) setIsAppleReady(false);
      }
    };

    initApple().catch(() => {
      if (!cancelled) setIsAppleReady(false);
    });

    return () => {
      cancelled = true;
    };
  }, [appleClientId, appleRedirectUri, loadScript]);

  const handleAppleLogin = async () => {
    if (!isAppleReady) {
      addNotification({
        type: 'warning',
        title: 'Apple login unavailable',
        message: 'Apple Sign-In is not configured'
      });
      return;
    }

    try {
      const appleApi = (window as any).AppleID;
      const response = await appleApi?.auth?.signIn();
      const idToken = response?.authorization?.id_token;

      if (!idToken) {
        addNotification({
          type: 'error',
          title: 'Apple login failed',
          message: 'Apple did not return identity token'
        });
        return;
      }

      await handleSocialTokenLogin('apple', idToken);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Apple login failed',
        message: error?.message || 'Unable to login with Apple'
      });
    }
  };

  const handleContinue = async () => {
    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentifier) {
      addNotification({
        type: 'error',
        title: 'Missing credentials',
        message: 'Enter identifier'
      });
      return;
    }

    const isTelegramId = /^[0-9]+$/.test(cleanIdentifier);

    if (isTelegramId) {
      try {
        await login({
          method: 'telegram',
          telegramId: cleanIdentifier
        });
        await finalizeLogin();
      } catch (error: any) {
        addNotification({
          type: 'error',
          title: 'Telegram login failed',
          message: error?.message || 'Unable to login by Telegram ID'
        });
      }
      return;
    }

    if (!cleanPassword) {
      addNotification({
        type: 'error',
        title: 'Missing password',
        message: 'Enter password'
      });
      return;
    }

    if (isRegistrationMode) {
      if (!isEmailLike(cleanIdentifier)) {
        addNotification({
          type: 'error',
          title: 'Email required',
          message: 'Registration requires valid email'
        });
        return;
      }

      try {
        await login({
          method: 'register',
          email: cleanIdentifier,
          password: cleanPassword,
          referralCode: referralCode || undefined
        });
        clearStoredReferral();
        addNotification({
          type: 'success',
          title: 'Account created',
          message: 'Registration complete'
        });
        await finalizeLogin();
      } catch (error: any) {
        addNotification({
          type: 'error',
          title: 'Registration failed',
          message: error?.message || 'Unable to register'
        });
      }
      return;
    }

    try {
      await login({
        method: 'email',
        identifier: cleanIdentifier,
        password: cleanPassword
      });
      await finalizeLogin();
      return;
    } catch (error: any) {
      const autoRegisterAllowed =
        isEmailLike(cleanIdentifier) &&
        (
          !(error instanceof ApiError) ||
          error.status === 401
        );

      if (!autoRegisterAllowed) {
        addNotification({
          type: 'error',
          title: 'Login failed',
          message: error?.message || 'Unable to login'
        });
        return;
      }

      try {
        await login({
          method: 'register',
          email: cleanIdentifier,
          password: cleanPassword,
          referralCode: referralCode || undefined
        });
        clearStoredReferral();

        addNotification({
          type: 'success',
          title: 'Account created',
          message: 'New account was created and signed in'
        });
        await finalizeLogin();
        return;
      } catch (registerError: any) {
        if (registerError instanceof ApiError && registerError.status === 409) {
          addNotification({
            type: 'error',
            title: 'Login failed',
            message: 'Account exists. Check password and try again'
          });
          return;
        }
        addNotification({
          type: 'error',
          title: 'Registration failed',
          message: registerError?.message || 'Unable to register'
        });
        return;
      }
    }
  };

  const toggleMode = () => {
    setIsRegistrationMode((prev) => !prev);
  };

  return (
    <Container>
      <Card variant="elevated">
        <Title>Account Access</Title>
        <Subtitle>
          {isRegistrationMode
            ? 'Create account with email and password.'
            : 'Login with email/username + password, or with Telegram ID only.'}
        </Subtitle>
        {!!referralCode && (
          <Subtitle style={{ marginTop: '0.35rem' }}>
            Referral code applied: <strong>{referralCode}</strong>
          </Subtitle>
        )}
      </Card>

      <Block>
        <h3 style={{ margin: 0 }}>{isRegistrationMode ? 'Registration' : 'Login'}</h3>
        <Label>
          Identifier
          <Input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={isRegistrationMode ? 'name@email.com' : 'name@email.com, username or Telegram ID'}
          />
        </Label>
        <Label>
          Password {isRegistrationMode ? '' : '(optional for Telegram ID)'}
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isRegistrationMode ? '********' : 'Leave empty for Telegram ID'}
          />
        </Label>
        <Row>
          <Button onClick={handleContinue} disabled={isLoading}>
            {isLoading ? 'Please wait...' : isRegistrationMode ? 'Create account' : 'Continue'}
          </Button>
        </Row>
        <Row>
          <InlineLink type="button" onClick={toggleMode}>
            {isRegistrationMode ? 'Back to login' : 'Registration'}
          </InlineLink>
        </Row>

        {!isRegistrationMode && (
          <>
            <Divider>or</Divider>
            <SocialActions>
              {googleClientId ? (
                <GoogleHost ref={googleHostRef} aria-label="Google login button" />
              ) : (
                <Subtitle>Google login is not configured</Subtitle>
              )}
              <SocialButton
                onClick={handleAppleLogin}
                variant="outline"
                disabled={!appleClientId || socialLoading === 'apple'}
              >
                {socialLoading === 'apple'
                  ? 'Connecting Apple...'
                  : isAppleReady
                    ? 'Continue with Apple'
                    : 'Apple login unavailable'}
              </SocialButton>
              {(socialLoading === 'google' || (googleClientId && !isGoogleReady)) && (
                <Subtitle>
                  {socialLoading === 'google' ? 'Connecting Google...' : 'Google login loading...'}
                </Subtitle>
              )}
            </SocialActions>
          </>
        )}
      </Block>
    </Container>
  );
};

export default AuthPage;
