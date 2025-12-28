import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FilterPanel } from './components/FilterPanel';
import { MovieGrid } from './components/MovieGrid';
import { MovieModal } from './components/MovieModal';
import { MovieSection } from './components/MovieSection';
import { Watchlist } from './components/Watchlist';
import { Favorites } from './components/Favorites';
import { useMovies } from './hooks/useMovies';
import { useFilters, HUNGARIAN_PROVIDER_IDS } from './hooks/useFilters';
import { useWatchlist } from './hooks/useWatchlist';
import { useFavorites } from './hooks/useFavorites';
import { useMovieSections } from './hooks/useMovieSections';
import { useI18n } from './i18n';
import type { Movie, TVShow, MediaType, BrowseMode } from './types/movie';
import './App.css';

function App() {
  // Média típus (film vagy sorozat)
  const [mediaType, setMediaType] = useState<MediaType>('movie');

  // Szűrő állapotok
  const [browseMode, setBrowseMode] = useState<BrowseMode>('streaming');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);
  const [selectedCertification, setSelectedCertification] = useState('');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [minRating, setMinRating] = useState(0);
  const [yearFrom, setYearFrom] = useState<number | undefined>(undefined);
  const [yearTo, setYearTo] = useState<number | undefined>(undefined);

  // Kiválasztott film/sorozat a modalhoz
  const [selectedItem, setSelectedItem] = useState<Movie | TVShow | null>(null);

  // Mobil szűrő panel megjelenítése
  const [showFilters, setShowFilters] = useState(false);

  // Watchlist panel megjelenítése
  const [showWatchlist, setShowWatchlist] = useState(false);

  // Favorites panel megjelenítése
  const [showFavorites, setShowFavorites] = useState(false);

  // Kiválasztott media type a modálhoz (favorites-ből jöhet más típus)
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('movie');

  // Watchlist hook
  const { items: watchlistItems, syncing } = useWatchlist();

  // Favorites hook
  const { syncing: favoritesSyncing } = useFavorites();

  // Trending section
  const {
    trending,
    loading: sectionsLoading,
  } = useMovieSections(mediaType);

  // Translations
  const { t } = useI18n();

  // Szűrők betöltése
  const {
    genres,
    providers,
    certifications,
    loading: filtersLoading,
  } = useFilters(mediaType);

  // Filmek/Sorozatok betöltése szűrőkkel
  const {
    items,
    loading: itemsLoading,
    page,
    totalPages,
    loadMore,
  } = useMovies({
    mediaType,
    browseMode,
    genres: selectedGenres.length > 0 ? selectedGenres : undefined,
    certification: mediaType === 'movie' ? (selectedCertification || undefined) : undefined,
    // Ha nincs kiválasztva szolgáltató, akkor mind a 6 szolgáltatónk kínálatát mutatjuk
    providers: selectedProviders.length > 0 ? selectedProviders : HUNGARIAN_PROVIDER_IDS,
    sortBy,
    minRating: minRating > 0 ? minRating : undefined,
    yearFrom,
    yearTo,
  });

  const handleMediaTypeChange = useCallback((type: MediaType) => {
    setMediaType(type);
    setBrowseMode('streaming');
    setSelectedGenres([]);
    setSelectedCertification('');
  }, []);

  const handleTheatersClick = useCallback(() => {
    setMediaType('movie');
    setBrowseMode('theaters');
    setSelectedGenres([]);
    setSelectedCertification('');
  }, []);

  const handleBrowseModeChange = useCallback((mode: BrowseMode) => {
    setBrowseMode(mode);
  }, []);

  const handleClearFilters = useCallback(() => {
    setBrowseMode('streaming');
    setSelectedGenres([]);
    setSelectedProviders([]);
    setSelectedCertification('');
    setSortBy('popularity.desc');
    setMinRating(0);
    setYearFrom(undefined);
    setYearTo(undefined);
  }, []);

  const handleSearch = useCallback((_query: string) => {
    // TODO: Keresés implementálása szükség esetén
  }, []);

  return (
    <div className="app">
      <Header
        onSearch={handleSearch}
        mediaType={mediaType}
        browseMode={browseMode}
        onMediaTypeChange={handleMediaTypeChange}
        onTheatersClick={handleTheatersClick}
        onWatchlistClick={() => setShowWatchlist(true)}
        watchlistCount={watchlistItems.length}
        syncing={syncing || favoritesSyncing}
        onFavoritesClick={() => setShowFavorites(true)}
      />

      <main className="main-content">
        {/* Trending Section */}
        <div className="movie-sections">
          <MovieSection
            title={t('trending')}
            items={trending}
            loading={sectionsLoading}
            mediaType={mediaType}
            onItemClick={(item) => {
              setSelectedItem(item);
              setSelectedMediaType(mediaType);
            }}
          />
        </div>

        <button
          className="filters-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? t('hideFilters') : t('showFilters')}
        </button>

        <div className="content-layout">
          <div className={`filters-container ${showFilters ? 'show' : ''}`}>
            {!filtersLoading && (
              <FilterPanel
                genres={genres}
                providers={providers}
                certifications={certifications}
                selectedGenres={selectedGenres}
                selectedProviders={selectedProviders}
                selectedCertification={selectedCertification}
                sortBy={sortBy}
                minRating={minRating}
                yearFrom={yearFrom}
                yearTo={yearTo}
                browseMode={browseMode}
                onGenreChange={setSelectedGenres}
                onProviderChange={setSelectedProviders}
                onCertificationChange={setSelectedCertification}
                onSortChange={setSortBy}
                onRatingChange={setMinRating}
                onYearFromChange={setYearFrom}
                onYearToChange={setYearTo}
                onBrowseModeChange={handleBrowseModeChange}
                onClearFilters={handleClearFilters}
                mediaType={mediaType}
              />
            )}
          </div>

          <div className="movies-container">
            <MovieGrid
              items={items}
              loading={itemsLoading}
              onItemClick={(item) => {
                setSelectedItem(item);
                setSelectedMediaType(mediaType);
              }}
              onLoadMore={loadMore}
              hasMore={page < totalPages}
              mediaType={mediaType}
            />
          </div>
        </div>
      </main>

      {selectedItem && (
        <MovieModal
          item={selectedItem}
          mediaType={selectedMediaType}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {showWatchlist && (
        <Watchlist
          onClose={() => setShowWatchlist(false)}
          onItemClick={() => {
            setShowWatchlist(false);
          }}
        />
      )}

      {showFavorites && (
        <Favorites
          onClose={() => setShowFavorites(false)}
          onItemClick={(id, itemMediaType) => {
            // Find the item in the current items list or create a minimal one
            const foundItem = items.find(i => i.id === id);
            if (foundItem) {
              setSelectedItem(foundItem);
            } else {
              // Create minimal item for modal to fetch details
              setSelectedItem({
                id,
                poster_path: null,
                backdrop_path: null,
                overview: '',
                vote_average: 0,
                vote_count: 0,
                genre_ids: [],
                adult: false,
                popularity: 0,
                ...(itemMediaType === 'movie'
                  ? { title: '', original_title: '', release_date: '' }
                  : { name: '', original_name: '', first_air_date: '' }
                )
              } as Movie | TVShow);
            }
            setSelectedMediaType(itemMediaType);
            setShowFavorites(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
