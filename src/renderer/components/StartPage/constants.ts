import { Language } from '../../i18n';
import type { Translations } from '../../i18n';

export const languageToLocale: Record<Language, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  'zh-CN': 'zh-CN',
};

export const weatherCodeToKey: Record<number, keyof Translations['weather']> = {
  0: 'clear',
  1: 'mostlyClear',
  2: 'partlyCloudy',
  3: 'overcast',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  61: 'rain',
  71: 'snow',
  95: 'thunderstorm',
};

export const defaultSites = [
  { name: 'Google', url: 'https://google.com', icon: 'https://google.com/favicon.ico' },
  { name: 'YouTube', url: 'https://youtube.com', icon: 'https://youtube.com/favicon.ico' },
  { name: 'GitHub', url: 'https://github.com', icon: 'https://github.com/favicon.ico' },
  { name: 'Reddit', url: 'https://reddit.com', icon: 'https://reddit.com/favicon.ico' },
  { name: 'StackOverFlow', url: 'https://stackoverflow.com', icon: 'https://stackoverflow.com/favicon.ico' },
];
