import { Star, ThumbsUp, Heart } from 'lucide-react';
import type { Movie, TVShow, MediaType } from '../types/movie';
import { getImageUrl, IMAGE_SIZES } from '../api/config';
import { useFavorites } from '../hooks/useFavorites';
import { useI18n } from '../i18n';
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
  const { t } = useI18n();
  const { toggleLike, toggleLove, isLiked, isLoved } = useFavorites();

  const title = isMovie(item) ? item.title : item.name;
  const dateStr = isMovie(item) ? item.release_date : item.first_air_date;
  const year = dateStr ? new Date(dateStr).getFullYear() : 'N/A';
  const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

  const liked = isLiked(item.id, mediaType);
  const loved = isLoved(item.id, mediaType);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(item, mediaType);
  };

  const handleLoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLove(item, mediaType);
  };

  return (
    <article className="movie-card" onClick={() => onClick?.(item)}>
      <div className="movie-card__poster">
        <img
          src={getImageUrl(item.poster_path, IMAGE_SIZES.poster.medium)}
          alt={title}
          loading="lazy"
        />
        <div className="movie-card__rating">
          <Star size={14} fill="currentColor" />
          {rating}
        </div>
        {mediaType === 'tv' && (
          <div className="movie-card__badge">{t('tvShow')}</div>
        )}
        <div className="movie-card__favorites">
          <button
            className={`movie-card__fav-btn movie-card__like ${liked ? 'active' : ''}`}
            onClick={handleLikeClick}
            title={t('like')}
          >
            <ThumbsUp size={14} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button
            className={`movie-card__fav-btn movie-card__love ${loved ? 'active' : ''}`}
            onClick={handleLoveClick}
            title={t('love')}
          >
            <Heart size={14} fill={loved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      <div className="movie-card__info">
        <h3 className="movie-card__title">{title}</h3>
        <p className="movie-card__year">{year}</p>
      </div>
    </article>
  );
};
