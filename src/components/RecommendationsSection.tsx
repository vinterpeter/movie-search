import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import type { Movie, TVShow, MediaType } from '../types/movie';
import { MovieCard } from './MovieCard';
import { SkeletonCard } from './SkeletonCard';
import { useI18n } from '../i18n';
import './MovieSection.css';
import './RecommendationsSection.css';

interface RecommendationItem {
  item: Movie | TVShow;
  mediaType: MediaType;
  score: number;
  basedOn: string[];
}

interface RecommendationsSectionProps {
  recommendations: RecommendationItem[];
  loading?: boolean;
  onItemClick: (item: Movie | TVShow, mediaType: MediaType, basedOn?: string[]) => void;
  onHideItem?: (item: Movie | TVShow, mediaType: MediaType) => void;
}

const SKELETON_COUNT = 8;

export const RecommendationsSection = ({
  recommendations,
  loading,
  onItemClick,
  onHideItem,
}: RecommendationsSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

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
      <section className="movie-section recommendations-section">
        <h2 className="movie-section__title">
          <Sparkles size={20} className="recommendations-icon" />
          {t('recommendedForYou')}
        </h2>
        <div className="movie-section__container">
          <div className="movie-section__scroll">
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <div key={index} className="movie-section__item">
                <SkeletonCard />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="movie-section recommendations-section">
      <h2 className="movie-section__title">
        <Sparkles size={20} className="recommendations-icon" />
        {t('recommendedForYou')}
      </h2>
      <div className="movie-section__container">
        <button
          className="movie-section__nav movie-section__nav--left"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="movie-section__scroll" ref={scrollRef}>
          {recommendations.map((rec) => (
            <div key={`${rec.mediaType}_${rec.item.id}`} className="movie-section__item">
              <div className="recommendation-card-wrapper">
                <MovieCard
                  item={rec.item}
                  mediaType={rec.mediaType}
                  onClick={(item) => onItemClick(item, rec.mediaType, rec.basedOn)}
                />
                {rec.score > 1 && (
                  <div className="recommendation-badge" title={`${t('basedOn')}: ${rec.basedOn.join(', ')}`}>
                    <span className="recommendation-badge__text">
                      {rec.score}x
                    </span>
                  </div>
                )}
                {onHideItem && (
                  <button
                    className="recommendation-hide-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onHideItem(rec.item, rec.mediaType);
                    }}
                    title={t('hideRecommendation')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
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
