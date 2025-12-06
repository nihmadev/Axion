import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Language } from '../../types';
import '../../styles/components/quicksites-page.css';

// Тип для QuickSite
interface QuickSite {
  name: string;
  url: string;
}

// Предустановленные популярные сайты
const POPULAR_SITES: QuickSite[] = [
  { name: 'Google', url: 'https://google.com' },
  { name: 'Pornhub', url: 'https://pornhub.com' },
  { name: 'YouTube', url: 'https://youtube.com' },
  { name: 'Twitter', url: 'https://twitter.com' },
  { name: 'Reddit', url: 'https://reddit.com' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Instagram', url: 'https://instagram.com' },
  { name: 'Facebook', url: 'https://facebook.com' },
  { name: 'LinkedIn', url: 'https://linkedin.com' },
  { name: 'TikTok', url: 'https://tiktok.com' },
  { name: 'Discord', url: 'https://discord.com' },
  { name: 'Twitch', url: 'https://twitch.tv' },
  { name: 'Spotify', url: 'https://spotify.com' },
  { name: 'Netflix', url: 'https://netflix.com' },
  { name: 'Amazon', url: 'https://amazon.com' },
  { name: 'Wikipedia', url: 'https://wikipedia.org' },
  { name: 'Pinterest', url: 'https://pinterest.com' },
  { name: 'Telegram', url: 'https://web.telegram.org' },
  { name: 'WhatsApp', url: 'https://web.whatsapp.com' },
  { name: 'Notion', url: 'https://notion.so' },
  { name: 'Figma', url: 'https://figma.com' },
  { name: 'Dribbble', url: 'https://dribbble.com' },
  { name: 'Behance', url: 'https://behance.net' },
  { name: 'Medium', url: 'https://medium.com' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com' },
  { name: 'VK', url: 'https://vk.com' },
  { name: 'Яндекс', url: 'https://ya.ru' },
  { name: 'Mail.ru', url: 'https://mail.ru' },
  { name: 'Habr', url: 'https://habr.com' },
];

const QUICK_SITES_STORAGE_KEY = 'axion-quick-sites';
const QUICK_SITES_CHANGE_EVENT = 'quick-sites-changed';

// Дефолтные сайты (должны совпадать с ZenSidebar/constants.ts)
const DEFAULT_QUICK_SITES: QuickSite[] = [
  { name: 'Google', url: 'https://google.com' },
  { name: 'Twitter', url: 'https://twitter.com' },
  { name: 'Opera', url: 'https://opera.com' },
  { name: 'Reddit', url: 'https://reddit.com' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'YouTube', url: 'https://youtube.com'},
];

interface QuickSitesPageProps {
  language: Language;
  onNavigate: (url: string) => void;
}

const QuickSitesPage: React.FC<QuickSitesPageProps> = ({ language, onNavigate }) => {
  const t = useTranslation(language);
  const [searchFilter, setSearchFilter] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  
  // Загрузка сохраненных сайтов
  const [savedSites, setSavedSites] = useState<QuickSite[]>(() => {
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

  // Сохранение в localStorage и отправка события синхронизации
  const saveSites = useCallback((sites: QuickSite[]) => {
    try {
      localStorage.setItem(QUICK_SITES_STORAGE_KEY, JSON.stringify(sites));
      setSavedSites(sites);
      // Dispatch custom event for same-window sync with sidebar
      window.dispatchEvent(new CustomEvent(QUICK_SITES_CHANGE_EVENT, { detail: sites }));
    } catch (e) {
      console.error('Failed to save quick sites:', e);
    }
  }, []);

  // Слушаем изменения от других компонентов (sidebar)
  useEffect(() => {
    const handleQuickSitesChange = (e: CustomEvent<QuickSite[]>) => {
      setSavedSites(e.detail);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === QUICK_SITES_STORAGE_KEY && e.newValue) {
        try {
          setSavedSites(JSON.parse(e.newValue));
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

  // Проверка, добавлен ли сайт
  const isSiteAdded = useCallback((url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return savedSites.some(site => {
        try {
          return new URL(site.url).hostname === hostname;
        } catch {
          return false;
        }
      });
    } catch {
      return false;
    }
  }, [savedSites]);

  // Добавить сайт
  const addSite = useCallback((site: QuickSite) => {
    if (isSiteAdded(site.url)) return;
    saveSites([...savedSites, site]);
  }, [savedSites, saveSites, isSiteAdded]);

  // Удалить сайт
  const removeSite = useCallback((url: string) => {
    try {
      const hostname = new URL(url).hostname;
      saveSites(savedSites.filter(site => {
        try {
          return new URL(site.url).hostname !== hostname;
        } catch {
          return true;
        }
      }));
    } catch {
      // ignore
    }
  }, [savedSites, saveSites]);

  // Добавить кастомный сайт
  const handleAddCustomSite = () => {
    if (!customUrl.trim()) return;
    
    let url = customUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      new URL(url); // Проверка валидности
    } catch {
      return;
    }

    let name = customName.trim();
    if (!name) {
      try {
        const urlObj = new URL(url);
        name = urlObj.hostname.replace('www.', '').split('.')[0];
        name = name.charAt(0).toUpperCase() + name.slice(1);
      } catch {
        name = t.quickSitesPage.site;
      }
    }

    addSite({ name, url });
    setCustomUrl('');
    setCustomName('');
    setShowCustomForm(false);
  };

  // Фильтрация популярных сайтов
  const filteredPopularSites = POPULAR_SITES.filter(site =>
    site.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    site.url.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Получить favicon URL
  const getFaviconUrl = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    } catch {
      return '';
    }
  };

  return (
    <div className="quicksites-page">
      <div className="quicksites-page-header">
        <h1>{t.quickSitesPage.title}</h1>
      </div>

      {/* Поиск и добавление */}
      <div className="quicksites-page-actions">
        <div className="quicksites-search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder={t.quickSitesPage.searchPlaceholder}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
        <button 
          className="quicksites-add-custom-btn"
          onClick={() => setShowCustomForm(!showCustomForm)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          {t.quickSitesPage.addCustomSite}
        </button>
      </div>

      {/* Форма добавления кастомного сайта */}
      {showCustomForm && (
        <div className="quicksites-custom-form">
          <div className="quicksites-custom-form-row">
            <input
              type="text"
              placeholder={t.quickSitesPage.urlPlaceholder}
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="quicksites-custom-input"
            />
            <input
              type="text"
              placeholder={t.quickSitesPage.namePlaceholder}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="quicksites-custom-input quicksites-custom-input--name"
            />
            <button 
              className="quicksites-submit-btn"
              onClick={handleAddCustomSite}
              disabled={!customUrl.trim()}
            >
              {t.quickSitesPage.addButton}
            </button>
          </div>
        </div>
      )}

      {/* Добавленные сайты */}
      {savedSites.length > 0 && (
        <div className="quicksites-section">
          <h2 className="quicksites-section-title">{t.quickSitesPage.addedSites}</h2>
          <div className="quicksites-grid">
            {savedSites.map((site, idx) => (
              <div 
                key={`saved-${site.url}-${idx}`} 
                className="quicksites-card quicksites-card--added"
                onClick={() => onNavigate(site.url)}
              >
                <div 
                  className="quicksites-card-icon"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                >
                  <img 
                    src={getFaviconUrl(site.url)} 
                    alt={site.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="quicksites-card-info">
                  <span className="quicksites-card-name">{site.name}</span>
                  <span className="quicksites-card-url">{new URL(site.url).hostname}</span>
                </div>
                <button 
                  className="quicksites-card-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSite(site.url);
                  }}
                  title={t.quickSitesPage.remove}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Популярные сайты */}
      <div className="quicksites-section">
        <h2 className="quicksites-section-title">{t.quickSitesPage.popularSites}</h2>
        <div className="quicksites-grid">
          {filteredPopularSites.map((site, idx) => {
            const isAdded = isSiteAdded(site.url);
            return (
              <div 
                key={`popular-${site.url}-${idx}`} 
                className={`quicksites-card ${isAdded ? 'quicksites-card--disabled' : ''}`}
                onClick={() => !isAdded && addSite(site)}
              >
                <div 
                  className="quicksites-card-icon"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                >
                  <img 
                    src={getFaviconUrl(site.url)} 
                    alt={site.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="quicksites-card-info">
                  <span className="quicksites-card-name">{site.name}</span>
                  <span className="quicksites-card-url">{new URL(site.url).hostname}</span>
                </div>
                {isAdded ? (
                  <div className="quicksites-card-added-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </div>
                ) : (
                  <button className="quicksites-card-add" title={t.quickSitesPage.add}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {filteredPopularSites.length === 0 && (
        <div className="quicksites-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <p>{t.quickSitesPage.nothingFound}</p>
        </div>
      )}
    </div>
  );
};

export default QuickSitesPage;
