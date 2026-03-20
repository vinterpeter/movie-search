import { useState } from 'react';
import { Film, X, Search, BookmarkCheck, Heart, SlidersHorizontal } from 'lucide-react';
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
  favoritesCount?: number;
  showFilters?: boolean;
  onFiltersToggle?: () => void;
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
  favoritesCount = 0,
  showFilters,
  onFiltersToggle,
}: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
    setMobileSearchOpen(false);
  };

  const handleMobileSearchToggle = () => {
    setMobileSearchOpen(!mobileSearchOpen);
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
        <div className="header__media-toggle" data-active={
          browseMode === 'theaters' ? 'theaters' :
          (mediaType === 'tv' ? 'tv' : 'movie')
        }>
          <div className="header__media-slider" />
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

        {/* Mobile search toggle button */}
        <button
          className="header__search-toggle"
          onClick={handleMobileSearchToggle}
          aria-label={t('searchMoviePlaceholder')}
        >
          <Search size={18} />
        </button>

        {/* Mobile filter toggle button */}
        {onFiltersToggle && (
          <button
            className={`header__filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={onFiltersToggle}
            aria-label={t('showFilters')}
          >
            <SlidersHorizontal size={18} />
          </button>
        )}

        {/* Search */}
        <form className={`header__search ${mobileSearchOpen ? 'mobile-open' : ''}`} onSubmit={handleSubmit}>
          <div className="header__search-wrapper">
            <Search size={16} className="header__search-icon" />
            <input
              type="text"
              placeholder={mediaType === 'tv' ? t('searchTvPlaceholder') : t('searchMoviePlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="header__search-input"
              autoFocus={mobileSearchOpen}
            />
            {(searchQuery || mobileSearchOpen) && (
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

        {/* Favorites - next to watchlist */}
        {onFavoritesClick && (
          <button className="header__favorites-btn" onClick={onFavoritesClick}>
            <Heart size={18} />
            <span className="header__favorites-text">{t('favorites')}</span>
            {favoritesCount > 0 && (
              <span className="header__favorites-count">{favoritesCount}</span>
            )}
          </button>
        )}

        {/* Right side actions */}
        <div className="header__actions">
          <LanguageSelector />
          <UserMenu syncing={syncing} onFavoritesClick={onFavoritesClick} />
        </div>
      </div>
    </header>
  );
};
