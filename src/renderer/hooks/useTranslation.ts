import { useMemo } from 'react';
import { translations, Language, Translations } from '../i18n';

export const useTranslation = (language: Language): Translations => {
  return useMemo(() => translations[language], [language]);
};
