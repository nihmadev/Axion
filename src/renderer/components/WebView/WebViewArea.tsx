import React, { useState, useCallback, useRef } from 'react';
import WebView2Container from './WebView2Container';
import HistoryPage from '../History/HistoryPage';
import DownloadsPage from '../Downloads/DownloadsPage';
import SettingsPage from '../Settings/SettingsPage';
import QuickSitesPage from '../QuickSites/QuickSitesPage';
import StartPage from '../StartPage/StartPage';
import { SnowflakeIcon } from '../ZenSidebar/icons';
import { INTERNAL_URLS } from '../../constants';
import { Settings, Workspace, Tab, HistoryEntry, SplitView } from '../../types';

interface WebViewAreaProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeTabId: string;
  tabs: Tab[];
  settings: Settings;
  history: HistoryEntry[];
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  addToHistory: (item: Omit<HistoryEntry, 'id' | 'visitedAt'>) => void;
  webviewRefs: React.MutableRefObject<Map<string, HTMLWebViewElement>>;
  createNewTab: (url?: string) => void;
  unfreezeTab: (tabId: string) => void;
  navigate: (url: string) => void;
  clearHistory: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
  
  // StartPage props
  hiddenSites: string[];
  renamedSites: Record<string, string>;
  onHideSite: (url: string) => void;
  onDeleteSite: (url: string) => void;
  onRenameSite: (url: string, newName: string) => void;
  
  // Split View props
  splitView?: SplitView;
  onSetSplitViewTab?: (side: 'left' | 'right', tabId: string) => void;
  onSetSplitRatio?: (ratio: number) => void;
  onCloseSplitView?: () => void;
  
  t: any; // Translation object
}

// Компонент для рендеринга контента вкладки (внутренние страницы)
const TabContent: React.FC<{
  tab: Tab;
  settings: Settings;
  history: HistoryEntry[];
  navigate: (url: string) => void;
  clearHistory: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
  unfreezeTab: (tabId: string) => void;
  hiddenSites: string[];
  renamedSites: Record<string, string>;
  onHideSite: (url: string) => void;
  onDeleteSite: (url: string) => void;
  onRenameSite: (url: string, newName: string) => void;
  t: any;
}> = ({ tab, settings, history, navigate, clearHistory, updateSettings, unfreezeTab, hiddenSites, renamedSites, onHideSite, onDeleteSite, onRenameSite, t }) => {
  if (tab.isFrozen) {
    return (
      <div className="frozen-tab-placeholder">
        <div className="frozen-icon"><SnowflakeIcon size={48} /></div>
        <p>{t.common.frozenForMemory}</p>
        <button onClick={() => unfreezeTab(tab.id)}>{t.common.unfreeze}</button>
      </div>
    );
  }
  
  if (tab.url === INTERNAL_URLS.history) {
    return (
      <HistoryPage
        history={history}
        onNavigate={navigate}
        onClearHistory={clearHistory}
        language={settings.language}
      />
    );
  }
  
  if (tab.url === INTERNAL_URLS.downloads) {
    return <DownloadsPage language={settings.language} />;
  }
  
  if (tab.url === INTERNAL_URLS.settings) {
    return <SettingsPage settings={settings} onUpdate={updateSettings} />;
  }
  
  if (tab.url === INTERNAL_URLS.quicksites) {
    return <QuickSitesPage language={settings.language} onNavigate={navigate} />;
  }
  
  if (!tab.url) {
    return (
      <StartPage
        settings={settings}
        language={settings.language}
        onNavigate={navigate}
        recentSites={history.slice(0, 8).map(h => ({
          url: h.url,
          title: h.title,
          favicon: h.favicon,
        }))}
        hiddenSites={hiddenSites}
        renamedSites={renamedSites}
        onHideSite={onHideSite}
        onDeleteSite={onDeleteSite}
        onRenameSite={onRenameSite}
      />
    );
  }
  
  return null;
};

