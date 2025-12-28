import { useEffect, useState } from 'react';
import { X, Play, Star, Check, Plus, ExternalLink, Loader2, ThumbsUp, Heart, MapPin, Calendar, Ticket } from 'lucide-react';
import type { Movie, TVShow, MovieDetails, TVShowDetails, WatchProviderResult, Video, MediaType, BrowseMode, Screening, CinemaMovie } from '../types/movie';
import { getMovieDetails, getMovieWatchProviders, getTVDetails, getTVWatchProvidersForShow, getVideos, getBestTrailer, getHungarianCinemaData } from '../api/tmdb';
import { getImageUrl, IMAGE_SIZES } from '../api/config';
import { useWatchlist } from '../hooks/useWatchlist';
import { useFavorites } from '../hooks/useFavorites';
import { useI18n } from '../i18n';
import './MovieModal.css';

interface MovieModalProps {
  item: Movie | TVShow;
  mediaType: MediaType;
  browseMode?: BrowseMode;
  initialCity?: string;
  onClose: () => void;
}

// Type guards
const isMovie = (item: Movie | TVShow): item is Movie => {
  return 'title' in item;
};

const isMovieDetails = (details: MovieDetails | TVShowDetails): details is MovieDetails => {
  return 'runtime' in details;
};

export const MovieModal = ({ item, mediaType, browseMode, initialCity, onClose }: MovieModalProps) => {
  const [details, setDetails] = useState<MovieDetails | TVShowDetails | null>(null);
  const [providers, setProviders] = useState<WatchProviderResult | null>(null);
  const [trailer, setTrailer] = useState<Video | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cinemaMovie, setCinemaMovie] = useState<CinemaMovie | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const { t } = useI18n();
  const { addItem, removeItem, isInWatchlist } = useWatchlist();
  const { toggleLike, toggleLove, isLiked, isLoved } = useFavorites();
  const inWatchlist = isInWatchlist(item.id, mediaType);
  const liked = isLiked(item.id, mediaType);
  const loved = isLoved(item.id, mediaType);

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

  // Fetch cinema data when in theaters mode
  useEffect(() => {
    if (browseMode === 'theaters' && mediaType === 'movie') {
      getHungarianCinemaData().then(data => {
        if (data) {
          const movie = data.movies.find(m => m.id === item.id);
          if (movie) {
            setCinemaMovie(movie);
            // Set default city: use initialCity if available for this movie, otherwise first available
            if (movie.cities.length > 0 && !selectedCity) {
              if (initialCity && movie.cities.includes(initialCity)) {
                setSelectedCity(initialCity);
              } else {
                setSelectedCity(movie.cities[0]);
              }
            }
          }
        }
      });
    }
  }, [browseMode, mediaType, item.id, selectedCity, initialCity]);

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

  // Get filtered screenings for selected city and date
  const getFilteredScreenings = (): Screening[] => {
    if (!cinemaMovie || !selectedCity) return [];
    const cityScreenings = cinemaMovie.screenings[selectedCity] || [];
    if (!selectedDate) return cityScreenings;
    return cityScreenings.filter(s => s.date === selectedDate);
  };

  // Group screenings by cinema and date
  const getGroupedScreenings = () => {
    const screenings = getFilteredScreenings();
    const grouped: Record<string, Record<string, Screening[]>> = {};

    screenings.forEach(s => {
      if (!grouped[s.date]) grouped[s.date] = {};
      if (!grouped[s.date][s.cinemaName]) grouped[s.date][s.cinemaName] = [];
      grouped[s.date][s.cinemaName].push(s);
    });

    // Sort screenings by time within each group
    Object.values(grouped).forEach(dateGroup => {
      Object.values(dateGroup).forEach(cinemaScreenings => {
        cinemaScreenings.sort((a, b) => a.time.localeCompare(b.time));
      });
    });

    return grouped;
  };

  // Format date for display
  const formatDateForDisplay = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('tomorrow');
    } else {
      return date.toLocaleDateString('hu-HU', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

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
              <div className="favorite-buttons">
                <button
                  className={`favorite-button like-button ${liked ? 'active' : ''}`}
                  onClick={() => toggleLike(item, mediaType)}
                  title={t('like')}
                >
                  <ThumbsUp size={16} fill={liked ? 'currentColor' : 'none'} />
                </button>
                <button
                  className={`favorite-button love-button ${loved ? 'active' : ''}`}
                  onClick={() => toggleLove(item, mediaType)}
                  title={t('love')}
                >
                  <Heart size={16} fill={loved ? 'currentColor' : 'none'} />
                </button>
              </div>
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

            {/* Cinema Screenings Section */}
            {browseMode === 'theaters' && cinemaMovie && (
              <div className="modal-screenings">
                <h3><Ticket size={18} /> {t('screenings')}</h3>

                {/* City and Date filters */}
                <div className="screenings-filters">
                  <div className="screenings-filter">
                    <MapPin size={16} />
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="screenings-select"
                    >
                      {cinemaMovie.cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div className="screenings-filter">
                    <Calendar size={16} />
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="screenings-select"
                    >
                      <option value="">{t('allDates')}</option>
                      {cinemaMovie.dates.map(date => (
                        <option key={date} value={date}>{formatDateForDisplay(date)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Screenings list */}
                <div className="screenings-list">
                  {Object.entries(getGroupedScreenings()).length > 0 ? (
                    Object.entries(getGroupedScreenings())
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([date, cinemas]) => (
                        <div key={date} className="screenings-date-group">
                          <div className="screenings-date-header">
                            {formatDateForDisplay(date)}
                          </div>
                          {Object.entries(cinemas).map(([cinemaName, screenings]) => (
                            <div key={cinemaName} className="screenings-cinema-group">
                              <div className="screenings-cinema-name">{cinemaName}</div>
                              <div className="screenings-times">
                                {screenings.map((s, idx) => (
                                  <a
                                    key={idx}
                                    href={s.bookingLink || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="screening-time"
                                    title={s.auditorium}
                                  >
                                    {s.time}
                                  </a>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))
                  ) : (
                    <p className="no-screenings">{t('noScreeningsFound')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
