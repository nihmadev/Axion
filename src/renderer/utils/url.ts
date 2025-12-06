import { INTERNAL_URLS, SEARCH_ENGINES } from '../constants';
import { Settings } from '../types';

/**
 * Получение заголовка для внутренних страниц
 */
export const getInternalPageTitle = (url: string): string => {
  switch (url) {
    case INTERNAL_URLS.history: return 'История';
    case INTERNAL_URLS.downloads: return 'Загрузки';
    case INTERNAL_URLS.settings: return 'Настройки';
    default: return 'Axion';
  }
};

/**
 * Нормализация URL или поискового запроса
 */
export const normalizeUrl = (input: string, searchEngine: Settings['searchEngine']): string => {
  let s = input.trim();
  if (!s) return '';

  // Внутренние URL браузера
  if (s.startsWith('axion://')) {
    return s;
  }

  // Если уже есть протокол
  if (/^https?:\/\//i.test(s)) {
    return s;
  }

  // Если похоже на домен (есть точка и нет пробелов)
  if (s.includes('.') && !s.includes(' ')) {
    return 'https://' + s;
  }

  // Иначе это поисковый запрос
  return SEARCH_ENGINES[searchEngine] + encodeURIComponent(s);
};

/**
 * Проверка, является ли URL внутренним
 */
export const isInternalUrl = (url: string): boolean => {
  return url.startsWith('axion://');
};

/**
 * Извлечение поисковых запросов из истории
 */
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
