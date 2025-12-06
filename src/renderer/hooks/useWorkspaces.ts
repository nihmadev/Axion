import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Tab, Workspace, Settings, Language } from '../types';
import { normalizeUrl } from '../utils/url';
import { removeWebViewFromCache } from '../components/WebView/WebView2Container';
import { useTranslation } from './useTranslation';

interface UseWorkspacesOptions {
  settings: Settings;
  language: Language;
}

export const useWorkspaces = ({ settings, language }: UseWorkspacesOptions) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');
  const [closedTabs, setClosedTabs] = useState<Tab[]>([]);
  const t = useTranslation(language);
  
  // Ref для актуального состояния workspaces
  const workspacesRef = useRef(workspaces);
  useEffect(() => {
    workspacesRef.current = workspaces;
  }, [workspaces]);

  // Update tab titles based on URL changes
  useEffect(() => {
    setWorkspaces(prev => prev.map(ws => ({
      ...ws,
      tabs: ws.tabs.map(tab => ({
        ...tab,
        title: tab.url ? (tab.title === t.common.home ? t.common.newTab : tab.title) : t.common.home
      }))
    })));
  }, [t]);

  const createWorkspace = useCallback((options?: { 
    name?: string; 
    icon?: string; 
    color?: string; 
    initialUrl?: string 
  }) => {
    const workspaceId = uuidv4();
    
    // Получаем title и favicon из URL
    let title = t.common.home;
    let favicon: string | undefined;
    
    if (options?.initialUrl) {
      try {
        const urlObj = new URL(options.initialUrl);
        title = urlObj.hostname.replace('www.', '');
        favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
      } catch {
        title = t.common.newTab;
      }
    }
    
    const initialTab: Tab = {
      id: uuidv4(),
      url: options?.initialUrl || '',
      title: title,
      favicon: favicon,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      zoomLevel: 1,
    };

    setWorkspaces(prev => {
      const workspace: Workspace = {
        id: workspaceId,
        name: options?.name ?? (prev.length === 0 ? 'Default' : `Workspace ${prev.length + 1}`),
        icon: options?.icon,
        color: options?.color,
        activeTabId: initialTab.id,
        tabs: [initialTab],
      };
      return [...prev, workspace];
    });
    setActiveWorkspaceId(workspaceId);
    return workspaceId;
  }, [t]);

  const deleteWorkspace = useCallback((workspaceId: string) => {
    if (workspaces.length <= 1) return;
    setWorkspaces(prev => {
      const newWorkspaces = prev.filter(ws => ws.id !== workspaceId);
      if (workspaceId === activeWorkspaceId) {
        const newActiveWorkspace = newWorkspaces[0];
        if (newActiveWorkspace) setActiveWorkspaceId(newActiveWorkspace.id);
      }
      return newWorkspaces;
    });
  }, [workspaces.length, activeWorkspaceId]);

  const renameWorkspace = useCallback((workspaceId: string, newName: string) => {
    setWorkspaces(prev => prev.map(ws => 
      ws.id === workspaceId ? { ...ws, name: newName } : ws
    ));
  }, []);

  const updateWorkspaceIcon = useCallback((workspaceId: string, icon: string) => {
    setWorkspaces(prev => prev.map(ws => 
      ws.id === workspaceId ? { ...ws, icon } : ws
    ));
  }, []);

  const updateWorkspaceColor = useCallback((workspaceId: string, color: string | undefined) => {
    setWorkspaces(prev => prev.map(ws => 
      ws.id === workspaceId ? { ...ws, color } : ws
    ));
  }, []);

  const createNewTab = useCallback((urlOrQuery?: string) => {
    const finalUrl = urlOrQuery ? normalizeUrl(urlOrQuery, settings.searchEngine) : '';

    if (!activeWorkspaceId) {
      createWorkspace({ initialUrl: finalUrl || undefined });
      return;
    }

    // Получаем title и favicon из URL
    let title = t.common.home;
    let favicon: string | undefined;
    
    if (finalUrl) {
      try {
        const urlObj = new URL(finalUrl);
        title = urlObj.hostname.replace('www.', '');
        favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
      } catch {
        title = t.common.newTab;
      }
    }

    const newTab: Tab = {
      id: uuidv4(),
      url: finalUrl,
      title: title,
      favicon: favicon,
      isLoading: Boolean(finalUrl),
      canGoBack: false,
      canGoForward: false,
      zoomLevel: 1,
    };

    setWorkspaces(prev => prev.map(ws =>
      ws.id === activeWorkspaceId 
        ? { ...ws, tabs: [...ws.tabs, newTab], activeTabId: newTab.id } 
        : ws
    ));
  }, [activeWorkspaceId, createWorkspace, settings.searchEngine, t]);

  const closeTab = useCallback((tabId: string) => {
    // Сохраняем закрытую вкладку для восстановления
    const allTabs = workspaces.flatMap(ws => ws.tabs);
    const closedTab = allTabs.find(t => t.id === tabId);
    if (closedTab && closedTab.url) {
      setClosedTabs(prev => [closedTab, ...prev.slice(0, 9)]);
    }

    // Удаляем WebView из глобального кэша и закрываем нативный WebView
    removeWebViewFromCache(tabId);
    window.electronAPI.closeWebView?.(tabId).catch(console.error);

    setWorkspaces(prev => prev.map(ws => {
      if (!ws.tabs.some(t => t.id === tabId)) return ws;
      const remaining = ws.tabs.filter(t => t.id !== tabId);
      if (remaining.length === 0) {
        const newTab: Tab = { 
          id: uuidv4(), 
          url: '', 
          title: t.common.home, 
          isLoading: false, 
          canGoBack: false, 
          canGoForward: false, 
          zoomLevel: 1 
        };
        return { ...ws, tabs: [newTab], activeTabId: newTab.id };
      }
      let nextActiveId = ws.activeTabId;
      if (ws.activeTabId === tabId) {
        const idx = ws.tabs.findIndex(t => t.id === tabId);
        const newIndex = Math.min(idx, remaining.length - 1);
        nextActiveId = remaining[newIndex].id;
      }
      return { ...ws, tabs: remaining, activeTabId: nextActiveId };
    }));
  }, [workspaces, t]);

  const restoreClosedTab = useCallback(() => {
    if (closedTabs.length === 0) return;
    const [tabToRestore, ...remaining] = closedTabs;
    setClosedTabs(remaining);
    createNewTab(tabToRestore.url);
  }, [closedTabs, createNewTab]);

  const updateTab = useCallback((tabId: string, updates: Partial<Tab>) => {
    setWorkspaces(prev => prev.map(ws => ({
      ...ws, 
      tabs: ws.tabs.map(tab => {
        if (tab.id === tabId) {
          const updatedTab = { ...tab, ...updates };
          // Update title based on URL change
          if ('url' in updates) {
            updatedTab.title = updatedTab.url ? 
              (updatedTab.title === t.common.home ? t.common.newTab : updatedTab.title) : 
              t.common.home;
          }
          return updatedTab;
        }
        return tab;
      }),
    })));
  }, [t]);

  const setActiveTabInWorkspace = useCallback((tabId: string) => {
    if (!activeWorkspaceId) return;
    
    setWorkspaces(prev => prev.map(ws => 
      ws.id === activeWorkspaceId 
        ? { 
            ...ws, 
            activeTabId: tabId,
            tabs: ws.tabs.map(tab => tab.id === tabId ? { ...tab, lastActiveAt: Date.now() } : tab)
          } 
        : ws
    ));
  }, [activeWorkspaceId]);

  const selectTabFromSearch = useCallback((workspaceId: string, tabId: string) => {
    if (workspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId(workspaceId);
    }
    
    setWorkspaces(prev => prev.map(ws => 
      ws.id === workspaceId 
        ? { 
            ...ws, 
            activeTabId: tabId,
            tabs: ws.tabs.map(tab => tab.id === tabId ? { ...tab, lastActiveAt: Date.now() } : tab)
          } 
        : ws
    ));
  }, [activeWorkspaceId]);

  // Получение активного workspace и вкладки
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const tabs = activeWorkspace?.tabs ?? [];
  const activeTabId = activeWorkspace?.activeTabId ?? '';
  const activeTab = tabs.find(t => t.id === activeTabId);

  return {
    workspaces,
    setWorkspaces,
    workspacesRef,
    activeWorkspaceId,
    setActiveWorkspaceId,
    closedTabs,
    activeWorkspace,
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
  };
};
