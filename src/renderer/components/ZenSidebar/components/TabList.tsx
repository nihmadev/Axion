import React, { useState, useRef, useCallback } from 'react';
import { Tab } from '../../../types';
import { useTranslation } from '../../../hooks/useTranslation';
import { 
  PlusIcon, 
  CloseIcon, 
  GlobeIcon,
  HistoryTabIcon,
  DownloadsTabIcon,
  SettingsTabIcon,
  HomeTabIcon,
  QuickSitesTabIcon
} from '../icons';
import { TabPreview } from './TabPreview';

interface TabListProps {
  tabs: Tab[];
  activeTabId: string;
  style: 'default' | 'compact' | 'minimal';
  tabCloseButton: 'hover' | 'always' | 'never';
  showTabFavicons: boolean;
  showTabPreviews?: boolean;
  sidebarPosition?: 'left' | 'right';
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
  language: 'ru' | 'en';
}

const getInternalIcon = (url?: string) => {
  if (!url) return <HomeTabIcon />; // StartPage
  if (url === 'axion://history') return <HistoryTabIcon />;
  if (url === 'axion://downloads') return <DownloadsTabIcon />;
  if (url === 'axion://settings') return <SettingsTabIcon />;
  if (url === 'axion://quicksites') return <QuickSitesTabIcon />;
  return null;
};

const getInternalPageName = (url: string | undefined, t: ReturnType<typeof useTranslation>): string | null => {
  if (!url) return t.common.startPage;
  if (url === 'axion://history') return t.common.history;
  if (url === 'axion://downloads') return t.common.downloads;
  if (url === 'axion://settings') return t.common.settings;
  if (url === 'axion://quicksites') return t.common.quickSites;
  return null;
};

export const TabList: React.FC<TabListProps> = ({
  tabs,
  activeTabId,
  style,
  tabCloseButton,
  showTabFavicons,
  showTabPreviews = true,
  sidebarPosition = 'right',
  onTabSelect,
  onTabClose,
  onNewTab,
  language,
}) => {
  const t = useTranslation(language);
  const [hoveredTab, setHoveredTab] = useState<Tab | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tabRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleTabMouseDown = (e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) {
      e.preventDefault();
      onTabClose(tabId);
    }
  };

  const handleTabMouseEnter = useCallback((tab: Tab, element: HTMLDivElement) => {
    if (!showTabPreviews) return;
    
    // Очищаем предыдущий таймаут
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Задержка перед показом превью (200ms)
    hoverTimeoutRef.current = setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const sidebarRect = element.closest('.zen-sidebar')?.getBoundingClientRect();
      
      if (sidebarRect) {
        // Позиционируем превью сбоку от сайдбара с отступом
        const gap = 12;
        
        setPreviewPosition({
          x: sidebarPosition === 'right' 
            ? window.innerWidth - sidebarRect.left + gap
            : sidebarRect.right + gap,
          y: rect.top + rect.height / 2,
        });
      }
      
      setHoveredTab(tab);
    }, 200);
  }, [showTabPreviews, sidebarPosition]);

  const handleTabMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredTab(null);
  }, []);

  return (
    <div className="zen-sidebar__tabs">
      {tabs.map(tab => {
        const isInternalPage = !tab.url || tab.url?.startsWith('axion://');

        return (
          <div
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
              else tabRefs.current.delete(tab.id);
            }}
            className={`zen-sidebar__tab ${tab.id === activeTabId ? 'is-active' : ''} ${tab.isFrozen ? 'is-frozen' : ''} ${isInternalPage ? 'is-internal' : ''}`}
            onClick={() => onTabSelect(tab.id)}
            onMouseDown={(e) => handleTabMouseDown(e, tab.id)}
            onMouseEnter={(e) => handleTabMouseEnter(tab, e.currentTarget)}
            onMouseLeave={handleTabMouseLeave}
            title={!showTabPreviews ? (tab.title || t.common.newTab) : undefined}
          >
            <div className="zen-sidebar__tab-icon">
              {showTabFavicons && (
                isInternalPage ? (
                  getInternalIcon(tab.url)
                ) : tab.favicon ? (
                  <img src={tab.favicon} alt="" />
                ) : tab.isLoading ? (
                  <div className="zen-sidebar__tab-spinner" />
                ) : (
                  <GlobeIcon />
                )
              )}
            </div>
            {style !== 'minimal' && (
              <span className="zen-sidebar__tab-title">
                {isInternalPage ? (getInternalPageName(tab.url, t) || tab.title || t.common.newTab) : (tab.title || t.common.newTab)}
              </span>
            )}
            {tabCloseButton !== 'never' && (
              <button
                className={`zen-sidebar__tab-close ${tabCloseButton === 'always' ? 'always-visible' : ''}`}
                onClick={(e) => { e.stopPropagation(); onTabClose(tab.id); }}
              >
                <CloseIcon />
              </button>
            )}
          </div>
        );
      })}
      
      <button className="zen-sidebar__new-tab" onClick={onNewTab}>
        <PlusIcon />
        <span>{t.common.newTab}</span>
      </button>

      {/* Tab Preview Tooltip */}
      {hoveredTab && showTabPreviews && (
        <TabPreview
          tab={hoveredTab}
          position={previewPosition}
          sidebarPosition={sidebarPosition}
          language={language}
        />
      )}
    </div>
  );
};
