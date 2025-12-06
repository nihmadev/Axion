import React, { KeyboardEvent } from 'react';
import type { Translations } from '../../../i18n';

interface SearchBoxProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onNavigate: (url: string) => void;
  t: Translations;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ 
  searchValue, 
  onSearchChange, 
  onNavigate,
  t 
}) => {
  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      onNavigate(searchValue);
    }
  };

  return (
    <div className="search-box">
      <div className="search-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
      </div>
      <input
        type="text"
        className="search-input"
        placeholder={t.common.searchOrUrl}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleSearch}
        autoFocus
      />
    </div>
  );
};
