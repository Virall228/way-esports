import mongoose from 'mongoose';

export interface TournamentPlayerIdentity {
  userId: string;
  displayName: string;
  ingameNickname: string;
  ingameId: string;
  avatar?: string;
}

export interface ParsedPlayerRow {
  nickname: string;
  kills: number;
  deaths: number;
  assists: number;
  mvp_status: boolean;
  damage: number;
}

export interface MatchSuggestionRow {
  parsed: ParsedPlayerRow;
  matchedUserId: string | null;
  matchedBy: 'ingame_id' | 'nickname_fuzzy' | 'none';
  confidence: number;
}

const normalize = (value: unknown): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

const similarity = (left: string, right: string): number => {
  const a = normalize(left);
  const b = normalize(right);
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  const longest = Math.max(a.length, b.length) || 1;
  return Math.max(0, 1 - dist / longest);
};

export const mapParsedRowsToTournamentPlayers = (
  parsedRows: ParsedPlayerRow[],
  players: TournamentPlayerIdentity[]
): MatchSuggestionRow[] => {
  const byIngameId = new Map<string, TournamentPlayerIdentity>(
    players.map((player) => [normalize(player.ingameId), player])
  );

  return parsedRows.map((parsed) => {
    const normalizedNick = normalize(parsed.nickname);
    const exactById = byIngameId.get(normalizedNick);
    if (exactById) {
      return {
        parsed,
        matchedUserId: exactById.userId,
        matchedBy: 'ingame_id',
        confidence: 1
      };
    }

    let best: TournamentPlayerIdentity | null = null;
    let bestScore = 0;
    for (const player of players) {
      const score = Math.max(
        similarity(parsed.nickname, player.ingameNickname),
        similarity(parsed.nickname, player.displayName)
      );
      if (score > bestScore) {
        bestScore = score;
        best = player;
      }
    }

    if (!best || bestScore < 0.55) {
      return {
        parsed,
        matchedUserId: null,
        matchedBy: 'none',
        confidence: Number(bestScore.toFixed(3))
      };
    }

    return {
      parsed,
      matchedUserId: best.userId,
      matchedBy: 'nickname_fuzzy',
      confidence: Number(bestScore.toFixed(3))
    };
  });
};

const toImpactScore = (row: ParsedPlayerRow): number => {
  const raw = row.kills * 2 + row.assists * 1.2 - row.deaths * 0.8 + (row.mvp_status ? 5 : 0) + row.damage / 500;
  return Math.max(0, Math.min(100, Number(raw.toFixed(2))));
};

export const updateUserStatsFromMatchRows = async (
  rows: Array<{ userId?: string | null; parsed: ParsedPlayerRow }>
) => {
  const UserStats = mongoose.model('UserStats');
  const now = new Date();
  for (const row of rows) {
    const userId = String(row.userId || '').trim();
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) continue;

    const rating = toImpactScore(row.parsed);
    const doc: any = await UserStats.findOne({ user: userId }).lean();
    const previous = Number(doc?.impactRating || 50);
    const blended = Number((previous * 0.75 + rating * 0.25).toFixed(2));

    const trend30d = Array.isArray(doc?.trend30d) ? doc.trend30d.slice(-29) : [];
    trend30d.push({ date: now, rating: blended });

    await UserStats.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          impactRating: blended,
          trend30d
        },
        $setOnInsert: {
          user: new mongoose.Types.ObjectId(userId)
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
};
