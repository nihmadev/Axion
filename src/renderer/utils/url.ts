import { INTERNAL_URLS, SEARCH_ENGINES } from '../constants';
import { Settings } from '../types';

export const getInternalPageTitle = (url: string): string => {
  switch (url) {
    case INTERNAL_URLS.history: return 'История';
    case INTERNAL_URLS.downloads: return 'Загрузки';
    case INTERNAL_URLS.settings: return 'Настройки';
    default: return 'Axion';
  }
};

export const normalizeUrl = (input: string, searchEngine: Settings['searchEngine']): string => {
  let s = input.trim();
  if (!s) return '';

  if (s.startsWith('axion://')) {
    return s;
  }

  if (/^https?:\/\//.test(s)) {
    return s;
  }

  if (/^[a-zA-Z]:[\\\/]/.test(s) || s.startsWith('/')) {
    const normalizedPath = s.replace(/\\/g, '/');
    return 'file:///' + normalizedPath;
  }

  if (s.includes('.') && !s.includes(' ')) {
    return 'https://' + s;
  }

  return SEARCH_ENGINES[searchEngine] + encodeURIComponent(s);
};

export const isInternalUrl = (url: string): boolean => {
  return url.startsWith('axion://');
};

export const extractSearchQueries = (history: { url: string }[]): string[] => {
  const results: string[] = [];
  
  for (const h of history) {
    try {
      const u = new URL(h.url);
      const q = u.searchParams.get('q') || u.searchParams.get('text');
      if (q && (u.hostname.includes('google.') || u.hostname.includes('duckduckgo.com') || u.hostname.includes('bing.com'))) {
        results.push(decodeURIComponent(q));
      }
    } catch {}
    if (results.length > 32) break;
  }
  
  const seen = new Set<string>();
  return results.filter((s) => (seen.has(s) ? false : (seen.add(s), true))).slice(0, 8);
};
