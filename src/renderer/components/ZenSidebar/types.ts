import { Tab, Workspace, Language, SplitView, TabGroup, TabGroupColorId } from '../../types';

export interface ZenSidebarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onWorkspaceSelect: (id: string) => void;
  onWorkspaceCreate: () => void;
  onWorkspaceDelete: (id: string) => void;
  onWorkspaceRename?: (id: string, name: string) => void;
  onWorkspaceIconChange?: (id: string, icon: string) => void;
  onWorkspaceColorChange?: (id: string, color: string | undefined) => void;

  tabs: Tab[];
  activeTabId: string;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;

  onShowHistory: () => void;
  onShowDownloads: () => void;
  onShowSettings?: () => void;
  
  // Navigation
  canGoBack?: boolean;
  canGoForward?: boolean;
  isLoading?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  onReload?: () => void;
  onStop?: () => void;
  
  // Search
  onSearch?: (query: string) => void;
  
  // Resizable
  sidebarWidth?: number;
  onSidebarWidthChange?: (width: number) => void;
  
  // Customization
  position?: 'left' | 'right';
  style?: 'default' | 'compact' | 'minimal';
  showQuickSites?: boolean;
  showWorkspaces?: boolean;
  showNavigation?: boolean;
  tabCloseButton?: 'hover' | 'always' | 'never';
  showTabFavicons?: boolean;
  showTabPreviews?: boolean;
  
  // Split View
  splitView?: SplitView;
  onCloseSplitView?: () => void;
  
  // Tab Groups
  tabGroups?: TabGroup[];
  onCreateTabGroup?: (name: string, colorId: TabGroupColorId, tabIds: string[]) => void;
  onToggleTabGroupCollapsed?: (groupId: string) => void;
  onUpdateTabGroup?: (groupId: string, updates: Partial<Omit<TabGroup, 'id'>>) => void;
  onDeleteTabGroup?: (groupId: string) => void;
  onCloseTabGroup?: (groupId: string) => void;
  onAddTabToGroup?: (tabId: string, groupId: string) => void;
  onRemoveTabFromGroup?: (tabId: string) => void;
  
  // Localization
  language: Language;
}

export interface ContextMenuPosition {
  id: string;
  x: number;
  y: number;
}

export interface QuickSite {
  name: string;
  url: string;
  color: string;
}
