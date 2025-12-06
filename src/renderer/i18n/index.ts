export type { Language, Translations } from './types';
export { ru } from './ru';
export { en } from './en';
export { es } from './es';
export { fr } from './fr';
export { de } from './de';

import type { Language, Translations } from './types';
import { ru } from './ru';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { de } from './de';

export const translations: Record<Language, Translations> = {
  ru,
  en,
  es,
  fr,
  de,
};
