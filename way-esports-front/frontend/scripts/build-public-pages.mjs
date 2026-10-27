import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const origin = 'https://wayesports.space';
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const games = [['critical-ops', 'Critical Ops'], ['cs2', 'CS2'], ['pubg-mobile', 'PUBG Mobile'], ['valorant-mobile', 'Valorant Mobile'], ['dota-2', 'Dota 2'], ['standoff-2', 'Standoff 2'], ['mobile-legends-bang-bang', 'Mobile Legends: Bang Bang']];
const locales = [
  {
    lang: 'en', path: '/about/', locale: 'en_US',
    title: 'About WAY Esports | Tournaments, Teams and Player Discovery',
    description: 'Learn what WAY Esports offers: esports tournaments, team and player profiles, rankings, match information and news for mobile and PC games.',
    heading: 'One place to discover your next competition.',
    intro: 'WAY Esports is an esports platform for discovering tournaments, teams, player profiles, rankings, matches and news across mobile and PC games.',
    sections: [
      ['Discover tournaments', 'Browse tournament pages for schedules, game titles, formats, rules and registration availability. Each event has its own conditions; check its page before entering.', '/tournaments', 'Browse tournaments'],
      ['Find teams and players', 'Explore public team pages and player profiles. Registered users can create teams and use personal platform features. Public scouting profiles help players present their competitive experience.', '/teams', 'Explore teams'],
      ['Follow competition', 'Use rankings, match pages and published news to follow the activity available on the platform.', '/news', 'Read published news']
    ],
    gamesTitle: 'Explore by game',
    gamesCopy: 'These game hubs organize related tournaments, teams and news. Event availability depends on the current schedule.',
    faqTitle: 'Before you start',
    faq: [
      ['Can I browse without an account?', 'Yes. Public tournament, team, news and player discovery pages can be browsed before registration.'],
      ['When do I need an account?', 'Register or sign in to join tournaments, create a team and use personal profile features. Additional requirements are shown in the relevant feature or event.'],
      ['Where can I find the rules and dates?', 'Open the tournament page for its schedule, format, rules and registration information. Do not assume every event has the same eligibility or entry conditions.']
    ],
    aboutLabel: 'About', feedLabel: 'News RSS', home: 'Home'
  }
];

for (const page of locales) {
  const canonical = origin + page.path;
  const graph = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'Organization', '@id': origin + '/#organization', name: 'WAY Esports', url: origin, logo: origin + '/images/way-main-logo-metal-v2.jpg', description: page.intro },
      { '@type': 'WebSite', '@id': origin + '/#website', name: 'WAY Esports', url: origin, inLanguage: 'en', publisher: { '@id': origin + '/#organization' } },
      { '@type': 'AboutPage', '@id': canonical + '#page', url: canonical, name: page.title, description: page.description, inLanguage: page.lang, about: { '@id': origin + '/#organization' }, isPartOf: { '@id': origin + '/#website' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: page.home, item: origin + '/' },
        { '@type': 'ListItem', position: 2, name: page.aboutLabel, item: canonical }
      ] }
    ]
  };
  const html = `<!doctype html>
<html lang="${page.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(page.title)}</title><meta name="description" content="${escape(page.description)}"><meta name="robots" content="index, follow, max-image-preview:large"><meta name="theme-color" content="#080b10">
<link rel="canonical" href="${canonical}">
<link rel="alternate" type="application/rss+xml" title="WAY Esports News" href="${origin}/feed.xml"><link rel="icon" href="/images/way-main-logo-metal-v2.jpg" type="image/jpeg">
<meta property="og:type" content="website"><meta property="og:site_name" content="WAY Esports"><meta property="og:title" content="${escape(page.title)}"><meta property="og:description" content="${escape(page.description)}"><meta property="og:url" content="${canonical}"><meta property="og:locale" content="${page.locale}">
<meta property="og:image" content="${origin}/images/way-twitter-banner-bg.jpg"><meta property="og:image:width" content="1248"><meta property="og:image:height" content="832"><meta property="og:image:alt" content="WAY Esports"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(page.title)}"><meta name="twitter:description" content="${escape(page.description)}"><meta name="twitter:image" content="${origin}/images/way-twitter-banner-bg.jpg"><meta name="twitter:image:alt" content="WAY Esports">
<script type="application/ld+json">${json(graph)}</script>
<style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#080b10;color:#f4f6fa}*{box-sizing:border-box}body{margin:0;line-height:1.7}a{color:#ffad66;text-underline-offset:4px}a:focus-visible{outline:2px solid #ffad66;outline-offset:5px}header,main,footer{width:min(1080px,100% - 40px);margin:auto}header{display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between;padding:24px 0;border-bottom:1px solid #252a34}header>a{font-weight:800;text-decoration:none;color:inherit;letter-spacing:.1em}.hero{padding:70px 0 45px;max-width:850px}.eyebrow{color:#ffad66;text-transform:uppercase;letter-spacing:.15em;font-size:.8rem}h1{font-size:clamp(2.1rem,5vw,4rem);line-height:1.1;letter-spacing:-.04em;margin:20px 0}h2{line-height:1.25}p{color:#bfc6d2}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:20px}.card{padding:26px;border:1px solid #282e39;border-radius:20px;background:#11161e}.card h2{font-size:1.3rem;margin-top:0}.section{padding:35px 0}.games{display:flex;flex-wrap:wrap;gap:12px;padding:0;list-style:none}.games a{display:inline-block;padding:12px 18px;border-radius:12px;border:1px solid #4c3b2d;text-decoration:none}.faq{max-width:850px}.faq h3{margin-bottom:4px}.faq p{margin-top:4px}footer{padding:30px 0;border-top:1px solid #252a34;display:flex;flex-wrap:wrap;gap:24px}@media(max-width:600px){.hero{padding-top:40px}}
</style></head><body>
<header><a href="/">WAY ESPORTS</a></header>
<main><section class="hero"><p class="eyebrow">${escape(page.aboutLabel)} · WAY Esports</p><h1>${escape(page.heading)}</h1><p>${escape(page.intro)}</p></section>
<div class="grid">${page.sections.map(([title, copy, href, label]) => `<section class="card"><h2>${escape(title)}</h2><p>${escape(copy)}</p><a href="${href}">${escape(label)}</a></section>`).join('')}</div>
<section class="section"><h2>${escape(page.gamesTitle)}</h2><p>${escape(page.gamesCopy)}</p><ul class="games">${games.map(([slug, label]) => `<li><a href="/games/${slug}">${label}</a></li>`).join('')}</ul></section>
<section class="section faq"><h2>${escape(page.faqTitle)}</h2>${page.faq.map(([q, a]) => `<h3>${escape(q)}</h3><p>${escape(a)}</p>`).join('')}</section></main>
<footer><span>WAY Esports · wayesports.space</span><a href="/">${escape(page.home)}</a><a href="/feed.xml">${escape(page.feedLabel)}</a></footer></body></html>`;
  const dir = fileURLToPath(new URL('../dist' + page.path, import.meta.url));
  await mkdir(dir, { recursive: true });
  await writeFile(dir + 'index.html', html);
}
console.log('Generated public English About page.');
