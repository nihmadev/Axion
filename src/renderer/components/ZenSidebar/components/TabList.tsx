import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Tab, SplitView, TabGroup, TAB_GROUP_COLORS, TabGroupColorId } from '../../../types';
import { useTranslation } from '../../../hooks/useTranslation';
import { 
  PlusIcon, 
  CloseIcon, 
  GlobeIcon,
  HistoryTabIcon,
  DownloadsTabIcon,
  SettingsTabIcon,
  HomeTabIcon,
  QuickSitesTabIcon
} from '../icons';
import { TabPreview } from './TabPreview';
import { TabGroupHeader } from './TabGroupHeader';
import { CreateTabGroupModal } from './CreateTabGroupModal';

interface TabListProps {
  tabs: Tab[];
  activeTabId: string;
  style: 'default' | 'compact' | 'minimal';
  tabCloseButton: 'hover' | 'always' | 'never';
  showTabFavicons: boolean;
  showTabPreviews?: boolean;
  sidebarPosition?: 'left' | 'right';
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
  splitView?: SplitView;
  onCloseSplitView?: () => void;
  language: 'ru' | 'en' | 'es' | 'fr' | 'de' | 'zh-CN';
  // Tab Groups
  tabGroups?: TabGroup[];
  onCreateTabGroup?: (name: string, colorId: TabGroupColorId, tabIds: string[]) => void;
  onToggleTabGroupCollapsed?: (groupId: string) => void;
  onUpdateTabGroup?: (groupId: string, updates: Partial<Omit<TabGroup, 'id'>>) => void;
  onDeleteTabGroup?: (groupId: string) => void;
  onCloseTabGroup?: (groupId: string) => void;
  onAddTabToGroup?: (tabId: string, groupId: string) => void;
  onRemoveTabFromGroup?: (tabId: string) => void;
}

const getInternalIcon = (url?: string) => {
  if (!url) return <HomeTabIcon />; // StartPage
  if (url === 'axion://history') return <HistoryTabIcon />;
  if (url === 'axion://downloads') return <DownloadsTabIcon />;
  if (url === 'axion://settings') return <SettingsTabIcon />;
  if (url === 'axion://quicksites') return <QuickSitesTabIcon />;
  return null;
};

const getInternalPageName = (url: string | undefined, t: ReturnType<typeof useTranslation>): string | null => {
  if (!url) return t.common.startPage;
  if (url === 'axion://history') return t.common.history;
  if (url === 'axion://downloads') return t.common.downloads;
  if (url === 'axion://settings') return t.common.settings;
  if (url === 'axion://quicksites') return t.common.quickSites;
  return null;
};

