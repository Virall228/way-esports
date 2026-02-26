/* eslint-disable no-console */
const http = require('http');
const { URL } = require('url');

const BOT_TOKEN = String(process.env.TELEGRAM_BOT_TOKEN || '').trim();
const API_BASE_URL = String(process.env.API_BASE_URL || 'https://wayesports.duckdns.org').replace(/\/+$/, '');
const WEBAPP_URL = String(process.env.WEBAPP_URL || 'https://wayesports.duckdns.org').replace(/\/+$/, '');
const POLL_TIMEOUT_SEC = Math.max(10, Number(process.env.POLL_TIMEOUT_SEC || 30));
const PORT = Number(process.env.PORT || 8080);
const USE_WEBHOOK = ['1', 'true', 'yes'].includes(String(process.env.USE_WEBHOOK || '').toLowerCase());
const WEBHOOK_PATH = String(process.env.WEBHOOK_PATH || '/telegram/webhook').trim() || '/telegram/webhook';
const WEBHOOK_SECRET = String(process.env.WEBHOOK_SECRET || '').trim();
const WEBHOOK_PUBLIC_URL = String(process.env.WEBHOOK_PUBLIC_URL || '').trim().replace(/\/+$/, '');

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const TG_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;
let lastUpdateId = 0;
let polling = true;

const SUPPORTED_LANGS = new Set(['en', 'ru', 'uk', 'es', 'de', 'fr', 'it', 'pt', 'tr', 'ar', 'hi']);

const I18N = {
  en: {
    welcomeTitle: 'WAY ESPORTS BOT',
    welcome: 'Welcome to WAY ESPORTS. Use quick commands or open app directly.',
    commands: 'Commands',
    openApp: 'Open app',
    quick: 'Quick sections',
    openLabel: 'Open App',
    tournaments: 'Tournaments',
    wallet: 'Wallet',
    analytics: 'Analytics',
    support: 'Support',
    profile: 'Profile',
    cardMissing: 'No player card found yet. Open app and play matches first:',
    cardUnavailable: 'Unable to identify Telegram account.',
    inviteAccepted: 'Invite accepted.\nOpen team page and submit join request:',
    playerCard: 'Player status card',
    statusLinked: 'Profile linked',
    statusNo: 'no'
  },
  ru: {
    welcomeTitle: 'БОТ WAY ESPORTS',
    welcome: 'Добро пожаловать в WAY ESPORTS. Используйте быстрые команды или откройте приложение.',
    commands: 'Команды',
    openApp: 'Открыть приложение',
    quick: 'Быстрые разделы',
    openLabel: 'Открыть App',
    tournaments: 'Турниры',
    wallet: 'Кошелек',
    analytics: 'Аналитика',
    support: 'Поддержка',
    profile: 'Профиль',
    cardMissing: 'Карточка игрока пока не найдена. Откройте приложение и сыграйте матчи:',
    cardUnavailable: 'Не удалось определить Telegram-аккаунт.',
    inviteAccepted: 'Инвайт принят.\nОткрой страницу команды и отправь запрос на вступление:',
    playerCard: 'Карточка игрока',
    statusLinked: 'Профиль привязан',
    statusNo: 'нет'
  }
};

const pickLang = (from) => {
  const raw = String(from?.language_code || 'en').toLowerCase();
  const short = raw.split('-')[0];
  if (!SUPPORTED_LANGS.has(short)) return 'en';
  if (!I18N[short]) return 'en';
  return short;
};

const t = (lang, key) => (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;

const appUrl = (path = '') => {
  if (!path) return WEBAPP_URL;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${WEBAPP_URL}${normalized}`;
};

async function ensureTelegramReachability() {
  const healthUrl = `${API_BASE_URL}/api/health`;
  const response = await fetch(healthUrl, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`API health check failed (${response.status})`);
  }
}

async function tg(method, payload) {
  const res = await fetch(`${TG_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {})
  });
  const json = await res.json();
  if (!json.ok) {
    throw new Error(`Telegram API error (${method}): ${json.description || 'unknown'}`);
  }
  return json.result;
}

async function answerMessage(chatId, text, options = {}) {
  await tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...options
  });
}

async function getPlayerCardByTelegramId(telegramId) {
  const url = new URL('/api/rankings/leaderboard', API_BASE_URL);
  const leaderboardRes = await fetch(url.toString());
  if (!leaderboardRes.ok) return null;
  const leaderboardJson = await leaderboardRes.json();
  const rows = leaderboardJson?.data || leaderboardJson || [];
  const found = Array.isArray(rows)
    ? rows.find((r) => String(r?.telegramId || '') === String(telegramId))
    : null;
  const userId = found?.id || found?._id;
  if (!userId) return null;

  const cardRes = await fetch(`${API_BASE_URL}/api/intelligence/telegram/player-card/${encodeURIComponent(userId)}`);
  if (!cardRes.ok) return null;
  const cardJson = await cardRes.json();
  return cardJson?.data || null;
}

