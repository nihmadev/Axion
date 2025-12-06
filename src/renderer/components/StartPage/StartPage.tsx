import React, { useState, useEffect, KeyboardEvent, useMemo } from 'react';
import { Settings } from '../../types';
import { Language, translations, type Translations } from '../../i18n';
import {
  SunIcon,
  CloudSunIcon,
  CloudIcon,
  CloudFogIcon,
  CloudDrizzleIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudLightningIcon,
} from '../ZenSidebar/icons';
import '../../styles/pages/start-page.css';

interface StartPageProps {
  settings: Settings;
  language?: Language;
  onNavigate: (url: string) => void;
  recentSites?: Array<{ url: string; title: string; favicon?: string }>;
  hiddenSites?: string[]; // URLs скрытых сайтов
  renamedSites?: Record<string, string>; // URL -> новое имя
  onHideSite?: (url: string) => void;
  onDeleteSite?: (url: string) => void;
  onRenameSite?: (url: string, newName: string) => void;
}

// Маппинг языка на локаль
const languageToLocale: Record<Language, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
};

// Хук для часов
const useClock = (format: '12h' | '24h', language: Language = 'ru') => {
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

interface WeatherData {
  temp: number;
  weatherCode: number;
  icon: React.ReactNode;
  location: string;
}

// Маппинг кодов погоды на ключи переводов
const weatherCodeToKey: Record<number, keyof Translations['weather']> = {
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

const defaultSites = [
  { name: 'Google', url: 'https://google.com', icon: 'https://www.google.com/favicon.ico' },
  { name: 'YouTube', url: 'https://youtube.com', icon: 'https://www.youtube.com/favicon.ico' },
  { name: 'GitHub', url: 'https://github.com', icon: 'https://github.com/favicon.ico' },
  { name: 'Reddit', url: 'https://reddit.com', icon: 'https://www.reddit.com/favicon.ico' },
  { name: 'StackOverFlow', url: 'https://stackoverflow.com', icon: 'https://stackoverflow.com/favicon.ico' }
];

const StartPage: React.FC<StartPageProps> = ({ 
  settings,
  language = 'ru',
  onNavigate, 
  recentSites = [],
  hiddenSites = [],
  renamedSites = {},
  onHideSite,
  onDeleteSite,
  onRenameSite,
}) => {
  const t = useMemo(() => translations[language], [language]);
  const locale = languageToLocale[language];
  
  const [searchValue, setSearchValue] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [renameIndex, setRenameIndex] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [searchWidth, setSearchWidth] = useState(600);
  
  const clock = useClock(settings.clockFormat || '24h', language);
  useEffect(() => {
    let mounted = true;
    
    const fetchWeather = async () => {
      try {
        // Получаем геолокацию через встроенный API браузера
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000 // Кэшируем на 5 минут
          });
        });

        if (!mounted) return;

        const { latitude, longitude } = position.coords;

        // Используем open-meteo.com - бесплатный API без ключа
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
        );

        if (!mounted) return;

        if (response.ok) {
          const data = await response.json();
          const weatherCode = data.current_weather.weathercode;
          
          // Маппинг кодов погоды на иконки
          const weatherIconMap: Record<number, React.ReactNode> = {
            0: <SunIcon size={32} />,
            1: <CloudSunIcon size={32} />,
            2: <CloudSunIcon size={32} />,
            3: <CloudIcon size={32} />,
            45: <CloudFogIcon size={32} />,
            48: <CloudFogIcon size={32} />,
            51: <CloudDrizzleIcon size={32} />,
            61: <CloudRainIcon size={32} />,
            71: <CloudSnowIcon size={32} />,
            95: <CloudLightningIcon size={32} />,
          };
          
          const icon = weatherIconMap[weatherCode] || weatherIconMap[0];
          
          // Получаем название города через обратное геокодирование
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=${locale}`
          );
          
          if (!mounted) return;
          
          const geoData = await geoResponse.json();
          const location = geoData.address?.city || geoData.address?.town || geoData.address?.village || t.common.unknown;

          setWeather({
            temp: Math.round(data.current_weather.temperature),
            weatherCode: weatherCode,
            icon: icon,
            location: location,
          });
        }
      } catch (error) {
        // Silently fail - weather is optional feature
        if (mounted) {
          console.debug('Weather unavailable:', error instanceof GeolocationPositionError ? 'Location denied' : 'Network error');
        }
      }
    };

    fetchWeather();
    
    return () => {
      mounted = false;
    };
  }, [locale, t.common.unknown]);

  // Расширение только когда текст подходит к краю
useEffect(() => {
  const measureTextWidth = (text: string) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.font = "16px Inter, Arial, sans-serif"; // тот же шрифт, что в .search-input
    return ctx.measureText(text).width;
  };

  const baseWidth = 600;
  const maxWidth = 900;
  const availableWidth = baseWidth - 120; // доступная ширина для текста (учёт иконки + отступов)

  const textWidth = measureTextWidth(searchValue);
  
  // Расширяем только если текст выходит за доступную ширину
  if (textWidth > availableWidth) {
    const overflow = textWidth - availableWidth;
    const newWidth = Math.min(baseWidth + overflow, maxWidth);
    setSearchWidth(newWidth);
  } else {
    // Возвращаем к базовой ширине если текст помещается
    setSearchWidth(baseWidth);
  }
}, [searchValue]);

  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      onNavigate(searchValue);
    }
  };

  // Функция для получения favicon
  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    } catch {
      return '';
    }
  };

  // Фильтруем скрытые сайты и применяем переименования
  const filteredSites = recentSites.length > 0 
    ? recentSites
        .filter(s => !hiddenSites.includes(s.url))
        .slice(0, 8)
        .map(s => ({ 
          name: renamedSites[s.url] || s.title || new URL(s.url).hostname, 
          url: s.url, 
          icon: s.favicon || getFaviconUrl(s.url)
        }))
    : defaultSites.filter(s => !hiddenSites.includes(s.url));
  
  const displaySites = filteredSites;

  const handleMenuClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === index ? null : index);
  };

  const handleDelete = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const site = displaySites[index];
    if (site && onDeleteSite) {
      onDeleteSite(site.url);
    }
    setActiveMenu(null);
  };

  const handleRename = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const site = displaySites[index];
    if (site) {
      setRenameIndex(index);
      setRenameValue(site.name);
    }
    setActiveMenu(null);
  };

  const handleRenameSubmit = (index: number) => {
    const site = displaySites[index];
    if (site && onRenameSite && renameValue.trim()) {
      onRenameSite(site.url, renameValue.trim());
    }
    setRenameIndex(null);
    setRenameValue('');
  };

  const handleRenameCancel = () => {
    setRenameIndex(null);
    setRenameValue('');
  };

  const handleHide = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const site = displaySites[index];
    if (site && onHideSite) {
      onHideSite(site.url);
    }
    setActiveMenu(null);
  };

  // Закрыть меню при клике вне его
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    if (activeMenu !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeMenu]);

  return (
    <div 
      className="start-page"
      style={{
        backgroundImage: settings.wallpaperUrl ? `url(${settings.wallpaperUrl})` : 'none',
        backgroundColor: settings.wallpaperUrl ? 'transparent' : (settings.theme === 'light' ? '#f5f5f7' : '#1e1e1e'),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="start-page-overlay" style={{
        background: `rgba(0, 0, 0, ${(settings.wallpaperDim || 20) / 100})`,
        backdropFilter: `blur(${settings.wallpaperBlur || 0}px)`,
      }} />
      
<div className="search-container-wrapper">
        <div className="search-container" style={{ width: `${searchWidth}px` }}>
        {/* Часы */}
        {settings.showClock && (
          <div className="clock-widget">
            <div className="clock-time">{clock.time}</div>
            <div className="clock-date">{clock.date}</div>
          </div>
        )}
        
        {/* Погода */}
        {settings.showWeather && weather && (
          <div className="weather-widget">
            <div className="weather-icon">{weather.icon}</div>
            <div className="weather-info">
              <div className="weather-temp">{weather.temp}°C</div>
              <div className="weather-desc">{t.weather[weatherCodeToKey[weather.weatherCode] || 'clear']}</div>
              <div className="weather-location">{weather.location}</div>
            </div>
          </div>
        )}
        
        {/* Поиск */}
        {settings.showSearchOnStartPage && (
          <div className="search-box">
            <div className="search-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <input
              type="text"
              className="search-input"
              placeholder={t.common.searchOrUrl}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearch}
              autoFocus
            />
          </div>
        )}
      </div>
    </div>

      {settings.showQuickSitesOnStartPage && displaySites.length > 0 && (
        <div className={`recent-sites recent-sites--${settings.quickSitesLayout || 'grid'}`}>
          <div className="recent-sites-grid">
            {displaySites.map((site, index) => (
              <div
                key={index}
                className="recent-site-item"
                onClick={() => onNavigate(site.url)}
              >
                <button
                  className="recent-site-menu-btn"
                  onClick={(e) => handleMenuClick(e, index)}
                  aria-label="Меню"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>
                
                {activeMenu === index && (
                  <div className="recent-site-menu">
                    <button onClick={(e) => handleRename(e, index)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Переименовать
                    </button>
                    <button onClick={(e) => handleHide(e, index)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                      Скрыть
                    </button>
                    <button onClick={(e) => handleDelete(e, index)} className="danger">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      Удалить
                    </button>
                  </div>
                )}

                <div className="recent-site-icon">
                  {site.icon && <img src={site.icon} alt={site.name} onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }} />}
                </div>
                {renameIndex === index ? (
                  <input
                    type="text"
                    className="recent-site-rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(index);
                      if (e.key === 'Escape') handleRenameCancel();
                    }}
                    onBlur={() => handleRenameSubmit(index)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <div className="recent-site-name">{site.name}</div>
                )}
              </div>
            ))}
        </div>
      </div>
      )}
    </div>
  );
};

export default StartPage;
