export type { Language, Translations } from './types';
export { ru } from './ru';
export { en } from './en';
export { es } from './es';
export { fr } from './fr';
export { de } from './de';
export { zhCN } from './zh-CN';
export { pt } from './pt';
export { ja } from './ja';

import type { Language, Translations } from './types';
import { ru } from './ru';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { de } from './de';
import { zhCN } from './zh-CN';
import { pt } from './pt';
import { ja } from './ja';

export const translations: Record<Language, Translations> = {
  ru,
  en,
  es,
  fr,
  de,
  'zh-CN': zhCN,
  pt,
  ja,
};
