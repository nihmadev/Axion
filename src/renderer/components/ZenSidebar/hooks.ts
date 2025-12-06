import { useState, useRef, useEffect, useCallback, RefObject } from 'react';
import { ContextMenuPosition, QuickSite } from './types';
import { MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH, DEFAULT_QUICK_SITES } from './constants';

const QUICK_SITES_STORAGE_KEY = 'axion-quick-sites';
const QUICK_SITES_CHANGE_EVENT = 'quick-sites-changed';

/**
 * Hook for managing QuickSites with localStorage persistence
 */
export function useQuickSites() {
  const [sites, setSites] = useState<QuickSite[]>(() => {
    try {
      const stored = localStorage.getItem(QUICK_SITES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load quick sites:', e);
    }
    return DEFAULT_QUICK_SITES;
  });

  const [isEditMode, setIsEditMode] = useState(false);

  // Persist to localStorage and dispatch custom event
  const saveSites = useCallback((newSites: QuickSite[]) => {
    try {
      localStorage.setItem(QUICK_SITES_STORAGE_KEY, JSON.stringify(newSites));
      setSites(newSites);
      // Dispatch custom event for same-window sync
      window.dispatchEvent(new CustomEvent(QUICK_SITES_CHANGE_EVENT, { detail: newSites }));
    } catch (e) {
      console.error('Failed to save quick sites:', e);
    }
  }, []);

  // Listen for changes from other components (same window)
  useEffect(() => {
    const handleQuickSitesChange = (e: CustomEvent<QuickSite[]>) => {
      setSites(e.detail);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === QUICK_SITES_STORAGE_KEY && e.newValue) {
        try {
          setSites(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener(QUICK_SITES_CHANGE_EVENT, handleQuickSitesChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(QUICK_SITES_CHANGE_EVENT, handleQuickSitesChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addSite = useCallback((site: QuickSite) => {
    const newSites = [...sites, site];
    saveSites(newSites);
  }, [sites, saveSites]);

  const removeSite = useCallback((index: number) => {
    const newSites = sites.filter((_, i) => i !== index);
    saveSites(newSites);
  }, [sites, saveSites]);

  const updateSite = useCallback((index: number, site: QuickSite) => {
    const newSites = sites.map((s, i) => i === index ? site : s);
    saveSites(newSites);
  }, [sites, saveSites]);

  const resetToDefaults = useCallback(() => {
    saveSites(DEFAULT_QUICK_SITES);
  }, [saveSites]);

  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);

  return {
    sites,
    isEditMode,
    addSite,
    removeSite,
    updateSite,
    resetToDefaults,
    toggleEditMode,
  };
}

/**
 * Hook for managing workspace editing state
 */
export function useWorkspaceEdit() {
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingWorkspaceId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingWorkspaceId]);

  const startRename = useCallback((id: string, name: string) => {
    setEditingWorkspaceId(id);
    setEditingName(name);
  }, []);

  const finishRename = useCallback((onRename?: (id: string, name: string) => void) => {
    if (editingWorkspaceId && editingName.trim() && onRename) {
      onRename(editingWorkspaceId, editingName.trim());
    }
    setEditingWorkspaceId(null);
    setEditingName('');
  }, [editingWorkspaceId, editingName]);

  const cancelRename = useCallback(() => {
    setEditingWorkspaceId(null);
    setEditingName('');
  }, []);

  return {
    editingWorkspaceId,
    editingName,
    setEditingName,
    editInputRef,
    startRename,
    finishRename,
    cancelRename,
  };
}

/**
 * Hook for managing context menu state
 */
export function useContextMenu(sidebarRef: RefObject<HTMLDivElement>) {
  const [contextMenuWorkspace, setContextMenuWorkspace] = useState<ContextMenuPosition | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenuWorkspace(null);
        setShowIconPicker(false);
      }
    };

    if (contextMenuWorkspace) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenuWorkspace]);

  const openContextMenu = useCallback((e: React.MouseEvent, workspaceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menuWidth = 220;
    const menuHeight = 200;
    
    const sidebarRect = sidebarRef.current?.getBoundingClientRect();
    if (!sidebarRect) return;
    
    const sidebarOnLeft = sidebarRect.left < window.innerWidth / 2;
    
    let x: number;
    let y = e.clientY;
    
    if (sidebarOnLeft) {
      x = sidebarRect.right + 10;
      if (x + menuWidth > window.innerWidth - 10) {
        x = Math.max(10, e.clientX - menuWidth - 10);
      }
    } else {
      x = sidebarRect.left - menuWidth - 10;
      if (x < 10) {
        x = Math.min(window.innerWidth - menuWidth - 10, e.clientX + 10);
      }
    }
    
    x = Math.max(10, Math.min(x, window.innerWidth - menuWidth - 10));
    
    if (y + menuHeight > window.innerHeight - 10) {
      y = Math.max(10, window.innerHeight - menuHeight - 10);
    }
    
    y = Math.max(10, y);
    
    setContextMenuWorkspace({ id: workspaceId, x, y });
  }, [sidebarRef]);

  const openIconPicker = useCallback(() => {
    if (!contextMenuWorkspace) return;
    
    const pickerWidth = 300;
    const pickerHeight = 350;
    
    const sidebarRect = sidebarRef.current?.getBoundingClientRect();
    if (!sidebarRect) return;
    
    const sidebarOnLeft = sidebarRect.left < window.innerWidth / 2;
    
    let x: number;
    let y = contextMenuWorkspace.y;
    
    if (sidebarOnLeft) {
      x = sidebarRect.right + 10;
      if (x + pickerWidth > window.innerWidth - 10) {
        x = Math.max(10, window.innerWidth - pickerWidth - 10);
      }
    } else {
      x = sidebarRect.left - pickerWidth - 10;
      if (x < 10) {
        x = 10;
      }
    }
    
    x = Math.max(10, Math.min(x, window.innerWidth - pickerWidth - 10));
    
    if (y + pickerHeight > window.innerHeight - 10) {
      y = Math.max(10, window.innerHeight - pickerHeight - 10);
    }
    
    y = Math.max(10, y);
    
    setContextMenuWorkspace({ ...contextMenuWorkspace, x, y });
    setShowIconPicker(true);
  }, [contextMenuWorkspace, sidebarRef]);

  const closeContextMenu = useCallback(() => {
    setContextMenuWorkspace(null);
    setShowIconPicker(false);
  }, []);

  return {
    contextMenuWorkspace,
    showIconPicker,
    setShowIconPicker,
    contextMenuRef,
    openContextMenu,
    openIconPicker,
    closeContextMenu,
  };
}

/**
 * Hook for sidebar resizing
 */
export function useSidebarResize(
  position: 'left' | 'right',
  onSidebarWidthChange?: (width: number) => void
) {
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!onSidebarWidthChange) return;
      
      let newWidth: number;
      
      if (position === 'left') {
        newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, e.clientX));
      } else {
        newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, window.innerWidth - e.clientX));
      }
      
      onSidebarWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onSidebarWidthChange, position]);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  return { isResizing, startResizing };
}
