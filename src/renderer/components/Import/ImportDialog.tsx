import React, { useState } from 'react';
import { ChromeIcon, EdgeIcon, FirefoxIcon, ZenBrowserIcon } from '../ZenSidebar/icons';
import '@/renderer/styles/components/import-dialog.css';

interface ImportDialogProps {
  onClose: () => void;
  onImport: (browser: 'chrome' | 'firefox' | 'edge' | 'zen') => void;
}

const ImportDialog: React.FC<ImportDialogProps> = ({ onClose, onImport }) => {
  const [selectedBrowser, setSelectedBrowser] = useState<'chrome' | 'firefox' | 'edge' | 'zen'>('chrome');

  return (
    <>
      <div className="import-dialog-overlay" onClick={onClose} />
      <div className="import-dialog-container" onClick={onClose}>
        <div className="import-dialog" onClick={e => e.stopPropagation()}>
        <div className="import-header">
          <h2>Импорт данных из другого браузера</h2>
          <button onClick={onClose} className="close-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="import-content">
          <p>Выберите браузер для импорта закладок и истории:</p>
          <div className="browser-options">
            <label className={`browser-option ${selectedBrowser === 'chrome' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="browser"
                value="chrome"
                checked={selectedBrowser === 'chrome'}
                onChange={() => setSelectedBrowser('chrome')}
              />
              <div className="browser-icon"><ChromeIcon size={24} /></div>
              <span>Google Chrome</span>
            </label>
            <label className={`browser-option ${selectedBrowser === 'edge' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="browser"
                value="edge"
                checked={selectedBrowser === 'edge'}
                onChange={() => setSelectedBrowser('edge')}
              />
              <div className="browser-icon"><EdgeIcon size={24} /></div>
              <span>Microsoft Edge</span>
            </label>
            <label className={`browser-option ${selectedBrowser === 'firefox' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="browser"
                value="firefox"
                checked={selectedBrowser === 'firefox'}
                onChange={() => setSelectedBrowser('firefox')}
              />
              <div className="browser-icon"><FirefoxIcon size={24} /></div>
              <span>Mozilla Firefox</span>
            </label>
            <label className={`browser-option ${selectedBrowser === 'zen' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="browser"
                value="zen"
                checked={selectedBrowser === 'zen'}
                onChange={() => setSelectedBrowser('zen')}
              />
              <div className="browser-icon"><ZenBrowserIcon size={24} /></div>
              <span>Zen Browser</span>
            </label>
          </div>
        </div>
        <div className="import-footer">
          <button onClick={onClose} className="btn-cancel">Отмена</button>
          <button onClick={() => onImport(selectedBrowser)} className="btn-import">Импортировать</button>
        </div>
      </div>
      </div>
    </>
  );
};

export default ImportDialog;
