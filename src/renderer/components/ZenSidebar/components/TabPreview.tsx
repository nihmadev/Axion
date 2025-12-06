import React from 'react';
import { Tab } from '../../../types';
import { useTranslation } from '../../../hooks/useTranslation';
import { GlobeIcon, HistoryTabIcon, DownloadsTabIcon, SettingsTabIcon, HomeTabIcon, QuickSitesTabIcon, SnowflakeIcon } from '../icons';

interface TabPreviewProps {
  tab: Tab;
  position: { x: number; y: number };
  sidebarPosition: 'left' | 'right';
  language: 'ru' | 'en';
}

const getInternalIcon = (url?: string) => {
  if (!url) return <HomeTabIcon />;
  if (url === 'axion://history') return <HistoryTabIcon />;
  if (url === 'axion://downloads') return <DownloadsTabIcon />;
  if (url === 'axion://settings') return <SettingsTabIcon />;
  if (url === 'axion://quicksites') return <QuickSitesTabIcon />;
  return null;
};

export const TabPreview: React.FC<TabPreviewProps> = ({ tab, position, sidebarPosition, language }) => {
  const t = useTranslation(language);
  
  const getInternalPageName = (url?: string): string => {
    if (!url) return t.common.startPage;
    if (url === 'axion://history') return t.common.history;
    if (url === 'axion://downloads') return t.common.downloads;
    if (url === 'axion://settings') return t.common.settings;
    if (url === 'axion://quicksites') return t.common.quickSites;
    return '';
  };
  
  const isInternalPage = !tab.url || tab.url?.startsWith('axion://');
  const hasThumbnail = tab.thumbnail && !isInternalPage;
  
  const displayUrl = tab.url || '';
  const hostname = displayUrl ? (() => {
    try {
      return new URL(displayUrl).hostname;
    } catch {
      return displayUrl;
    }
  })() : '';

  // Позиционирование превью - появляется сбоку от сайдбара
  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.max(60, Math.min(position.y - 100, window.innerHeight - 280)),
    zIndex: 10000,
    ...(sidebarPosition === 'right' 
      ? { right: position.x }
      : { left: position.x }
    ),
  };

  return (
    <div className="tab-preview" style={style} data-position={sidebarPosition}>
      {/* Миниатюра страницы */}
      <div className="tab-preview__thumbnail">
        {isInternalPage ? (
          <div className="tab-preview__internal-page">
            <div className="tab-preview__internal-icon">
              {getInternalIcon(tab.url)}
            </div>
            <span className="tab-preview__internal-name">
              {getInternalPageName(tab.url)}
            </span>
          </div>
        ) : hasThumbnail ? (
          /* Реальный скриншот страницы */
          <div className="tab-preview__screenshot">
            <img 
              src={tab.thumbnail} 
              alt={tab.title || ''} 
              className="tab-preview__screenshot-img"
            />
            {/* Оверлей с URL */}
            <div className="tab-preview__screenshot-overlay">
              <div className="tab-preview__browser-url">{hostname}</div>
            </div>
          </div>
        ) : (
          <div className="tab-preview__site">
            {/* Имитация окна браузера (fallback без скриншота) */}
            <div className="tab-preview__browser-chrome">
              <div className="tab-preview__browser-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="tab-preview__browser-url">{hostname}</div>
            </div>
            <div className="tab-preview__site-content">
              {tab.favicon ? (
                <img src={tab.favicon} alt="" className="tab-preview__site-favicon" />
              ) : (
                <GlobeIcon />
              )}
              <div className="tab-preview__site-title">{tab.title || t.common.newTab}</div>
            </div>
          </div>
        )}
        
        {/* Статус индикаторы */}
        {(tab.isFrozen || tab.isLoading) && (
          <div className="tab-preview__status-badge">
            {tab.isFrozen && <span className="tab-preview__frozen"><SnowflakeIcon /></span>}
            {tab.isLoading && <span className="tab-preview__loading"></span>}
          </div>
        )}
      </div>
      
      {/* Информация о вкладке */}
      <div className="tab-preview__info">
        <div className="tab-preview__title">
          {tab.title || (isInternalPage ? getInternalPageName(tab.url) : t.common.newTab)}
        </div>
        {!isInternalPage && hostname && (
          <div className="tab-preview__url">{hostname}</div>
        )}
      </div>
      
      {/* Стрелка-указатель */}
      <div className="tab-preview__arrow"></div>
    </div>
  );
};
