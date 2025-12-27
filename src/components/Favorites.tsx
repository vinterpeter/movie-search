import { useState } from 'react';
import { useFavorites } from '../hooks/useFavorites';
import { getImageUrl, IMAGE_SIZES } from '../api/config';
import type { MediaType } from '../types/movie';
import { useI18n } from '../i18n';
import {
  X,
  ThumbsUp,
  Heart,
  Trash2,
  Loader2,
  ImageOff,
  Star,
} from 'lucide-react';
import './Favorites.css';

interface FavoritesProps {
  onClose: () => void;
  onItemClick: (id: number, mediaType: MediaType) => void;
}

type FilterType = 'all' | 'liked' | 'loved';

export const Favorites = ({ onClose, onItemClick }: FavoritesProps) => {
  const { t, language } = useI18n();
  const {
    items,
    loading,
    removeFavorite,
    toggleLike,
    toggleLove,
  } = useFavorites();

  const [filter, setFilter] = useState<FilterType>('all');

  const filteredItems = items.filter((item) => {
    if (filter === 'liked') return item.liked;
    if (filter === 'loved') return item.loved;
    return true;
  });

  const likedCount = items.filter((i) => i.liked).length;
  const lovedCount = items.filter((i) => i.loved).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-GB');
  };

  return (
    <div className="favorites-overlay" onClick={onClose}>
      <div className="favorites-panel" onClick={(e) => e.stopPropagation()}>
        <div className="favorites-header">
          <h2>{t('favorites')}</h2>
          <button className="favorites-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="favorites-filters">
          <button
            className={`favorites-filter ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('filterAll')} ({items.length})
          </button>
          <button
            className={`favorites-filter ${filter === 'liked' ? 'active' : ''}`}
            onClick={() => setFilter('liked')}
          >
            <ThumbsUp size={14} /> {t('liked')} ({likedCount})
          </button>
          <button
            className={`favorites-filter ${filter === 'loved' ? 'active' : ''}`}
            onClick={() => setFilter('loved')}
          >
            <Heart size={14} /> {t('loved')} ({lovedCount})
          </button>
        </div>

        <div className="favorites-content">
          {loading ? (
            <div className="favorites-loading">
              <Loader2 size={40} className="spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="favorites-empty">
              <p>{t('noFavorites')}</p>
            </div>
          ) : (
            <div className="favorites-items">
              {filteredItems.map((item) => (
                <div
                  key={`${item.mediaType}-${item.id}`}
                  className="favorites-item"
                >
                  <div
                    className="favorites-item-poster"
                    onClick={() => onItemClick(item.id, item.mediaType)}
                  >
                    {item.posterPath ? (
                      <img
                        src={getImageUrl(item.posterPath, IMAGE_SIZES.poster.small)}
                        alt={item.title}
                      />
                    ) : (
                      <div className="no-poster">
                        <ImageOff size={24} />
                      </div>
                    )}
                  </div>

                  <div className="favorites-item-info">
                    <h3
                      className="favorites-item-title"
                      onClick={() => onItemClick(item.id, item.mediaType)}
                    >
                      {item.title}
                    </h3>
                    <div className="favorites-item-meta">
                      <span className="media-type-badge">
                        {item.mediaType === 'movie' ? t('movie') : t('tvShow')}
                      </span>
                      {item.releaseDate && (
                        <span className="release-year">
                          {item.releaseDate.split('-')[0]}
                        </span>
                      )}
                      <span className="rating">
                        <Star size={12} fill="currentColor" /> {item.voteAverage.toFixed(1)}
                      </span>
                    </div>

                    <div className="favorites-item-badges">
                      {item.liked && (
                        <span className="badge badge-liked">
                          <ThumbsUp size={12} /> {t('liked')}
                        </span>
                      )}
                      {item.loved && (
                        <span className="badge badge-loved">
                          <Heart size={12} /> {t('loved')}
                        </span>
                      )}
                    </div>

                    <div className="favorites-item-date">
                      {t('addedOn')}: {formatDate(item.addedAt)}
                    </div>
                  </div>

                  <div className="favorites-item-actions">
                    <button
                      className={`btn-like ${item.liked ? 'active' : ''}`}
                      onClick={() => {
                        // Create a minimal movie/tvshow object for toggle
                        const mediaItem = {
                          id: item.id,
                          title: item.title,
                          name: item.title,
                          poster_path: item.posterPath,
                          release_date: item.releaseDate,
                          first_air_date: item.releaseDate,
                          vote_average: item.voteAverage,
                          overview: '',
                          original_title: item.title,
                          original_name: item.title,
                          backdrop_path: null,
                          vote_count: 0,
                          genre_ids: [],
                          adult: false,
                          popularity: 0,
                        };
                        toggleLike(mediaItem as any, item.mediaType);
                      }}
                      title={t('like')}
                    >
                      <ThumbsUp size={18} fill={item.liked ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      className={`btn-love ${item.loved ? 'active' : ''}`}
                      onClick={() => {
                        const mediaItem = {
                          id: item.id,
                          title: item.title,
                          name: item.title,
                          poster_path: item.posterPath,
                          release_date: item.releaseDate,
                          first_air_date: item.releaseDate,
                          vote_average: item.voteAverage,
                          overview: '',
                          original_title: item.title,
                          original_name: item.title,
                          backdrop_path: null,
                          vote_count: 0,
                          genre_ids: [],
                          adult: false,
                          popularity: 0,
                        };
                        toggleLove(mediaItem as any, item.mediaType);
                      }}
                      title={t('love')}
                    >
                      <Heart size={18} fill={item.loved ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      className="btn-remove"
                      onClick={() => removeFavorite(item.id, item.mediaType)}
                      title={t('removeFromList')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
