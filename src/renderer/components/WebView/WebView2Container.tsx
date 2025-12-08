import React, { useEffect, useRef, useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Tab, HistoryEntry } from '../../types';
import '../../styles/components/webview-container.css';

interface WebView2ContainerProps {
  tab: Tab;
  isActive: boolean;
  onUpdate: (updates: Partial<Tab>) => void;
  onAddHistory: (entry: Omit<HistoryEntry, 'id' | 'visitedAt'>) => void;
  webviewRef: (ref: HTMLDivElement | null) => void;
  onOpenInNewTab?: (url: string) => void;
}

interface WebViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}


const createdWebViews = new Set<string>();
const webViewLastUrls = new Map<string, string>();


export const removeWebViewFromCache = (tabId: string) => {
  createdWebViews.delete(tabId);
  webViewLastUrls.delete(tabId);
};



export const updateWebViewLastUrl = (tabId: string, url: string) => {
  webViewLastUrls.set(tabId, url);
};


const faviconCache = new Map<string, string>();


const getFaviconUrl = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    if (faviconCache.has(hostname)) {
      return faviconCache.get(hostname)!;
    }
    
    const faviconUrl = `https://${hostname}/favicon.ico`;
    faviconCache.set(hostname, faviconUrl);
    return faviconUrl;
  } catch {
    return '';
  }
};


const WebView2Container: React.FC<WebView2ContainerProps> = ({
  tab, isActive, onUpdate, onAddHistory, webviewRef, onOpenInNewTab: _onOpenInNewTab
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const webviewCreatedRef = useRef(false);
  const lastUrlRef = useRef<string>('');
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const boundsUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const createTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  
  const updateBoundsDebounced = useCallback((bounds: WebViewBounds) => {
    if (boundsUpdateTimeoutRef.current) {
      clearTimeout(boundsUpdateTimeoutRef.current);
    }
    boundsUpdateTimeoutRef.current = setTimeout(() => {
      if (webviewCreatedRef.current) {
        invoke('update_webview_bounds', { id: tab.id, bounds }).catch(console.error);
      }
    }, 16); 
  }, [tab.id]);

  
  useEffect(() => {
    if (!tab.url || isCreating) return;

    const createOrRestoreWebView = async () => {
      
      const alreadyCreated = createdWebViews.has(tab.id);
      
      if (alreadyCreated) {
        
        webviewCreatedRef.current = true;
        
        
        
        const container = containerRef.current;
        if (container && isActive) {
          const rect = container.getBoundingClientRect();
          const bounds: WebViewBounds = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          };
          await invoke('update_webview_bounds', { id: tab.id, bounds });
          await invoke('set_webview_visible', { id: tab.id, visible: true });
        }
        return;
      }

      
      try {
        const exists = await invoke<boolean>('webview_exists', { id: tab.id });
        if (exists) {
          createdWebViews.add(tab.id);
          webviewCreatedRef.current = true;
          
          
          const container = containerRef.current;
          if (container && isActive) {
            const rect = container.getBoundingClientRect();
            const bounds: WebViewBounds = {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
            };
            await invoke('update_webview_bounds', { id: tab.id, bounds });
            await invoke('set_webview_visible', { id: tab.id, visible: true });
          }
          return;
        }
      } catch (e) {
        console.warn('Failed to check webview existence:', e);
      }

      
      setIsCreating(true);
      
      try {
        const container = containerRef.current;
        if (!container) {
          setIsCreating(false);
          return;
        }

        const rect = container.getBoundingClientRect();
        const bounds: WebViewBounds = {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        };

        
        onUpdate({ isLoading: true, canGoBack: false, canGoForward: false });

        
        await invoke('create_webview', {
          id: tab.id,
          url: tab.url,
          bounds,
        });

        createdWebViews.add(tab.id);
        webviewCreatedRef.current = true;
        lastUrlRef.current = tab.url;
        webViewLastUrls.set(tab.id, tab.url);
        
        
        createTimeoutRef.current = setTimeout(() => {
          onUpdate({ isLoading: false, canGoBack: false });
        }, 50);

        
        onAddHistory({
          url: tab.url,
          title: tab.title || tab.url,
          favicon: getFaviconUrl(tab.url),
        });
      } catch (error) {
        console.error('Failed to create webview:', error);
        onUpdate({ isLoading: false });
      } finally {
        setIsCreating(false);
      }
    };

    
    createOrRestoreWebView();

    return () => {
      
      if (boundsUpdateTimeoutRef.current) {
        clearTimeout(boundsUpdateTimeoutRef.current);
      }
      if (createTimeoutRef.current) {
        clearTimeout(createTimeoutRef.current);
      }
      
      
      if (webviewCreatedRef.current || createdWebViews.has(tab.id)) {
        invoke('set_webview_visible', { id: tab.id, visible: false }).catch(() => {});
      }
    };
  }, [tab.id, tab.url, isActive]);

  
  useEffect(() => {
    
    const webviewExists = webviewCreatedRef.current || createdWebViews.has(tab.id);
    if (!webviewExists || !tab.url) return;
    
    
    
    const lastKnownUrl = webViewLastUrls.get(tab.id) || lastUrlRef.current;
    if (tab.url === lastKnownUrl) return;

    const navigate = async () => {
      try {
        
        onUpdate({ isLoading: true, canGoBack: true });
        
        
        await invoke('navigate_webview', { id: tab.id, url: tab.url });
        lastUrlRef.current = tab.url;
        webViewLastUrls.set(tab.id, tab.url);
        
        
        setTimeout(() => {
          onUpdate({ isLoading: false });
        }, 30);

        
        onAddHistory({
          url: tab.url,
          title: tab.title || tab.url,
          favicon: getFaviconUrl(tab.url),
        });
      } catch (error) {
        console.error('Navigation failed:', error);
        onUpdate({ isLoading: false });
      }
    };

    navigate();
  }, [tab.url]);

  
  useEffect(() => {
    if (!webviewCreatedRef.current && !createdWebViews.has(tab.id)) return;

    const updateVisibility = async () => {
      if (isActive) {
        
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const bounds: WebViewBounds = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          };
          await invoke('update_webview_bounds', { id: tab.id, bounds });
        }
      }
      await invoke('set_webview_visible', { id: tab.id, visible: isActive });
    };

    updateVisibility().catch(console.error);
  }, [isActive, tab.id]);

  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateBounds = () => {
      if (!webviewCreatedRef.current) return;

      const rect = container.getBoundingClientRect();
      const bounds: WebViewBounds = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      };

      updateBoundsDebounced(bounds);
    };

    resizeObserverRef.current = new ResizeObserver(updateBounds);
    resizeObserverRef.current.observe(container);

    
    window.addEventListener('resize', updateBounds);
    window.addEventListener('scroll', updateBounds);

    return () => {
      resizeObserverRef.current?.disconnect();
      window.removeEventListener('resize', updateBounds);
      window.removeEventListener('scroll', updateBounds);
    };
  }, [tab.id, updateBoundsDebounced]);

  
  useEffect(() => {
    webviewRef(containerRef.current);
  }, [webviewRef]);

  
  

  return (
    <div className="webview-container" ref={containerRef}>
      {tab.isLoading && <div className="loading-progress" />}
      {}
      <div className="webview-placeholder">
        {!webviewCreatedRef.current && (
          <div className="webview-loading">��������...</div>
        )}
      </div>
    </div>
  );
};

export default WebView2Container;
