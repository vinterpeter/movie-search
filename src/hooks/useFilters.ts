import { useState, useEffect } from 'react';
import type { Genre, WatchProvider, Certification, MediaType } from '../types/movie';
import { getGenres, getWatchProviders, getCertifications, getTVGenres, getTVWatchProviders } from '../api/tmdb';

// Magyar streaming szolgáltatók ID-k (exportálva, hogy máshol is használható legyen)
export const HUNGARIAN_PROVIDER_IDS = [
  1899, // HBO Max (Magyarország)
  8,    // Netflix
  119,  // Amazon Prime Video
  337,  // Disney Plus
  1773, // SkyShowtime
  2,    // Apple TV+
];

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

        // Csak a kért magyar streaming szolgáltatók
        const filteredProviders = providersData
          .filter(p => HUNGARIAN_PROVIDER_IDS.includes(p.provider_id))
          .sort((a, b) => HUNGARIAN_PROVIDER_IDS.indexOf(a.provider_id) - HUNGARIAN_PROVIDER_IDS.indexOf(b.provider_id));
        setProviders(filteredProviders);

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
