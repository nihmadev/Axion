import React, { useState, useEffect } from 'react';
import { DisplaySite } from '../types';

interface QuickSitesProps {
  sites: DisplaySite[];
  layout: 'grid' | 'list' | 'compact';
  onNavigate: (url: string) => void;
  onHideSite?: (url: string) => void;
  onDeleteSite?: (url: string) => void;
  onRenameSite?: (url: string, newName: string) => void;
}

export const QuickSites: React.FC<QuickSitesProps> = ({
  sites,
  layout,
  onNavigate,
  onHideSite,
  onDeleteSite,
  onRenameSite,
}) => {
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [renameIndex, setRenameIndex] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleMenuClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === index ? null : index);
  };

  const handleDelete = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const site = sites[index];
    if (site && onDeleteSite) {
      onDeleteSite(site.url);
    }
    setActiveMenu(null);
  };

  const handleRename = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const site = sites[index];
    if (site) {
      setRenameIndex(index);
      setRenameValue(site.name);
    }
    setActiveMenu(null);
  };

  const handleRenameSubmit = (index: number) => {
    const site = sites[index];
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
    const site = sites[index];
    if (site && onHideSite) {
      onHideSite(site.url);
    }
    setActiveMenu(null);
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    if (activeMenu !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeMenu]);

  if (sites.length === 0) return null;

  return (
    <div className={`recent-sites recent-sites--${layout}`}>
      <div className="recent-sites-grid">
        {sites.map((site, index) => (
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
  );
};
