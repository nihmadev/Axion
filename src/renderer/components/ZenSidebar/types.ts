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
  
  
  canGoBack?: boolean;
  canGoForward?: boolean;
  isLoading?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  onReload?: () => void;
  onStop?: () => void;
  
  
  onSearch?: (query: string) => void;
  
  
  sidebarWidth?: number;
  onSidebarWidthChange?: (width: number) => void;
  
  
  position?: 'left' | 'right';
  style?: 'default' | 'compact' | 'minimal';
  showQuickSites?: boolean;
  showWorkspaces?: boolean;
  showNavigation?: boolean;
  tabCloseButton?: 'hover' | 'always' | 'never';
  showTabFavicons?: boolean;
  showTabPreviews?: boolean;
  
  
  splitView?: SplitView;
  onCloseSplitView?: () => void;
  
  
  tabGroups?: TabGroup[];
  onCreateTabGroup?: (name: string, colorId: TabGroupColorId, tabIds: string[]) => void;
  onToggleTabGroupCollapsed?: (groupId: string) => void;
  onUpdateTabGroup?: (groupId: string, updates: Partial<Omit<TabGroup, 'id'>>) => void;
  onDeleteTabGroup?: (groupId: string) => void;
  onCloseTabGroup?: (groupId: string) => void;
  onAddTabToGroup?: (tabId: string, groupId: string) => void;
  onRemoveTabFromGroup?: (tabId: string) => void;
  
  
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
