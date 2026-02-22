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

const buildPrompt = (input: SupportReplyInput): string => {
  const history = input.messages
    .slice(-12)
    .map((m) => `[${m.role}] ${m.content}`)
    .join('\n');

  return `
You are WAY ESPORTS emergency support assistant.
Rules:
- Reply in concise Russian if user text is Russian, otherwise concise English.
- Keep answer practical and directly actionable.
- If issue is account/payment/security-critical, ask user for only required details and tell admin will review.
- Do not ask for private keys or passwords.
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
      text: 'Понял проблему с 502. Проверь статус контейнеров `api/web/reverse-proxy`, затем логи reverse-proxy и api. Если нужно, передаю диалог админу для ручного ответа.'
    };
  }

  if (last.includes('login') || last.includes('логин') || last.includes('auth')) {
    return {
      provider: 'heuristic',
      text: 'Проверь, что токен сохранён в браузере и `/api/auth/*` отвечает без 5xx. Если вход всё равно не работает, укажи время ошибки и устройство — передам админу на ручную проверку.'
    };
  }

  if (last.includes('wallet') || last.includes('withdraw') || last.includes('вывод')) {
    return {
      provider: 'heuristic',
      text: 'По выводу средств: проверь сеть адреса (TRC20/ERC20/BEP20), минимальную сумму и статус заявки в Wallet. Я отмечу диалог для админ-проверки транзакции.'
    };
  }

  return {
    provider: 'heuristic',
    text: 'Принял запрос. Опиши проблему в формате: что делал → что ожидал → какая ошибка. Я дам точные шаги и при необходимости передам админу.'
  };
};

const callGemini = async (input: SupportReplyInput): Promise<SupportReplyResult | null> => {
  if (!geminiKey) return null;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: buildPrompt(input) }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 380 }
    })
  });

  if (!response.ok) return null;
  const payload: any = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string' || !text.trim()) return null;

  return {
    provider: 'gemini',
    text: text.trim().slice(0, 900)
  };
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

  if (!response.ok) return null;
  const payload: any = await response.json();
  const text = payload?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) return null;

  return {
    provider: 'openai',
    text: text.trim().slice(0, 900)
  };
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
        text: 'ИИ-ответ временно отключён. Ваш запрос передан в админ-панель для ручного ответа.'
      };
    }

    if (supportProvider === 'openai') {
      return (await callOpenAI(input)) || heuristicReply(input);
    }

    if (supportProvider === 'gemini') {
      return (await callGemini(input)) || heuristicReply(input);
    }

    return (await callGemini(input)) || (await callOpenAI(input)) || heuristicReply(input);
  } catch {
    return heuristicReply(input);
  }
};

