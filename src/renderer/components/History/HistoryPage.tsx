import React, { useState, useMemo } from 'react';
import { HistoryEntry } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import '../../styles/components/history-page.css';

interface HistoryPageProps {
  history: HistoryEntry[];
  onNavigate: (url: string) => void;
  onClearHistory: () => void;
  language: 'ru' | 'en';
}

const HistoryPage: React.FC<HistoryPageProps> = ({ history, onNavigate, onClearHistory, language }) => {
  const [searchFilter, setSearchFilter] = useState('');
  const t = useTranslation(language);

  const filteredHistory = useMemo(() => 
    history.filter(h =>
      h.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      h.url.toLowerCase().includes(searchFilter.toLowerCase())
    ), [history, searchFilter]);

  // Группировка по дням
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: HistoryEntry[] } = {};
    
    filteredHistory.forEach(entry => {
      const date = new Date(entry.visitedAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = t.common.today;
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = t.common.yesterday;
      } else {
        key = date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    
    return groups;
  }, [filteredHistory, language, t.common.today, t.common.yesterday]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(language === 'ru' ? 'ru-RU' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch {
      return '';
    }
  };

  return (
    <div className="history-page">
      <div className="history-page-header">
        <h1>{t.common.history}</h1>
        <div className="history-page-actions">
          <div className="history-search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder={t.common.searchPlaceholder}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
          {history.length > 0 && (
            <button className="history-clear-btn" onClick={onClearHistory}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              {t.common.clearHistory}
            </button>
          )}
        </div>
      </div>

      <div className="history-page-content">
        {Object.keys(groupedHistory).length === 0 ? (
          <div className="history-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <p>{t.common.historyEmpty}</p>
          </div>
        ) : (
          Object.entries(groupedHistory).map(([date, entries]) => (
            <div key={date} className="history-group">
              <h2 className="history-group-title">{date}</h2>
              <div className="history-group-items">
                {entries.map(entry => (
                  <div key={entry.id} className="history-item" onClick={() => onNavigate(entry.url)}>
                    <div className="history-item-favicon">
                      <img src={getFaviconUrl(entry.url)} alt="" />
                    </div>
                    <div className="history-item-info">
                      <div className="history-item-title">{entry.title || t.common.noTitle}</div>
                      <div className="history-item-url">{entry.url}</div>
                    </div>
                    <div className="history-item-time">{formatTime(entry.visitedAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
