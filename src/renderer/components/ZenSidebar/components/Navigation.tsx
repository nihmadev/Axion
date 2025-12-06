import React from 'react';
import { BackIcon, ForwardIcon, StopIcon, ReloadIcon } from '../icons';

interface NavigationProps {
  canGoBack?: boolean;
  canGoForward?: boolean;
  isLoading?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  onReload?: () => void;
  onStop?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  canGoBack,
  canGoForward,
  isLoading,
  onBack,
  onForward,
  onReload,
  onStop,
}) => {
  return (
    <div className="zen-sidebar__nav">
      <button 
        className="zen-sidebar__nav-btn" 
        onClick={onBack} 
        disabled={!canGoBack} 
        title="Назад"
      >
        <BackIcon />
      </button>
      <button 
        className="zen-sidebar__nav-btn" 
        onClick={onForward} 
        disabled={!canGoForward} 
        title="Вперед"
      >
        <ForwardIcon />
      </button>
      <button 
        className="zen-sidebar__nav-btn" 
        onClick={isLoading ? onStop : onReload} 
        title={isLoading ? "Стоп" : "Обновить"}
      >
        {isLoading ? <StopIcon /> : <ReloadIcon />}
      </button>
    </div>
  );
};
