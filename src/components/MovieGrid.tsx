import type { Movie, TVShow, MediaType } from '../types/movie';
import { MovieCard } from './MovieCard';
import { useI18n } from '../i18n';
import './MovieGrid.css';

interface MovieGridProps {
  items: (Movie | TVShow)[];
  loading: boolean;
  onItemClick?: (item: Movie | TVShow) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  mediaType: MediaType;
}

export const MovieGrid = ({
  items,
  loading,
  onItemClick,
  onLoadMore,
  hasMore,
  mediaType,
}: MovieGridProps) => {
  const { t } = useI18n();

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
          <MovieCard
            key={item.id}
            item={item}
            onClick={onItemClick}
            mediaType={mediaType}
          />
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
