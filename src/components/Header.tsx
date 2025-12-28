import { useState } from 'react';
import { Film, X, Search, BookmarkCheck } from 'lucide-react';
import type { MediaType, BrowseMode } from '../types/movie';
import { useI18n } from '../i18n';
import { LanguageSelector } from './LanguageSelector';
import { UserMenu } from './UserMenu';
import './Header.css';

interface HeaderProps {
  onSearch: (query: string) => void;
  mediaType: MediaType;
  browseMode: BrowseMode;
  onMediaTypeChange: (type: MediaType) => void;
  onTheatersClick: () => void;
  onWatchlistClick: () => void;
  watchlistCount: number;
  syncing?: boolean;
  onFavoritesClick?: () => void;
}

export const Header = ({
  onSearch,
  mediaType,
  browseMode,
  onMediaTypeChange,
  onTheatersClick,
  onWatchlistClick,
  watchlistCount,
  syncing,
  onFavoritesClick,
}: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useI18n();

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
          <span className="header__title">{t('appTitle')}</span>
        </div>

        {/* Media type toggle */}
        <div className="header__media-toggle">
          <button
            className={`header__media-btn ${mediaType === 'movie' && browseMode !== 'theaters' ? 'active' : ''}`}
            onClick={() => onMediaTypeChange('movie')}
          >
            {t('movies')}
          </button>
          <button
            className={`header__media-btn ${mediaType === 'tv' ? 'active' : ''}`}
            onClick={() => onMediaTypeChange('tv')}
          >
            {t('tvShows')}
          </button>
          <button
            className={`header__media-btn ${browseMode === 'theaters' ? 'active' : ''}`}
            onClick={onTheatersClick}
          >
            {t('theaters')}
          </button>
        </div>

        {/* Search */}
        <form className="header__search" onSubmit={handleSubmit}>
          <div className="header__search-wrapper">
            <Search size={16} className="header__search-icon" />
            <input
              type="text"
              placeholder={mediaType === 'tv' ? t('searchTvPlaceholder') : t('searchMoviePlaceholder')}
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

        {/* Watchlist - after search */}
        <button className="header__watchlist-btn" onClick={onWatchlistClick}>
          <BookmarkCheck size={18} />
          <span className="header__watchlist-text">{t('watchlist')}</span>
          {watchlistCount > 0 && (
            <span className="header__watchlist-count">{watchlistCount}</span>
          )}
        </button>

        {/* Right side actions */}
        <div className="header__actions">
          <LanguageSelector />
          <UserMenu syncing={syncing} onFavoritesClick={onFavoritesClick} />
        </div>
      </div>
    </header>
  );
};
