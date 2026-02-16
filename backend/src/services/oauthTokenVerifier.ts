import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';

type Provider = 'google' | 'apple';

type ProviderPayload = JwtPayload & {
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  given_name?: string;
  family_name?: string;
  name?: string;
};

type Jwk = {
  kty: string;
  kid?: string;
  alg?: string;
  n?: string;
  e?: string;
};

const JWKS_CACHE = new Map<string, { expiresAt: number; keys: Jwk[] }>();
const JWKS_TTL_MS = 60 * 60 * 1000;

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

const parseAudience = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const getJwks = async (url: string): Promise<Jwk[]> => {
  const cached = JWKS_CACHE.get(url);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.keys;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch JWKS: ${response.status}`);
  }

  const data: any = await response.json();
  const keys: Jwk[] = Array.isArray(data?.keys) ? data.keys : [];
  if (!keys.length) {
    throw new Error('JWKS does not contain keys');
  }

  JWKS_CACHE.set(url, {
    expiresAt: now + JWKS_TTL_MS,
    keys
  });

  return keys;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
};

const verifyJwtWithJwks = async (
  token: string,
  jwksUrl: string,
  allowedIssuers: string[],
  allowedAudiences: string[]
): Promise<ProviderPayload> => {
  const decoded = jwt.decode(token, { complete: true }) as { header?: any } | null;
  const kid = decoded?.header?.kid;
  const alg = decoded?.header?.alg;

  if (!kid || alg !== 'RS256') {
    throw new Error('Invalid token header');
  }

  const keys = await getJwks(jwksUrl);
  const matchingKey = keys.find((item) => item.kid === kid && item.kty === 'RSA' && item.n && item.e);
  if (!matchingKey?.n || !matchingKey?.e) {
    throw new Error('Signing key not found');
  }

  const publicKey = crypto.createPublicKey({
    key: {
      kty: 'RSA',
      n: matchingKey.n,
      e: matchingKey.e
    },
    format: 'jwk'
  });

  const issuerOption =
    allowedIssuers.length === 1
      ? allowedIssuers[0]
      : (allowedIssuers as [string, ...string[]]);

  const audienceOption =
    allowedAudiences.length === 1
      ? allowedAudiences[0]
      : (allowedAudiences as [string, ...string[]]);

  const payload = jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: issuerOption,
    audience: audienceOption
  }) as ProviderPayload;

  return payload;
};

const verifyByProvider = async (provider: Provider, token: string): Promise<ProviderPayload> => {
  if (provider === 'google') {
    const audiences = parseAudience(process.env.GOOGLE_CLIENT_ID);
    if (!audiences.length) {
      throw new Error('GOOGLE_CLIENT_ID is not configured');
    }

    return verifyJwtWithJwks(
      token,
      GOOGLE_JWKS_URL,
      ['https://accounts.google.com', 'accounts.google.com'],
      audiences
    );
  }

  const audiences = parseAudience(process.env.APPLE_CLIENT_ID);
  if (!audiences.length) {
    throw new Error('APPLE_CLIENT_ID is not configured');
  }

  return verifyJwtWithJwks(
    token,
    APPLE_JWKS_URL,
    ['https://appleid.apple.com'],
    audiences
  );
};

export const verifyGoogleIdToken = async (idToken: string) => {
  const payload = await verifyByProvider('google', idToken);

  if (!payload.sub) {
    throw new Error('Google token has no subject');
  }

  return {
    provider: 'google' as const,
    providerId: payload.sub,
    email: typeof payload.email === 'string' ? payload.email.toLowerCase() : null,
    emailVerified: toBoolean(payload.email_verified),
    firstName: payload.given_name || null,
    lastName: payload.family_name || null,
    fullName: payload.name || null
  };
};

export const verifyAppleIdentityToken = async (identityToken: string) => {
  const payload = await verifyByProvider('apple', identityToken);

  if (!payload.sub) {
    throw new Error('Apple token has no subject');
  }

  return {
    provider: 'apple' as const,
    providerId: payload.sub,
    email: typeof payload.email === 'string' ? payload.email.toLowerCase() : null,
    emailVerified: toBoolean(payload.email_verified),
    firstName: null,
    lastName: null,
    fullName: null
  };
};
