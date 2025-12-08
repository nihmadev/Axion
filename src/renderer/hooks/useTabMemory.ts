import { useCallback, useEffect } from 'react';
import { Workspace } from '../types';
import { TAB_FREEZE_TIMEOUT, MAX_ACTIVE_TABS } from '../constants';
import { removeWebViewFromCache } from '../components/WebView/WebView2Container';

interface UseTabMemoryOptions {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
}

export const useTabMemory = ({ 
  workspaces, 
  activeWorkspaceId, 
  setWorkspaces 
}: UseTabMemoryOptions) => {
  
  const freezeTab = useCallback((tabId: string) => {
    removeWebViewFromCache(tabId);
    window.electronAPI.freezeTab(tabId);
    setWorkspaces(prev => prev.map(ws => ({
      ...ws,
      tabs: ws.tabs.map(t => t.id === tabId ? { ...t, isFrozen: true } : t)
    })));
  }, [setWorkspaces]);

  const unfreezeTab = useCallback((tabId: string) => {
    window.electronAPI.unfreezeTab(tabId);
    setWorkspaces(prev => prev.map(ws => ({
      ...ws,
      tabs: ws.tabs.map(t => t.id === tabId ? { ...t, isFrozen: false, lastActiveAt: Date.now() } : t)
    })));
  }, [setWorkspaces]);

  useEffect(() => {
    const checkAndFreezeTabs = () => {
      const now = Date.now();
      const allTabs = workspaces.flatMap(ws => 
        ws.tabs.map(t => ({ 
          ...t, 
          workspaceId: ws.id, 
          isActive: t.id === ws.activeTabId && ws.id === activeWorkspaceId 
        }))
      );
      
      const sortedTabs = allTabs
        .filter(t => t.url && !t.isFrozen && !t.isActive)
        .sort((a, b) => (a.lastActiveAt || 0) - (b.lastActiveAt || 0));
      
      for (const tab of sortedTabs) {
        const inactiveTime = now - (tab.lastActiveAt || 0);
        const activeTabsCount = allTabs.filter(t => !t.isFrozen && t.url).length;
        
        if (inactiveTime > TAB_FREEZE_TIMEOUT || activeTabsCount > MAX_ACTIVE_TABS) {
          freezeTab(tab.id);
        }
      }
    };

    const interval = setInterval(checkAndFreezeTabs, 60000);
    return () => clearInterval(interval);
  }, [workspaces, activeWorkspaceId, freezeTab]);

  return {
    freezeTab,
    unfreezeTab,
  };
};
