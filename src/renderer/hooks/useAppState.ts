import { useState, useRef, useMemo } from 'react';
import { Settings, defaultSettings } from '../types';

export const useAppState = () => {
  // Базовые состояния
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [showNewTabModal, setShowNewTabModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showTabSearch, setShowTabSearch] = useState(false);
  const [updateAvailable] = useState(false);
  const [updateDownloaded] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Состояния для StartPage сайтов
  const [hiddenSites, setHiddenSites] = useState<string[]>(() => {
    const saved = localStorage.getItem('hiddenSites');
    return saved ? JSON.parse(saved) : [];
  });
  const [renamedSites, setRenamedSites] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('renamedSites');
    return saved ? JSON.parse(saved) : {};
  });
  
  const webviewRefs = useRef<Map<string, HTMLWebViewElement>>(new Map());

  // Вычисляемые значения
  const isModalOpen = showNewTabModal || showImportDialog || showTabSearch;

  return {
    // State
    settings,
    setSettings,
    showNewTabModal,
    setShowNewTabModal,
    isFullscreen,
    setIsFullscreen,
    showImportDialog,
    setShowImportDialog,
    showTabSearch,
    setShowTabSearch,
    updateAvailable,
    updateDownloaded,
    sidebarWidth,
    setSidebarWidth,
    toastMessage,
    setToastMessage,
    hiddenSites,
    setHiddenSites,
    renamedSites,
    setRenamedSites,
    webviewRefs,
    isModalOpen,
  };
};
