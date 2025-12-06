import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Workspace } from '../types';

interface UseWebViewVisibilityProps {
  workspaces: Workspace[];
  workspacesRef?: React.MutableRefObject<Workspace[]>;
  activeWorkspaceId: string;
  isModalOpen: boolean;
}

/**
 * Управляет видимостью нативных WebView.
 * Скрывает все WebView когда открыто модальное окно,
 * чтобы нативный WebView не перекрывал UI React.
 */
export const useWebViewVisibility = ({
  workspaces,
  activeWorkspaceId,
  isModalOpen,
}: UseWebViewVisibilityProps) => {
  const previousModalStateRef = useRef(isModalOpen);

  useEffect(() => {
    const wasModalOpen = previousModalStateRef.current;
    previousModalStateRef.current = isModalOpen;

    // Находим активную вкладку
    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    if (!activeWorkspace) return;

    const activeTab = activeWorkspace.tabs.find(t => t.id === activeWorkspace.activeTabId);
    if (!activeTab || !activeTab.url || activeTab.url.startsWith('axion://')) return;

    const tabId = activeTab.id;

    if (isModalOpen && !wasModalOpen) {
      // Модальное окно открылось - скрываем WebView
      invoke('set_webview_visible', { id: tabId, visible: false }).catch(console.error);
    } else if (!isModalOpen && wasModalOpen) {
      // Модальное окно закрылось - показываем WebView обратно
      invoke('set_webview_visible', { id: tabId, visible: true }).catch(console.error);
    }
  }, [isModalOpen, workspaces, activeWorkspaceId]);
};
