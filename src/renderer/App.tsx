import React, { useMemo } from 'react';
import TitleBar from './components/TitleBar/TitleBar';
import AddressBar from './components/AddressBar/AddressBar';
import ZenSidebar from './components/ZenSidebar';
import WebViewArea from './components/WebView/WebViewArea';
import AppModals from './components/AppModals';
import UpdateBanner from './components/UpdateBanner';
import WelcomePage from './components/WelcomePage';
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
  useTranslation,
  useAppState,
  useAppHandlers,
  useAutofill,
} from './hooks';
import { AutofillPopup, SavePasswordPrompt } from './components/Autofill';
import './styles/App.css';

const App: React.FC = () => {
  // Базовые состояния из хука
  const {
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
  } = useAppState();
  
  const t = useTranslation(settings.language);
  
  // Состояния для StartPage сайтов
  const {
    hiddenSites,
    renamedSites,
    handleHideSite,
    handleDeleteSite,
    handleRenameSite
  } = useStartPageData();

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
    splitView,
    toggleSplitView,
    setSplitViewTab,
    setSplitRatio,
    closeSplitView,
    // Tab Groups
    tabGroups,
    createTabGroup,
    addTabToGroup,
    removeTabFromGroup,
    updateTabGroup,
    toggleTabGroupCollapsed,
    deleteTabGroup,
    closeTabGroup,
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

  // Обработчики из хука
  const {
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
  } = useAppHandlers({
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
  });

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
    printPage,
    restoreClosedTab,
    addBookmark,
    openInternalPage,
    setShowTabSearch,
    setIsFullscreen,
    addToHistory,
    setWorkspaces,
  });
  
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

  // Автозаполнение паролей
  const {
    autofillRequest,
    savePasswordRequest,
    fillCredentials,
    closeAutofillPopup,
    closeSavePasswordPrompt,
    markCredentialsSaved,
  } = useAutofill({ activeTabId });

  // Вычисляемые значения
  const isBookmarked = useMemo(() => 
    activeTab ? bookmarks.some(b => b.url === activeTab.url) : false, 
    [activeTab, bookmarks]
  );

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
              onPip={handlePip}
              pipTitle={t.common.pip}
              isSplitView={splitView?.enabled || false}
              onToggleSplitView={toggleSplitView}
              isReaderMode={activeTab.isReaderMode || false}
              onToggleReaderMode={handleReaderMode}
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
              splitView={splitView}
              onSetSplitViewTab={setSplitViewTab}
              onSetSplitRatio={setSplitRatio}
              onCloseSplitView={closeSplitView}
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
          splitView={splitView}
          onCloseSplitView={closeSplitView}
          language={settings.language}
          // Tab Groups
          tabGroups={tabGroups}
          onCreateTabGroup={createTabGroup}
          onToggleTabGroupCollapsed={toggleTabGroupCollapsed}
          onUpdateTabGroup={updateTabGroup}
          onDeleteTabGroup={deleteTabGroup}
          onCloseTabGroup={closeTabGroup}
          onAddTabToGroup={addTabToGroup}
          onRemoveTabFromGroup={removeTabFromGroup}
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

      {/* Autofill Popup */}
      {autofillRequest && (
        <AutofillPopup
          url={autofillRequest.url}
          tabId={autofillRequest.tabId}
          position={autofillRequest.position}
          onClose={closeAutofillPopup}
          onFill={fillCredentials}
          t={t}
        />
      )}

      {/* Save Password Prompt */}
      {savePasswordRequest && (
        <SavePasswordPrompt
          url={savePasswordRequest.url}
          username={savePasswordRequest.username}
          password={savePasswordRequest.password}
          onClose={closeSavePasswordPrompt}
          onSaved={markCredentialsSaved}
          t={t}
        />
      )}

    </div>
  );
};

export default App;
