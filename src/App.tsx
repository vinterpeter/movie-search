import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FilterPanel } from './components/FilterPanel';
import { MovieGrid } from './components/MovieGrid';
import { MovieModal } from './components/MovieModal';
import { useMovies } from './hooks/useMovies';
import { useFilters, HUNGARIAN_PROVIDER_IDS } from './hooks/useFilters';
import type { Movie, TVShow, MediaType } from './types/movie';
import './App.css';

function App() {
  // Média típus (film vagy sorozat)
  const [mediaType, setMediaType] = useState<MediaType>('movie');

  // Szűrő állapotok
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
    totalResults,
    loadMore,
  } = useMovies({
    mediaType,
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
    setSelectedGenres([]);
    setSelectedCertification('');
  }, []);

  const handleClearFilters = useCallback(() => {
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
        totalResults={totalResults}
        mediaType={mediaType}
      />

      <main className="main-content">
        {/* Média típus váltó */}
        <div className="media-type-toggle">
          <button
            className={`media-type-btn ${mediaType === 'movie' ? 'active' : ''}`}
            onClick={() => handleMediaTypeChange('movie')}
          >
            Filmek
          </button>
          <button
            className={`media-type-btn ${mediaType === 'tv' ? 'active' : ''}`}
            onClick={() => handleMediaTypeChange('tv')}
          >
            Sorozatok
          </button>
        </div>

        <button
          className="filters-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Szűrők elrejtése' : 'Szűrők megjelenítése'}
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
                onGenreChange={setSelectedGenres}
                onProviderChange={setSelectedProviders}
                onCertificationChange={setSelectedCertification}
                onSortChange={setSortBy}
                onRatingChange={setMinRating}
                onYearFromChange={setYearFrom}
                onYearToChange={setYearTo}
                onClearFilters={handleClearFilters}
                mediaType={mediaType}
              />
            )}
          </div>

          <div className="movies-container">
            <MovieGrid
              items={items}
              loading={itemsLoading}
              onItemClick={setSelectedItem}
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
          mediaType={mediaType}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

export default App;
