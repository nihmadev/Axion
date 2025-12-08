import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Workspace } from '../types';

interface UseWebViewVisibilityProps {
  workspaces: Workspace[];
  workspacesRef?: React.MutableRefObject<Workspace[]>;
  activeWorkspaceId: string;
  isModalOpen: boolean;
}

export const useWebViewVisibility = ({
  workspaces,
  activeWorkspaceId,
  isModalOpen,
}: UseWebViewVisibilityProps) => {
  const previousModalStateRef = useRef(isModalOpen);

  useEffect(() => {
    const wasModalOpen = previousModalStateRef.current;
    previousModalStateRef.current = isModalOpen;

    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    if (!activeWorkspace) return;

    const activeTab = activeWorkspace.tabs.find(t => t.id === activeWorkspace.activeTabId);
    if (!activeTab || !activeTab.url || activeTab.url.startsWith('axion://')) return;

    const tabId = activeTab.id;

    if (isModalOpen && !wasModalOpen) {
      invoke('set_webview_visible', { id: tabId, visible: false }).catch(console.error);
    } else if (!isModalOpen && wasModalOpen) {
      invoke('set_webview_visible', { id: tabId, visible: true }).catch(console.error);
    }
  }, [isModalOpen, workspaces, activeWorkspaceId]);
};
