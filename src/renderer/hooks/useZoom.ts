import { useCallback } from 'react';
import { Workspace } from '../types';

interface UseZoomOptions {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeTabIdRef: React.MutableRefObject<string>;
  webviewRefs: React.MutableRefObject<Map<string, HTMLWebViewElement>>;
  updateTab: (tabId: string, updates: { zoomLevel: number }) => void;
}

export const useZoom = ({
  workspaces,
  activeWorkspaceId,
  activeTabIdRef,
  webviewRefs,
  updateTab,
}: UseZoomOptions) => {
  
  const zoomIn = useCallback(() => {
    const tabId = activeTabIdRef.current;
    const iframe = webviewRefs.current.get(tabId) as HTMLIFrameElement;
    const workspace = workspaces.find(ws => ws.id === activeWorkspaceId);
    const tab = workspace?.tabs.find(t => t.id === tabId);
    
    if (iframe && tab) {
      const currentZoom = tab.zoomLevel || 1;
      const newZoom = Math.min(currentZoom + 0.1, 3);
      iframe.style.transform = `scale(${newZoom})`;
      iframe.style.transformOrigin = 'top left';
      iframe.style.width = `${100 / newZoom}%`;
      iframe.style.height = `${100 / newZoom}%`;
      updateTab(tabId, { zoomLevel: newZoom });
    }
  }, [workspaces, activeWorkspaceId, activeTabIdRef, webviewRefs, updateTab]);

  const zoomOut = useCallback(() => {
    const tabId = activeTabIdRef.current;
    const iframe = webviewRefs.current.get(tabId) as HTMLIFrameElement;
    const workspace = workspaces.find(ws => ws.id === activeWorkspaceId);
    const tab = workspace?.tabs.find(t => t.id === tabId);
    
    if (iframe && tab) {
      const currentZoom = tab.zoomLevel || 1;
      const newZoom = Math.max(currentZoom - 0.1, 0.3);
      iframe.style.transform = `scale(${newZoom})`;
      iframe.style.transformOrigin = 'top left';
      iframe.style.width = `${100 / newZoom}%`;
      iframe.style.height = `${100 / newZoom}%`;
      updateTab(tabId, { zoomLevel: newZoom });
    }
  }, [workspaces, activeWorkspaceId, activeTabIdRef, webviewRefs, updateTab]);

  const zoomReset = useCallback(() => {
    const tabId = activeTabIdRef.current;
    const iframe = webviewRefs.current.get(tabId) as HTMLIFrameElement;
    
    if (iframe) {
      iframe.style.transform = 'scale(1)';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      updateTab(tabId, { zoomLevel: 1 });
    }
  }, [activeTabIdRef, webviewRefs, updateTab]);

  return {
    zoomIn,
    zoomOut,
    zoomReset,
  };
};
