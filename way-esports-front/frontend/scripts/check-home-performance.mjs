import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

// Build first. Uses local Chromium/Edge and fixture API responses; no production traffic.
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const output = path.resolve(process.env.PERF_OUTPUT || path.join(root, 'logs', 'performance'));
const baseline = process.env.PERF_BASELINE === '1';
const browserPath = process.env.PERF_BROWSER || [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/chromium', '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].find(existsSync);
assert(browserPath, 'Set PERF_BROWSER to a Chromium/Chrome/Edge executable');
assert(existsSync(path.join(dist, 'index.html')), 'Run npm run build first');
await mkdir(output, { recursive: true });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const records = Array.from({ length: 4 }, (_, i) => ({
  id: `fixture-${i}`, title: `Tournament ${i + 1}`, name: `Team ${i + 1}`,
  game: 'critical-ops', status: 'upcoming', prizePool: 100,
  summary: 'Performance test fixture', stats: { winRate: 50 }
}));
const requests = [];
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      requests.push(url.pathname);
      const data = url.pathname === '/api/stats'
        ? { totalUsers: 1200, activeTournaments: 4, activeTeams: 12, totalPrizePool: 400 }
        : url.pathname === '/api/ui-settings/public' ? { backgroundPreset: 'auto' } : records;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, data }));
      return;
    }
    const filename = path.resolve(dist, `.${decodeURIComponent(url.pathname)}`);
    if (filename !== dist && !filename.startsWith(dist + path.sep)) { res.writeHead(403).end(); return; }
    const file = path.extname(filename) ? filename : path.join(dist, 'index.html');
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf', '.otf': 'font/otf' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const profile = await mkdtemp(path.join(os.tmpdir(), 'way-perf-'));
const browser = spawn(browserPath, [
  '--headless=new', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--enable-unsafe-swiftshader', 'about:blank'
], { windowsHide: true, stdio: 'ignore' });
let ws;
let id = 0;
const pending = new Map();
const errors = [];
let command;
try {
  let port;
  for (let attempt = 0; attempt < 150; attempt++) {
    try { port = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
    catch { await delay(100); }
  }
  assert(port, 'Browser did not start its debugging server');
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = event => {
    const msg = JSON.parse(event.data);
    if (msg.id) {
      const task = pending.get(msg.id);
      if (!task) return;
      clearTimeout(task.timeout);
      pending.delete(msg.id);
      msg.error ? task.reject(new Error(JSON.stringify(msg.error))) : task.resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.text);
    else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push(msg.params.args.map(arg => arg.value || arg.description).join(' '));
    }
  };
  command = (method, params = {}) => new Promise((resolve, reject) => {
    const messageId = ++id;
    const timeout = setTimeout(() => { pending.delete(messageId); reject(new Error(`Timed out: ${method}`)); }, 20000);
    pending.set(messageId, { resolve, reject, timeout });
    ws.send(JSON.stringify({ id: messageId, method, params }));
  });
  const evaluate = async expression => {
    const response = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    assert(!response.exceptionDetails, JSON.stringify(response.exceptionDetails));
    return response.result.value;
  };
  await command('Page.enable');
  await command('Runtime.enable');
  await command('Network.enable');
  await command('Network.setBlockedURLs', { urls: ['https://telegram.org/*', 'https://fonts.googleapis.com/*', 'https://fonts.gstatic.com/*'] });
  await command('Page.addScriptToEvaluateOnNewDocument', { source: `
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
    window.__draws = 0;
    window.__contexts = 0;
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type === 'webgl2' || type === 'webgl') window.__contexts++;
      return getContext.call(this, type, ...args);
    };
    if (window.WebGL2RenderingContext) {
      const draw = WebGL2RenderingContext.prototype.drawArrays;
      WebGL2RenderingContext.prototype.drawArrays = function(...args) {
        window.__draws++;
        return draw.apply(this, args);
      };
    }
  ` });
  const waitForHome = async () => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(`!!document.querySelector('main h1') && document.body.textContent.includes('Team directory')`)) return;
      await delay(100);
    }
    throw new Error('Landing page did not render');
  };
  const frameSample = () => evaluate(`new Promise(resolve => {
    const start = performance.now(), count = window.__draws;
    setTimeout(() => resolve({ frames: window.__draws - count, milliseconds: performance.now() - start }), 1000);
  })`);
  const snapshot = () => evaluate(`({
    canvases: [...document.querySelectorAll('canvas')].map(c => ({ width: c.width, height: c.height })),
    contexts: window.__contexts,
    gpuModuleLoaded: performance.getEntriesByType('resource').some(r => /PlasmaCanvas-/.test(r.name)),
    overflow: document.documentElement.scrollWidth > innerWidth,
    title: document.querySelector('main h1')?.textContent
  })`);
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
  await command('Page.navigate', { url: origin + '/' });
  await waitForHome();
  await delay(1000);
  const desktop = await snapshot();
  desktop.visible = await frameSample();
  if (!baseline) {
    assert.equal(desktop.canvases.length, 1, 'Desktop animation should be present');
    assert.equal(desktop.contexts, 1, 'Do not allocate a throwaway WebGL probe');
    assert(desktop.canvases[0].width <= 960 && desktop.canvases[0].height <= 540, 'Drawing buffer must stay capped');
    assert(desktop.visible.frames > 0 && desktop.visible.frames / desktop.visible.milliseconds * 1000 <= 32, 'Background should animate at <=30 FPS');
  }
  const dockBounds = () => evaluate(`(() => {
    const dock = document.querySelector('aside [role="toolbar"]');
    const buttons = dock.querySelectorAll('button');
    const first = buttons[0].getBoundingClientRect();
    return { height: dock.getBoundingClientRect().height, nextTop: buttons[1].getBoundingClientRect().top,
      x: first.left + first.width / 2, y: first.top + first.height / 2 };
  })()`);
  const beforeHover = await dockBounds();
  await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: beforeHover.x, y: beforeHover.y });
  await delay(500);
  const afterHover = await dockBounds();
  desktop.dockHeightChange = afterHover.height - beforeHover.height;
  desktop.neighborShift = afterHover.nextTop - beforeHover.nextTop;
  if (!baseline) {
    assert(Math.abs(desktop.dockHeightChange) < 1, 'Dock hover must not change layout height');
    assert(Math.abs(desktop.neighborShift) < 1, 'Dock hover must not move neighboring buttons');
  }
  console.log('Desktop:', JSON.stringify(desktop));
  if (process.env.PERF_SCREENSHOTS === '1') {
    await evaluate(`Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'))`);
    await delay(200);
    const screenshot = await command('Page.captureScreenshot', { format: 'png' });
    await writeFile(path.join(output, baseline ? 'before-desktop.png' : 'after-desktop.png'), Buffer.from(screenshot.data, 'base64'));
    await evaluate(`delete document.hidden; document.dispatchEvent(new Event('visibilitychange'))`);
  }
  await evaluate(`document.querySelector('main').scrollTop = document.querySelector('main').scrollHeight`);
  await delay(700);
  desktop.offscreen = await frameSample();
  if (!baseline) assert.equal(desktop.offscreen.frames, 0, 'Offscreen hero must stop rendering');
  await evaluate(`document.querySelector('main').scrollTop = 0`);
  await delay(700);
  desktop.resumed = await frameSample();
  if (!baseline) assert(desktop.resumed.frames > 0, 'Hero must resume after scrolling back');
  // Visibility events are deterministic here; the offscreen check above uses real scrolling.
  await evaluate(`Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'))`);
  desktop.hidden = await frameSample();
  if (!baseline) assert.equal(desktop.hidden.frames, 0, 'Hidden tab must stop rendering');
  await evaluate(`delete document.hidden; document.dispatchEvent(new Event('visibilitychange'))`);
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (let attempt = 0; attempt < 100 && !baseline; attempt++) {
    if (await evaluate(`document.querySelectorAll('canvas').length === 0`)) break;
    await delay(100);
  }
  const reducedMotion = await snapshot();
  if (!baseline) assert.equal(reducedMotion.canvases.length, 0, 'Reduced motion should release the canvas');
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await command('Emulation.setTouchEmulationEnabled', { enabled: true });
  await command('Page.navigate', { url: origin + '/' });
  await waitForHome();
  await delay(500);
  const mobile = await snapshot();
  mobile.visible = await frameSample();
  if (!baseline) {
    assert.equal(mobile.contexts, 0, 'Mobile must not allocate a WebGL context');
    assert.equal(mobile.gpuModuleLoaded, false, 'Mobile must not download the GPU renderer');
    assert.equal(mobile.visible.frames, 0, 'Mobile should use the static gradient');
    assert.equal(mobile.overflow, false, 'Mobile page must fit the viewport');
    assert.equal(errors.length, 0, errors.join('\n'));
  }
  if (process.env.PERF_SCREENSHOTS === '1') {
    await evaluate(`Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'))`);
    await delay(200);
    const mobileImage = await command('Page.captureScreenshot', { format: 'png' });
    await writeFile(path.join(output, baseline ? 'before-mobile.png' : 'after-mobile.png'), Buffer.from(mobileImage.data, 'base64'));
    await evaluate(`delete document.hidden; document.dispatchEvent(new Event('visibilitychange'))`);
  }
  const report = { baseline, desktop, reducedMotion, mobile, errors, requests };
  await writeFile(path.join(output, baseline ? 'before.json' : 'after.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log(`Artifacts: ${output}`);
} finally {
  if (command) await command('Browser.close').catch(() => {});
  ws?.close();
  browser.kill();
  server.close();
}
