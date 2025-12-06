import React from 'react';
import '../../styles/components/title-bar.css';

const TitleBar: React.FC = () => {
  return (
    <div className="title-bar">
      <div className="title-bar-drag">
        <span className="title-bar-logo">Axion</span>
      </div>
      <div className="window-controls">
        <button className="window-btn minimize" onClick={() => window.electronAPI.minimize()}>
          <svg width="12" height="12" viewBox="0 0 12 12"><rect y="5" width="12" height="2" fill="currentColor"/></svg>
        </button>
        <button className="window-btn maximize" onClick={() => window.electronAPI.maximize()}>
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
        </button>
        <button className="window-btn close" onClick={() => window.electronAPI.close()}>
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="2"/></svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