const WebViewArea: React.FC<WebViewAreaProps> = ({
  workspaces,
  activeWorkspaceId,
  activeTabId,
  tabs,
  settings,
  history,
  updateTab,
  addToHistory,
  webviewRefs,
  createNewTab,
  unfreezeTab,
  navigate,
  clearHistory,
  updateSettings,
  hiddenSites,
  renamedSites,
  onHideSite,
  onDeleteSite,
  onRenameSite,
  splitView,
  onSetSplitRatio,
  onCloseSplitView,
  t,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Обработчик перетаскивания разделителя
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !splitContainerRef.current || !onSetSplitRatio) return;
    
    const rect = splitContainerRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSetSplitRatio(ratio);
  }, [isDragging, onSetSplitRatio]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Проверяем, активен ли Split View
  const isSplitViewActive = splitView?.enabled && splitView.leftTabId && splitView.rightTabId;

  // Находим вкладки для Split View
  const leftTab = isSplitViewActive ? tabs.find(t => t.id === splitView.leftTabId) : null;
  const rightTab = isSplitViewActive ? tabs.find(t => t.id === splitView.rightTabId) : null;

  // Рендер одиночной панели (WebView или внутренняя страница)
  const renderPanel = (tab: Tab, isActive: boolean) => {
    const hasWebView = tab.url && !tab.url.startsWith('axion://');
    
    if (hasWebView) {
      return (
        <WebView2Container
          tab={tab}
          isActive={isActive}
          onUpdate={(updates) => updateTab(tab.id, updates)}
          onAddHistory={addToHistory}
          webviewRef={(ref) => {
            if (ref) webviewRefs.current.set(tab.id, ref as any);
          }}
          onOpenInNewTab={createNewTab}
        />
      );
    }
    
    return (
      <TabContent
        tab={tab}
        settings={settings}
        history={history}
        navigate={navigate}
        clearHistory={clearHistory}
        updateSettings={updateSettings}
        unfreezeTab={unfreezeTab}
        hiddenSites={hiddenSites}
        renamedSites={renamedSites}
        onHideSite={onHideSite}
        onDeleteSite={onDeleteSite}
        onRenameSite={onRenameSite}
        t={t}
      />
    );
  };

  // Split View режим
  if (isSplitViewActive && leftTab && rightTab) {
    const splitRatio = splitView.splitRatio || 0.5;
    
    return (
      <div 
        className="webview-area split-view-container"
        ref={splitContainerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Левая панель */}
        <div 
          className="split-view-panel split-view-left"
          style={{ width: `calc(${splitRatio * 100}% - 3px)` }}
        >
          <div className="split-view-header">
            <span className="split-view-title" title={leftTab.url}>
              {leftTab.favicon && <img src={leftTab.favicon} alt="" className="split-view-favicon" />}
              {leftTab.title || leftTab.url || 'Новая вкладка'}
            </span>
          </div>
          <div className="split-view-content">
            {renderPanel(leftTab, true)}
          </div>
        </div>

        {/* Разделитель */}
        <div 
          className={`split-view-divider ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown}
        >
          <div className="split-view-divider-handle" />
        </div>

        {/* Правая панель */}
        <div 
          className="split-view-panel split-view-right"
          style={{ width: `calc(${(1 - splitRatio) * 100}% - 3px)` }}
        >
          <div className="split-view-header">
            <span className="split-view-title" title={rightTab.url}>
              {rightTab.favicon && <img src={rightTab.favicon} alt="" className="split-view-favicon" />}
              {rightTab.title || rightTab.url || 'Новая вкладка'}
            </span>
            <button className="split-view-close" onClick={onCloseSplitView} title="Закрыть Split View">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="split-view-content">
            {renderPanel(rightTab, true)}
          </div>
        </div>
      </div>
    );
  }

  // Обычный режим (без Split View)
  return (
    <div className="webview-area">
      {/* WebView для всех воркспейсов */}
      {workspaces.map(workspace =>
        workspace.tabs.map(tab => {
          const isCurrentWorkspace = workspace.id === activeWorkspaceId;
          const isActiveTab = isCurrentWorkspace && tab.id === activeTabId;
          const shouldRender = tab.url && !tab.url.startsWith('axion://');

          return (
            <div
              key={tab.id}
              className={`webview-wrapper ${isActiveTab && shouldRender ? 'active' : 'hidden'}`}
              style={{ display: isActiveTab && shouldRender ? 'flex' : 'none' }}
            >
              {shouldRender && (
                <WebView2Container
                  tab={tab}
                  isActive={isActiveTab}
                  onUpdate={(updates) => updateTab(tab.id, updates)}
                  onAddHistory={addToHistory}
                  webviewRef={(ref) => {
                    if (ref) webviewRefs.current.set(tab.id, ref as any);
                  }}
                  onOpenInNewTab={createNewTab}
                />
              )}
            </div>
          );
        })
      )}
      
      {/* Внутренние страницы и стартовая */}
      {tabs.map(tab => {
        const isActiveTab = tab.id === activeTabId;
        const hasWebView = tab.url && !tab.url.startsWith('axion://');
        const shouldShowContent = isActiveTab && !hasWebView;

        return (
          <div
            key={`content-${tab.id}`}
            className={`webview-wrapper ${shouldShowContent ? 'active' : 'hidden'}`}
            style={{ display: shouldShowContent ? 'flex' : 'none' }}
          >
            {shouldShowContent && (
              <TabContent
                tab={tab}
                settings={settings}
                history={history}
                navigate={navigate}
                clearHistory={clearHistory}
                updateSettings={updateSettings}
                unfreezeTab={unfreezeTab}
                hiddenSites={hiddenSites}
                renamedSites={renamedSites}
                onHideSite={onHideSite}
                onDeleteSite={onDeleteSite}
                onRenameSite={onRenameSite}
                t={t}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WebViewArea;
