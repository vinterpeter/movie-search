import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Movie, TVShow, MediaType } from '../types/movie';
import { MovieCard } from './MovieCard';
import './MovieSection.css';

interface MovieSectionProps {
  title: string;
  items: (Movie | TVShow)[];
  loading?: boolean;
  mediaType: MediaType;
  onItemClick: (item: Movie | TVShow) => void;
}

export const MovieSection = ({
  title,
  items,
  loading,
  mediaType,
  onItemClick,
}: MovieSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return (
      <section className="movie-section">
        <h2 className="movie-section__title">{title}</h2>
        <div className="movie-section__loading">
          <Loader2 size={32} className="spin" />
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="movie-section">
      <h2 className="movie-section__title">{title}</h2>
      <div className="movie-section__container">
        <button
          className="movie-section__nav movie-section__nav--left"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="movie-section__scroll" ref={scrollRef}>
          {items.map((item) => (
            <div key={item.id} className="movie-section__item">
              <MovieCard
                item={item}
                mediaType={mediaType}
                onClick={onItemClick}
              />
            </div>
          ))}
        </div>
        <button
          className="movie-section__nav movie-section__nav--right"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </section>
  );
};
