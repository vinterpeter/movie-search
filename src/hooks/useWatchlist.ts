import { useState, useEffect, useCallback } from 'react';
import type { Movie, TVShow, WatchlistItem, MediaType, WatchProviderResult } from '../types/movie';
import { getMovieWatchProviders, getTVWatchProvidersForShow } from '../api/tmdb';
import { HUNGARIAN_PROVIDER_IDS } from './useFilters';

const WATCHLIST_KEY = 'movie-search-watchlist';

// Type guard
const isMovie = (item: Movie | TVShow): item is Movie => {
  return 'title' in item;
};

export interface WatchlistItemWithAvailability extends WatchlistItem {
  availability?: WatchProviderResult | null;
  isAvailable?: boolean;
  lastChecked?: string; // ISO date string when availability was last checked
}

interface UseWatchlistReturn {
  items: WatchlistItemWithAvailability[];
  loading: boolean;
  refreshingId: number | null;
  addItem: (item: Movie | TVShow, mediaType: MediaType) => void;
  removeItem: (id: number, mediaType: MediaType) => void;
  toggleWatched: (id: number, mediaType: MediaType) => void;
  isInWatchlist: (id: number, mediaType: MediaType) => boolean;
  checkAvailability: () => Promise<void>;
  refreshItemAvailability: (id: number, mediaType: MediaType) => Promise<void>;
}

export const useWatchlist = (): UseWatchlistReturn => {
  const [items, setItems] = useState<WatchlistItemWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);

  // Load from localStorage on mount (including availability data)
  useEffect(() => {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as WatchlistItemWithAvailability[];
        setItems(parsed);
      } catch (e) {
        console.error('Failed to parse watchlist:', e);
      }
    }
    setLoading(false);
  }, []);

  // Save to localStorage when items change (including availability data)
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
    }
  }, [items, loading]);

  const addItem = useCallback((item: Movie | TVShow, mediaType: MediaType) => {
    const title = isMovie(item) ? item.title : item.name;
    const releaseDate = isMovie(item) ? item.release_date : item.first_air_date;

    const newItem: WatchlistItemWithAvailability = {
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

  // Check availability for items that don't have it yet
  const checkAvailability = useCallback(async () => {
    // Only check items without availability data
    const itemsToCheck = items.filter((item) => item.availability === undefined);

    if (itemsToCheck.length === 0) {
      return;
    }

    setLoading(true);

    const updatedItems = await Promise.all(
      items.map(async (item) => {
        // Skip if already has availability data
        if (item.availability !== undefined) {
          return item;
        }

        try {
          const providers =
            item.mediaType === 'movie'
              ? await getMovieWatchProviders(item.id)
              : await getTVWatchProvidersForShow(item.id);

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
            lastChecked: new Date().toISOString(),
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

  // Refresh availability for a single item
  const refreshItemAvailability = useCallback(async (id: number, mediaType: MediaType) => {
    setRefreshingId(id);

    try {
      const providers =
        mediaType === 'movie'
          ? await getMovieWatchProviders(id)
          : await getTVWatchProvidersForShow(id);

      const allProviders = [
        ...(providers?.flatrate || []),
        ...(providers?.rent || []),
        ...(providers?.buy || []),
      ];

      const isAvailable = allProviders.some((p) =>
        HUNGARIAN_PROVIDER_IDS.includes(p.provider_id)
      );

      setItems((prev) =>
        prev.map((item) =>
          item.id === id && item.mediaType === mediaType
            ? {
                ...item,
                availability: providers,
                isAvailable,
                lastChecked: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (e) {
      console.error(`Failed to refresh availability for item ${id}:`, e);
    } finally {
      setRefreshingId(null);
    }
  }, []);

  return {
    items,
    loading,
    refreshingId,
    addItem,
    removeItem,
    toggleWatched,
    isInWatchlist,
    checkAvailability,
    refreshItemAvailability,
  };
};
