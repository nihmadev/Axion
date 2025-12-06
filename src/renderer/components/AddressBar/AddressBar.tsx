import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import '../../styles/components/address-bar.css';

// Словарь популярных сокращений
const SHORTCUTS: Record<string, { url: string; title: string }> = {
  'yo': { url: 'https://youtube.com', title: 'YouTube' },
  'go': { url: 'https://google.com', title: 'Google' },
  'gi': { url: 'https://github.com', title: 'GitHub' },
  'tw': { url: 'https://twitter.com', title: 'Twitter / X' },
  'fb': { url: 'https://facebook.com', title: 'Facebook' },
  'ig': { url: 'https://instagram.com', title: 'Instagram' },
  'rd': { url: 'https://reddit.com', title: 'Reddit' },
  'wiki': { url: 'https://wikipedia.org', title: 'Wikipedia' },
  'gm': { url: 'https://gmail.com', title: 'Gmail' },
  'yt': { url: 'https://youtube.com', title: 'YouTube' },
  'gh': { url: 'https://github.com', title: 'GitHub' },
  'so': { url: 'https://stackoverflow.com', title: 'Stack Overflow' },
  'li': { url: 'https://linkedin.com', title: 'LinkedIn' },
  'am': { url: 'https://amazon.com', title: 'Amazon' },
  'nf': { url: 'https://netflix.com', title: 'Netflix' },
  'sp': { url: 'https://spotify.com', title: 'Spotify' },
  'tg': { url: 'https://web.telegram.org', title: 'Telegram Web' },
  'vk': { url: 'https://vk.com', title: 'VK' },
  'mail': { url: 'https://mail.ru', title: 'Mail.ru' },
};

interface AddressBarProps {
  url: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isBookmarked: boolean;
  isSecure?: boolean;
  history?: Array<{ url: string; title: string }>;
  bookmarks?: Array<{ url: string; title: string; favicon?: string }>;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onStop: () => void;
  onBookmark: () => void;
}

const AddressBar: React.FC<AddressBarProps> = ({
  url, isLoading, canGoBack, canGoForward, isBookmarked, isSecure,
  onNavigate, onBack, onForward, onReload, onStop, onBookmark
}) => {
  const [inputValue, setInputValue] = useState(url);
  const [autoComplete, setAutoComplete] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(url);
    setAutoComplete('');
  }, [url]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = inputValue.trim();
      
      // Если ввод пустой, переходим на StartPage
      if (!trimmed) {
        onNavigate('');
        setAutoComplete('');
        return;
      }
      
      const query = trimmed.toLowerCase();
      
      // Сокращения применяются ТОЛЬКО если:
      // 1. Текст короткий (до 6 символов)
      // 2. Не содержит точку, слэш, двоеточие (не похоже на URL)
      // 3. Не содержит пробелы (не поисковый запрос)
      const isShortcutCandidate = query.length <= 6 && 
        !query.includes('.') && 
        !query.includes('/') && 
        !query.includes(':') &&
        !query.includes(' ');
      
      let targetUrl = '';
      if (isShortcutCandidate) {
        // Проверяем точное совпадение с сокращением
        if (SHORTCUTS[query]) {
          targetUrl = SHORTCUTS[query].url;
        }
      }
      
      if (targetUrl) {
        onNavigate(targetUrl);
      } else {
        onNavigate(trimmed);
      }
      setAutoComplete('');
    } else if (e.key === 'Tab' && autoComplete) {
      // Tab принимает автодополнение
      e.preventDefault();
      const query = inputValue.toLowerCase().trim();
      
      // Находим соответствующий URL
      let matchedUrl = '';
      if (SHORTCUTS[query]) {
        matchedUrl = SHORTCUTS[query].url;
      } else {
        for (const [key, shortcut] of Object.entries(SHORTCUTS)) {
          if (key.startsWith(query)) {
            matchedUrl = shortcut.url;
            break;
          }
        }
      }
      
      if (matchedUrl) {
        // Устанавливаем полный домен без протокола
        const domain = matchedUrl.replace(/^https?:\/\//, '');
        setInputValue(domain);
        setAutoComplete('');
      }
    } else if (e.key === 'ArrowRight' && autoComplete && inputRef.current) {
      // Стрелка вправо принимает автодополнение если курсор в конце
      const cursorPos = inputRef.current.selectionStart || 0;
      if (cursorPos === inputValue.length) {
        e.preventDefault();
        const query = inputValue.toLowerCase().trim();
        
        // Находим соответствующий URL
        let matchedUrl = '';
        if (SHORTCUTS[query]) {
          matchedUrl = SHORTCUTS[query].url;
        } else {
          for (const [key, shortcut] of Object.entries(SHORTCUTS)) {
            if (key.startsWith(query)) {
              matchedUrl = shortcut.url;
              break;
            }
          }
        }
        
        if (matchedUrl) {
          // Устанавливаем полный домен без протокола
          const domain = matchedUrl.replace(/^https?:\/\//, '');
          setInputValue(domain);
          setAutoComplete('');
        }
      }
    } else if (e.key === 'Escape') {
      setAutoComplete('');
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);

    // Автодополнение для сокращений
    const query = value.toLowerCase().trim();
    let completionSuffix = '';
    
    if (query) {
      let matchedUrl = '';
      
      // Проверяем точное совпадение
      if (SHORTCUTS[query]) {
        matchedUrl = SHORTCUTS[query].url;
      } else {
        // Проверяем частичное совпадение (первое найденное)
        for (const [key, shortcut] of Object.entries(SHORTCUTS)) {
          if (key.startsWith(query)) {
            matchedUrl = shortcut.url;
            break;
          }
        }
      }
      
      // Формируем суффикс для автодополнения - только домен без протокола
      if (matchedUrl) {
        // Убираем https:// и показываем только домен
        const domain = matchedUrl.replace(/^https?:\/\//, '');
        // Проверяем, начинается ли домен с введенного текста
        if (domain.toLowerCase().startsWith(query)) {
          // Показываем только оставшуюся часть домена
          completionSuffix = domain.slice(query.length);
        } else {
          // Если не начинается, показываем весь домен
          completionSuffix = domain;
        }
      }
    }
    
    setAutoComplete(completionSuffix);
  };



  return (
    <div className="address-bar">
      <div className="nav-buttons">
        <button className="nav-btn" onClick={onBack} disabled={!canGoBack} title="Назад">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <button className="nav-btn" onClick={onForward} disabled={!canGoForward} title="Вперед">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
        <button className="nav-btn" onClick={isLoading ? onStop : onReload} title={isLoading ? "Остановить" : "Обновить (Ctrl+R)"}>
          {isLoading ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          )}
        </button>
      </div>

      <div className="address-input-container">
        <div className={`security-icon ${isSecure ? 'secure' : url ? 'insecure' : ''}`} title={isSecure ? 'Безопасное соединение (HTTPS)' : url ? 'Небезопасное соединение' : ''}>
          {url && (isSecure ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
            </svg>
          ))}
          {!url && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          )}
        </div>
        <div className="input-wrapper">
          {autoComplete && inputValue && (
            <div className="autocomplete-text">
              <span className="invisible-text">{inputValue}</span>
              <span className="completion-text">{autoComplete}</span>
            </div>
          )}
          <input
            ref={inputRef}
            type="text"
            className="address-input"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите адрес или поисковый запрос..."
          />
        </div>
      </div>

      <div className="action-buttons">
        <button className={`action-btn ${isBookmarked ? 'bookmarked' : ''}`} onClick={onBookmark} title="Добавить в закладки">
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AddressBar;
