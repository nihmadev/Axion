import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Settings, defaultSettings } from './types';
import { useTranslation } from './hooks/useTranslation';
import TitleBar from './components/TitleBar/TitleBar';
import AddressBar from './components/AddressBar/AddressBar';
import ZenSidebar from './components/ZenSidebar';
import WebViewArea from './components/WebView/WebViewArea';
import AppModals from './components/AppModals';
import UpdateBanner from './components/UpdateBanner';
import WelcomePage from './components/WelcomePage';
import { extractSearchQueries } from './utils/url';
import {
  useWorkspaces,
  useNavigation,
  useTabMemory,
  useHistory,
  useZoom,
  useBookmarks,
  useShortcuts,
  useSession,
  useWebViewVisibility,
  useStartPageData,
  useTabThumbnails,
} from './hooks';
import './styles/App.css';

const App: React.FC = () => {
  
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
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  
  const t = useTranslation(settings.language);
  
  // Проверка первого запуска или настройки showWelcomeOnNextLaunch
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const isFirst = await window.electronAPI.isFirstLaunch();
        const savedSettings = await window.electronAPI.getSettings();
        const shouldShowWelcome = isFirst || savedSettings?.showWelcomeOnNextLaunch;
        setShowWelcome(shouldShowWelcome);
        
        // Если показываем приветствие из-за настройки, сбрасываем её
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
  
  // Состояния для StartPage сайтов
  const {
    hiddenSites,
    renamedSites,
    handleHideSite,
    handleDeleteSite,
    handleRenameSite
  } = useStartPageData();
  
  const webviewRefs = useRef<Map<string, HTMLWebViewElement>>(new Map());

  // Хуки для управления данными
  const { history, setHistory, addToHistory, clearHistory } = useHistory();
  
  const {
    workspaces,
    setWorkspaces,
    workspacesRef,
    activeWorkspaceId,
    setActiveWorkspaceId,
    tabs,
    activeTabId,
    activeTab,
    createWorkspace,
    deleteWorkspace,
    renameWorkspace,
    updateWorkspaceIcon,
    updateWorkspaceColor,
    createNewTab,
    closeTab,
    restoreClosedTab,
    updateTab,
    setActiveTabInWorkspace,
    selectTabFromSearch,
  } = useWorkspaces({ settings, language: settings.language });

  const {
    activeTabIdRef,
    navigate,
    goBack,
    goForward,
    reloadTab,
    stopLoading,
    openInternalPage,
  } = useNavigation({
    settings,
    workspaces,
    activeWorkspaceId,
    activeTabId,
    updateTab,
    setWorkspaces,
  });

  const { unfreezeTab } = useTabMemory({
    workspaces,
    activeWorkspaceId,
    setWorkspaces,
  });

  const { zoomIn, zoomOut, zoomReset } = useZoom({
    workspaces,
    activeWorkspaceId,
    activeTabIdRef,
    webviewRefs,
    updateTab,
  });

  const { bookmarks, setBookmarks, addBookmark, handleImportFromBrowser } = useBookmarks({
    workspaces,
    activeWorkspaceId,
  });

  // Сессия и восстановление
  useSession({
    workspaces,
    activeWorkspaceId,
    setWorkspaces,
    setActiveWorkspaceId,
    setSettings,
    setBookmarks,
    setHistory,
    setSidebarWidth,
  });

  // Вспомогательные функции
  const toggleFullscreen = useCallback(() => {
    window.electronAPI.fullscreen();
  }, []);

  const openDevTools = useCallback(() => {
    // DevTools: Press F12 to open DevTools for the entire window
  }, []);

  const printPage = useCallback(() => {
    const iframe = webviewRefs.current.get(activeTabIdRef.current) as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.print();
      } catch (e) {
        console.warn('Cannot print iframe content:', e);
        window.print();
      }
    }
  }, [activeTabIdRef]);

  const openNewTabModal = useCallback(() => {
    setShowNewTabModal(true);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    window.electronAPI.setSettings(updated);
  }, [settings]);

  const handleSidebarWidthChange = useCallback((width: number) => {
    setSidebarWidth(width);
    localStorage.setItem('sidebarWidth', width.toString());
  }, []);

  // Шорткаты
  useShortcuts({
    createNewTab,
    closeTab,
    activeTabIdRef,
    reloadTab,
    zoomIn,
    zoomOut,
    zoomReset,
    toggleFullscreen,
    openDevTools,
    printPage,
    restoreClosedTab,
    addBookmark,
    openInternalPage,
    setShowTabSearch,
    setIsFullscreen,
    addToHistory,
    setWorkspaces,
  });

  // Видимость WebView
  const isModalOpen = showNewTabModal || showImportDialog || showTabSearch;
  
  useWebViewVisibility({
    workspaces,
    workspacesRef,
    activeWorkspaceId,
    isModalOpen,
  });

  // Захват скриншотов для превью вкладок
  useTabThumbnails({
    workspaces,
    activeWorkspaceId,
    activeTabId,
    updateTab,
    captureInterval: 5000, // Обновление каждые 5 секунд
  });

  // Вычисляемые значения
  const isBookmarked = activeTab ? bookmarks.some(b => b.url === activeTab.url) : false;
  const recentSearches = useMemo(() => extractSearchQueries(history), [history]);

  const handleSearch = useCallback((query: string) => {
    createNewTab(query);
  }, [createNewTab]);

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
  }, [updateSettings]);

  // Показываем пустой экран пока проверяем первый запуск
  if (!welcomeChecked) {
    return <div className="app" style={{ background: '#000' }} />;
  }

  // Показываем WelcomePage при первом запуске
  if (showWelcome) {
    return (
      <WelcomePage
        onComplete={handleWelcomeComplete}
        onImport={handleWelcomeImport}
      />
    );
  }

  return (
    <div 
      className={`app ${isFullscreen ? 'app--fullscreen' : ''} ${isModalOpen ? 'modal-open' : ''}`}
      style={{ 
        '--accent': settings.accentColor, 
        fontSize: settings.fontSize,
        '--wallpaper-url': `url(${settings.wallpaperUrl || '/walpaper1.jpg'})`,
        '--wallpaper-blur': `${settings.wallpaperBlur || 0}px`,
        '--wallpaper-dim': `${settings.wallpaperDim || 20}%`,
      } as React.CSSProperties}
      data-radius={settings.borderRadius}
      data-font={settings.fontFamily}
      data-animations={settings.animationsEnabled}
      data-sidebar-position={settings.sidebarPosition}
      data-theme={settings.theme}
    >
      <UpdateBanner 
        updateAvailable={updateAvailable} 
        updateDownloaded={updateDownloaded} 
      />
      
      {!isFullscreen && <TitleBar />}
      
      <div className="browser-shell">
        <div className="main-area">
          {activeTab?.url && (
            <AddressBar
              url={activeTab.url}
              isLoading={activeTab.isLoading || false}
              canGoBack={activeTab.canGoBack || false}
              canGoForward={activeTab.canGoForward || false}
              isBookmarked={isBookmarked}
              isSecure={activeTab.isSecure}
              history={history}
              bookmarks={bookmarks}
              onNavigate={navigate}
              onBack={goBack}
              onForward={goForward}
              onReload={reloadTab}
              onStop={stopLoading}
              onBookmark={addBookmark}
            />
          )}
          
          <div className="content-area">
            <WebViewArea
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              activeTabId={activeTabId}
              tabs={tabs}
              settings={settings}
              history={history}
              updateTab={updateTab}
              addToHistory={addToHistory}
              webviewRefs={webviewRefs}
              createNewTab={createNewTab}
              unfreezeTab={unfreezeTab}
              navigate={navigate}
              clearHistory={clearHistory}
              updateSettings={updateSettings}
              hiddenSites={hiddenSites}
              renamedSites={renamedSites}
              onHideSite={handleHideSite}
              onDeleteSite={handleDeleteSite}
              onRenameSite={handleRenameSite}
              t={t}
            />
          </div>
        </div>
        
        <ZenSidebar
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onWorkspaceSelect={setActiveWorkspaceId}
          onWorkspaceCreate={() => createWorkspace()}
          onWorkspaceDelete={deleteWorkspace}
          onWorkspaceRename={renameWorkspace}
          onWorkspaceIconChange={updateWorkspaceIcon}
          onWorkspaceColorChange={updateWorkspaceColor}
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={setActiveTabInWorkspace}
          onTabClose={closeTab}
          onNewTab={openNewTabModal}
          onShowHistory={() => openInternalPage('history')}
          onShowDownloads={() => openInternalPage('downloads')}
          onShowSettings={() => openInternalPage('settings')}
          canGoBack={activeTab?.canGoBack || false}
          canGoForward={activeTab?.canGoForward || false}
          isLoading={activeTab?.isLoading || false}
          onBack={goBack}
          onForward={goForward}
          onReload={reloadTab}
          onStop={stopLoading}
          onSearch={handleSearch}
          sidebarWidth={sidebarWidth}
          onSidebarWidthChange={handleSidebarWidthChange}
          // Customization from settings
          position={settings.sidebarPosition}
          style={settings.sidebarStyle}
          showQuickSites={settings.showSidebarQuickSites}
          showWorkspaces={settings.showSidebarWorkspaces}
          showNavigation={settings.showSidebarNavigation}
          tabCloseButton={settings.tabCloseButton}
          showTabFavicons={settings.showTabFavicons}
          showTabPreviews={settings.showTabPreviews}
          language={settings.language}
        />
      </div>

      <AppModals
        showNewTabModal={showNewTabModal}
        setShowNewTabModal={setShowNewTabModal}
        showImportDialog={showImportDialog}
        setShowImportDialog={setShowImportDialog}
        showTabSearch={showTabSearch}
        setShowTabSearch={setShowTabSearch}
        toastMessage={toastMessage}
        setToastMessage={setToastMessage}
        recentSearches={recentSearches}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        createNewTab={createNewTab}
        handleImportFromBrowser={handleImportFromBrowser}
        history={history}
        setHistory={setHistory}
        selectTabFromSearch={selectTabFromSearch}
      />

    </div>
  );
};

export default App;
