import { useState, useEffect } from 'react';
import type { Genre, WatchProvider, Certification, MediaType } from '../types/movie';
import { getGenres, getWatchProviders, getCertifications, getTVGenres, getTVWatchProviders } from '../api/tmdb';

// Alapértelmezett magyar streaming szolgáltatók ID-k
export const DEFAULT_PROVIDER_IDS = [
  1899, // HBO Max (Magyarország)
  8,    // Netflix
  119,  // Amazon Prime Video
  337,  // Disney Plus
  1773, // SkyShowtime
  2,    // Apple TV+
];

// Legacy export for backwards compatibility
export const HUNGARIAN_PROVIDER_IDS = DEFAULT_PROVIDER_IDS;

interface UseFiltersReturn {
  genres: Genre[];
  providers: WatchProvider[];
  certifications: Certification[];
  loading: boolean;
  error: string | null;
}

export const useFilters = (mediaType: MediaType = 'movie'): UseFiltersReturn => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [providers, setProviders] = useState<WatchProvider[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilters = async () => {
      setLoading(true);
      setError(null);

      try {
        // Műfajok és szolgáltatók média típus alapján
        const [genresData, providersData, certificationsData] = await Promise.all([
          mediaType === 'tv' ? getTVGenres() : getGenres(),
          mediaType === 'tv' ? getTVWatchProviders() : getWatchProviders(),
          getCertifications(),
        ]);

        setGenres(genresData);

        // Minden magyar szolgáltató, alapértelmezettek előre rendezve
        const sortedProviders = providersData.sort((a, b) => {
          const aIsDefault = DEFAULT_PROVIDER_IDS.includes(a.provider_id);
          const bIsDefault = DEFAULT_PROVIDER_IDS.includes(b.provider_id);

          // Alapértelmezettek előre
          if (aIsDefault && !bIsDefault) return -1;
          if (!aIsDefault && bIsDefault) return 1;

          // Alapértelmezetteken belül eredeti sorrend
          if (aIsDefault && bIsDefault) {
            return DEFAULT_PROVIDER_IDS.indexOf(a.provider_id) - DEFAULT_PROVIDER_IDS.indexOf(b.provider_id);
          }

          // Többi népszerűség szerint (display_priority)
          return (a.display_priority || 999) - (b.display_priority || 999);
        });
        setProviders(sortedProviders);

        setCertifications(certificationsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Hiba történt a szűrők betöltésekor');
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, [mediaType]);

  return {
    genres,
    providers,
    certifications,
    loading,
    error,
  };
};
