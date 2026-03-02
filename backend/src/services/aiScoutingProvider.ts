type ScoutInput = {
  username: string;
  role: string;
  rank: string;
  impactRating: number;
  skills: {
    aiming: number;
    positioning: number;
    utility: number;
    clutchFactor: number;
    teamplay: number;
  };
  behavioral: {
    chill: number;
    leadership: number;
    conflictScore: number;
  };
};
import { canCallProvider, markProviderFailure, markProviderSuccess, getCircuitStatus } from './aiCircuitBreaker';

type ScoutOutput = {
  tag?: 'Hidden Gem' | 'Prospect';
  summary?: string;
  scoreDelta?: number;
  source: 'heuristic' | 'gemini' | 'openai';
};

const getScoutConfig = () => ({
  provider: (process.env.AI_SCOUT_PROVIDER || 'gemini').trim().toLowerCase(),
  geminiKey: (process.env.GEMINI_API_KEY || '').trim(),
  openAiKey: (process.env.OPENAI_API_KEY || '').trim(),
  openAiBaseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').trim().replace(/\/+$/, '')
});

const basePrompt = (input: ScoutInput) => `
You are an esports scout assistant.
Return JSON only with fields: {"tag":"Hidden Gem|Prospect","summary":"string","scoreDelta":number}.
scoreDelta range: -8..8.
Input:
${JSON.stringify(input)}
`.trim();

const parseModelJson = (text: string): Omit<ScoutOutput, 'source'> | null => {
  try {
    const normalized = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '');
    const data = JSON.parse(normalized);
    if (!data || typeof data !== 'object') return null;
    const out: Omit<ScoutOutput, 'source'> = {};
    if (data.tag === 'Hidden Gem' || data.tag === 'Prospect') out.tag = data.tag;
    if (typeof data.summary === 'string' && data.summary.trim()) out.summary = data.summary.trim().slice(0, 1000);
    if (typeof data.scoreDelta === 'number' && Number.isFinite(data.scoreDelta)) {
      out.scoreDelta = Math.max(-8, Math.min(8, data.scoreDelta));
    }
    return out;
  } catch {
    return null;
  }
};

const callGemini = async (input: ScoutInput): Promise<ScoutOutput | null> => {
  const { geminiKey } = getScoutConfig();
  if (!canCallProvider('gemini')) return null;
  if (!geminiKey) return null;
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: basePrompt(input) }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 220
        }
      })
    });
    if (!response.ok) {
      markProviderFailure('gemini');
      return null;
    }
    const payload: any = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') {
      markProviderFailure('gemini');
      return null;
    }
    const parsed = parseModelJson(text);
    if (!parsed) {
      markProviderFailure('gemini');
      return null;
    }
    markProviderSuccess('gemini');
    console.info('[scout-ai] provider=gemini status=ok');
    return { ...parsed, source: 'gemini' };
  } catch {
    markProviderFailure('gemini');
    return null;
  }
};

const callOpenAI = async (input: ScoutInput): Promise<ScoutOutput | null> => {
  const { openAiKey, openAiBaseUrl } = getScoutConfig();
  if (!canCallProvider('openai')) return null;
  if (!openAiKey) return null;
  try {
    const response = await fetch(`${openAiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_SCOUT_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        messages: [{ role: 'user', content: basePrompt(input) }],
        max_tokens: 220
      })
    });
    if (!response.ok) {
      markProviderFailure('openai');
      return null;
    }
    const payload: any = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') {
      markProviderFailure('openai');
      return null;
    }
    const parsed = parseModelJson(text);
    if (!parsed) {
      markProviderFailure('openai');
      return null;
    }
    markProviderSuccess('openai');
    console.info('[scout-ai] provider=openai status=ok');
    return { ...parsed, source: 'openai' };
  } catch {
    markProviderFailure('openai');
    return null;
  }
};

export const getScoutProviderStatus = () => {
  const { provider, geminiKey, openAiKey } = getScoutConfig();
  return {
    provider,
    geminiEnabled: Boolean(geminiKey),
    openAiEnabled: Boolean(openAiKey),
    circuit: getCircuitStatus()
  };
};

export const generateAiScoutInsight = async (input: ScoutInput): Promise<ScoutOutput | null> => {
  try {
    const { provider } = getScoutConfig();
    if (provider === 'none') return null;
    if (provider === 'openai') return await callOpenAI(input);
    if (provider === 'gemini') return await callGemini(input);

    // auto mode/fallback
    return (await callGemini(input)) || (await callOpenAI(input));
  } catch {
    return null;
  }
};
