import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Tab, Workspace, Settings, Bookmark, HistoryEntry, defaultSettings } from '../types';

interface UseSessionOptions {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
  setActiveWorkspaceId: React.Dispatch<React.SetStateAction<string>>;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  setBookmarks: React.Dispatch<React.SetStateAction<Bookmark[]>>;
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>;
}

export const useSession = ({
  workspaces,
  activeWorkspaceId,
  setWorkspaces,
  setActiveWorkspaceId,
  setSettings,
  setBookmarks,
  setHistory,
  setSidebarWidth,
}: UseSessionOptions) => {
  const [sessionRestored, setSessionRestored] = useState(false);

  
  const loadData = useCallback(async () => {
    try {
      const [savedSettings, savedBookmarks, savedHistory] = await Promise.all([
        window.electronAPI.getSettings().catch(() => null),
        window.electronAPI.getBookmarks().catch(() => []),
        window.electronAPI.getHistory().catch(() => []),
      ]);
      if (savedSettings && Object.keys(savedSettings).length) {
        setSettings({ ...defaultSettings, ...savedSettings });
      }
      if (savedBookmarks) setBookmarks(savedBookmarks);
      if (savedHistory) setHistory(savedHistory);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  }, [setSettings, setBookmarks, setHistory]);

  
  useEffect(() => {
    let initialized = false;
    
    const initApp = async () => {
      if (initialized) return;
      initialized = true;
      
      await loadData();
      
      
      const savedWidth = localStorage.getItem('sidebarWidth');
      if (savedWidth) {
        setSidebarWidth(parseInt(savedWidth, 10));
      }
      
      
      const savedSession = await window.electronAPI.restoreSession();
      if (savedSession && savedSession.workspaces && savedSession.workspaces.length > 0) {
        setWorkspaces(savedSession.workspaces);
        setActiveWorkspaceId(savedSession.activeWorkspaceId || savedSession.workspaces[0].id);
        setSessionRestored(true);
        
        window.electronAPI.clearSession();
      } else {
        
        const workspaceId = uuidv4();
        const initialTab: Tab = {
          id: uuidv4(),
          url: '',
          title: 'Новая вкладка',
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
          zoomLevel: 1,
        };

        const workspace: Workspace = {
          id: workspaceId,
          name: 'Default',
          icon: 'workspace',
          activeTabId: initialTab.id,
          tabs: [initialTab],
        };
        
        setWorkspaces([workspace]);
        setActiveWorkspaceId(workspaceId);
      }
    };
    
    initApp();
  }, []);

  
  useEffect(() => {
    const unlisten = window.electronAPI.onOpenUrl((url: string) => {
      console.log('[Session] Received open-url event:', url);
      
      setWorkspaces(prev => {
        if (prev.length === 0) return prev;
        
        
        const wsIndex = prev.findIndex(ws => ws.id === activeWorkspaceId) || 0;
        const workspace = prev[wsIndex] || prev[0];
        
        
        const emptyTabIndex = workspace.tabs.findIndex(t => !t.url || t.url === '');
        
        if (emptyTabIndex !== -1) {
          
          const updatedTabs = [...workspace.tabs];
          updatedTabs[emptyTabIndex] = {
            ...updatedTabs[emptyTabIndex],
            url,
            title: url.split('/').pop() || 'Загрузка...',
            isLoading: true,
          };
          
          const updatedWorkspace = {
            ...workspace,
            tabs: updatedTabs,
            activeTabId: updatedTabs[emptyTabIndex].id,
          };
          
          const newWorkspaces = [...prev];
          newWorkspaces[wsIndex !== -1 ? wsIndex : 0] = updatedWorkspace;
          return newWorkspaces;
        } else {
          
          const newTab: Tab = {
            id: uuidv4(),
            url,
            title: url.split('/').pop() || 'Загрузка...',
            isLoading: true,
            canGoBack: false,
            canGoForward: false,
            zoomLevel: 1,
          };
          
          const updatedWorkspace = {
            ...workspace,
            tabs: [...workspace.tabs, newTab],
            activeTabId: newTab.id,
          };
          
          const newWorkspaces = [...prev];
          newWorkspaces[wsIndex !== -1 ? wsIndex : 0] = updatedWorkspace;
          return newWorkspaces;
        }
      });
    });

    return unlisten;
  }, [activeWorkspaceId, setWorkspaces]);

  
  useEffect(() => {
    if (workspaces.length === 0) return;

    const saveCurrentSession = () => {
      const sessionData = {
        workspaces: workspaces.map(ws => ({
          ...ws,
          tabs: ws.tabs.map(t => ({
            id: t.id,
            url: t.url,
            title: t.title,
            favicon: t.favicon,
            isLoading: false,
            canGoBack: false,
            canGoForward: false,
            zoomLevel: t.zoomLevel || 1,
          }))
        })),
        activeWorkspaceId,
      };
      window.electronAPI.saveSession(sessionData);
    };

    
    const interval = setInterval(saveCurrentSession, 30000);

    
    const handleBeforeUnload = () => {
      saveCurrentSession();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [workspaces, activeWorkspaceId]);

  return {
    sessionRestored,
    setSessionRestored,
    loadData,
  };
};
