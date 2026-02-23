export type StyleVector = {
  aiming: number;
  positioning: number;
  utility: number;
  clutchFactor: number;
  teamplay: number;
};

export type StyleMatchResult = {
  pro: string;
  similarity: number;
  distance: number;
  summary: string;
};

type ProProfile = {
  name: string;
  vector: StyleVector;
  description: string;
};

const PROFILES: ProProfile[] = [
  {
    name: 'TenZ',
    vector: { aiming: 95, positioning: 78, utility: 62, clutchFactor: 86, teamplay: 79 },
    description: 'High mechanical ceiling with aggressive duel focus'
  },
  {
    name: 'nAts',
    vector: { aiming: 84, positioning: 95, utility: 88, clutchFactor: 89, teamplay: 87 },
    description: 'Elite positioning and late-round control'
  },
  {
    name: 's1mple',
    vector: { aiming: 97, positioning: 85, utility: 64, clutchFactor: 93, teamplay: 74 },
    description: 'Explosive impact and top-tier clutch conversion'
  },
  {
    name: 'Faker',
    vector: { aiming: 82, positioning: 91, utility: 90, clutchFactor: 92, teamplay: 95 },
    description: 'Macro leadership and consistency under pressure'
  }
];

const keys: Array<keyof StyleVector> = ['aiming', 'positioning', 'utility', 'clutchFactor', 'teamplay'];

const euclidean = (a: StyleVector, b: StyleVector): number => {
  let sum = 0;
  for (const key of keys) {
    const delta = (a[key] || 0) - (b[key] || 0);
    sum += delta * delta;
  }
  return Math.sqrt(sum);
};

const similarityFromDistance = (distance: number): number => {
  const maxDistance = Math.sqrt(keys.length * 100 * 100);
  const score = 1 - distance / maxDistance;
  return Math.max(0, Math.min(1, score));
};

export const matchPlaystyle = (player: StyleVector): StyleMatchResult[] => {
  return PROFILES.map((profile) => {
    const distance = euclidean(player, profile.vector);
    const similarity = similarityFromDistance(distance);
    return {
      pro: profile.name,
      similarity: Number((similarity * 100).toFixed(2)),
      distance: Number(distance.toFixed(2)),
      summary: profile.description
    };
  }).sort((a, b) => b.similarity - a.similarity);
};