export const TabList: React.FC<TabListProps> = ({
  tabs,
  activeTabId,
  style,
  tabCloseButton,
  showTabFavicons,
  showTabPreviews = true,
  sidebarPosition = 'right',
  onTabSelect,
  onTabClose,
  onNewTab,
  splitView,
  onCloseSplitView,
  language,
  // Tab Groups
  tabGroups = [],
  onCreateTabGroup,
  onToggleTabGroupCollapsed,
  onUpdateTabGroup,
  onDeleteTabGroup,
  onCloseTabGroup,
  onAddTabToGroup,
  onRemoveTabFromGroup,
}) => {
  const t = useTranslation(language);
  const [hoveredTab, setHoveredTab] = useState<Tab | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tabRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [selectedTabsForGroup, setSelectedTabsForGroup] = useState<string[]>([]);
  const [contextMenuTab, setContextMenuTab] = useState<{ tabId: string; x: number; y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const handleTabMouseDown = (e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) {
      e.preventDefault();
      onTabClose(tabId);
    }
  };

  const handleTabMouseEnter = useCallback((tab: Tab, element: HTMLDivElement) => {
    if (!showTabPreviews) return;
    
    // Очищаем предыдущий таймаут
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Задержка перед показом превью (200ms)
    hoverTimeoutRef.current = setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const sidebarRect = element.closest('.zen-sidebar')?.getBoundingClientRect();
      
      if (sidebarRect) {
        // Позиционируем превью сбоку от сайдбара с отступом
        const gap = 12;
        
        setPreviewPosition({
          x: sidebarPosition === 'right' 
            ? window.innerWidth - sidebarRect.left + gap
            : sidebarRect.right + gap,
          y: rect.top + rect.height / 2,
        });
      }
      
      setHoveredTab(tab);
    }, 200);
  }, [showTabPreviews, sidebarPosition]);

  const handleTabMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredTab(null);
  }, []);

  // Tab context menu for groups
  const handleTabContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenuTab({ tabId, x: e.clientX, y: e.clientY });
  }, []);

  // Close context menu on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenuTab(null);
      }
    };
    if (contextMenuTab) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenuTab]);

  // Group tabs by groupId
  const { groupedTabs, ungroupedTabs } = useMemo(() => {
    const grouped: Record<string, Tab[]> = {};
    const ungrouped: Tab[] = [];
    
    for (const tab of tabs) {
      if (tab.groupId) {
        if (!grouped[tab.groupId]) grouped[tab.groupId] = [];
        grouped[tab.groupId].push(tab);
      } else {
        ungrouped.push(tab);
      }
    }
    
    return { groupedTabs: grouped, ungroupedTabs: ungrouped };
  }, [tabs]);

  const handleCreateGroup = (name: string, colorId: TabGroupColorId) => {
    if (onCreateTabGroup && selectedTabsForGroup.length > 0) {
      onCreateTabGroup(name, colorId, selectedTabsForGroup);
      setSelectedTabsForGroup([]);
    }
  };

  const getGroupColor = (groupId: string) => {
    const group = tabGroups.find(g => g.id === groupId);
    return TAB_GROUP_COLORS.find(c => c.id === group?.colorId)?.color || '#5f6368';
  };

  // Определяем, активен ли split view и какие вкладки в нём
  const isSplitViewActive = splitView?.enabled && splitView.leftTabId && splitView.rightTabId;
  const leftTab = isSplitViewActive ? tabs.find(t => t.id === splitView.leftTabId) : null;
  const rightTab = isSplitViewActive ? tabs.find(t => t.id === splitView.rightTabId) : null;

  // Фильтруем вкладки - если split view активен, скрываем обе вкладки из обычного списка
  const filteredUngroupedTabs = isSplitViewActive 
    ? ungroupedTabs.filter(tab => tab.id !== splitView.leftTabId && tab.id !== splitView.rightTabId)
    : ungroupedTabs;

  // Render a single tab item
  const renderTab = (tab: Tab, inGroup = false) => {
    const isInternalPage = !tab.url || tab.url?.startsWith('axion://');
    const groupColor = tab.groupId ? getGroupColor(tab.groupId) : undefined;

    return (
      <div
        key={tab.id}
        ref={(el) => {
          if (el) tabRefs.current.set(tab.id, el);
          else tabRefs.current.delete(tab.id);
        }}
        className={`zen-sidebar__tab ${tab.id === activeTabId ? 'is-active' : ''} ${tab.isFrozen ? 'is-frozen' : ''} ${isInternalPage ? 'is-internal' : ''} ${!inGroup && tab.groupId ? 'zen-sidebar__tab--grouped' : ''}`}
        style={!inGroup && groupColor ? { '--group-color': groupColor } as React.CSSProperties : undefined}
        onClick={() => onTabSelect(tab.id)}
        onMouseDown={(e) => handleTabMouseDown(e, tab.id)}
        onMouseEnter={(e) => handleTabMouseEnter(tab, e.currentTarget)}
        onMouseLeave={handleTabMouseLeave}
        onContextMenu={(e) => handleTabContextMenu(e, tab.id)}
        title={style === 'minimal' || !showTabPreviews 
          ? (isInternalPage ? (getInternalPageName(tab.url, t) || tab.title || t.common.newTab) : (tab.title || t.common.newTab)) 
          : undefined}
      >
        <div className="zen-sidebar__tab-icon">
          {showTabFavicons && (
            isInternalPage ? (
              getInternalIcon(tab.url)
            ) : tab.favicon ? (
              <img src={tab.favicon} alt="" />
            ) : tab.isLoading ? (
              <div className="zen-sidebar__tab-spinner" />
            ) : (
              <GlobeIcon />
            )
          )}
        </div>
        {style !== 'minimal' && (
          <span className="zen-sidebar__tab-title">
            {isInternalPage ? (getInternalPageName(tab.url, t) || tab.title || t.common.newTab) : (tab.title || t.common.newTab)}
          </span>
        )}
        {tabCloseButton !== 'never' && (
          <button
            className={`zen-sidebar__tab-close ${tabCloseButton === 'always' ? 'always-visible' : ''}`}
            onClick={(e) => { e.stopPropagation(); onTabClose(tab.id); }}
          >
            <CloseIcon />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="zen-sidebar__tabs">
      {/* Split View объединённая вкладка */}
      {isSplitViewActive && leftTab && rightTab && (
        <div
          className="zen-sidebar__tab zen-sidebar__tab--split-view is-active"
          onClick={() => onTabSelect(leftTab.id)}
        >
          <div className="split-view-combined">
            <div className="split-view-combined__left">
              <div className="zen-sidebar__tab-icon">
                {showTabFavicons && (
                  (!leftTab.url || leftTab.url?.startsWith('axion://')) ? (
                    getInternalIcon(leftTab.url)
                  ) : leftTab.favicon ? (
                    <img src={leftTab.favicon} alt="" />
                  ) : leftTab.isLoading ? (
                    <div className="zen-sidebar__tab-spinner" />
                  ) : (
                    <GlobeIcon />
                  )
                )}
              </div>
              {style !== 'minimal' && (
                <span className="split-view-combined__title">
                  {(!leftTab.url || leftTab.url?.startsWith('axion://')) 
                    ? (getInternalPageName(leftTab.url, t) || leftTab.title || t.common.newTab) 
                    : (leftTab.title || t.common.newTab)}
                </span>
              )}
            </div>
            
            <div className="split-view-combined__divider">|</div>
            
            <div className="split-view-combined__right" onClick={(e) => { e.stopPropagation(); onTabSelect(rightTab.id); }}>
              <div className="zen-sidebar__tab-icon">
                {showTabFavicons && (
                  (!rightTab.url || rightTab.url?.startsWith('axion://')) ? (
                    getInternalIcon(rightTab.url)
                  ) : rightTab.favicon ? (
                    <img src={rightTab.favicon} alt="" />
                  ) : rightTab.isLoading ? (
                    <div className="zen-sidebar__tab-spinner" />
                  ) : (
                    <GlobeIcon />
                  )
                )}
              </div>
              {style !== 'minimal' && (
                <span className="split-view-combined__title">
                  {(!rightTab.url || rightTab.url?.startsWith('axion://')) 
                    ? (getInternalPageName(rightTab.url, t) || rightTab.title || t.common.newTab) 
                    : (rightTab.title || t.common.newTab)}
                </span>
              )}
            </div>
          </div>
          
          {onCloseSplitView && (
            <button
              className="zen-sidebar__tab-close always-visible"
              onClick={(e) => { e.stopPropagation(); onCloseSplitView(); }}
              title="Close Split View"
            >
              <CloseIcon />
            </button>
          )}
        </div>
      )}

      {/* Tab Groups */}
      {tabGroups.map(group => {
        const tabsInGroup = groupedTabs[group.id] || [];
        if (tabsInGroup.length === 0) return null;
        
        const groupColor = TAB_GROUP_COLORS.find(c => c.id === group.colorId)?.color || '#5f6368';
        
        return (
          <div 
            key={group.id} 
            className={`tab-group ${group.collapsed ? 'tab-group--collapsed' : ''}`}
            style={{ '--group-color': groupColor } as React.CSSProperties}
          >
            <TabGroupHeader
              group={group}
              tabCount={tabsInGroup.length}
              onToggleCollapse={() => onToggleTabGroupCollapsed?.(group.id)}
              onRename={(name) => onUpdateTabGroup?.(group.id, { name })}
              onChangeColor={(colorId) => onUpdateTabGroup?.(group.id, { colorId })}
              onDelete={() => onDeleteTabGroup?.(group.id)}
              onCloseAll={() => onCloseTabGroup?.(group.id)}
              language={language}
            />
            {!group.collapsed && (
              <div className="tab-group__tabs">
                {tabsInGroup.map(tab => renderTab(tab, true))}
              </div>
            )}
          </div>
        );
      })}

      {/* Ungrouped tabs */}
      {filteredUngroupedTabs.map(tab => renderTab(tab))}
      
      <button className="zen-sidebar__new-tab" onClick={onNewTab} title={t.common.newTab}>
        <PlusIcon />
        <span>{t.common.newTab}</span>
      </button>

      {/* Tab Preview Tooltip */}
      {hoveredTab && showTabPreviews && (
        <TabPreview
          tab={hoveredTab}
          position={previewPosition}
          sidebarPosition={sidebarPosition}
          language={language}
        />
      )}

      {/* Tab Context Menu */}
      {contextMenuTab && (
        <div
          ref={contextMenuRef}
          className="tab-group__menu"
          style={{ left: contextMenuTab.x, top: contextMenuTab.y }}
        >
          {/* Add to existing group */}
          {tabGroups.length > 0 && (
            <>
              {tabGroups.map(group => (
                <div
                  key={group.id}
                  className="tab-group__menu-item"
                  onClick={() => {
                    onAddTabToGroup?.(contextMenuTab.tabId, group.id);
                    setContextMenuTab(null);
                  }}
                >
                  <div 
                    style={{ 
                      width: 10, 
                      height: 10, 
                      borderRadius: '50%', 
                      backgroundColor: TAB_GROUP_COLORS.find(c => c.id === group.colorId)?.color 
                    }} 
                  />
                  {t.tabGroups.addToGroup}: {group.name}
                </div>
              ))}
              <div className="tab-group__menu-separator" />
            </>
          )}
          
          {/* Create new group */}
          <div
            className="tab-group__menu-item"
            onClick={() => {
              setSelectedTabsForGroup([contextMenuTab.tabId]);
              setShowCreateGroupModal(true);
              setContextMenuTab(null);
            }}
          >
            {t.tabGroups.newGroup}
          </div>
          
          {/* Remove from group */}
          {tabs.find(tab => tab.id === contextMenuTab.tabId)?.groupId && (
            <div
              className="tab-group__menu-item"
              onClick={() => {
                onRemoveTabFromGroup?.(contextMenuTab.tabId);
                setContextMenuTab(null);
              }}
            >
              {t.tabGroups.removeFromGroup}
            </div>
          )}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <CreateTabGroupModal
          onClose={() => {
            setShowCreateGroupModal(false);
            setSelectedTabsForGroup([]);
          }}
          onCreate={handleCreateGroup}
          language={language}
        />
      )}
    </div>
  );
};
