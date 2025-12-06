// Внутренние URL браузера
export const INTERNAL_URLS = {
  history: 'axion://history',
  downloads: 'axion://downloads',
  settings: 'axion://settings',
  quicksites: 'axion://quicksites',
} as const;

// Константы для управления памятью
export const TAB_FREEZE_TIMEOUT = 5 * 60 * 1000; // 5 минут неактивности для заморозки
export const MAX_ACTIVE_TABS = 5; // Максимум активных (не замороженных) вкладок

// Поисковые системы
export const SEARCH_ENGINES = {
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
} as const;
