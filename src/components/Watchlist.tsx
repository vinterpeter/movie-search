import { useEffect } from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import type { MediaType } from '../types/movie';
import './Watchlist.css';

interface WatchlistProps {
  onClose: () => void;
  onItemClick: (id: number, mediaType: MediaType) => void;
}

export const Watchlist = ({ onClose, onItemClick }: WatchlistProps) => {
  const {
    items,
    loading,
    removeItem,
    toggleWatched,
    checkAvailability,
  } = useWatchlist();

  // Elérhetőség ellenőrzése az első betöltéskor
  useEffect(() => {
    if (items.length > 0) {
      checkAvailability();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU');
  };

  const getAvailabilityStatus = (item: typeof items[0]) => {
    if (item.isAvailable === undefined) {
      return { text: 'Ellenőrzés...', className: 'checking' };
    }
    if (item.isAvailable) {
      return { text: '✓ Elérhető', className: 'available' };
    }
    return { text: '✗ Nem elérhető', className: 'unavailable' };
  };

  const getProviderNames = (item: typeof items[0]) => {
    if (!item.availability) return [];

    const allProviders = [
      ...(item.availability.flatrate || []),
      ...(item.availability.rent || []),
      ...(item.availability.buy || []),
    ];

    // Csak az első 3-at mutatjuk
    return allProviders.slice(0, 3).map(p => p.provider_name);
  };

  return (
    <div className="watchlist-overlay" onClick={onClose}>
      <div className="watchlist-panel" onClick={(e) => e.stopPropagation()}>
        <div className="watchlist-header">
          <h2>Watchlist</h2>
          <button className="watchlist-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="watchlist-loading">
            <div className="spinner"></div>
            <p>Elérhetőség ellenőrzése...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="watchlist-empty">
            <p>A watchlist üres.</p>
            <p>Adj hozzá filmeket vagy sorozatokat a részletek oldalon!</p>
          </div>
        ) : (
          <div className="watchlist-items">
            {items.map((item) => {
              const status = getAvailabilityStatus(item);
              const providers = getProviderNames(item);

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
                      <div className="no-poster">?</div>
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
                      <span className="rating">★ {item.voteAverage.toFixed(1)}</span>
                    </div>
                    <div className={`availability-status ${status.className}`}>
                      {status.text}
                      {providers.length > 0 && (
                        <span className="provider-names">
                          {' '}({providers.join(', ')})
                        </span>
                      )}
                    </div>
                    <div className="watchlist-item-added">
                      Hozzáadva: {formatDate(item.addedAt)}
                    </div>
                  </div>

                  <div className="watchlist-item-actions">
                    <button
                      className={`btn-watched ${item.watched ? 'active' : ''}`}
                      onClick={() => toggleWatched(item.id, item.mediaType)}
                      title={item.watched ? 'Megjelölés nem látottként' : 'Megjelölés látottként'}
                    >
                      {item.watched ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button
                      className="btn-remove"
                      onClick={() => removeItem(item.id, item.mediaType)}
                      title="Eltávolítás a listából"
                    >
                      🗑️
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
              🔄 Elérhetőség frissítése
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
