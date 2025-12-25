import type { Genre, WatchProvider, Certification, MediaType } from '../types/movie';
import { getImageUrl, IMAGE_SIZES } from '../api/config';
import './FilterPanel.css';

interface FilterPanelProps {
  genres: Genre[];
  providers: WatchProvider[];
  certifications: Certification[];
  selectedGenres: number[];
  selectedProviders: number[];
  selectedCertification: string;
  sortBy: string;
  minRating?: number;
  yearFrom?: number;
  yearTo?: number;
  onGenreChange: (genres: number[]) => void;
  onProviderChange: (providers: number[]) => void;
  onCertificationChange: (certification: string) => void;
  onSortChange: (sort: string) => void;
  onRatingChange?: (rating: number) => void;
  onYearFromChange?: (year: number | undefined) => void;
  onYearToChange?: (year: number | undefined) => void;
  onClearFilters: () => void;
  mediaType: MediaType;
}

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Legnépszerűbb' },
  { value: 'vote_average.desc', label: 'Legjobb értékelés' },
  { value: 'primary_release_date.desc', label: 'Legújabb' },
  { value: 'title.asc', label: 'Cím (A-Z)' },
];

const TV_SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Legnépszerűbb' },
  { value: 'vote_average.desc', label: 'Legjobb értékelés' },
  { value: 'first_air_date.desc', label: 'Legújabb' },
  { value: 'name.asc', label: 'Cím (A-Z)' },
];

const RATING_OPTIONS = [
  { value: 0, label: 'Mindegy' },
  { value: 6, label: '6+ ★' },
  { value: 7, label: '7+ ★' },
  { value: 8, label: '8+ ★' },
  { value: 9, label: '9+ ★' },
];

// Év opciók generálása (1990-től a jelenlegi évig)
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from(
  { length: currentYear - 1989 },
  (_, i) => currentYear - i
);

const CERTIFICATION_INFO: Record<string, string> = {
  'KN': 'Korhatár nélkül',
  '6': '6 éven felülieknek',
  '12': '12 éven felülieknek',
  '16': '16 éven felülieknek',
  '18': '18 éven felülieknek',
  'G': 'Minden korosztálynak',
  'PG': 'Szülői felügyelettel',
  'PG-13': '13 év felett',
  'R': '17 év alatt szülővel',
  'NC-17': '18 év felett',
};

export const FilterPanel = ({
  genres,
  providers,
  certifications,
  selectedGenres,
  selectedProviders,
  selectedCertification,
  sortBy,
  minRating = 0,
  yearFrom,
  yearTo,
  onGenreChange,
  onProviderChange,
  onCertificationChange,
  onSortChange,
  onRatingChange,
  onYearFromChange,
  onYearToChange,
  onClearFilters,
  mediaType,
}: FilterPanelProps) => {
  const toggleGenre = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      onGenreChange(selectedGenres.filter((id) => id !== genreId));
    } else {
      onGenreChange([...selectedGenres, genreId]);
    }
  };

  const toggleProvider = (providerId: number) => {
    if (selectedProviders.includes(providerId)) {
      onProviderChange(selectedProviders.filter((id) => id !== providerId));
    } else {
      onProviderChange([...selectedProviders, providerId]);
    }
  };

  const hasActiveFilters =
    selectedGenres.length > 0 ||
    selectedProviders.length > 0 ||
    selectedCertification !== '' ||
    minRating > 0 ||
    yearFrom !== undefined ||
    yearTo !== undefined;

  const sortOptions = mediaType === 'tv' ? TV_SORT_OPTIONS : SORT_OPTIONS;

  return (
    <aside className="filter-panel">
      <div className="filter-panel__header">
        <h2>Szűrők</h2>
        {hasActiveFilters && (
          <button className="filter-panel__clear" onClick={onClearFilters}>
            Törlés
          </button>
        )}
      </div>

      {/* Rendezés */}
      <section className="filter-section">
        <h3>Rendezés</h3>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="filter-select"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      {/* Minimum értékelés */}
      {onRatingChange && (
        <section className="filter-section">
          <h3>Minimum értékelés</h3>
          <div className="filter-chips">
            {RATING_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`filter-chip ${minRating === option.value ? 'active' : ''}`}
                onClick={() => onRatingChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Megjelenés éve */}
      {(onYearFromChange || onYearToChange) && (
        <section className="filter-section">
          <h3>Megjelenés éve</h3>
          <div className="filter-year-range">
            <select
              value={yearFrom || ''}
              onChange={(e) => onYearFromChange?.(e.target.value ? parseInt(e.target.value) : undefined)}
              className="filter-select filter-select--small"
            >
              <option value="">Évtől</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span className="filter-year-separator">-</span>
            <select
              value={yearTo || ''}
              onChange={(e) => onYearToChange?.(e.target.value ? parseInt(e.target.value) : undefined)}
              className="filter-select filter-select--small"
            >
              <option value="">Évig</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </section>
      )}

      {/* Kategóriák */}
      <section className="filter-section">
        <h3>Kategóriák</h3>
        <div className="filter-chips">
          {genres.map((genre) => (
            <button
              key={genre.id}
              className={`filter-chip ${selectedGenres.includes(genre.id) ? 'active' : ''}`}
              onClick={() => toggleGenre(genre.id)}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </section>

      {/* Korosztály - csak filmekhez */}
      {mediaType === 'movie' && (
        <section className="filter-section">
          <h3>Korosztály</h3>
          <div className="filter-chips">
            <button
              className={`filter-chip ${selectedCertification === '' ? 'active' : ''}`}
              onClick={() => onCertificationChange('')}
            >
              Mind
            </button>
            {certifications.map((cert) => (
              <button
                key={cert.certification}
                className={`filter-chip ${selectedCertification === cert.certification ? 'active' : ''}`}
                onClick={() => onCertificationChange(cert.certification)}
                title={CERTIFICATION_INFO[cert.certification] || cert.meaning}
              >
                {cert.certification}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Streaming szolgáltatók */}
      <section className="filter-section">
        <h3>Streaming szolgáltatók</h3>
        <div className="filter-providers">
          {providers.map((provider) => (
            <button
              key={provider.provider_id}
              className={`filter-provider ${selectedProviders.includes(provider.provider_id) ? 'active' : ''}`}
              onClick={() => toggleProvider(provider.provider_id)}
              title={provider.provider_name}
            >
              <img
                src={getImageUrl(provider.logo_path, IMAGE_SIZES.logo.medium)}
                alt={provider.provider_name}
              />
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
};
