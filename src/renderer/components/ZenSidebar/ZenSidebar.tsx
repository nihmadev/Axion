import React, { useRef, useMemo } from 'react';
import { ZenSidebarProps } from './types';
import { DEFAULT_SIDEBAR_WIDTH } from './constants';
import { useWorkspaceEdit, useContextMenu, useSidebarResize } from './hooks';
import {
  WindowControls,
  Navigation,
  SearchBar,
  QuickSites,
  WorkspaceList,
  TabList,
  BottomToolbar,
  ResizeHandle,
} from './components';
import '../../styles/sidebar/index.css';

const ZenSidebar: React.FC<ZenSidebarProps> = ({
  workspaces,
  activeWorkspaceId,
  onWorkspaceSelect,
  onWorkspaceCreate,
  onWorkspaceDelete,
  onWorkspaceRename,
  onWorkspaceIconChange,
  onWorkspaceColorChange,
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
  onShowHistory,
  onShowDownloads,
  onShowSettings,
  canGoBack,
  canGoForward,
  isLoading,
  onBack,
  onForward,
  onReload,
  onStop,
  onSearch,
  sidebarWidth = DEFAULT_SIDEBAR_WIDTH,
  onSidebarWidthChange,
  position = 'right',
  style = 'default',
  showQuickSites = true,
  showWorkspaces = true,
  showNavigation = true,
  tabCloseButton = 'hover',
  showTabFavicons = true,
  showTabPreviews = true,
  language,
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Get active workspace accent color
  const activeWorkspaceColor = useMemo(() => {
    const activeWs = workspaces.find(ws => ws.id === activeWorkspaceId);
    return activeWs?.color;
  }, [workspaces, activeWorkspaceId]);
  
  // Custom hooks
  const workspaceEdit = useWorkspaceEdit();
  const contextMenu = useContextMenu(sidebarRef);
  const { startResizing } = useSidebarResize(position, onSidebarWidthChange);

  const handleQuickSiteClick = (url: string) => {
    if (onSearch) {
      onSearch(url);
    }
  };

  const sidebarClasses = [
    'zen-sidebar',
    `zen-sidebar--${position}`,
    `zen-sidebar--${style}`,
  ].join(' ');

  return (
    <div 
      ref={sidebarRef}
      className={sidebarClasses}
      style={{ 
        width: style === 'minimal' ? '60px' : `${sidebarWidth}px`,
        ...(activeWorkspaceColor && { '--workspace-accent': activeWorkspaceColor } as React.CSSProperties)
      }}
    >
      <WindowControls />

      {showNavigation && (
        <Navigation
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          isLoading={isLoading}
          onBack={onBack}
          onForward={onForward}
          onReload={onReload}
          onStop={onStop}
        />
      )}

      <SearchBar onSearch={onSearch} />

      {showQuickSites && style !== 'minimal' && (
        <QuickSites 
          onSiteClick={handleQuickSiteClick} 
        />
      )}

      {showWorkspaces && (
        <WorkspaceList
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          style={style}
          onWorkspaceSelect={onWorkspaceSelect}
          onWorkspaceCreate={onWorkspaceCreate}
          onWorkspaceDelete={onWorkspaceDelete}
          onWorkspaceRename={onWorkspaceRename}
          onWorkspaceIconChange={onWorkspaceIconChange}
          onWorkspaceColorChange={onWorkspaceColorChange}
          editingWorkspaceId={workspaceEdit.editingWorkspaceId}
          editingName={workspaceEdit.editingName}
          setEditingName={workspaceEdit.setEditingName}
          editInputRef={workspaceEdit.editInputRef}
          onStartRename={workspaceEdit.startRename}
          onFinishRename={() => workspaceEdit.finishRename(onWorkspaceRename)}
          onCancelRename={workspaceEdit.cancelRename}
          contextMenuWorkspace={contextMenu.contextMenuWorkspace}
          showIconPicker={contextMenu.showIconPicker}
          setShowIconPicker={contextMenu.setShowIconPicker}
          contextMenuRef={contextMenu.contextMenuRef}
          onOpenContextMenu={contextMenu.openContextMenu}
          onOpenIconPicker={contextMenu.openIconPicker}
          onCloseContextMenu={contextMenu.closeContextMenu}
          language={language}
        />
      )}

      <TabList
        tabs={tabs}
        activeTabId={activeTabId}
        style={style}
        tabCloseButton={tabCloseButton}
        showTabFavicons={showTabFavicons}
        showTabPreviews={showTabPreviews}
        sidebarPosition={position}
        onTabSelect={onTabSelect}
        onTabClose={onTabClose}
        onNewTab={onNewTab}
        language={language}
      />

      <BottomToolbar
        onShowSettings={onShowSettings}
        onShowHistory={onShowHistory}
        onShowDownloads={onShowDownloads}
        language={language}
      />

      {onSidebarWidthChange && (
        <ResizeHandle onStartResize={startResizing} />
      )}
    </div>
  );
};

export default ZenSidebar;
