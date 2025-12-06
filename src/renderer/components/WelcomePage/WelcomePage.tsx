import React, { useState, useEffect } from 'react';
import { DetectedBrowser } from '../../types';
import { ChromeIcon, EdgeIcon, FirefoxIcon, ZenBrowserIcon } from '../ZenSidebar/icons';
import '@/renderer/styles/components/welcome-page.css';

interface WelcomePageProps {
  onComplete: (accentColor: string) => void;
  onImport: (browser: 'chrome' | 'firefox' | 'edge' | 'zen') => Promise<void>;
}

const browserIcons: Record<string, React.FC<{ size?: number }>> = {
  chrome: ChromeIcon,
  edge: EdgeIcon,
  firefox: FirefoxIcon,
  zen: ZenBrowserIcon,
};

const ACCENT_COLORS = [
  { id: 'white', color: '#ffffff', name: 'Белый' },
  { id: 'gray', color: '#9ca3af', name: 'Серый' },
  { id: 'blue', color: '#3b82f6', name: 'Синий' },
  { id: 'green', color: '#22c55e', name: 'Зелёный' },
  { id: 'red', color: '#ef4444', name: 'Красный' },
  { id: 'orange', color: '#f97316', name: 'Оранжевый' },
  { id: 'yellow', color: '#eab308', name: 'Жёлтый' },
  { id: 'purple', color: '#a855f7', name: 'Фиолетовый' },
  { id: 'pink', color: '#ec4899', name: 'Розовый' },
  { id: 'cyan', color: '#06b6d4', name: 'Голубой' },
];

const WelcomePage: React.FC<WelcomePageProps> = ({ onComplete, onImport }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [browsers, setBrowsers] = useState<DetectedBrowser[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);
  const [importedBrowsers, setImportedBrowsers] = useState<Set<string>>(new Set());
  const [selectedAccent, setSelectedAccent] = useState('#ffffff');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const detectBrowsers = async () => {
      try {
        const detected = await window.electronAPI.detectBrowsers();
        setBrowsers(detected);
      } catch (error) {
        console.error('Failed to detect browsers:', error);
      } finally {
        setLoading(false);
      }
    };
    detectBrowsers();
  }, []);

  const handleImport = async (browserId: string) => {
    if (importing || importedBrowsers.has(browserId)) return;
    
    setImporting(browserId);
    try {
      await onImport(browserId as 'chrome' | 'firefox' | 'edge' | 'zen');
      setImportedBrowsers(prev => new Set(prev).add(browserId));
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(null);
    }
  };

  const goToNextPage = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage(1);
      setIsTransitioning(false);
    }, 300);
  };

  const handleFinish = async () => {
    try {
      await window.electronAPI.markInitialized();
      onComplete(selectedAccent);
    } catch (error) {
      console.error('Failed to mark initialized:', error);
      onComplete(selectedAccent);
    }
  };

  return (
    <div className="welcome-page">
      {/* Mac-style window controls */}
      <div className="welcome-window-controls">
        <button 
          className="window-control-btn close" 
          onClick={() => window.electronAPI.close()}
          title="Закрыть"
        />
        <button 
          className="window-control-btn minimize" 
          onClick={() => window.electronAPI.minimize()}
          title="Свернуть"
        />
        <button 
          className="window-control-btn maximize" 
          onClick={() => window.electronAPI.maximize()}
          title="Развернуть"
        />
      </div>

      <div className={`welcome-slider ${isTransitioning ? 'transitioning' : ''}`}>
        {/* Page 1: Features + Import (Two-column layout) */}
        <div className={`welcome-slide ${currentPage === 0 ? 'active' : 'hidden'}`}>
          <div className="welcome-content welcome-content-split">
            {/* Left column: Logo */}
            <div className="welcome-column welcome-column-left">
              <div className="welcome-header welcome-header-centered">
                <div className="welcome-logo welcome-logo-large">
                  <img src="/icon.png" alt="Axion" className="welcome-logo-img" />
                </div>
                <h1 className="welcome-title">Axion</h1>
              </div>
            </div>

            {/* Right column: Import */}
            <div className="welcome-column welcome-column-right">
              <div className="welcome-import">
                <h2>Импорт данных</h2>
                <p className="import-description">
                  Перенесите закладки и историю из другого браузера
                </p>

                {loading ? (
                  <div className="import-loading">Поиск браузеров...</div>
                ) : (
                  <div className="browser-list">
                    {browsers.map(browser => {
                      const Icon = browserIcons[browser.id];
                      const isImported = importedBrowsers.has(browser.id);
                      const isImporting = importing === browser.id;
                      const isDisabled = !browser.available || isImported || importing !== null;

                      return (
                        <button
                          key={browser.id}
                          className={`browser-item ${!browser.available ? 'unavailable' : ''} ${isImported ? 'imported' : ''}`}
                          onClick={() => handleImport(browser.id)}
                          disabled={isDisabled}
                        >
                          <div className="browser-item-icon">
                            {Icon && <Icon size={32} />}
                          </div>
                          <span className="browser-item-name">{browser.name}</span>
                          <span className="browser-item-status">
                            {isImporting ? (
                              <span className="status-importing">Импорт...</span>
                            ) : isImported ? (
                              <span className="status-done">Готово</span>
                            ) : !browser.available ? (
                              <span className="status-unavailable">Не найден</span>
                            ) : (
                              <span className="status-available">Импортировать</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="welcome-actions">
                <button className="btn-primary" onClick={goToNextPage}>
                  Продолжить
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page 2: Accent Color Selection */}
        <div className={`welcome-slide ${currentPage === 1 ? 'active' : 'hidden'}`}>
          <div className="welcome-content accent-page">
            <div className="welcome-header">
              <h1 className="welcome-title">Выберите акцент</h1>
              <p className="welcome-subtitle">Этот цвет будет использоваться для кнопок и выделений</p>
            </div>

            <div className="accent-grid">
              {ACCENT_COLORS.map(({ id, color, name }) => (
                <button
                  key={id}
                  className={`accent-option ${selectedAccent === color ? 'selected' : ''}`}
                  onClick={() => setSelectedAccent(color)}
                  style={{ '--accent-preview': color } as React.CSSProperties}
                >
                  <div className="accent-swatch" />
                  <span className="accent-name">{name}</span>
                </button>
              ))}
            </div>
            <div className="welcome-actions">
              <button className="btn-primary" onClick={handleFinish} style={{ background: selectedAccent }}>
                Начать работу
              </button>
            </div>

            <div className="page-dots">
              <span className="dot" />
              <span className="dot active" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
