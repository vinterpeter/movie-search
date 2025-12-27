import { useEffect, useState } from 'react';
import { X, Play, Star, Check, Plus, ExternalLink, Loader2 } from 'lucide-react';
import type { Movie, TVShow, MovieDetails, TVShowDetails, WatchProviderResult, Video, MediaType } from '../types/movie';
import { getMovieDetails, getMovieWatchProviders, getTVDetails, getTVWatchProvidersForShow, getVideos, getBestTrailer } from '../api/tmdb';
import { getImageUrl, IMAGE_SIZES } from '../api/config';
import { useWatchlist } from '../hooks/useWatchlist';
import { useI18n } from '../i18n';
import './MovieModal.css';

interface MovieModalProps {
  item: Movie | TVShow;
  mediaType: MediaType;
  onClose: () => void;
}

// Type guards
const isMovie = (item: Movie | TVShow): item is Movie => {
  return 'title' in item;
};

const isMovieDetails = (details: MovieDetails | TVShowDetails): details is MovieDetails => {
  return 'runtime' in details;
};

export const MovieModal = ({ item, mediaType, onClose }: MovieModalProps) => {
  const [details, setDetails] = useState<MovieDetails | TVShowDetails | null>(null);
  const [providers, setProviders] = useState<WatchProviderResult | null>(null);
  const [trailer, setTrailer] = useState<Video | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [loading, setLoading] = useState(true);

  const { t } = useI18n();
  const { addItem, removeItem, isInWatchlist } = useWatchlist();
  const inWatchlist = isInWatchlist(item.id, mediaType);

  const title = isMovie(item) ? item.title : item.name;
  const dateStr = isMovie(item) ? item.release_date : item.first_air_date;
  const year = dateStr ? new Date(dateStr).getFullYear() : 'N/A';

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (mediaType === 'tv') {
          const [tvDetails, watchProviders, videos] = await Promise.all([
            getTVDetails(item.id),
            getTVWatchProvidersForShow(item.id),
            getVideos('tv', item.id),
          ]);
          setDetails(tvDetails);
          setProviders(watchProviders);
          setTrailer(getBestTrailer(videos));
        } else {
          const [movieDetails, watchProviders, videos] = await Promise.all([
            getMovieDetails(item.id),
            getMovieWatchProviders(item.id),
            getVideos('movie', item.id),
          ]);
          setDetails(movieDetails);
          setProviders(watchProviders);
          setTrailer(getBestTrailer(videos));
        }
      } catch (error) {
        console.error('Error fetching details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [item.id, mediaType]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTrailer) {
          setShowTrailer(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose, showTrailer]);

  // Runtime display
  const getRuntimeDisplay = () => {
    if (!details) return null;
    if (isMovieDetails(details)) {
      return details.runtime ? `${details.runtime} ${t('minutes')}` : null;
    } else {
      // TV show - show number of seasons/episodes
      return `${details.number_of_seasons} ${t('seasons')}, ${details.number_of_episodes} ${t('episodes')}`;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        {/* Trailer Modal */}
        {showTrailer && trailer && (
          <div className="trailer-overlay" onClick={() => setShowTrailer(false)}>
            <div className="trailer-container" onClick={(e) => e.stopPropagation()}>
              <button className="trailer-close" onClick={() => setShowTrailer(false)}>
                <X size={24} />
              </button>
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
                title={trailer.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        <div className="modal-body">
          <div className="modal-poster">
            <img
              src={getImageUrl(item.poster_path, IMAGE_SIZES.poster.large)}
              alt={title}
            />
            <div className="poster-buttons">
              {trailer && (
                <button
                  className="trailer-button"
                  onClick={() => setShowTrailer(true)}
                >
                  <Play size={16} /> {t('trailer')}
                </button>
              )}
              <button
                className={`watchlist-button ${inWatchlist ? 'in-list' : ''}`}
                onClick={() => {
                  if (inWatchlist) {
                    removeItem(item.id, mediaType);
                  } else {
                    addItem(item, mediaType);
                  }
                }}
              >
                {inWatchlist ? <><Check size={16} /> {t('inWatchlist')}</> : <><Plus size={16} /> {t('addToWatchlist')}</>}
              </button>
            </div>
          </div>

          <div className="modal-info">
            <h2 className="modal-title">{title}</h2>

            <div className="modal-meta">
              <span className="modal-year">{year}</span>
              {getRuntimeDisplay() && (
                <span className="modal-runtime">{getRuntimeDisplay()}</span>
              )}
              <span className="modal-rating">
                <Star size={16} fill="currentColor" /> {item.vote_average.toFixed(1)}
              </span>
            </div>

            {details?.genres && (
              <div className="modal-genres">
                {details.genres.map((genre) => (
                  <span key={genre.id} className="modal-genre">
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {details?.tagline && (
              <p className="modal-tagline">"{details.tagline}"</p>
            )}

            <p className="modal-overview">
              {item.overview || t('noDescription')}
            </p>

            {loading && (
              <div className="modal-loading">
                <Loader2 size={32} className="spin" />
              </div>
            )}

            {providers && (
              <div className="modal-providers">
                <h3>{t('availableOnStreaming')}</h3>

                {providers.flatrate && providers.flatrate.length > 0 && (
                  <div className="provider-section">
                    <span className="provider-label">{t('withSubscription')}</span>
                    <div className="provider-list">
                      {providers.flatrate.map((p) => (
                        <img
                          key={p.provider_id}
                          src={getImageUrl(p.logo_path, IMAGE_SIZES.logo.medium)}
                          alt={p.provider_name}
                          title={p.provider_name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {providers.rent && providers.rent.length > 0 && (
                  <div className="provider-section">
                    <span className="provider-label">{t('rentable')}</span>
                    <div className="provider-list">
                      {providers.rent.map((p) => (
                        <img
                          key={p.provider_id}
                          src={getImageUrl(p.logo_path, IMAGE_SIZES.logo.medium)}
                          alt={p.provider_name}
                          title={p.provider_name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {providers.buy && providers.buy.length > 0 && (
                  <div className="provider-section">
                    <span className="provider-label">{t('purchasable')}</span>
                    <div className="provider-list">
                      {providers.buy.map((p) => (
                        <img
                          key={p.provider_id}
                          src={getImageUrl(p.logo_path, IMAGE_SIZES.logo.medium)}
                          alt={p.provider_name}
                          title={p.provider_name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {!providers.flatrate && !providers.rent && !providers.buy && (
                  <p className="no-providers">
                    {t('noStreamingProviders')}
                  </p>
                )}

                {providers.link && (
                  <a
                    href={providers.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="provider-link"
                  >
                    {t('viewOnJustWatch')} <ExternalLink size={14} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
