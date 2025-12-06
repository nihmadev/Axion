import React from 'react';
import WebView2Container from './WebView2Container';
import HistoryPage from '../History/HistoryPage';
import DownloadsPage from '../Downloads/DownloadsPage';
import SettingsPage from '../Settings/SettingsPage';
import QuickSitesPage from '../QuickSites/QuickSitesPage';
import StartPage from '../StartPage/StartPage';
import { SnowflakeIcon } from '../ZenSidebar/icons';
import { INTERNAL_URLS } from '../../constants';
import { Settings, Workspace, Tab, HistoryEntry } from '../../types';

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
  
  t: any; // Translation object
}

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
  t,
}) => {
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
              tab.isFrozen ? (
                <div className="frozen-tab-placeholder">
                  <div className="frozen-icon"><SnowflakeIcon size={48} /></div>
                  <p>{t.common.frozenForMemory}</p>
                  <button onClick={() => unfreezeTab(tab.id)}>{t.common.unfreeze}</button>
                </div>
              ) : tab.url === INTERNAL_URLS.history ? (
                <HistoryPage
                  history={history}
                  onNavigate={navigate}
                  onClearHistory={clearHistory}
                  language={settings.language}
                />
              ) : tab.url === INTERNAL_URLS.downloads ? (
                <DownloadsPage language={settings.language} />
              ) : tab.url === INTERNAL_URLS.settings ? (
                <SettingsPage settings={settings} onUpdate={updateSettings} />
              ) : tab.url === INTERNAL_URLS.quicksites ? (
                <QuickSitesPage language={settings.language} onNavigate={navigate} />
              ) : !tab.url ? (
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
              ) : null
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WebViewArea;
