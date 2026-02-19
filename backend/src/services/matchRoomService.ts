import Match from '../models/Match';

const ROOM_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const DEFAULT_VISIBILITY_WINDOW_MIN = 5;
const DEFAULT_TTL_HOURS = 6;

const randomFrom = (alphabet: string, length: number): string => {
  let value = '';
  for (let i = 0; i < length; i += 1) {
    value += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return value;
};

const generateRoomId = () => randomFrom(ROOM_ID_ALPHABET, 6);
const generateRoomPassword = () => randomFrom(ROOM_PASSWORD_ALPHABET, 8);

const normalizeDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

export interface PrepareRoomOptions {
  force?: boolean;
  roomId?: string;
  password?: string;
  visibleAt?: Date | string | null;
  expiresAt?: Date | string | null;
  visibilityWindowMinutes?: number;
  ttlHours?: number;
}

export const hasRoomCredentials = (match: any): boolean => {
  return Boolean(match?.roomCredentials?.roomId && match?.roomCredentials?.password);
};

export const ensureUniqueRoomId = async (candidate?: string, excludeMatchId?: string): Promise<string> => {
  const maxAttempts = 25;
  const normalized = String(candidate || '').trim().toUpperCase();

  const checkAvailability = async (roomId: string): Promise<boolean> => {
    const query: any = { 'roomCredentials.roomId': roomId };
    if (excludeMatchId) {
      query._id = { $ne: excludeMatchId };
    }

    const existing: any = await Match.findOne(query)
      .select('_id')
      .lean();

    return !existing;
  };

  if (normalized) {
    const available = await checkAvailability(normalized);
    if (available) return normalized;
    throw new Error('Room ID is already in use');
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const roomId = generateRoomId();
    // eslint-disable-next-line no-await-in-loop
    const available = await checkAvailability(roomId);
    if (available) return roomId;
  }

  throw new Error('Failed to generate a unique room ID');
};

export const buildRoomWindow = (
  startTimeRaw: Date | string | undefined,
  nowRaw?: Date,
  options?: Pick<PrepareRoomOptions, 'visibleAt' | 'expiresAt' | 'visibilityWindowMinutes' | 'ttlHours'>
) => {
  const now = nowRaw instanceof Date ? nowRaw : new Date();
  const startTime = normalizeDate(startTimeRaw) || now;

  const visibilityWindowMinutes = Math.max(1, Number(options?.visibilityWindowMinutes || DEFAULT_VISIBILITY_WINDOW_MIN));
  const ttlHours = Math.max(1, Number(options?.ttlHours || DEFAULT_TTL_HOURS));

  const requestedVisibleAt = normalizeDate(options?.visibleAt || null);
  const requestedExpiresAt = normalizeDate(options?.expiresAt || null);

  const defaultVisibleAt = new Date(
    Math.max(startTime.getTime() - visibilityWindowMinutes * 60 * 1000, now.getTime())
  );
  const defaultExpiresAt = new Date(startTime.getTime() + ttlHours * 60 * 60 * 1000);

  const visibleAt = requestedVisibleAt || defaultVisibleAt;
  let expiresAt = requestedExpiresAt || defaultExpiresAt;

  if (expiresAt.getTime() <= visibleAt.getTime()) {
    if (requestedExpiresAt || requestedVisibleAt) {
      throw new Error('expiresAt must be later than visibleAt');
    }
    // Fallback for delayed/suspended matches.
    expiresAt = new Date(visibleAt.getTime() + ttlHours * 60 * 60 * 1000);
  }

  return { visibleAt, expiresAt };
};

export const prepareMatchRoom = async (match: any, options: PrepareRoomOptions = {}) => {
  if (!match) throw new Error('Match is required');

  const force = Boolean(options.force);
  const hadCredentials = hasRoomCredentials(match);
  if (hadCredentials && !force) {
    return {
      created: false,
      updated: false,
      match
    };
  }

  const now = new Date();
  const matchId = match?._id?.toString?.() || '';
  const roomId = await ensureUniqueRoomId(options.roomId, matchId || undefined);
  const password = String(options.password || '').trim() || generateRoomPassword();
  const { visibleAt, expiresAt } = buildRoomWindow(match.startTime, now, options);

  match.roomCredentials = {
    roomId,
    password,
    generatedAt: now,
    visibleAt,
    expiresAt
  };

  await match.save();

  return {
    created: true,
    updated: force && hadCredentials,
    match
  };
};
