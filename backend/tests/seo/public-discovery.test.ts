import express from 'express';
import request from 'supertest';
import News from '../../src/models/News';
import Team from '../../src/models/Team';
import Tournament from '../../src/models/Tournament';
import User from '../../src/models/User';
import router from '../../src/routes/seo';
import { getPublicSiteUrl, safePublicUrl, serializeJsonLd, sitemapDate } from '../../src/utils/seo';

jest.mock('../../src/models/News', () => ({ __esModule: true, default: { find: jest.fn(), findById: jest.fn(), distinct: jest.fn() } }));
jest.mock('../../src/models/Team', () => ({ __esModule: true, default: { find: jest.fn(), findOne: jest.fn() } }));
jest.mock('../../src/models/Tournament', () => ({ __esModule: true, default: { find: jest.fn(), findById: jest.fn() } }));
jest.mock('../../src/models/User', () => ({ __esModule: true, default: { find: jest.fn(), findOne: jest.fn() } }));
jest.mock('../../src/services/playerPromotionService', () => ({ getPublicPromotionProfile: jest.fn(), listPublicPromotionSitemapEntries: jest.fn() }));

const app = express().use('/api/seo', router);
const origin = 'https://wayesports.space';
const id = '507f1f77bcf86cd799439011';
const query = (value: unknown) => {
  const result: any = { lean: jest.fn().mockResolvedValue(value) };
  for (const method of ['sort', 'select', 'limit', 'populate']) result[method] = jest.fn().mockReturnValue(result);
  return result;
};
const graphs = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(match => JSON.parse(match[1]));
const render = (path: string) => request(app).get('/api/seo/render').query({ path });
const originalEnv = { ...process.env };

beforeEach(() => {
  delete process.env.PUBLIC_WEB_URL;
  delete process.env.APP_URL;
  process.env.CORS_ORIGIN = '*';
  for (const model of [News, Team, Tournament, User]) (model.find as jest.Mock).mockReturnValue(query([]));
  (News.distinct as jest.Mock).mockResolvedValue([]);
  (News.findById as jest.Mock).mockReturnValue(query(null));
  (Tournament.findById as jest.Mock).mockReturnValue(query(null));
  (Team.findOne as jest.Mock).mockReturnValue(query(null));
  (User.findOne as jest.Mock).mockReturnValue(query(null));
});
afterAll(() => { process.env = originalEnv; });

