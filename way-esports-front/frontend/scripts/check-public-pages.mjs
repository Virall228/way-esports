import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const origin = 'https://wayesports.space';
const dist = new URL('../dist/', import.meta.url);
const graphs = html => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  .flatMap(match => { const value = JSON.parse(match[1]); return value['@graph'] || value; });

for (const [path, lang] of [['about/', 'en'], ['ru/about/', 'ru']]) {
  const html = await readFile(new URL(path + 'index.html', dist), 'utf8');
  assert.ok(html.includes(`<html lang="${lang}">`));
  assert.ok(html.includes(`rel="canonical" href="${origin}/${path}"`));
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  for (const [locale, href] of [['en', '/about/'], ['ru', '/ru/about/'], ['x-default', '/about/']]) {
    assert.ok(html.includes(`hreflang="${locale}" href="${origin}${href}"`), `Missing alternate ${locale} on ${path}`);
  }
  assert.ok(graphs(html).some(item => item['@type'] === 'AboutPage' && item.inLanguage === lang));
  assert.equal((html.match(/href="\/games\//g) || []).length, 7);
  assert.ok(!/<script\b[^>]*\bsrc=/.test(html), 'About pages must be readable without JavaScript');
  assert.ok(!html.includes('\uFFFD'), 'Broken Unicode in public page');
  if (lang === 'ru') assert.ok(html.includes('киберспортивная платформа'));
  for (const match of html.matchAll(/(?:href|content)="(?:https:\/\/wayesports\.space)?(\/images\/[^"?]+)"/g)) {
    await access(new URL('.' + match[1], dist));
  }
  console.log(`PASS /${path}: HTML, locale, alternates, JSON-LD, game links, image assets`);
}
const home = await readFile(new URL('index.html', dist), 'utf8');
assert.equal(graphs(home).filter(item => item['@type'] === 'Organization').length, 1);
assert.ok(home.includes('Browse public pages before registering.'));
assert.ok(home.includes('href="/about/"'));
const robots = await readFile(new URL('robots.txt', dist), 'utf8');
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
assert.ok(robots.includes('Allow: /api/uploads/'));
console.log('PASS /: initial public content, JSON-LD, links and robots discovery');
