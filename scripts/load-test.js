#!/usr/bin/env node

/**
 * Lightweight HTTP load test (no external deps).
 * Usage:
 *   node scripts/load-test.js --url=http://localhost:3000/api/health --concurrency=50 --duration=30
 */

const args = process.argv.slice(2);
const getArg = (key, fallback) => {
  const prefixed = `--${key}=`;
  const matched = args.find((item) => item.startsWith(prefixed));
  if (!matched) return fallback;
  return matched.slice(prefixed.length);
};

const targetUrl = getArg('url', 'http://localhost:3000/api/health');
const concurrency = Math.max(1, Number.parseInt(getArg('concurrency', '25'), 10) || 25);
const durationSeconds = Math.max(1, Number.parseInt(getArg('duration', '20'), 10) || 20);
const timeoutMs = Math.max(1000, Number.parseInt(getArg('timeout', '10000'), 10) || 10000);

const deadline = Date.now() + durationSeconds * 1000;
const latency = [];
let total = 0;
let ok = 0;
let failed = 0;

const requestOnce = async () => {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetUrl, { method: 'GET', signal: controller.signal });
    total += 1;
    if (response.ok) {
      ok += 1;
    } else {
      failed += 1;
    }
    latency.push(Date.now() - startedAt);
  } catch {
    total += 1;
    failed += 1;
    latency.push(Date.now() - startedAt);
  } finally {
    clearTimeout(timer);
  }
};

const worker = async () => {
  while (Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop
    await requestOnce();
  }
};

const percentile = (values, p) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
};

(async () => {
  console.log(`[load-test] target=${targetUrl}`);
  console.log(`[load-test] concurrency=${concurrency} duration=${durationSeconds}s`);

  const startedAt = Date.now();
  await Promise.all(new Array(concurrency).fill(0).map(() => worker()));
  const elapsedSec = (Date.now() - startedAt) / 1000;

  const p50 = percentile(latency, 50);
  const p95 = percentile(latency, 95);
  const p99 = percentile(latency, 99);
  const avg = latency.length
    ? Math.round(latency.reduce((sum, value) => sum + value, 0) / latency.length)
    : 0;

  console.log('\n[load-test] done');
  console.log(`requests_total=${total}`);
  console.log(`requests_ok=${ok}`);
  console.log(`requests_failed=${failed}`);
  console.log(`rps=${(total / elapsedSec).toFixed(2)}`);
  console.log(`latency_avg_ms=${avg}`);
  console.log(`latency_p50_ms=${p50}`);
  console.log(`latency_p95_ms=${p95}`);
  console.log(`latency_p99_ms=${p99}`);
})();

