import { useState, useEffect, useCallback } from 'react';
import type { Movie, TVShow, WatchlistItem, MediaType, WatchProviderResult } from '../types/movie';
import { getMovieWatchProviders, getTVWatchProvidersForShow } from '../api/tmdb';
import { HUNGARIAN_PROVIDER_IDS } from './useFilters';

const WATCHLIST_KEY = 'movie-search-watchlist';

// Type guard
const isMovie = (item: Movie | TVShow): item is Movie => {
  return 'title' in item;
};

interface WatchlistItemWithAvailability extends WatchlistItem {
  availability?: WatchProviderResult | null;
  isAvailable?: boolean;
}

interface UseWatchlistReturn {
  items: WatchlistItemWithAvailability[];
  loading: boolean;
  addItem: (item: Movie | TVShow, mediaType: MediaType) => void;
  removeItem: (id: number, mediaType: MediaType) => void;
  toggleWatched: (id: number, mediaType: MediaType) => void;
  isInWatchlist: (id: number, mediaType: MediaType) => boolean;
  checkAvailability: () => Promise<void>;
}

export const useWatchlist = (): UseWatchlistReturn => {
  const [items, setItems] = useState<WatchlistItemWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as WatchlistItem[];
        setItems(parsed);
      } catch (e) {
        console.error('Failed to parse watchlist:', e);
      }
    }
    setLoading(false);
  }, []);

  // Save to localStorage when items change
  useEffect(() => {
    if (!loading) {
      // Save without availability data
      const toSave = items.map(({ availability, isAvailable, ...rest }) => rest);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(toSave));
    }
  }, [items, loading]);

  const addItem = useCallback((item: Movie | TVShow, mediaType: MediaType) => {
    const title = isMovie(item) ? item.title : item.name;
    const releaseDate = isMovie(item) ? item.release_date : item.first_air_date;

    const newItem: WatchlistItem = {
      id: item.id,
      mediaType,
      title,
      posterPath: item.poster_path,
      releaseDate,
      voteAverage: item.vote_average,
      addedAt: new Date().toISOString(),
      watched: false,
    };

    setItems((prev) => {
      // Check if already exists
      if (prev.some((i) => i.id === item.id && i.mediaType === mediaType)) {
        return prev;
      }
      return [newItem, ...prev];
    });
  }, []);

  const removeItem = useCallback((id: number, mediaType: MediaType) => {
    setItems((prev) => prev.filter((i) => !(i.id === id && i.mediaType === mediaType)));
  }, []);

  const toggleWatched = useCallback((id: number, mediaType: MediaType) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id && i.mediaType === mediaType ? { ...i, watched: !i.watched } : i
      )
    );
  }, []);

  const isInWatchlist = useCallback(
    (id: number, mediaType: MediaType) => {
      return items.some((i) => i.id === id && i.mediaType === mediaType);
    },
    [items]
  );

  const checkAvailability = useCallback(async () => {
    setLoading(true);

    const updatedItems = await Promise.all(
      items.map(async (item) => {
        try {
          const providers =
            item.mediaType === 'movie'
              ? await getMovieWatchProviders(item.id)
              : await getTVWatchProvidersForShow(item.id);

          // Check if available on any of our providers
          const allProviders = [
            ...(providers?.flatrate || []),
            ...(providers?.rent || []),
            ...(providers?.buy || []),
          ];

          const isAvailable = allProviders.some((p) =>
            HUNGARIAN_PROVIDER_IDS.includes(p.provider_id)
          );

          return {
            ...item,
            availability: providers,
            isAvailable,
          };
        } catch (e) {
          console.error(`Failed to check availability for ${item.title}:`, e);
          return item;
        }
      })
    );

    setItems(updatedItems);
    setLoading(false);
  }, [items]);

  return {
    items,
    loading,
    addItem,
    removeItem,
    toggleWatched,
    isInWatchlist,
    checkAvailability,
  };
};
