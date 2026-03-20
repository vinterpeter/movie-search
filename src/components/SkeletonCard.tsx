import './SkeletonCard.css';

export const SkeletonCard = () => {
  return (
    <article className="skeleton-card">
      <div className="skeleton-card__poster">
        <div className="skeleton-shimmer" />
      </div>
      <div className="skeleton-card__info">
        <div className="skeleton-card__title">
          <div className="skeleton-shimmer" />
        </div>
        <div className="skeleton-card__year">
          <div className="skeleton-shimmer" />
        </div>
      </div>
    </article>
  );
};
