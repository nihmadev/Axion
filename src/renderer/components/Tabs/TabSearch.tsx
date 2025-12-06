import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Tab, Workspace } from '../../types';
import { GlobeIcon, SnowflakeIcon } from '../ZenSidebar/icons';
import '../../styles/components/tab-search.css';

interface TabSearchProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectTab: (workspaceId: string, tabId: string) => void;
  onClose: () => void;
}

const TabSearch: React.FC<TabSearchProps> = ({
  workspaces,
  activeWorkspaceId,
  onSelectTab,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Собираем все вкладки из всех workspaces
  const allTabs = useMemo(() => {
    const tabs: Array<{ tab: Tab; workspace: Workspace }> = [];
    for (const workspace of workspaces) {
      for (const tab of workspace.tabs) {
        tabs.push({ tab, workspace });
      }
    }
    return tabs;
  }, [workspaces]);

  // Фильтруем по запросу
  const filteredTabs = useMemo(() => {
    if (!query.trim()) return allTabs;
    const q = query.toLowerCase();
    return allTabs.filter(({ tab }) =>
      tab.title.toLowerCase().includes(q) ||
      tab.url.toLowerCase().includes(q)
    );
  }, [allTabs, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Скролл к выбранному элементу
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.children[selectedIndex] as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredTabs.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredTabs[selectedIndex]) {
          const { tab, workspace } = filteredTabs[selectedIndex];
          onSelectTab(workspace.id, tab.id);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const handleSelect = (workspaceId: string, tabId: string) => {
    onSelectTab(workspaceId, tabId);
    onClose();
  };

  return (
    <>
      <div className="tab-search-overlay" onClick={onClose} />
      <div className="tab-search-container" onClick={onClose}>
        <div className="tab-search-modal" onClick={e => e.stopPropagation()}>
        <div className="tab-search-header">
          <input
            ref={inputRef}
            type="text"
            className="tab-search-input"
            placeholder="Поиск по вкладкам..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="tab-search-hint">
            {filteredTabs.length} вкладок
          </span>
        </div>
        <div className="tab-search-list" ref={listRef}>
          {filteredTabs.length === 0 ? (
            <div className="tab-search-empty">Вкладки не найдены</div>
          ) : (
            filteredTabs.map(({ tab, workspace }, index) => (
              <div
                key={`${workspace.id}-${tab.id}`}
                className={`tab-search-item ${index === selectedIndex ? 'selected' : ''} ${
                  workspace.id === activeWorkspaceId && tab.id === workspace.activeTabId ? 'active' : ''
                }`}
                onClick={() => handleSelect(workspace.id, tab.id)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="tab-search-favicon">
                  {tab.favicon ? (
                    <img src={tab.favicon} alt="" />
                  ) : (
                    <span className="tab-search-favicon-placeholder"><GlobeIcon /></span>
                  )}
                </div>
                <div className="tab-search-info">
                  <div className="tab-search-title">{tab.title || 'Новая вкладка'}</div>
                  <div className="tab-search-url">{tab.url || 'about:blank'}</div>
                </div>
                {workspace.id !== activeWorkspaceId && (
                  <div className="tab-search-workspace">{workspace.name}</div>
                )}
                {tab.isFrozen && <span className="tab-search-frozen"><SnowflakeIcon /></span>}
              </div>
            ))
          )}
        </div>
        <div className="tab-search-footer">
          <span>↑↓ навигация</span>
          <span>Enter выбрать</span>
          <span>Esc закрыть</span>
        </div>
      </div>
      </div>
    </>
  );
};

export default TabSearch;
