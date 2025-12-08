import React, { useState, useRef } from 'react';
import { SearchIcon } from '../icons';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch,
  placeholder = "Search with Google..."
}) => {
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue.trim() && onSearch) {
      onSearch(searchValue);
      setSearchValue('');
    }
  };

  const handleSearchClick = () => {
    
    inputRef.current?.focus();
  };

  return (
    <div className="zen-sidebar__search" onClick={handleSearchClick} title="Search">
      <SearchIcon />
      <input
        ref={inputRef}
        type="text"
        className="zen-sidebar__search-input"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};
