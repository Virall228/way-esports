import { canCallProvider, getCircuitStatus, markProviderFailure, markProviderSuccess } from './aiCircuitBreaker';

type SupportRole = 'user' | 'ai' | 'admin' | 'system';

type SupportContextMessage = {
  role: SupportRole;
  content: string;
  createdAt?: string | Date;
};

type SupportReplyInput = {
  username: string;
  subject?: string;
  messages: SupportContextMessage[];
  preferredLanguage?: 'en' | 'ru';
};

type SupportReplyResult = {
  text: string;
  provider: 'gemini' | 'openai' | 'heuristic' | 'none';
};

const getSupportConfig = () => {
  const provider = (process.env.SUPPORT_AI_PROVIDER || process.env.AI_SCOUT_PROVIDER || 'gemini')
    .trim()
    .toLowerCase();
  const geminiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''
  ).trim();
  const openAiKey = (process.env.OPENAI_API_KEY || '').trim();
  const openAiBaseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
  return { provider, geminiKey, openAiKey, openAiBaseUrl };
};

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];

const buildPrompt = (input: SupportReplyInput): string => {
  const history = input.messages
    .slice(-12)
    .map((m) => `[${m.role}] ${m.content}`)
    .join('\n');

  const languageInstruction = input.preferredLanguage === 'ru'
    ? 'Reply language: Russian only.'
    : 'Reply language: English only.';

  return `
You are WAY ESPORTS emergency support assistant.
Rules:
- ${languageInstruction}
- Be concise and practical.
- Give clear next actions.
- Never ask for private keys or passwords.
- Max 900 characters.

User: ${input.username}
Subject: ${input.subject || 'Emergency Support'}
Chat history:
${history}
`.trim();
};

const heuristicReply = (input: SupportReplyInput): SupportReplyResult => {
  const lastRaw = String(input.messages[input.messages.length - 1]?.content || '');
  const last = lastRaw.toLowerCase();
  const hasCyrillic = input.preferredLanguage
    ? input.preferredLanguage === 'ru'
    : /[\u0400-\u04FF]/.test(lastRaw);

  const msg = (en: string, ru: string) => (hasCyrillic ? ru : en);

  if (last.includes('502') || last.includes('bad gateway')) {
    return {
      provider: 'heuristic',
      text: msg(
        'Detected 502 Bad Gateway. Check api/web/reverse-proxy container status, then inspect reverse-proxy and api logs. Send the last 100 lines if needed.',
        'Обнаружен 502 Bad Gateway. Проверь статус контейнеров api/web/reverse-proxy, затем логи reverse-proxy и api. При необходимости отправь последние 100 строк.'
      )
    };
  }

  if (last.includes('login') || last.includes('auth') || last.includes('вход') || last.includes('логин')) {
    return {
      provider: 'heuristic',
      text: msg(
        'Looks like an authentication issue. Check /api/auth/* calls in DevTools and response status (especially 4xx/5xx). Send exact status code and response body.',
        'Похоже на проблему авторизации. Проверь запросы /api/auth/* в DevTools и их статус (особенно 4xx/5xx). Отправь точный код и тело ответа.'
      )
    };
  }

  if (
    last.includes('wallet') ||
    last.includes('withdraw') ||
    last.includes('кошел') ||
    last.includes('вывод')
  ) {
    return {
      provider: 'heuristic',
      text: msg(
        'Check network (TRC20/ERC20/BEP20), wallet address format, and minimum withdrawal limit. In admin panel, verify transaction status and rejection reason.',
        'Проверь сеть (TRC20/ERC20/BEP20), формат адреса и минимальный лимит вывода. В админке проверь статус транзакции и причину отклонения.'
      )
    };
  }

  return {
    provider: 'heuristic',
    text: msg(
      'Request received. Describe issue as: what you did -> what you expected -> actual error. I will provide exact steps and escalate to admin when needed.',
      'Запрос принят. Опиши проблему в формате: что сделал -> что ожидал -> какая ошибка. Я дам точные шаги и передам администратору при необходимости.'
    )
  };
};

const parseGeminiText = (payload: any): string | null => {
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  return trimmed ? trimmed.slice(0, 900) : null;
};

const callGeminiModel = async (model: string, geminiKey: string, input: SupportReplyInput): Promise<string | null> => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: buildPrompt(input) }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 420 }
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error(`[support-ai] gemini failed model=${model} status=${response.status} body=${body.slice(0, 400)}`);
    return null;
  }

  const payload: any = await response.json();
  return parseGeminiText(payload);
};

const callGemini = async (input: SupportReplyInput): Promise<SupportReplyResult | null> => {
  const { geminiKey } = getSupportConfig();
  if (!canCallProvider('gemini')) return null;
  if (!geminiKey) return null;

  for (const model of GEMINI_MODELS) {
    const text = await callGeminiModel(model, geminiKey, input);
    if (text) {
      markProviderSuccess('gemini');
      console.info(`[support-ai] provider=gemini model=${model} status=ok`);
      return { provider: 'gemini', text };
    }
  }

  markProviderFailure('gemini');
  return null;
};

const callOpenAI = async (input: SupportReplyInput): Promise<SupportReplyResult | null> => {
  const { openAiKey, openAiBaseUrl } = getSupportConfig();
  if (!canCallProvider('openai')) return null;
  if (!openAiKey) return null;

  const response = await fetch(`${openAiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_SUPPORT_MODEL || process.env.OPENAI_SCOUT_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 420,
      messages: [{ role: 'user', content: buildPrompt(input) }]
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error(`[support-ai] openai failed status=${response.status} body=${body.slice(0, 400)}`);
    markProviderFailure('openai');
    return null;
  }

  const payload: any = await response.json();
  const text = payload?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    markProviderFailure('openai');
    return null;
  }
  markProviderSuccess('openai');
  console.info('[support-ai] provider=openai status=ok');
  return { provider: 'openai', text: text.trim().slice(0, 900) };
};

export const getSupportAiStatus = () => {
  const { provider, geminiKey, openAiKey } = getSupportConfig();
  return {
    provider,
    geminiEnabled: Boolean(geminiKey),
    openAiEnabled: Boolean(openAiKey),
    circuit: getCircuitStatus()
  };
};

export const generateSupportReply = async (input: SupportReplyInput): Promise<SupportReplyResult> => {
  try {
    const { provider } = getSupportConfig();
    if (provider === 'none') {
      return {
        provider: 'none',
        text: 'AI reply is temporarily disabled. Your request has been routed to admin for manual response.'
      };
    }

    if (provider === 'openai') {
      return (await callOpenAI(input)) || heuristicReply(input);
    }

    if (provider === 'gemini') {
      return (await callGemini(input)) || heuristicReply(input);
    }

    return (await callGemini(input)) || (await callOpenAI(input)) || heuristicReply(input);
  } catch (error: any) {
    console.error('[support-ai] unexpected failure', error?.message || error);
    return heuristicReply(input);
  }
};
