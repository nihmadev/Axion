import { useState, useEffect } from 'react';
import { Language } from '../../../i18n';
import { languageToLocale } from '../constants';

export const useClock = (format: '12h' | '24h', language: Language = 'ru') => {
  const locale = languageToLocale[language];
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const formatTime = () => {
    if (format === '12h') {
      return time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  
  const formatDate = () => {
    return time.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  };
  
  return { time: formatTime(), date: formatDate() };
};
