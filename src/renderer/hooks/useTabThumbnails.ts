import { useCallback, useEffect, useRef } from 'react';
import { Tab, Workspace } from '../types';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

interface UseTabThumbnailsProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeTabId: string;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  captureInterval?: number; 
}


const createCaptureScript = (tabId: string) => `
(async function() {
  try {
    if (window.location.href.startsWith('axion://')) return;
    
    const thumbWidth = 320;
    const thumbHeight = 200;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = thumbWidth;
    canvas.height = thumbHeight;
    
    
    const gradient = ctx.createLinearGradient(0, 0, thumbWidth, thumbHeight);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, thumbWidth, thumbHeight);
    
    
    const faviconLink = document.querySelector('link[rel*="icon"]');
    const faviconUrl = faviconLink?.href || '';
    
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    
    const title = document.title || window.location.hostname;
    const truncatedTitle = title.length > 35 ? title.substring(0, 35) + '...' : title;
    ctx.fillText(truncatedTitle, thumbWidth/2, thumbHeight/2 + 10);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(window.location.hostname, thumbWidth/2, thumbHeight/2 + 30);
    
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    window.__TAURI__.event.emit('thumbnail-captured', { 
      tabId: '${tabId}', 
      thumbnail: dataUrl 
    });
  } catch (e) {
    console.warn('Thumbnail capture failed:', e);
  }
})();
`;

interface ThumbnailEvent {
  tabId: string;
  thumbnail: string;
}

export const useTabThumbnails = ({
  workspaces,
  activeWorkspaceId,
  activeTabId,
  updateTab,
  captureInterval = 5000,
}: UseTabThumbnailsProps) => {
  const lastCaptureRef = useRef<Map<string, number>>(new Map());
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  
  useEffect(() => {
    const unlisten = listen<ThumbnailEvent>('thumbnail-captured', (event) => {
      const { tabId, thumbnail } = event.payload;
      if (thumbnail && thumbnail.startsWith('data:image')) {
        lastCaptureRef.current.set(tabId, Date.now());
        updateTab(tabId, {
          thumbnail,
          thumbnailUpdatedAt: Date.now(),
        });
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, [updateTab]);

  
  const captureTabThumbnail = useCallback(async (tabId: string) => {
    try {
      
      const lastCapture = lastCaptureRef.current.get(tabId) || 0;
      const now = Date.now();
      if (now - lastCapture < 2000) {
        return;
      }

      
      const script = createCaptureScript(tabId);
      await invoke('execute_script', { id: tabId, script });
    } catch (error) {
      console.warn('Failed to capture thumbnail for tab:', tabId, error);
    }
  }, []);

  
  useEffect(() => {
    if (!activeTabId) return;

    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    const activeTab = activeWorkspace?.tabs.find(t => t.id === activeTabId);
    
    
    if (!activeTab || !activeTab.url || activeTab.url.startsWith('axion://')) {
      return;
    }

    
    const initialCapture = setTimeout(() => {
      captureTabThumbnail(activeTabId);
    }, 1500);

    
    captureTimeoutRef.current = setInterval(() => {
      captureTabThumbnail(activeTabId);
    }, captureInterval);

    return () => {
      clearTimeout(initialCapture);
      if (captureTimeoutRef.current) {
        clearInterval(captureTimeoutRef.current);
      }
    };
  }, [activeTabId, activeWorkspaceId, workspaces, captureTabThumbnail, captureInterval]);

  
  const forceCaptureAll = useCallback(() => {
    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    if (!activeWorkspace) return;

    activeWorkspace.tabs.forEach(tab => {
      if (tab.url && !tab.url.startsWith('axion://')) {
        captureTabThumbnail(tab.id);
      }
    });
  }, [workspaces, activeWorkspaceId, captureTabThumbnail]);

  return {
    captureTabThumbnail,
    forceCaptureAll,
  };
};
