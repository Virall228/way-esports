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

async function handleStart(chatId, payload) {
  if (payload && payload.startsWith('invite_team_')) {
    const teamId = payload.slice('invite_team_'.length);
    const link = `${WEBAPP_URL}/team/${encodeURIComponent(teamId)}`;
    await answerMessage(
      chatId,
      `Invite accepted.\nOpen team page and submit join request:\n${link}`
    );
    return;
  }

  if (payload && payload.startsWith('player_')) {
    const userId = payload.slice('player_'.length);
    const cardUrl = `${API_BASE_URL}/api/intelligence/telegram/player-card/${encodeURIComponent(userId)}.svg`;
    await answerMessage(
      chatId,
      `Player status card:\n${cardUrl}\n\nOpen platform: ${WEBAPP_URL}`
    );
    return;
  }

  await answerMessage(
    chatId,
    `WAY ESPORTS BOT\n\nCommands:\n/start\n/card\n/webapp\n\nOpen app: ${WEBAPP_URL}`
  );
}

async function handleCard(chatId, from) {
  const telegramId = from?.id;
  if (!telegramId) {
    await answerMessage(chatId, 'Unable to identify Telegram account.');
    return;
  }

  const card = await getPlayerCardByTelegramId(telegramId);
  if (!card) {
    await answerMessage(chatId, `No player card found yet. Open app and play matches first:\n${WEBAPP_URL}`);
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

  if (text.startsWith('/start')) {
    const payload = text.split(' ').slice(1).join(' ').trim();
    await handleStart(chatId, payload);
    return;
  }

  if (text === '/webapp') {
    await answerMessage(chatId, `Open WAY ESPORTS:\n${WEBAPP_URL}`, {
      reply_markup: {
        inline_keyboard: [[{ text: 'Open App', web_app: { url: WEBAPP_URL } }]]
      }
    });
    return;
  }

  if (text === '/card') {
    await handleCard(chatId, from);
    return;
  }

  if (text === '/status') {
    const card = await getPlayerCardByTelegramId(from?.id);
    const statusLine = card
      ? `Profile linked: @${card.username} (${card.points} points)`
      : 'Profile linked: no';
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
});

process.on('SIGINT', () => {
  polling = false;
  process.exit(0);
});

process.on('SIGTERM', () => {
  polling = false;
  process.exit(0);
});
