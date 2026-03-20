import { EyeOff } from 'lucide-react';
import type { Movie, TVShow, MediaType } from '../types/movie';
import { MovieCard } from './MovieCard';
import { SkeletonCard } from './SkeletonCard';
import { useI18n } from '../i18n';
import './MovieGrid.css';

interface MovieGridProps {
  items: (Movie | TVShow)[];
  loading: boolean;
  onItemClick?: (item: Movie | TVShow) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  mediaType: MediaType;
  onHideItem?: (item: Movie | TVShow) => void;
}

// Number of skeleton cards to show during initial load
const SKELETON_COUNT = 12;

export const MovieGrid = ({
  items,
  loading,
  onItemClick,
  onLoadMore,
  hasMore,
  mediaType,
  onHideItem,
}: MovieGridProps) => {
  const { t } = useI18n();

  // Show skeleton cards during initial load
  if (loading && items.length === 0) {
    return (
      <div className="movie-grid-container">
        <div className="movie-grid">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="movie-grid__empty">
        <p>{mediaType === 'tv' ? t('noTvShowsFound') : t('noMoviesFound')}</p>
        <p>{t('tryDifferentFilters')}</p>
      </div>
    );
  }

  return (
    <div className="movie-grid-container">
      <div className="movie-grid">
        {items.map((item) => (
          <div key={item.id} className="movie-grid__item-wrapper">
            <MovieCard
              item={item}
              onClick={onItemClick}
              mediaType={mediaType}
            />
            {onHideItem && (
              <button
                className="movie-grid__hide-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onHideItem(item);
                }}
                title={t('hideRecommendation')}
              >
                <EyeOff size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div className="movie-grid__loading">
          <div className="spinner"></div>
          <p>{mediaType === 'tv' ? t('loadingTvShows') : t('loadingMovies')}</p>
        </div>
      )}

      {!loading && hasMore && (
        <button className="movie-grid__load-more" onClick={onLoadMore}>
          {mediaType === 'tv' ? t('loadMoreTvShows') : t('loadMoreMovies')}
        </button>
      )}
    </div>
  );
};
