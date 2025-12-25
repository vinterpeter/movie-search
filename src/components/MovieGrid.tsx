import type { Movie, TVShow, MediaType } from '../types/movie';
import { MovieCard } from './MovieCard';
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
  const emptyText = mediaType === 'tv' ? 'sorozatokat' : 'filmeket';
  const loadingText = mediaType === 'tv' ? 'Sorozatok' : 'Filmek';
  const loadMoreText = mediaType === 'tv' ? 'Több sorozat betöltése' : 'Több film betöltése';

  if (!loading && items.length === 0) {
    return (
      <div className="movie-grid__empty">
        <p>Nem találtunk {emptyText} a megadott szűrőkkel.</p>
        <p>Próbáld meg módosítani a keresési feltételeket.</p>
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
          <p>{loadingText} betöltése...</p>
        </div>
      )}

      {!loading && hasMore && (
        <button className="movie-grid__load-more" onClick={onLoadMore}>
          {loadMoreText}
        </button>
      )}
    </div>
  );
};
