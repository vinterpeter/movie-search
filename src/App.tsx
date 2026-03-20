import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { FilterPanel } from './components/FilterPanel';
import { MovieGrid } from './components/MovieGrid';
import { MovieModal } from './components/MovieModal';
import { Watchlist } from './components/Watchlist';
import { Favorites } from './components/Favorites';
import { useMovies } from './hooks/useMovies';
import { useFilters, DEFAULT_PROVIDER_IDS } from './hooks/useFilters';
import { useWatchlist } from './hooks/useWatchlist';
import { useFavorites } from './hooks/useFavorites';
import { useRecommendations } from './hooks/useRecommendations';
import { useBlacklist } from './hooks/useBlacklist';
import { useI18n } from './i18n';
import { getHungarianCinemaData } from './api/tmdb';
import type { Movie, TVShow, MediaType, BrowseMode } from './types/movie';
import './App.css';

function App() {
  // Média típus (film vagy sorozat)
  const [mediaType, setMediaType] = useState<MediaType>('movie');

  // Szűrő állapotok
  const [browseMode, setBrowseMode] = useState<BrowseMode>('streaming');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<number[]>(DEFAULT_PROVIDER_IDS);
  const [selectedCertification, setSelectedCertification] = useState('');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [minRating, setMinRating] = useState(0);
  const [yearFrom, setYearFrom] = useState<number | undefined>(undefined);
  const [yearTo, setYearTo] = useState<number | undefined>(undefined);

  // Cinema filters (theaters mode)
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Keresés
  const [searchQuery, setSearchQuery] = useState('');

  // Kiválasztott film/sorozat a modalhoz
  const [selectedItem, setSelectedItem] = useState<Movie | TVShow | null>(null);

  // Mobil szűrő panel megjelenítése
  const [showFilters, setShowFilters] = useState(false);

  // Desktop szűrő panel összecsukva
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  // Watchlist panel megjelenítése
  const [showWatchlist, setShowWatchlist] = useState(false);

  // Favorites panel megjelenítése
  const [showFavorites, setShowFavorites] = useState(false);

  // Kiválasztott media type a modálhoz (favorites-ből jöhet más típus)
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('movie');

  // BasedOn info for recommendations
  const [selectedBasedOn, setSelectedBasedOn] = useState<string[] | undefined>(undefined);

  // Watchlist hook
  const { items: watchlistItems, syncing } = useWatchlist();

  // Favorites hook
  const { items: favoritesItems, syncing: favoritesSyncing } = useFavorites();

  // Blacklist hook
  const { addToBlacklist, isBlacklisted } = useBlacklist();

  // Recommendations hook - fetch all recommendations (more items for forYou mode)
  const { recommendations: rawRecommendations, loading: recommendationsLoading } = useRecommendations(
    favoritesItems,
    browseMode === 'forYou' ? 100 : 20,
    browseMode === 'forYou' ? mediaType : mediaType,
    browseMode === 'forYou' ? 'streaming' : browseMode
  );

  // Filter out blacklisted items from recommendations
  const recommendations = rawRecommendations.filter(
    rec => !isBlacklisted(rec.item.id, rec.mediaType)
  );

  // Apply filters to recommendations for forYou mode
  const filteredRecommendations = browseMode === 'forYou'
    ? recommendations.filter(rec => {
        const item = rec.item;
        // Filter by genre
        if (selectedGenres.length > 0 && !item.genre_ids.some(g => selectedGenres.includes(g))) {
          return false;
        }
        // Filter by min rating
        if (minRating > 0 && item.vote_average < minRating) {
          return false;
        }
        // Filter by year
        const dateStr = 'release_date' in item ? item.release_date : ('first_air_date' in item ? item.first_air_date : '');
        if (dateStr) {
          const year = parseInt(dateStr.split('-')[0], 10);
          if (yearFrom && year < yearFrom) return false;
          if (yearTo && year > yearTo) return false;
        }
        return true;
      })
    : recommendations;

  // Translations
  const { t } = useI18n();

  // Szűrők betöltése
  const {
    genres,
    providers,
    certifications,
    loading: filtersLoading,
  } = useFilters(mediaType);

  // Load cinema data when theaters mode is active
  useEffect(() => {
    if (browseMode === 'theaters') {
      getHungarianCinemaData().then(data => {
        if (data) {
          setAvailableCities(data.cities);
          setAvailableDates(data.dates);
        }
      });
    }
  }, [browseMode]);

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
    // Ha nincs kiválasztva szolgáltató, akkor minden TMDB film (undefined = nincs streaming szűrés)
    providers: selectedProviders.length > 0 ? selectedProviders : undefined,
    sortBy,
    minRating: minRating > 0 ? minRating : undefined,
    yearFrom,
    yearTo,
    // Cinema filters
    city: selectedCity || undefined,
    date: selectedDate || undefined,
    // Search
    searchQuery: searchQuery || undefined,
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
    setSelectedCity('');
    setSelectedDate('');
  }, []);

  const handleBrowseModeChange = useCallback((mode: BrowseMode) => {
    setBrowseMode(mode);
  }, []);

  const handleClearFilters = useCallback(() => {
    setBrowseMode('streaming');
    setSelectedGenres([]);
    setSelectedProviders(DEFAULT_PROVIDER_IDS);
    setSelectedCertification('');
    setSortBy('popularity.desc');
    setMinRating(0);
    setYearFrom(undefined);
    setYearTo(undefined);
    setSelectedCity('');
    setSelectedDate('');
    setSearchQuery('');
  }, []);

  const handleResetProviders = useCallback(() => {
    setSelectedProviders(DEFAULT_PROVIDER_IDS);
  }, []);

  const handleClearProviders = useCallback(() => {
    setSelectedProviders([]);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // Ha keresünk, streaming módba váltunk
    if (query.trim()) {
      setBrowseMode('streaming');
    }
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
        favoritesCount={favoritesItems.length}
        showFilters={showFilters || !filtersCollapsed}
        onFiltersToggle={() => {
          // On desktop toggle collapsed, on mobile toggle show
          if (window.innerWidth > 1024) {
            setFiltersCollapsed(!filtersCollapsed);
          } else {
            setShowFilters(!showFilters);
          }
        }}
      />

      <main className="main-content">
        <button
          className="filters-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? t('hideFilters') : t('showFilters')}
        </button>

        <div className={`content-layout ${filtersCollapsed ? 'filters-collapsed' : ''}`}>
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
                availableCities={availableCities}
                availableDates={availableDates}
                selectedCity={selectedCity}
                selectedDate={selectedDate}
                onCityChange={setSelectedCity}
                onDateChange={setSelectedDate}
                onGenreChange={setSelectedGenres}
                onProviderChange={setSelectedProviders}
                onCertificationChange={setSelectedCertification}
                onSortChange={setSortBy}
                onRatingChange={setMinRating}
                onYearFromChange={setYearFrom}
                onYearToChange={setYearTo}
                onBrowseModeChange={handleBrowseModeChange}
                onClearFilters={handleClearFilters}
                onResetProviders={handleResetProviders}
                onClearProviders={handleClearProviders}
                mediaType={mediaType}
                isCollapsed={filtersCollapsed}
                onToggleCollapse={() => setFiltersCollapsed(!filtersCollapsed)}
              />
            )}
          </div>

          <div className="movies-container">
            {browseMode === 'forYou' ? (
              <MovieGrid
                items={filteredRecommendations.map(rec => rec.item)}
                loading={recommendationsLoading}
                onItemClick={(item) => {
                  // Find the recommendation to get basedOn info
                  const rec = filteredRecommendations.find(r => r.item.id === item.id);
                  setSelectedItem(item);
                  setSelectedMediaType(rec?.mediaType || mediaType);
                  setSelectedBasedOn(rec?.basedOn);
                }}
                onLoadMore={() => {}}
                hasMore={false}
                mediaType={mediaType}
                onHideItem={(item) => {
                  const rec = filteredRecommendations.find(r => r.item.id === item.id);
                  if (rec) {
                    addToBlacklist(item, rec.mediaType);
                  }
                }}
              />
            ) : (
              <MovieGrid
                items={items}
                loading={itemsLoading}
                onItemClick={(item) => {
                  setSelectedItem(item);
                  setSelectedMediaType(mediaType);
                  setSelectedBasedOn(undefined);
                }}
                onLoadMore={loadMore}
                hasMore={page < totalPages}
                mediaType={mediaType}
              />
            )}
          </div>
        </div>
      </main>

      {selectedItem && (
        <MovieModal
          item={selectedItem}
          mediaType={selectedMediaType}
          browseMode={browseMode}
          initialCity={selectedCity}
          basedOn={selectedBasedOn}
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
            setSelectedBasedOn(undefined);
            setShowFavorites(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
