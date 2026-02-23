export type BracketTeam = {
  id: string;
  seed?: number;
  name?: string;
};

export type BracketMatch = {
  id: string;
  round: number;
  bracket: 'winners' | 'losers' | 'final';
  sideA: BracketTeam | null;
  sideB: BracketTeam | null;
};

export type BracketGeneration = {
  type: 'single' | 'double';
  rounds: BracketMatch[];
};

const nextPowerOfTwo = (value: number): number => {
  let p = 1;
  while (p < value) p *= 2;
  return p;
};

const normalizeTeams = (teams: BracketTeam[]): BracketTeam[] => {
  const sorted = [...teams].sort((a, b) => {
    const left = Number.isFinite(a.seed as number) ? Number(a.seed) : Number.MAX_SAFE_INTEGER;
    const right = Number.isFinite(b.seed as number) ? Number(b.seed) : Number.MAX_SAFE_INTEGER;
    return left - right;
  });
  return sorted;
};

const createRound = (
  bracket: 'winners' | 'losers' | 'final',
  round: number,
  pairCount: number,
  sourceTeams: BracketTeam[]
): BracketMatch[] => {
  const out: BracketMatch[] = [];
  for (let i = 0; i < pairCount; i += 1) {
    const sideA = sourceTeams[i * 2] || null;
    const sideB = sourceTeams[i * 2 + 1] || null;
    out.push({
      id: `${bracket}-r${round}-m${i + 1}`,
      round,
      bracket,
      sideA,
      sideB
    });
  }
  return out;
};

export const generateSingleElimination = (teams: BracketTeam[]): BracketGeneration => {
  const seeded = normalizeTeams(teams);
  const totalSlots = nextPowerOfTwo(Math.max(seeded.length, 2));
  const padded: BracketTeam[] = [
    ...seeded,
    ...Array.from({ length: totalSlots - seeded.length }).map((_, idx) => ({
      id: `bye-${idx + 1}`,
      name: 'BYE'
    }))
  ];

  const rounds: BracketMatch[] = [];
  let pairCount = totalSlots / 2;
  let round = 1;
  let source = padded;
  while (pairCount >= 1) {
    rounds.push(...createRound('winners', round, pairCount, source));
    source = [];
    pairCount /= 2;
    round += 1;
  }

  return { type: 'single', rounds };
};

export const generateDoubleElimination = (teams: BracketTeam[]): BracketGeneration => {
  const single = generateSingleElimination(teams);
  const winnerRounds = single.rounds.length > 0 ? Math.max(...single.rounds.map((m) => m.round)) : 1;
  const losersRounds: BracketMatch[] = [];

  for (let r = 1; r <= Math.max(1, winnerRounds - 1); r += 1) {
    const pairCount = Math.max(1, Math.floor(Math.pow(2, winnerRounds - r - 1)));
    losersRounds.push(...createRound('losers', r, pairCount, []));
  }

  const finalMatch: BracketMatch = {
    id: 'final-r1-m1',
    round: 1,
    bracket: 'final',
    sideA: null,
    sideB: null
  };

  return {
    type: 'double',
    rounds: [...single.rounds, ...losersRounds, finalMatch]
  };
};

