import type { Movie, TVShow, MediaType } from '../types/movie';
import { getImageUrl, IMAGE_SIZES } from '../api/config';
import './MovieCard.css';

interface MovieCardProps {
  item: Movie | TVShow;
  onClick?: (item: Movie | TVShow) => void;
  mediaType: MediaType;
}

// Type guards
const isMovie = (item: Movie | TVShow): item is Movie => {
  return 'title' in item;
};

export const MovieCard = ({ item, onClick, mediaType }: MovieCardProps) => {
  const title = isMovie(item) ? item.title : item.name;
  const dateStr = isMovie(item) ? item.release_date : item.first_air_date;
  const year = dateStr ? new Date(dateStr).getFullYear() : 'N/A';
  const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

  return (
    <article className="movie-card" onClick={() => onClick?.(item)}>
      <div className="movie-card__poster">
        <img
          src={getImageUrl(item.poster_path, IMAGE_SIZES.poster.medium)}
          alt={title}
          loading="lazy"
        />
        <div className="movie-card__rating">
          <span className="movie-card__rating-star">★</span>
          {rating}
        </div>
        {mediaType === 'tv' && (
          <div className="movie-card__badge">Sorozat</div>
        )}
      </div>
      <div className="movie-card__info">
        <h3 className="movie-card__title">{title}</h3>
        <p className="movie-card__year">{year}</p>
      </div>
    </article>
  );
};
