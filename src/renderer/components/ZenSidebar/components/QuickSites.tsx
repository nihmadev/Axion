import React, { useState, useRef } from 'react';
import { useQuickSites } from '../hooks';
import { INTERNAL_URLS } from '../../../constants';

interface QuickSitesProps {
  onSiteClick: (url: string) => void;
  onOpenQuickSitesPage?: () => void;
}

export const QuickSites: React.FC<QuickSitesProps> = ({ onSiteClick, onOpenQuickSitesPage }) => {
  const {
    sites,
    isEditMode,
    removeSite,
    toggleEditMode,
  } = useQuickSites();

  // Открыть страницу управления быстрыми сайтами
  const handleOpenQuickSitesPage = () => {
    if (onOpenQuickSitesPage) {
      onOpenQuickSitesPage();
    } else {
      // Fallback: navigate to quicksites page
      onSiteClick(INTERNAL_URLS.quicksites);
    }
  };

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  const handleMouseDown = (index: number) => {
    setPressedIndex(index);
    longPressTimer.current = setTimeout(() => {
      toggleEditMode();
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setPressedIndex(null);
  };

  const handleSiteClick = (url: string) => {
    if (isEditMode) return;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    onSiteClick(url);
  };

  const handleRemove = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    removeSite(index);
  };

  return (
    <>
      <div className={`zen-sidebar__quick-sites ${isEditMode ? 'zen-sidebar__quick-sites--edit-mode' : ''}`}>
        {/* Edit mode toggle button */}
        <button 
          className={`zen-sidebar__quick-sites-edit-btn ${isEditMode ? 'zen-sidebar__quick-sites-edit-btn--active' : ''}`}
          onClick={toggleEditMode}
          title={isEditMode ? 'Готово' : 'Редактировать'}
        >
          {isEditMode ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* Sites grid */}
        {sites.map((site, idx) => (
          <div
            key={`${site.url}-${idx}`}
            className={`zen-sidebar__quick-site-wrapper ${isEditMode ? 'zen-sidebar__quick-site-wrapper--wiggle' : ''}`}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <button
              className={`zen-sidebar__quick-site ${pressedIndex === idx ? 'zen-sidebar__quick-site--pressed' : ''}`}
              onClick={() => handleSiteClick(site.url)}
              onMouseDown={() => handleMouseDown(idx)}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              title={site.name}
            >
              <img 
                src={`https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=32`} 
                alt={site.name}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </button>
            
            {/* Remove button */}
            {isEditMode && (
              <button 
                className="zen-sidebar__quick-site-remove"
                onClick={(e) => handleRemove(e, idx)}
                title="Удалить"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 1L7 7M1 7L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        ))}

        {/* Add new site button - opens QuickSites page */}
        <div className="zen-sidebar__quick-site-wrapper">
          <button
            className="zen-sidebar__quick-site zen-sidebar__quick-site--add"
            onClick={handleOpenQuickSitesPage}
            title="Управление быстрыми сайтами"
          >
            <div className="zen-sidebar__quick-site-add-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </>
  );
};
