import { useState } from 'react';
import { Film, X, Search, BookmarkCheck } from 'lucide-react';
import type { MediaType } from '../types/movie';
import './Header.css';

interface HeaderProps {
  onSearch: (query: string) => void;
  mediaType: MediaType;
  onMediaTypeChange: (type: MediaType) => void;
  onWatchlistClick: () => void;
  watchlistCount: number;
}

export const Header = ({
  onSearch,
  mediaType,
  onMediaTypeChange,
  onWatchlistClick,
  watchlistCount,
}: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <header className="header">
      <div className="header__content">
        {/* Logo */}
        <div className="header__brand">
          <Film size={24} />
          <span className="header__title">Film Kereső</span>
        </div>

        {/* Media type toggle */}
        <div className="header__media-toggle">
          <button
            className={`header__media-btn ${mediaType === 'movie' ? 'active' : ''}`}
            onClick={() => onMediaTypeChange('movie')}
          >
            Filmek
          </button>
          <button
            className={`header__media-btn ${mediaType === 'tv' ? 'active' : ''}`}
            onClick={() => onMediaTypeChange('tv')}
          >
            Sorozatok
          </button>
        </div>

        {/* Search */}
        <form className="header__search" onSubmit={handleSubmit}>
          <div className="header__search-wrapper">
            <Search size={16} className="header__search-icon" />
            <input
              type="text"
              placeholder={mediaType === 'tv' ? 'Sorozat keresése...' : 'Film keresése...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="header__search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="header__search-clear"
                onClick={handleClear}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </form>

        {/* Watchlist */}
        <button className="header__watchlist-btn" onClick={onWatchlistClick}>
          <BookmarkCheck size={18} />
          <span className="header__watchlist-text">Watchlist</span>
          {watchlistCount > 0 && (
            <span className="header__watchlist-count">{watchlistCount}</span>
          )}
        </button>
      </div>
    </header>
  );
};
