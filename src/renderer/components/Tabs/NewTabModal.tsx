import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/components/new-tab-modal.css';

type SearchEngine = 'google' | 'duckduckgo' | 'bing';

interface SearchEngineConfig {
  name: string;
  url: string;
  icon: React.ReactNode;
}

const searchEngines: Record<SearchEngine, SearchEngineConfig> = {
  google: {
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  duckduckgo: {
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#DE5833" strokeWidth="1.5" fill="none"/>
        <path d="M10 20.5 8 12c-.4-2 .8-3.5 2.5-3.5 1.5 0 2.8 1 3 2.5l.5 1c.7 3.5-3.5 1.8-2.5 5s2 4.8 2 4.8M11.5 8.5c-.2-1-1.2-1.5-2.2-1.5" stroke="#DE5833" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14.5 12.5c.7 0 1.7-.2 2.5-.8m-4 2.3c.7.5 2 .8 3.3.5" stroke="#DE5833" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  bing: {
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M5 3v18l5-3 7 4V6.5L9 9.5V7l8-4H5z" fill="url(#bingGradient)"/>
        <defs>
          <linearGradient id="bingGradient" x1="5" y1="3" x2="17" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#37BDFF"/>
            <stop offset="0.18" stopColor="#33BFFD"/>
            <stop offset="0.36" stopColor="#28C5F5"/>
            <stop offset="0.53" stopColor="#15D0E7"/>
            <stop offset="0.55" stopColor="#12D1E5"/>
            <stop offset="0.59" stopColor="#1CD2E5"/>
            <stop offset="1" stopColor="#30D6E5"/>
          </linearGradient>
        </defs>
      </svg>
    ),
  },
};

interface NewTabModalProps {
  recentQueries: string[];
  onSubmit: (query: string) => void;
  onClose: () => void;
}

const NewTabModal: React.FC<NewTabModalProps> = ({ recentQueries, onSubmit, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [input, setInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchEngine, setSearchEngine] = useState<SearchEngine>('google');
  const [showEngineDropdown, setShowEngineDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const displayList = input.trim() ? [] : recentQueries;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
          setShowEngineDropdown(false);
        }
      }
    };

    if (showEngineDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEngineDropdown]);

  const handleToggleDropdown = () => {
    if (!showEngineDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
    setShowEngineDropdown(!showEngineDropdown);
  };

  const handleSubmit = (query?: string) => {
    const value = query ?? input.trim();
    if (value) {
      // Проверяем, является ли это URL
      const isUrl = /^(https?:\/\/|www\.|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/.test(value);
      if (isUrl) {
        onSubmit(value);
      } else {
        // Используем выбранную поисковую систему
        const engine = searchEngines[searchEngine];
        onSubmit(engine.url + encodeURIComponent(value));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && displayList[selectedIndex]) {
        handleSubmit(displayList[selectedIndex]);
      } else {
        handleSubmit();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (displayList.length + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + displayList.length + 1) % (displayList.length + 1));
      return;
    }
  };

  return createPortal(
    <>
      <div className="new-tab-modal-overlay" onClick={onClose} />
      <div className="new-tab-modal-container">
        <div className="new-tab-modal">
        <div className="new-tab-modal__input-wrapper">
          <div className="new-tab-modal__engine-selector">
            <button
              ref={buttonRef}
              className="new-tab-modal__engine-button"
              onClick={handleToggleDropdown}
              type="button"
            >
              {searchEngines[searchEngine].icon}
              <svg
                className="new-tab-modal__chevron"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
          {showEngineDropdown && createPortal(
            <div 
              ref={dropdownRef}
              className="new-tab-modal__engine-dropdown"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
              }}
            >
              {(Object.keys(searchEngines) as SearchEngine[]).map((key) => (
                <button
                  key={key}
                  className={`new-tab-modal__engine-option ${searchEngine === key ? 'is-active' : ''}`}
                  onClick={() => {
                    setSearchEngine(key);
                    setShowEngineDropdown(false);
                    inputRef.current?.focus();
                  }}
                  type="button"
                >
                  {searchEngines[key].icon}
                  <span>{searchEngines[key].name}</span>
                </button>
              ))}
            </div>,
            document.body
          )}
          <input
            ref={inputRef}
            type="text"
            className="new-tab-modal__input"
            placeholder={`Поиск в ${searchEngines[searchEngine].name} или URL...`}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>

        {displayList.length > 0 && (
          <div className="new-tab-modal__suggestions">
            {displayList.map((query, idx) => (
              <button
                key={idx}
                className={`new-tab-modal__suggestion-item ${selectedIndex === idx ? 'is-active' : ''}`}
                onClick={() => handleSubmit(query)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <svg
                  className="new-tab-modal__suggestion-icon"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 12 9 18 21 6" />
                </svg>
                <span className="new-tab-modal__suggestion-text">{query}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      </div>
    </>,
    document.body
  );
};

export default NewTabModal;
