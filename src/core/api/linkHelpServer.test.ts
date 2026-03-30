import { describe, expect, it, vi, afterEach } from 'vitest';
import { discoverWebWelfare, normalizeApiBase } from './linkHelpServer';

describe('normalizeApiBase', () => {
  it('trims and strips trailing slashes', () => {
    expect(normalizeApiBase('  https://x.com/path/  ')).toBe('https://x.com/path');
  });
});

describe('discoverWebWelfare', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs query and returns JSON', async () => {
    const payload = {
      ok: true,
      source: 'google_cse',
      items: [{ title: 'T', link: 'https://a.go.kr/x', snippet: 'S', displayLink: 'a.go.kr' }],
      llm_summary: null,
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      })
    );
    const out = await discoverWebWelfare('http://localhost:8787', '청년 지원', { regionHint: '용인시' }, 'tok');
    expect(out.items).toHaveLength(1);
    expect(out.items[0].link).toBe('https://a.go.kr/x');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8787/welfare/discover-web',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer tok',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ query: '청년 지원', regionHint: '용인시', limit: undefined }),
      })
    );
  });
});
