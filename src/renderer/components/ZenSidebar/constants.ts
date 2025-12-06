import { QuickSite } from './types';

export const DEFAULT_QUICK_SITES: QuickSite[] = [
  { name: 'Google', url: 'https://google.com', color: '#4285f4' },
  { name: 'Twitter', url: 'https://twitter.com', color: '#1da1f2' },
  { name: 'Opera', url: 'https://opera.com', color: '#ff1b2d' },
  { name: 'Reddit', url: 'https://reddit.com', color: '#ff4500' },
  { name: 'GitHub', url: 'https://github.com', color: '#6e5494' },
  { name: 'YouTube', url: 'https://youtube.com', color: '#ff0000' },
];

// Предустановленные цвета для выбора
export const PRESET_COLORS = [
  '#4285f4', // Google Blue
  '#1da1f2', // Twitter Blue
  '#ff1b2d', // Opera Red
  '#ff4500', // Reddit Orange
  '#6e5494', // GitHub Purple
  '#ff0000', // YouTube Red
  '#25D366', // WhatsApp Green
  '#0077B5', // LinkedIn Blue
  '#E4405F', // Instagram Pink
  '#FF6900', // Firefox Orange
  '#7289DA', // Discord Purple
  '#1DB954', // Spotify Green
];

export const MIN_SIDEBAR_WIDTH = 180;
export const MAX_SIDEBAR_WIDTH = 400;
export const DEFAULT_SIDEBAR_WIDTH = 220;
