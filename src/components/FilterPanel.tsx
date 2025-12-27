import type { Genre, WatchProvider, Certification, MediaType } from '../types/movie';
import { getImageUrl, IMAGE_SIZES } from '../api/config';
import { useI18n } from '../i18n';
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

// Year options (1990 to current year)
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from(
  { length: currentYear - 1989 },
  (_, i) => currentYear - i
);

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
  const { t } = useI18n();

  const SORT_OPTIONS = [
    { value: 'popularity.desc', label: t('sortMostPopular') },
    { value: 'vote_average.desc', label: t('sortBestRated') },
    { value: 'primary_release_date.desc', label: t('sortNewest') },
    { value: 'title.asc', label: t('sortTitleAZ') },
  ];

  const TV_SORT_OPTIONS = [
    { value: 'popularity.desc', label: t('sortMostPopular') },
    { value: 'vote_average.desc', label: t('sortBestRated') },
    { value: 'first_air_date.desc', label: t('sortNewest') },
    { value: 'name.asc', label: t('sortTitleAZ') },
  ];

  const RATING_OPTIONS = [
    { value: 0, label: t('ratingAny') },
    { value: 6, label: '6+ ★' },
    { value: 7, label: '7+ ★' },
    { value: 8, label: '8+ ★' },
    { value: 9, label: '9+ ★' },
  ];

  const CERTIFICATION_INFO: Record<string, string> = {
    'KN': t('certKN'),
    '6': t('cert6'),
    '12': t('cert12'),
    '16': t('cert16'),
    '18': t('cert18'),
    'G': t('certG'),
    'PG': t('certPG'),
    'PG-13': t('certPG13'),
    'R': t('certR'),
    'NC-17': t('certNC17'),
  };

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
        <h2>{t('filters')}</h2>
        {hasActiveFilters && (
          <button className="filter-panel__clear" onClick={onClearFilters}>
            {t('clearFilters')}
          </button>
        )}
      </div>

      {/* Sort */}
      <section className="filter-section">
        <h3>{t('sortBy')}</h3>
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

      {/* Minimum rating */}
      {onRatingChange && (
        <section className="filter-section">
          <h3>{t('minimumRating')}</h3>
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

      {/* Release year */}
      {(onYearFromChange || onYearToChange) && (
        <section className="filter-section">
          <h3>{t('releaseYear')}</h3>
          <div className="filter-year-range">
            <select
              value={yearFrom || ''}
              onChange={(e) => onYearFromChange?.(e.target.value ? parseInt(e.target.value) : undefined)}
              className="filter-select filter-select--small"
            >
              <option value="">{t('yearFrom')}</option>
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
              <option value="">{t('yearTo')}</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="filter-section">
        <h3>{t('categories')}</h3>
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

      {/* Age rating - movies only */}
      {mediaType === 'movie' && (
        <section className="filter-section">
          <h3>{t('ageRating')}</h3>
          <div className="filter-chips">
            <button
              className={`filter-chip ${selectedCertification === '' ? 'active' : ''}`}
              onClick={() => onCertificationChange('')}
            >
              {t('all')}
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

      {/* Streaming providers */}
      <section className="filter-section">
        <h3>{t('streamingProviders')}</h3>
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