test('homepage has parseable JSON-LD, text and all seven game links without JavaScript', async () => {
  const response = await render('/').set('Host', 'untrusted.invalid').expect(200);
  expect(response.text).toContain(`rel="canonical" href="${origin}/"`);
  expect(response.text).toContain('Browse public tournaments');
  expect((response.text.match(/href="https:\/\/wayesports.space\/games\//g) || []).length).toBe(7);
  expect(graphs(response.text).filter(item => item['@type'] === 'WebSite')).toHaveLength(1);
  expect(graphs(response.text).find(item => item['@type'] === 'Organization')['@id']).toBe(`${origin}/#organization`);
});

test('article includes full content, visible author and safe structured data', async () => {
  const title = 'Finals </script><script>alert(1)</script> & results';
  (News.findById as jest.Mock).mockReturnValue(query({ _id: id, title, status: 'published', summary: 'Short summary', content: '<p>Full match report beyond the summary.</p>', author: { username: 'Alice' }, coverImage: '/api/uploads/final.webp', publishDate: '2026-01-01T10:00:00Z' }));
  const response = await render(`/news/${id}?utm_source=share`).expect(200);
  expect(response.text).toContain('Full match report beyond the summary.');
  expect(response.text).toContain('By Alice');
  expect(response.text).toContain('property="og:image:type" content="image/webp"');
  expect(response.text).not.toContain('</script><script>alert');
  const article = graphs(response.text).find(item => item['@type'] === 'NewsArticle');
  expect(article.headline).toBe(title);
  expect(article.mainEntityOfPage).toBe(`${origin}/news/${id}`);
  expect(article.author.url).toBe(`${origin}/profile/Alice`);
  expect(article.image).toBe(`${origin}/api/uploads/final.webp`);
});

test('original URI header takes precedence over query and strips tracking parameters', async () => {
  const response = await render('/teams').set('X-Original-URI', '/news?path=/settings&utm_source=x').expect(200);
  expect(response.text).toContain(`rel="canonical" href="${origin}/news"`);
});

test.each(['/news/not-an-id', `/news/${id}/extra`, '/news/category', '/news/category/nonexistent', '/settings', '/missing-page', `/news/${id}`, `/teams/${id}`])('returns noindex 404 for absent or invalid page %s', async path => {
  await render(path).expect(404).expect('X-Robots-Tag', 'noindex');
});

test('draft articles are not exposed in crawler HTML', async () => {
  (News.findById as jest.Mock).mockReturnValue(query({ status: 'draft', title: 'Unpublished secret', content: 'Draft body' }));
  const response = await render(`/news/${id}`).expect(404);
  expect(response.text).not.toContain('Unpublished secret');
  expect(response.text).not.toContain('Draft body');
});

test('public team and player lookups retain visibility filters', async () => {
  await render(`/teams/${id}`).expect(404);
  expect(Team.findOne).toHaveBeenCalledWith({ _id: id, isPrivate: { $ne: true } });
  await render('/profile/Player%20One').expect(404);
  expect(User.findOne).toHaveBeenCalledWith({ username: 'Player One', isBanned: { $ne: true } });
  await render('/profile/%broken').expect(400);
});

test('sitemap index advertises public endpoints and the current About page', async () => {
  const index = await request(app).get('/api/seo/sitemap-index.xml').expect(200).expect('Content-Type', /xml/);
  expect(index.text).toContain(`${origin}/sitemaps/news.xml`);
  expect(index.text).toContain(`${origin}/sitemap-player-promotion.xml`);
  expect(index.text).not.toContain('<lastmod>');
  const core = await request(app).get('/api/seo/sitemaps/core.xml').expect(200);
  expect(core.text).toContain(`${origin}/about/`);
  expect(core.text).not.toContain(`${origin}/ru/about/`);
});

test('news sitemap uses publication filter and never invents modification dates', async () => {
  (News.find as jest.Mock).mockReturnValue(query([{ _id: id }, { _id: 'other', updatedAt: '2026-01-01' }]));
  const response = await request(app).get('/api/seo/sitemaps/news.xml').expect(200);
  expect(News.find).toHaveBeenCalledWith({ status: 'published' });
  expect(response.text).toContain(`/news/${id}</loc><changefreq>`);
  expect(response.text).toContain('<lastmod>2026-01-01T00:00:00.000Z</lastmod>');
});

test('RSS has absolute links, escaped text and publication dates', async () => {
  (News.find as jest.Mock).mockReturnValue(query([{ _id: id, title: 'A & B <final>', summary: 'Tournament recap', publishDate: '2026-01-01T10:00:00Z' }]));
  const response = await request(app).get('/api/seo/feed.xml').expect(200).expect('Content-Type', /rss\+xml/);
  expect(News.find).toHaveBeenCalledWith({ status: 'published' });
  expect(response.text).toContain('<title>A &amp; B &lt;final&gt;</title>');
  expect(response.text).toContain(`<link>${origin}/news/${id}</link>`);
  expect(response.text).toContain('<pubDate>Thu, 01 Jan 2026 10:00:00 GMT</pubDate>');
});

test('database failure cannot be cached as a successful discovery page', async () => {
  (News.find as jest.Mock).mockReturnValue({ sort: () => { throw new Error('offline'); } });
  await request(app).get('/api/seo/feed.xml').expect(503).expect('Cache-Control', 'no-store');
  await render('/').expect(500).expect('Cache-Control', 'no-store');
});

test('canonical origins, JSON-LD and dates reject malformed configuration', () => {
  process.env.CORS_ORIGIN = 'https://a.test,https://b.test';
  expect(getPublicSiteUrl()).toBe(origin);
  process.env.PUBLIC_WEB_URL = 'https://preview.example/path';
  expect(getPublicSiteUrl()).toBe('https://preview.example');
  process.env.PUBLIC_WEB_URL = 'javascript:alert(1)';
  expect(getPublicSiteUrl()).toBe(origin);
  const payload = { title: '</script>&\u2028' };
  expect(JSON.parse(serializeJsonLd(payload))).toEqual(payload);
  expect(serializeJsonLd(payload)).not.toContain('<');
  expect(safePublicUrl('javascript:alert(1)', origin)).toBe('');
  expect(sitemapDate('bad')).toBeUndefined();
  expect(sitemapDate(undefined)).toBeUndefined();
});
