import React, { useState, useMemo } from 'react';
import { translations } from '../../i18n';
import '../../styles/pages/start-page.css';

import { StartPageProps } from './types';
import { defaultSites } from './constants';
import { useClock, useWeather, useSearchWidth } from './hooks';
import { ClockWidget, WeatherWidget, SearchBox, QuickSites } from './components';

// Функция для получения favicon
const getFaviconUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
  } catch {
    return '';
  }
};

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
  const [searchValue, setSearchValue] = useState('');
  
  const clock = useClock(settings.clockFormat || '24h', language);
  const weather = useWeather(language);
  const searchWidth = useSearchWidth(searchValue);

  // Фильтруем скрытые сайты и применяем переименования
  const displaySites = useMemo(() => {
    if (recentSites.length > 0) {
      return recentSites
        .filter(s => !hiddenSites.includes(s.url))
        .slice(0, 8)
        .map(s => ({ 
          name: renamedSites[s.url] || s.title || new URL(s.url).hostname, 
          url: s.url, 
          icon: s.favicon || getFaviconUrl(s.url)
        }));
    }
    return defaultSites.filter(s => !hiddenSites.includes(s.url));
  }, [recentSites, hiddenSites, renamedSites]);

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
          {settings.showClock && (
            <ClockWidget time={clock.time} date={clock.date} />
          )}
          
          {settings.showWeather && weather && (
            <WeatherWidget weather={weather} t={t} />
          )}
          
          {settings.showSearchOnStartPage && (
            <SearchBox
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              onNavigate={onNavigate}
              t={t}
            />
          )}
        </div>
      </div>

      {settings.showQuickSitesOnStartPage && (
        <QuickSites
          sites={displaySites}
          layout={settings.quickSitesLayout || 'grid'}
          onNavigate={onNavigate}
          onHideSite={onHideSite}
          onDeleteSite={onDeleteSite}
          onRenameSite={onRenameSite}
        />
      )}
    </div>
  );
};

export default StartPage;
