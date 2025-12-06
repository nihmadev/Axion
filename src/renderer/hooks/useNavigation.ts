import { useCallback, useRef, useEffect } from 'react';
import { Tab, Workspace, Settings } from '../types';
import { normalizeUrl, getInternalPageTitle } from '../utils/url';
import { INTERNAL_URLS } from '../constants';
import { v4 as uuidv4 } from 'uuid';

interface UseNavigationOptions {
  settings: Settings;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeTabId: string;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
}

export const useNavigation = ({
  settings,
  workspaces,
  activeWorkspaceId,
  activeTabId,
  updateTab,
  setWorkspaces,
}: UseNavigationOptions) => {
  const activeTabIdRef = useRef<string>('');
  
  useEffect(() => { 
    activeTabIdRef.current = activeTabId; 
  }, [activeTabId]);

  const navigate = useCallback((url: string) => {
    const currentActiveId = activeTabIdRef.current;
    if (!currentActiveId) return;
    
    let finalUrl = url.trim();

    // Если URL пустой, переходим на StartPage
    if (!finalUrl) {
      updateTab(currentActiveId, { 
        url: '', 
        isLoading: false, 
        title: 'Новая вкладка' 
      });
      return;
    }

    // Проверяем внутренние URL браузера
    if (finalUrl.startsWith('axion://')) {
      updateTab(currentActiveId, { 
        url: finalUrl, 
        isLoading: false, 
        title: getInternalPageTitle(finalUrl) 
      });
      return;
    }

    finalUrl = normalizeUrl(finalUrl, settings.searchEngine);
    updateTab(currentActiveId, { url: finalUrl, isLoading: true });
  }, [settings.searchEngine, updateTab]);

  const goBack = useCallback(async () => {
    const tabId = activeTabIdRef.current;
    if (!tabId) return;
    
    try {
      const result = await window.electronAPI.webViewGoBack(tabId);
      if (result) {
        updateTab(tabId, { isLoading: true });
      }
    } catch (e) {
      console.warn('Cannot go back:', e);
    }
  }, [updateTab]);
  
  const goForward = useCallback(async () => {
    const tabId = activeTabIdRef.current;
    if (!tabId) return;
    
    try {
      const result = await window.electronAPI.webViewGoForward(tabId);
      if (result) {
        updateTab(tabId, { isLoading: true });
      }
    } catch (e) {
      console.warn('Cannot go forward:', e);
    }
  }, [updateTab]);
  
  const reloadTab = useCallback(async () => {
    const tabId = activeTabIdRef.current;
    if (!tabId) return;
    
    try {
      updateTab(tabId, { isLoading: true });
      await window.electronAPI.webViewReload(tabId);
    } catch (e) {
      console.warn('Cannot reload:', e);
      const tab = workspaces.find(ws => ws.id === activeWorkspaceId)?.tabs.find(t => t.id === tabId);
      if (tab?.url) {
        updateTab(tabId, { url: tab.url, isLoading: true });
      }
    }
  }, [updateTab, workspaces, activeWorkspaceId]);
  
  const stopLoading = useCallback(async () => {
    const tabId = activeTabIdRef.current;
    if (!tabId) return;
    
    try {
      await window.electronAPI.webViewStop(tabId);
      updateTab(tabId, { isLoading: false });
    } catch (e) {
      console.warn('Cannot stop loading:', e);
    }
  }, [updateTab]);
  
  // Открытие внутренних страниц с toggle функциональностью
  const openInternalPage = useCallback((page: 'history' | 'downloads' | 'settings') => {
    const url = INTERNAL_URLS[page];
    const title = getInternalPageTitle(url);
    
    setWorkspaces(prev => prev.map(ws => {
      if (ws.id !== activeWorkspaceId) return ws;
      
      const existingTab = ws.tabs.find(t => t.url === url);
      
      // Toggle: если вкладка уже открыта и активна - закрываем её
      if (existingTab && ws.activeTabId === existingTab.id) {
        const remaining = ws.tabs.filter(t => t.id !== existingTab.id);
        
        if (remaining.length === 0) {
          const newTab: Tab = {
            id: uuidv4(),
            url: '',
            title: 'Новая вкладка',
            isLoading: false,
            canGoBack: false,
            canGoForward: false,
            zoomLevel: 1,
          };
          return { ...ws, tabs: [newTab], activeTabId: newTab.id };
        }
        
        const idx = ws.tabs.findIndex(t => t.id === existingTab.id);
        const newIndex = Math.min(idx, remaining.length - 1);
        return { ...ws, tabs: remaining, activeTabId: remaining[newIndex].id };
      }
      
      // Если вкладка существует но не активна - активируем её
      if (existingTab) {
        return { ...ws, activeTabId: existingTab.id };
      }
      
      // Создаем новую вкладку с внутренней страницей
      const newTab: Tab = {
        id: uuidv4(),
        url,
        title,
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        zoomLevel: 1,
      };
      
      return { ...ws, tabs: [...ws.tabs, newTab], activeTabId: newTab.id };
    }));
  }, [activeWorkspaceId, setWorkspaces]);

  return {
    activeTabIdRef,
    navigate,
    goBack,
    goForward,
    reloadTab,
    stopLoading,
    openInternalPage,
  };
};
