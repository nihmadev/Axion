import React from 'react';
import { SettingsIcon, ProfileIcon, HistoryIcon, DownloadsIcon } from '../icons';
import { useTranslation } from '../../../hooks/useTranslation';

interface BottomToolbarProps {
  onShowSettings?: () => void;
  onShowHistory: () => void;
  onShowDownloads: () => void;
  language: 'ru' | 'en';
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  onShowSettings,
  onShowHistory,
  onShowDownloads,
  language,
}) => {
  const t = useTranslation(language);
  return (
    <div className="zen-sidebar__bottom">
      <button 
        className="zen-sidebar__bottom-btn" 
        onClick={onShowSettings} 
        title={t.common.settings}
      >
        <SettingsIcon />
      </button>
      <button className="zen-sidebar__bottom-btn" title={t.common.profile}>
        <ProfileIcon />
      </button>
      <button 
        className="zen-sidebar__bottom-btn" 
        onClick={onShowHistory} 
        title={t.common.history}
      >
        <HistoryIcon />
      </button>
      <button 
        className="zen-sidebar__bottom-btn" 
        onClick={onShowDownloads} 
        title={t.common.downloads}
      >
        <DownloadsIcon />
      </button>
    </div>
  );
};