async function sendQuickMenu(chatId, lang) {
  await answerMessage(chatId, `${t(lang, 'quick')}:`, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: t(lang, 'openLabel'), web_app: { url: appUrl('/') } },
          { text: t(lang, 'tournaments'), url: appUrl('/tournaments') }
        ],
        [
          { text: t(lang, 'wallet'), url: appUrl('/wallet') },
          { text: t(lang, 'analytics'), url: appUrl('/analytics') }
        ],
        [
          { text: t(lang, 'support'), url: appUrl('/support') },
          { text: t(lang, 'profile'), url: appUrl('/profile') }
        ]
      ]
    }
  });
}

async function handleStart(chatId, payload, from) {
  const lang = pickLang(from);
  if (payload && payload.startsWith('invite_team_')) {
    const teamId = payload.slice('invite_team_'.length);
    const link = appUrl(`/team/${encodeURIComponent(teamId)}`);
    await answerMessage(
      chatId,
      `${t(lang, 'inviteAccepted')}\n${link}`
    );
    return;
  }

  if (payload && payload.startsWith('player_')) {
    const userId = payload.slice('player_'.length);
    const cardUrl = `${API_BASE_URL}/api/intelligence/telegram/player-card/${encodeURIComponent(userId)}.svg`;
    await answerMessage(
      chatId,
      `${t(lang, 'playerCard')}:\n${cardUrl}\n\n${t(lang, 'openApp')}: ${WEBAPP_URL}`
    );
    return;
  }

  await answerMessage(
    chatId,
    `${t(lang, 'welcomeTitle')}\n\n${t(lang, 'welcome')}\n\n${t(lang, 'commands')}:\n/start\n/menu\n/webapp\n/tournaments\n/wallet\n/analytics\n/support\n/profile\n/card\n\n${t(lang, 'openApp')}: ${WEBAPP_URL}`
  );
  await sendQuickMenu(chatId, lang);
}

async function handleCard(chatId, from) {
  const lang = pickLang(from);
  const telegramId = from?.id;
  if (!telegramId) {
    await answerMessage(chatId, t(lang, 'cardUnavailable'));
    return;
  }

  const card = await getPlayerCardByTelegramId(telegramId);
  if (!card) {
    await answerMessage(chatId, `${t(lang, 'cardMissing')}\n${WEBAPP_URL}`);
    return;
  }

  const svgUrl = `${API_BASE_URL}/api/intelligence/telegram/player-card/${encodeURIComponent(card.userId)}.svg`;
  await answerMessage(
    chatId,
    `@${card.username}\nPoints: ${card.points}\nWin rate: ${card.winRate}%\nCard:\n${svgUrl}`
  );
}

async function handleInlineQuery(inlineQuery) {
  const from = inlineQuery?.from || {};
  const telegramId = from.id;
  const card = telegramId ? await getPlayerCardByTelegramId(telegramId) : null;
  const articles = [];

  if (card?.userId) {
    const svgUrl = `${API_BASE_URL}/api/intelligence/telegram/player-card/${encodeURIComponent(card.userId)}.svg`;
    articles.push({
      type: 'article',
      id: `card_${card.userId}`,
      title: `Share ${card.username} status card`,
      description: `Points ${card.points} • WR ${card.winRate}%`,
      input_message_content: {
        message_text: `WAY ESPORTS STATUS CARD\n@${card.username}\nPoints: ${card.points}\nWin rate: ${card.winRate}%\n${svgUrl}`
      }
    });
  } else {
    articles.push({
      type: 'article',
      id: 'open_app',
      title: 'Open WAY ESPORTS',
      description: 'Create profile and matches to enable status card',
      input_message_content: {
        message_text: `Open WAY ESPORTS: ${WEBAPP_URL}`
      }
    });
  }

  await tg('answerInlineQuery', {
    inline_query_id: inlineQuery.id,
    results: articles,
    cache_time: 5,
    is_personal: true
  });
}

