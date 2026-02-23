export type RawMatchStats = {
  kills: number;
  deaths: number;
  assists: number;
  survivalSeconds: number;
  utilityUses: number;
  objectiveActions: number;
  clutchRoundsWon: number;
  roundsPlayed: number;
};

export type NormalizedSkillScores = {
  aimScore: number;
  tacticalScore: number;
  survivalScore: number;
  utilityScore: number;
  clutchScore: number;
  overallScore: number;
};

const safe = (value: number, fallback = 0): number =>
  Number.isFinite(value) ? value : fallback;

const clamp = (value: number): number => Math.min(100, Math.max(0, value));

const normalize = (value: number, baseline: number, maxFactor = 2): number => {
  if (baseline <= 0) return 0;
  const factor = Math.min(maxFactor, Math.max(0, value / baseline));
  return clamp(Math.round((factor / maxFactor) * 100));
};

export const computeNormalizedScores = (raw: RawMatchStats): NormalizedSkillScores => {
  const kills = safe(raw.kills);
  const deaths = Math.max(1, safe(raw.deaths, 1));
  const assists = safe(raw.assists);
  const roundsPlayed = Math.max(1, safe(raw.roundsPlayed, 1));
  const survivalSeconds = safe(raw.survivalSeconds);
  const utilityUses = safe(raw.utilityUses);
  const objectiveActions = safe(raw.objectiveActions);
  const clutchRoundsWon = safe(raw.clutchRoundsWon);

  const kda = (kills + assists * 0.5) / deaths;
  const objectivesPerRound = objectiveActions / roundsPlayed;
  const utilityPerRound = utilityUses / roundsPlayed;
  const clutchRate = clutchRoundsWon / roundsPlayed;
  const survivalPerRound = survivalSeconds / roundsPlayed;

  const aimScore = normalize(kda, 1.2);
  const tacticalScore = normalize(objectivesPerRound, 0.9);
  const survivalScore = normalize(survivalPerRound, 45);
  const utilityScore = normalize(utilityPerRound, 1.1);
  const clutchScore = normalize(clutchRate, 0.12);

  const overallScore = clamp(
    Math.round(
      aimScore * 0.3 +
      tacticalScore * 0.22 +
      survivalScore * 0.16 +
      utilityScore * 0.16 +
      clutchScore * 0.16
    )
  );

  return {
    aimScore,
    tacticalScore,
    survivalScore,
    utilityScore,
    clutchScore,
    overallScore
  };
};

