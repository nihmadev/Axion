import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Bookmark, Workspace, HistoryEntry } from '../types';

interface UseBookmarksOptions {
  workspaces: Workspace[];
  activeWorkspaceId: string;
}

export const useBookmarks = ({ workspaces, activeWorkspaceId }: UseBookmarksOptions) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const addBookmark = useCallback(async () => {
    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    const tab = activeWorkspace?.tabs.find(t => t.id === activeWorkspace.activeTabId);
    if (!tab) return;
    
    // Получаем реальную информацию о странице из WebView менеджера
    // Это гарантирует актуальный URL даже после SPA-навигации
    let url = tab.url;
    let title = tab.title;
    let favicon = tab.favicon;
    
    try {
      const realInfo = await window.electronAPI.getRealPageInfo(tab.id);
      if (realInfo && realInfo.url && realInfo.url !== 'about:blank') {
        url = realInfo.url;
        title = realInfo.title || title;
        favicon = realInfo.favicon || favicon;
      }
    } catch (e) {
      // Fallback на данные из tab если не удалось получить из WebView
      console.warn('Failed to get real page info, using tab data:', e);
    }
    
    if (!url) return;
    
    const bookmark: Bookmark = { 
      id: uuidv4(), 
      url, 
      title, 
      favicon, 
      createdAt: Date.now() 
    };
    const newBookmarks = [...bookmarks, bookmark];
    setBookmarks(newBookmarks);
    window.electronAPI.setBookmarks(newBookmarks);
  }, [workspaces, activeWorkspaceId, bookmarks]);

  const handleImportFromBrowser = useCallback(async (
    browser: 'chrome' | 'firefox' | 'edge' | 'zen',
    history: HistoryEntry[],
    setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>,
    setShowImportDialog: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setShowImportDialog(false);
    const result = await window.electronAPI.importFromBrowser(browser);
    if (result) {
      // Объединяем закладки
      const mergedBookmarks = [...bookmarks, ...result.bookmarks.filter(
        imported => !bookmarks.some(b => b.url === imported.url)
      )];
      setBookmarks(mergedBookmarks);
      window.electronAPI.setBookmarks(mergedBookmarks);
      
      // Объединяем историю
      const mergedHistory = [...result.history, ...history];
      setHistory(mergedHistory.slice(0, 500));
      window.electronAPI.setHistory?.(mergedHistory.slice(0, 500));
      
      alert(`Импортировано: ${result.bookmarks.length} закладок и ${result.history.length} записей истории`);
    } else {
      alert('Не удалось найти данные браузера. Убедитесь, что браузер установлен.');
    }
  }, [bookmarks]);

  return {
    bookmarks,
    setBookmarks,
    addBookmark,
    handleImportFromBrowser,
  };
};
