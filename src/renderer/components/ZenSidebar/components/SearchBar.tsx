import React, { useState } from 'react';
import { SearchIcon } from '../icons';

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue.trim() && onSearch) {
      onSearch(searchValue);
      setSearchValue('');
    }
  };

  return (
    <div className="zen-sidebar__search">
      <SearchIcon />
      <input
        type="text"
        className="zen-sidebar__search-input"
        placeholder="Search with Google o..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};
