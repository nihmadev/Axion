import { useState, useRef, useEffect } from 'react';
import { Settings, createDefaultSettings } from '../types';

export const useAppState = () => {
  
  const [settings, setSettings] = useState<Settings>(() => createDefaultSettings());
  const [showNewTabModal, setShowNewTabModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showTabSearch, setShowTabSearch] = useState(false);
  const [updateAvailable] = useState(false);
  const [updateDownloaded] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  
  const webviewRefs = useRef<Map<string, HTMLWebViewElement>>(new Map());

  
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const isFirst = await window.electronAPI.isFirstLaunch();
        const savedSettings = await window.electronAPI.getSettings();
        const shouldShowWelcome = isFirst || savedSettings?.showWelcomeOnNextLaunch;
        setShowWelcome(shouldShowWelcome);
        
        
        if (savedSettings?.showWelcomeOnNextLaunch && !isFirst) {
          const updatedSettings = { ...savedSettings, showWelcomeOnNextLaunch: false };
          await window.electronAPI.setSettings(updatedSettings);
          setSettings(updatedSettings);
        } else if (savedSettings) {
          setSettings(savedSettings);
        }
      } catch (error) {
        console.error('Failed to check first launch:', error);
      } finally {
        setWelcomeChecked(true);
      }
    };
    checkFirstLaunch();
  }, []);

  
  const isModalOpen = showNewTabModal || showImportDialog || showTabSearch;

  return {
    
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
    showWelcome,
    setShowWelcome,
    welcomeChecked,
    webviewRefs,
    isModalOpen,
  };
};
