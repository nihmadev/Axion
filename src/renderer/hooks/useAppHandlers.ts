import { useCallback, useMemo, RefObject } from 'react';
import { Settings, HistoryEntry, Bookmark, Tab } from '../types';
import { extractSearchQueries } from '../utils/url';
import { electronAPI } from '../tauri-api';

interface UseAppHandlersProps {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  setSidebarWidth: (width: number) => void;
  activeTabId: string | null;
  activeTabIdRef: RefObject<string>;
  activeTab: Tab | null | undefined;
  webviewRefs: RefObject<Map<string, HTMLWebViewElement>>;
  updateTab: (tabId: string, updates: Record<string, unknown>) => void;
  createNewTab: (url?: string) => void;
  setShowNewTabModal: (show: boolean) => void;
  setShowWelcome: (show: boolean) => void;
  bookmarks: Bookmark[];
  setBookmarks: (bookmarks: Bookmark[]) => void;
  history: HistoryEntry[];
  setHistory: (history: HistoryEntry[]) => void;
}

export const useAppHandlers = ({
  settings,
  setSettings,
  setSidebarWidth,
  activeTabId,
  activeTabIdRef,
  activeTab,
  webviewRefs,
  updateTab,
  createNewTab,
  setShowNewTabModal,
  setShowWelcome,
  bookmarks,
  setBookmarks,
  history,
  setHistory,
}: UseAppHandlersProps) => {
  
  // Вспомогательные функции
  const toggleFullscreen = useCallback(() => {
    window.electronAPI.fullscreen();
  }, []);

  const printPage = useCallback(() => {
    const iframe = webviewRefs.current?.get(activeTabIdRef.current || '') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.print();
      } catch (e) {
        console.warn('Cannot print iframe content:', e);
        window.print();
      }
    }
  }, [activeTabIdRef, webviewRefs]);

  const openNewTabModal = useCallback(() => {
    setShowNewTabModal(true);
  }, [setShowNewTabModal]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    window.electronAPI.setSettings(updated);
  }, [settings, setSettings]);

  const handleSidebarWidthChange = useCallback((width: number) => {
    setSidebarWidth(width);
    localStorage.setItem('sidebarWidth', width.toString());
  }, [setSidebarWidth]);

  const handleSearch = useCallback((query: string) => {
    createNewTab(query);
  }, [createNewTab]);

  // Picture-in-Picture для видео
  const handlePip = useCallback(() => {
    if (activeTabId) {
      electronAPI.togglePip(activeTabId).catch(console.error);
    }
  }, [activeTabId]);

  // Reader Mode - режим чтения
  const handleReaderMode = useCallback(() => {
    if (activeTabId) {
      electronAPI.toggleReaderMode(activeTabId).catch(console.error);
      updateTab(activeTabId, { isReaderMode: !activeTab?.isReaderMode });
    }
  }, [activeTabId, activeTab?.isReaderMode, updateTab]);

  // Обработчик импорта для WelcomePage
  const handleWelcomeImport = useCallback(async (browser: 'chrome' | 'firefox' | 'edge' | 'zen') => {
    const result = await window.electronAPI.importFromBrowser(browser);
    if (result) {
      // Объединяем закладки
      const mergedBookmarks = [...bookmarks, ...result.bookmarks.filter(
        (imported: { url: string }) => !bookmarks.some(b => b.url === imported.url)
      )];
      setBookmarks(mergedBookmarks);
      window.electronAPI.setBookmarks(mergedBookmarks);
      
      // Объединяем историю
      const mergedHistory = [...result.history, ...history];
      setHistory(mergedHistory.slice(0, 500));
    }
  }, [bookmarks, history, setBookmarks, setHistory]);

  // Обработчик завершения WelcomePage с выбранным акцентным цветом
  const handleWelcomeComplete = useCallback((accentColor: string) => {
    updateSettings({ accentColor });
    setShowWelcome(false);
  }, [updateSettings, setShowWelcome]);

  // Вычисляемые значения
  const recentSearches = useMemo(() => extractSearchQueries(history), [history]);

  return {
    toggleFullscreen,
    printPage,
    openNewTabModal,
    updateSettings,
    handleSidebarWidthChange,
    handleSearch,
    handlePip,
    handleReaderMode,
    handleWelcomeImport,
    handleWelcomeComplete,
    recentSearches,
  };
};
