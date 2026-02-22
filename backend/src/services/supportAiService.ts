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
};

type SupportReplyResult = {
  text: string;
  provider: 'gemini' | 'openai' | 'heuristic' | 'none';
};

const supportProvider = (process.env.SUPPORT_AI_PROVIDER || process.env.AI_SCOUT_PROVIDER || 'gemini')
  .trim()
  .toLowerCase();
const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
const openAiKey = (process.env.OPENAI_API_KEY || '').trim();

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];

const buildPrompt = (input: SupportReplyInput): string => {
  const history = input.messages
    .slice(-12)
    .map((m) => `[${m.role}] ${m.content}`)
    .join('\n');

  return `
You are WAY ESPORTS emergency support assistant.
Rules:
- If user text is Russian, answer in Russian. Else answer in English.
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
  const last = (input.messages[input.messages.length - 1]?.content || '').toLowerCase();

  if (last.includes('502') || last.includes('bad gateway')) {
    return {
      provider: 'heuristic',
      text: 'Понял проблему с 502. Проверь статус контейнеров api/web/reverse-proxy и логи reverse-proxy + api. Если нужно, передам запрос админу.'
    };
  }

  if (last.includes('login') || last.includes('логин') || last.includes('auth')) {
    return {
      provider: 'heuristic',
      text: 'Проверь токен авторизации в браузере и ответы /api/auth/* (без 5xx). Если не помогает — укажи устройство и точное время ошибки.'
    };
  }

  if (last.includes('wallet') || last.includes('withdraw') || last.includes('вывод')) {
    return {
      provider: 'heuristic',
      text: 'Проверь сеть кошелька (TRC20/ERC20/BEP20), минимальную сумму и статус заявки в Wallet. Я пометил запрос для админ-проверки.'
    };
  }

  return {
    provider: 'heuristic',
    text: 'Принял запрос. Опиши в формате: что сделал -> что ожидал -> какая ошибка. Дам точные шаги и при необходимости подключу админа.'
  };
};

const parseGeminiText = (payload: any): string | null => {
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  return trimmed ? trimmed.slice(0, 900) : null;
};

const callGeminiModel = async (model: string, input: SupportReplyInput): Promise<string | null> => {
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
  if (!geminiKey) return null;

  for (const model of GEMINI_MODELS) {
    const text = await callGeminiModel(model, input);
    if (text) {
      return { provider: 'gemini', text };
    }
  }

  return null;
};

const callOpenAI = async (input: SupportReplyInput): Promise<SupportReplyResult | null> => {
  if (!openAiKey) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    return null;
  }

  const payload: any = await response.json();
  const text = payload?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) return null;
  return { provider: 'openai', text: text.trim().slice(0, 900) };
};

export const getSupportAiStatus = () => ({
  provider: supportProvider,
  geminiEnabled: Boolean(geminiKey),
  openAiEnabled: Boolean(openAiKey)
});

export const generateSupportReply = async (input: SupportReplyInput): Promise<SupportReplyResult> => {
  try {
    if (supportProvider === 'none') {
      return {
        provider: 'none',
        text: 'ИИ-ответ временно отключен. Запрос доступен админу для ручного ответа.'
      };
    }

    if (supportProvider === 'openai') {
      return (await callOpenAI(input)) || heuristicReply(input);
    }

    if (supportProvider === 'gemini') {
      return (await callGemini(input)) || heuristicReply(input);
    }

    return (await callGemini(input)) || (await callOpenAI(input)) || heuristicReply(input);
  } catch (error: any) {
    console.error('[support-ai] unexpected failure', error?.message || error);
    return heuristicReply(input);
  }
};

