import { useEffect } from 'react';
import { updateWebViewLastUrl } from '../components/WebView/WebView2Container';

interface UseShortcutsOptions {
  createNewTab: (urlOrQuery?: string) => void;
  closeTab: (tabId: string) => void;
  activeTabIdRef: React.MutableRefObject<string>;
  reloadTab: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  toggleFullscreen: () => void;
  printPage: () => void;
  restoreClosedTab: () => void;
  addBookmark: () => void;
  openInternalPage: (page: 'history' | 'downloads' | 'settings') => void;
  setShowTabSearch: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
  addToHistory: (entry: { url: string; title: string; favicon?: string }) => void;
  setWorkspaces: React.Dispatch<React.SetStateAction<any[]>>;
}

export const useShortcuts = ({
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
}: UseShortcutsOptions) => {
  
  useEffect(() => {
    const handleShortcut = (action: string) => {
      switch (action) {
        case 'new-tab': createNewTab(); break;
        case 'close-tab': activeTabIdRef.current && closeTab(activeTabIdRef.current); break;
        case 'focus-url': document.querySelector<HTMLInputElement>('.address-input')?.focus(); break;
        case 'reload': reloadTab(); break;
        case 'find':
        case 'escape':
          window.dispatchEvent(new CustomEvent('webview-shortcut', { detail: action }));
          break;
        case 'zoom-in': zoomIn(); break;
        case 'zoom-out': zoomOut(); break;
        case 'zoom-reset': zoomReset(); break;
        case 'fullscreen': toggleFullscreen(); break;
        case 'print': printPage(); break;
        case 'restore-tab': restoreClosedTab(); break;
        case 'downloads': openInternalPage('downloads'); break;
        case 'bookmarks': addBookmark(); break;
        case 'history': openInternalPage('history'); break;
        case 'search-tabs': setShowTabSearch(true); break;
      }
    };

    const cleanupShortcut = window.electronAPI.onShortcut(handleShortcut);
    const cleanupFullscreen = window.electronAPI.onFullscreenChange(setIsFullscreen);
    const cleanupOpenUrl = window.electronAPI.onOpenUrl((url: string) => createNewTab(url));

    
    
    const cleanupWebViewUrlChanged = window.electronAPI.onWebViewUrlChanged?.((data: { 
      id: string; 
      url?: string; 
      title?: string; 
      favicon?: string;
      is_loading?: boolean 
    }) => {
      if (!data.url || data.url === 'about:blank') return;
      
      
      
      updateWebViewLastUrl(data.id, data.url);

      
      let pageTitle = data.title;
      if (!pageTitle || pageTitle.trim() === '') {
        try {
          const urlObj = new URL(data.url);
          pageTitle = urlObj.hostname.replace('www.', '');
        } catch {
          pageTitle = data.url;
        }
      }

      
      let favicon = data.favicon;
      if (!favicon) {
        try {
          const urlObj = new URL(data.url);
          favicon = `https://${urlObj.hostname}/favicon.ico`;
        } catch {
          favicon = undefined;
        }
      }

      setWorkspaces((prev: any[]) => prev.map(ws => ({
        ...ws,
        tabs: ws.tabs.map((t: any) => {
          if (t.id === data.id) {
            
            const urlChanged = t.url !== data.url;
            const titleChanged = t.title !== pageTitle;
            const faviconChanged = favicon && t.favicon !== favicon;
            
            
            if (!urlChanged && !titleChanged && !faviconChanged) return t;
            
            return {
              ...t,
              url: data.url,
              title: pageTitle,
              favicon: favicon || t.favicon,
              isLoading: data.is_loading ?? false,
              canGoBack: true,
            };
          }
          return t;
        })
      })));
      
      
      if (!data.url.startsWith('about:')) {
        addToHistory({
          url: data.url,
          title: pageTitle,
          favicon: favicon,
        });
      }
    }) || (() => {});

    return () => {
      cleanupShortcut();
      cleanupFullscreen();
      cleanupOpenUrl();
      cleanupWebViewUrlChanged();
    };
  }, [
    createNewTab, closeTab, zoomIn, zoomOut, zoomReset, 
    toggleFullscreen, printPage, restoreClosedTab, 
    addBookmark, openInternalPage, addToHistory, setWorkspaces
  ]);
};
