// Внутренние URL браузера
export const INTERNAL_URLS = {
  history: 'axion://history',
  downloads: 'axion://downloads',
  settings: 'axion://settings',
  quicksites: 'axion://quicksites',
} as const;

// Константы для управления памятью
export const TAB_FREEZE_TIMEOUT = 3 * 60 * 1000; // 3 минуты неактивности для заморозки (уменьшено для экономии памяти)
export const MAX_ACTIVE_TABS = 4; // Максимум активных (не замороженных) вкладок (уменьшено для экономии памяти)

// Поисковые системы
export const SEARCH_ENGINES = {
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
} as const;
