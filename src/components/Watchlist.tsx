import { useEffect, useState } from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import { searchMovies, searchTV } from '../api/tmdb';
import { getImageUrl, IMAGE_SIZES } from '../api/config';
import { HUNGARIAN_PROVIDER_IDS } from '../hooks/useFilters';
import type { MediaType, Movie, TVShow, WatchProvider } from '../types/movie';
import {
  X,
  Plus,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Film,
  ImageOff,
  Star,
} from 'lucide-react';
import './Watchlist.css';

interface WatchlistProps {
  onClose: () => void;
  onItemClick: (id: number, mediaType: MediaType) => void;
}

// Type guard
const isMovie = (item: Movie | TVShow): item is Movie => {
  return 'title' in item;
};

type SearchResult = (Movie | TVShow) & { mediaType: MediaType };

export const Watchlist = ({ onClose, onItemClick }: WatchlistProps) => {
  const {
    items,
    loading,
    refreshingId,
    removeItem,
    toggleWatched,
    addItem,
    isInWatchlist,
    checkAvailability,
    refreshItemAvailability,
  } = useWatchlist();

  const [activeTab, setActiveTab] = useState<'list' | 'search'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<MediaType>('movie');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Elérhetőség ellenőrzése az első betöltéskor és új elemek hozzáadásakor
  const itemsNeedingCheck = items.filter(item => item.isAvailable === undefined).length;

  useEffect(() => {
    if (itemsNeedingCheck > 0 && activeTab === 'list' && !loading) {
      checkAvailability();
    }
  }, [activeTab, itemsNeedingCheck, checkAvailability, loading]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      if (searchType === 'movie') {
        const results = await searchMovies(searchQuery);
        setSearchResults(results.results.map(m => ({ ...m, mediaType: 'movie' as MediaType })));
      } else {
        const results = await searchTV(searchQuery);
        setSearchResults(results.results.map(t => ({ ...t, mediaType: 'tv' as MediaType })));
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU');
  };

  const formatLastChecked = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Ma ellenőrizve';
    } else if (diffDays === 1) {
      return 'Tegnap ellenőrizve';
    } else if (diffDays < 7) {
      return `${diffDays} napja ellenőrizve`;
    } else {
      return `${formatDate(dateString)}-kor ellenőrizve`;
    }
  };

  const getAvailabilityStatus = (item: typeof items[0]) => {
    if (item.isAvailable === undefined) {
      return { icon: <Loader2 size={14} className="spin" />, text: 'Ellenőrzés...', className: 'checking' };
    }
    if (item.isAvailable) {
      return { icon: <CheckCircle size={14} />, text: 'Elérhető', className: 'available' };
    }
    return { icon: <XCircle size={14} />, text: 'Nem elérhető', className: 'unavailable' };
  };

  const getAvailableProviders = (item: typeof items[0]): WatchProvider[] => {
    if (!item.availability) return [];

    const allProviders = [
      ...(item.availability.flatrate || []),
      ...(item.availability.rent || []),
      ...(item.availability.buy || []),
    ];

    // Szűrjük csak a magyar szolgáltatókra és távolítsuk el a duplikátumokat
    const uniqueProviders = allProviders.filter(
      (p, index, self) =>
        HUNGARIAN_PROVIDER_IDS.includes(p.provider_id) &&
        self.findIndex(x => x.provider_id === p.provider_id) === index
    );

    return uniqueProviders;
  };

  return (
    <div className="watchlist-overlay" onClick={onClose}>
      <div className="watchlist-panel" onClick={(e) => e.stopPropagation()}>
        <div className="watchlist-header">
          <h2>Watchlist</h2>
          <button className="watchlist-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tab váltó */}
        <div className="watchlist-tabs">
          <button
            className={`watchlist-tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            <Film size={16} /> Lista ({items.length})
          </button>
          <button
            className={`watchlist-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Plus size={16} /> Hozzáadás
          </button>
        </div>

        {activeTab === 'search' && (
          <div className="watchlist-search">
            <form onSubmit={handleSearch}>
              <div className="search-type-toggle">
                <button
                  type="button"
                  className={`search-type-btn ${searchType === 'movie' ? 'active' : ''}`}
                  onClick={() => setSearchType('movie')}
                >
                  Film
                </button>
                <button
                  type="button"
                  className={`search-type-btn ${searchType === 'tv' ? 'active' : ''}`}
                  onClick={() => setSearchType('tv')}
                >
                  Sorozat
                </button>
              </div>
              <div className="search-input-row">
                <input
                  type="text"
                  placeholder="Keress bármilyen filmet vagy sorozatot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="watchlist-search-input"
                />
                <button type="submit" className="watchlist-search-btn" disabled={searching}>
                  {searching ? '...' : 'Keresés'}
                </button>
              </div>
            </form>

            {searching ? (
              <div className="watchlist-loading">
                <Loader2 size={40} className="spin" />
                <p>Keresés...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="search-results">
                {searchResults.map((result) => {
                  const title = isMovie(result) ? result.title : result.name;
                  const date = isMovie(result) ? result.release_date : result.first_air_date;
                  const inList = isInWatchlist(result.id, result.mediaType);

                  return (
                    <div key={`${result.mediaType}-${result.id}`} className="search-result-item">
                      <div className="search-result-poster">
                        {result.poster_path ? (
                          <img
                            src={getImageUrl(result.poster_path, IMAGE_SIZES.poster.small)}
                            alt={title}
                          />
                        ) : (
                          <div className="no-poster">
                            <ImageOff size={20} />
                          </div>
                        )}
                      </div>
                      <div className="search-result-info">
                        <h4>{title}</h4>
                        <div className="search-result-meta">
                          <span className="media-type-badge">
                            {result.mediaType === 'movie' ? 'Film' : 'Sorozat'}
                          </span>
                          {date && <span>{date.split('-')[0]}</span>}
                          <span className="rating"><Star size={12} fill="currentColor" /> {result.vote_average.toFixed(1)}</span>
                        </div>
                      </div>
                      <button
                        className={`add-to-list-btn ${inList ? 'in-list' : ''}`}
                        onClick={() => {
                          if (inList) {
                            removeItem(result.id, result.mediaType);
                          } else {
                            addItem(result, result.mediaType);
                          }
                        }}
                      >
                        {inList ? <Check size={18} /> : <Plus size={18} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : searchQuery && !searching ? (
              <div className="watchlist-empty">
                <p>Nincs találat a keresésre.</p>
              </div>
            ) : (
              <div className="watchlist-empty">
                <p>Keress rá bármilyen filmre vagy sorozatra, ami érdekel!</p>
                <p className="hint">Akkor is hozzáadhatod, ha még nem érhető el streamingnél.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'list' && (
          <>
            {loading ? (
              <div className="watchlist-loading">
                <Loader2 size={40} className="spin" />
                <p>Elérhetőség ellenőrzése...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="watchlist-empty">
                <p>A watchlist üres.</p>
                <p>Kattints a "+ Hozzáadás" fülre filmek kereséséhez!</p>
              </div>
            ) : (
              <div className="watchlist-items">
                {items.map((item) => {
                  const status = getAvailabilityStatus(item);
                  const providers = getAvailableProviders(item);

                  return (
                    <div
                      key={`${item.mediaType}-${item.id}`}
                      className={`watchlist-item ${item.watched ? 'watched' : ''}`}
                    >
                      <div
                        className="watchlist-item-poster"
                        onClick={() => onItemClick(item.id, item.mediaType)}
                      >
                        {item.posterPath ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${item.posterPath}`}
                            alt={item.title}
                          />
                        ) : (
                          <div className="no-poster">
                            <ImageOff size={24} />
                          </div>
                        )}
                      </div>

                      <div className="watchlist-item-info">
                        <h3
                          className="watchlist-item-title"
                          onClick={() => onItemClick(item.id, item.mediaType)}
                        >
                          {item.title}
                        </h3>
                        <div className="watchlist-item-meta">
                          <span className="media-type-badge">
                            {item.mediaType === 'movie' ? 'Film' : 'Sorozat'}
                          </span>
                          {item.releaseDate && (
                            <span className="release-year">
                              {item.releaseDate.split('-')[0]}
                            </span>
                          )}
                          <span className="rating"><Star size={12} fill="currentColor" /> {item.voteAverage.toFixed(1)}</span>
                        </div>

                        {/* Elérhetőség és szolgáltató ikonok */}
                        <div className={`availability-status ${status.className}`}>
                          {status.icon} {status.text}
                        </div>

                        {providers.length > 0 && item.availability?.link && (
                          <div className="watchlist-providers">
                            {providers.map((provider) => (
                              <a
                                key={provider.provider_id}
                                href={item.availability?.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="provider-icon-link"
                                title={`Megnézés: ${provider.provider_name}`}
                              >
                                <img
                                  src={getImageUrl(provider.logo_path, IMAGE_SIZES.logo.small)}
                                  alt={provider.provider_name}
                                />
                              </a>
                            ))}
                          </div>
                        )}

                        <div className="watchlist-item-dates">
                          <span className="date-added">Hozzáadva: {formatDate(item.addedAt)}</span>
                          {item.lastChecked && (
                            <span className="date-checked">{formatLastChecked(item.lastChecked)}</span>
                          )}
                        </div>
                      </div>

                      <div className="watchlist-item-actions">
                        <button
                          className={`btn-refresh-item ${refreshingId === item.id ? 'refreshing' : ''}`}
                          onClick={() => refreshItemAvailability(item.id, item.mediaType)}
                          disabled={refreshingId === item.id}
                          title="Elérhetőség frissítése"
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button
                          className={`btn-watched ${item.watched ? 'active' : ''}`}
                          onClick={() => toggleWatched(item.id, item.mediaType)}
                          title={item.watched ? 'Megjelölés nem látottként' : 'Megjelölés látottként'}
                        >
                          {item.watched ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <button
                          className="btn-remove"
                          onClick={() => removeItem(item.id, item.mediaType)}
                          title="Eltávolítás a listából"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {items.length > 0 && !loading && (
              <div className="watchlist-footer">
                <button
                  className="btn-refresh"
                  onClick={checkAvailability}
                >
                  <RefreshCw size={16} /> Elérhetőség frissítése
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