async function handleUpdate(update) {
  if (update.inline_query) {
    await handleInlineQuery(update.inline_query);
    return;
  }

  const message = update.message;
  if (!message || !message.chat) return;
  const chatId = message.chat.id;
  const text = String(message.text || '').trim();
  const from = message.from || {};
  const lang = pickLang(from);
  const command = text.split(/\s+/)[0].split('@')[0].toLowerCase();

  if (command === '/start') {
    const payload = text.split(' ').slice(1).join(' ').trim();
    await handleStart(chatId, payload, from);
    return;
  }

  if (command === '/menu') {
    await sendQuickMenu(chatId, lang);
    return;
  }

  if (command === '/webapp') {
    await answerMessage(chatId, `${t(lang, 'openApp')}:\n${WEBAPP_URL}`, {
      reply_markup: {
        inline_keyboard: [[{ text: t(lang, 'openLabel'), web_app: { url: WEBAPP_URL } }]]
      }
    });
    return;
  }

  if (command === '/tournaments') {
    await answerMessage(chatId, `${t(lang, 'tournaments')}:\n${appUrl('/tournaments')}`);
    return;
  }

  if (command === '/wallet') {
    await answerMessage(chatId, `${t(lang, 'wallet')}:\n${appUrl('/wallet')}`);
    return;
  }

  if (command === '/analytics') {
    await answerMessage(chatId, `${t(lang, 'analytics')}:\n${appUrl('/analytics')}`);
    return;
  }

  if (command === '/support') {
    await answerMessage(chatId, `${t(lang, 'support')}:\n${appUrl('/support')}`);
    return;
  }

  if (command === '/profile') {
    await answerMessage(chatId, `${t(lang, 'profile')}:\n${appUrl('/profile')}`);
    return;
  }

  if (command === '/card') {
    await handleCard(chatId, from);
    return;
  }

  if (command === '/status') {
    const card = await getPlayerCardByTelegramId(from?.id);
    const statusLine = card
      ? `${t(lang, 'statusLinked')}: @${card.username} (${card.points} points)`
      : `${t(lang, 'statusLinked')}: ${t(lang, 'statusNo')}`;
    await answerMessage(
      chatId,
      `Bot status: OK\nMode: ${USE_WEBHOOK ? 'webhook' : 'polling'}\n${statusLine}\nWebApp: ${WEBAPP_URL}`
    );
    return;
  }
}

async function pollLoop() {
  while (polling) {
    try {
      const result = await tg('getUpdates', {
        timeout: POLL_TIMEOUT_SEC,
        offset: lastUpdateId ? lastUpdateId + 1 : undefined,
        allowed_updates: ['message', 'inline_query']
      });

      for (const update of result || []) {
        lastUpdateId = update.update_id;
        try {
          await handleUpdate(update);
        } catch (error) {
          console.error('Failed to process update:', error.message);
        }
      }
    } catch (error) {
      console.error('Polling error:', error.message);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

const healthServer = http.createServer((req, res) => {
  if (USE_WEBHOOK && req.url && req.url.startsWith(WEBHOOK_PATH) && req.method === 'POST') {
    const token = String(req.headers['x-telegram-bot-api-secret-token'] || '');
    if (WEBHOOK_SECRET && token !== WEBHOOK_SECRET) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Unauthorized webhook token' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString('utf8');
      if (body.length > 2_000_000) {
        req.destroy();
      }
    });
    req.on('end', async () => {
      try {
        const update = JSON.parse(body || '{}');
        await handleUpdate(update);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (error) {
        console.error('Webhook update error:', error.message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false }));
      }
    });
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      mode: USE_WEBHOOK ? 'webhook' : 'polling',
      webhookPath: WEBHOOK_PATH,
      lastUpdateId,
      polling
    }));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Not found' }));
});

healthServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Bot health server on ${PORT}`);
  console.log(`API_BASE_URL=${API_BASE_URL}`);
  console.log(`WEBAPP_URL=${WEBAPP_URL}`);
  void ensureTelegramReachability().catch((error) => {
    console.error('Startup API reachability check failed:', error.message);
  });
  if (USE_WEBHOOK) {
    if (!WEBHOOK_PUBLIC_URL) {
      console.error('WEBHOOK_PUBLIC_URL is required when USE_WEBHOOK=true');
    } else {
      const webhookUrl = `${WEBHOOK_PUBLIC_URL}${WEBHOOK_PATH}`;
      tg('setWebhook', {
        url: webhookUrl,
        secret_token: WEBHOOK_SECRET || undefined,
        allowed_updates: ['message', 'inline_query']
      })
        .then(() => console.log(`Webhook set: ${webhookUrl}`))
        .catch((error) => console.error('Failed to set webhook:', error.message));
    }
  } else {
    void pollLoop();
  }

  tg('setMyCommands', {
    commands: [
      { command: 'start', description: 'Welcome + quick menu' },
      { command: 'menu', description: 'Quick sections' },
      { command: 'webapp', description: 'Open app' },
      { command: 'tournaments', description: 'Open tournaments' },
      { command: 'wallet', description: 'Open wallet' },
      { command: 'analytics', description: 'Open analytics' },
      { command: 'support', description: 'Open support' },
      { command: 'profile', description: 'Open profile' },
      { command: 'card', description: 'Show status card' },
      { command: 'status', description: 'Bot health status' }
    ]
  }).catch((error) => console.error('Failed to set bot commands:', error.message));
});

process.on('SIGINT', () => {
  polling = false;
  process.exit(0);
});

process.on('SIGTERM', () => {
  polling = false;
  process.exit(0);
});
