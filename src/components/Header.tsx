import { useState } from 'react';
import type { MediaType } from '../types/movie';
import './Header.css';

interface HeaderProps {
  onSearch: (query: string) => void;
  totalResults: number;
  mediaType: MediaType;
  onWatchlistClick: () => void;
  watchlistCount: number;
}

export const Header = ({ onSearch, totalResults, mediaType, onWatchlistClick, watchlistCount }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  const resultText = mediaType === 'tv' ? 'sorozat' : 'film';
  const searchPlaceholder = mediaType === 'tv' ? 'Sorozat keresése...' : 'Film keresése...';

  return (
    <header className="header">
      <div className="header__content">
        <div className="header__brand">
          <h1>🎬 Film Kereső</h1>
          <p>Streaming újdonságok kategória és értékelés szerint</p>
        </div>

        <div className="header__actions">
          <form className="header__search" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder={searchPlaceholder}
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
                ✕
              </button>
            )}
            <button type="submit" className="header__search-button">
              Keresés
            </button>
          </form>

          <button className="header__watchlist-btn" onClick={onWatchlistClick}>
            📋 Watchlist
            {watchlistCount > 0 && (
              <span className="header__watchlist-count">{watchlistCount}</span>
            )}
          </button>
        </div>

        {totalResults > 0 && (
          <p className="header__results">{totalResults} {resultText} található</p>
        )}
      </div>
    </header>
  );
};
