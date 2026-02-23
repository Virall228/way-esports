export type EloMatchInput = {
  playerRating: number;
  opponentRating: number;
  result: 0 | 0.5 | 1;
  kFactor?: number;
};

export type EloMatchOutput = {
  expectedScore: number;
  delta: number;
  newRating: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const expectedScore = (playerRating: number, opponentRating: number): number => {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
};

export const resolveKFactor = (rating: number): number => {
  if (rating < 1200) return 40;
  if (rating < 1800) return 28;
  return 20;
};

export const calculateElo = (input: EloMatchInput): EloMatchOutput => {
  const player = Number.isFinite(input.playerRating) ? input.playerRating : 1000;
  const opponent = Number.isFinite(input.opponentRating) ? input.opponentRating : 1000;
  const expected = expectedScore(player, opponent);
  const k = Number.isFinite(input.kFactor as number)
    ? clamp(Number(input.kFactor), 8, 64)
    : resolveKFactor(player);

  const deltaRaw = k * (input.result - expected);
  const delta = Math.round(deltaRaw);
  const newRating = Math.max(0, Math.round(player + deltaRaw));

  return {
    expectedScore: Number(expected.toFixed(4)),
    delta,
    newRating
  };
};

