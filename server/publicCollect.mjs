/**
 * API-key-free public collectors: RSS + government notice list pages.
 */

const OFFICIAL_HOST_HINTS = [
  '.go.kr',
  '.or.kr',
  '.ac.kr',
  'gg.go.kr',
  'yongin.go.kr',
  'bokji.go.kr',
  'work.go.kr',
  'moel.go.kr',
  'mohw.go.kr',
  'nhis.or.kr',
  'kosaf.go.kr',
  'korea.kr',
];

const RSS_SOURCES = [
  {
    name: '대한민국 정책브리핑',
    url: 'https://www.korea.kr/rss/policy.xml',
    region_hint: '전국',
  },
];

const HTML_SOURCES = [
  {
    name: '복지로',
    url: 'https://www.bokji.go.kr',
    region_hint: '전국',
  },
  {
    name: '경기도청',
    url: 'https://www.gg.go.kr',
    region_hint: '경기도',
  },
  {
    name: '용인시청',
    url: 'https://www.yongin.go.kr',
    region_hint: '용인시',
  },
];

function looksLikeOfficial(url) {
  const u = String(url || '').toLowerCase();
  return OFFICIAL_HOST_HINTS.some((h) => u.includes(h));
}

function normalizeUrl(raw, baseUrl) {
  const s = String(raw || '').trim();
  if (!s) return '';
  try {
    const u = baseUrl ? new URL(s, baseUrl) : new URL(s);
    u.hash = '';
    return u.toString();
  } catch {
    return '';
  }
}

function stripXmlCdata(s) {
  return String(s || '').replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
}

function decodeHtml(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRssItems(xml, source) {
  const out = [];
  const txt = String(xml || '');
  const itemMatches = txt.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  for (const block of itemMatches) {
    const title = stripXmlCdata((block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const link = stripXmlCdata((block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || '');
    const desc = stripXmlCdata((block.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || '');
    const url = normalizeUrl(link);
    if (!url || !looksLikeOfficial(url)) continue;
    out.push({
      url,
      title: decodeHtml(title).slice(0, 240),
      snippet: decodeHtml(desc).slice(0, 500),
      region_hint: source.region_hint || '',
      source_label: source.name,
      source_type: 'rss',
    });
  }
  return out;
}

function parseHtmlLinks(html, source) {
  const out = [];
  const txt = String(html || '');
  const links = txt.match(/<a\b[^>]*href=["'][^"']+["'][^>]*>[\s\S]*?<\/a>/gi) || [];
  for (const a of links) {
    const href = (a.match(/href=["']([^"']+)["']/i) || [])[1] || '';
    const text = decodeHtml((a.match(/>([\s\S]*?)<\/a>/i) || [])[1] || '');
    const url = normalizeUrl(href, source.url);
    if (!url || !looksLikeOfficial(url)) continue;
    if (text.length < 2) continue;
    out.push({
      url,
      title: text.slice(0, 240),
      snippet: '',
      region_hint: source.region_hint || '',
      source_label: source.name,
      source_type: 'crawler',
    });
  }
  return out;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Link-Help Collector/1.0 (+https://github.com/HEO-J-H/link-help)',
      Accept: 'text/html,application/xml,text/xml;q=0.9,*/*;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`collect_http_${res.status}`);
  return await res.text();
}

function dedupeByUrl(items) {
  const m = new Map();
  for (const it of items) {
    if (!it || !it.url) continue;
    if (!m.has(it.url)) m.set(it.url, it);
  }
  return [...m.values()];
}

export function normalizeCandidateInput(row, sourceType = 'manual') {
  const url = normalizeUrl(row?.url || row?.link || row?.href || '');
  if (!url || !looksLikeOfficial(url)) return null;
  const title = decodeHtml(row?.title || '').slice(0, 240);
  const snippet = decodeHtml(row?.snippet || row?.description || '').slice(0, 500);
  const region_hint = decodeHtml(row?.region_hint || row?.regionHint || '').slice(0, 60);
  return {
    url,
    title,
    snippet,
    region_hint,
    source_type: sourceType,
    source_label: decodeHtml(row?.source_label || row?.source || '').slice(0, 80),
  };
}

export async function collectPublicCandidates(limitPerSource = 40) {
  const all = [];
  for (const s of RSS_SOURCES) {
    try {
      const xml = await fetchText(s.url);
      all.push(...parseRssItems(xml, s).slice(0, limitPerSource));
    } catch {
      // ignore per-source failure
    }
  }
  for (const s of HTML_SOURCES) {
    try {
      const html = await fetchText(s.url);
      all.push(...parseHtmlLinks(html, s).slice(0, limitPerSource));
    } catch {
      // ignore per-source failure
    }
  }
  return dedupeByUrl(all);
}
