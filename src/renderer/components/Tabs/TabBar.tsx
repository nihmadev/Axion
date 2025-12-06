import React from 'react';
import { Tab } from '../../types';
import '../styles/components/tab-bar.css';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onTabSelect, onTabClose, onNewTab }) => {
  return (
    <div className="tab-bar">
      <div className="tabs-container">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => onTabSelect(tab.id)}
          >
            {tab.favicon ? (
              <img src={tab.favicon} alt="" className="tab-favicon" />
            ) : (
              <div className="tab-favicon-placeholder">
                {tab.isLoading ? (
                  <div className="tab-spinner" />
                ) : !tab.url ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                )}
              </div>
            )}
            <span className="tab-title">{tab.title}</span>
            <button
              className="tab-close"
              onClick={(e) => { e.stopPropagation(); onTabClose(tab.id); }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button className="new-tab-btn" onClick={onNewTab}>
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </button>
    </div>
  );
};

export default TabBar;
