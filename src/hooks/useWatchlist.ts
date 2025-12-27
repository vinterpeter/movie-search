import { useState, useEffect, useCallback, useRef } from 'react';
import type { Movie, TVShow, WatchlistItem, MediaType, WatchProviderResult } from '../types/movie';
import { getMovieWatchProviders, getTVWatchProvidersForShow } from '../api/tmdb';
import { HUNGARIAN_PROVIDER_IDS } from './useFilters';
import { useAuth } from '../auth';
import {
  subscribeToWatchlist,
  addItemToFirestore,
  removeItemFromFirestore,
  updateItemInFirestore,
  mergeWatchlists,
  syncLocalItemsToFirestore,
} from '../firebase/watchlistService';

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
  syncing: boolean;
  refreshingId: number | null;
  addItem: (item: Movie | TVShow, mediaType: MediaType) => void;
  removeItem: (id: number, mediaType: MediaType) => void;
  toggleWatched: (id: number, mediaType: MediaType) => void;
  isInWatchlist: (id: number, mediaType: MediaType) => boolean;
  checkAvailability: () => Promise<void>;
  refreshItemAvailability: (id: number, mediaType: MediaType) => Promise<void>;
}

// Load from localStorage
const loadFromLocalStorage = (): WatchlistItemWithAvailability[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(WATCHLIST_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as WatchlistItemWithAvailability[];
    } catch (e) {
      console.error('Failed to parse watchlist:', e);
    }
  }
  return [];
};

// Save to localStorage
const saveToLocalStorage = (items: WatchlistItemWithAvailability[]) => {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
};

export const useWatchlist = (): UseWatchlistReturn => {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItemWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const hasMerged = useRef(false);
  const previousUserId = useRef<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const localItems = loadFromLocalStorage();
    setItems(localItems);
    setLoading(false);
  }, []);

  // Handle Firestore subscription and merge when user logs in
  useEffect(() => {
    if (!user) {
      // User logged out - keep local items, reset merge flag for next login
      previousUserId.current = null;
      hasMerged.current = false;
      return;
    }

    // User just logged in or changed
    if (previousUserId.current !== user.uid) {
      previousUserId.current = user.uid;
      hasMerged.current = false;
    }

    setSyncing(true);

    const unsubscribe = subscribeToWatchlist(
      user.uid,
      async (cloudItems) => {
        // On first sync after login, merge local items with cloud
        if (!hasMerged.current) {
          hasMerged.current = true;
          const localItems = loadFromLocalStorage();

          if (localItems.length > 0) {
            // Merge and sync
            const merged = mergeWatchlists(localItems, cloudItems);
            setItems(merged);
            saveToLocalStorage(merged);

            // Upload any items that were only local
            const localOnlyItems = localItems.filter(
              (local) =>
                !cloudItems.some(
                  (cloud) => cloud.id === local.id && cloud.mediaType === local.mediaType
                )
            );

            if (localOnlyItems.length > 0) {
              try {
                await syncLocalItemsToFirestore(user.uid, localOnlyItems);
              } catch (e) {
                console.error('Failed to sync local items to cloud:', e);
              }
            }
          } else {
            // No local items, just use cloud
            setItems(cloudItems);
            saveToLocalStorage(cloudItems);
          }
        } else {
          // Regular update from cloud
          setItems(cloudItems);
          saveToLocalStorage(cloudItems);
        }

        setSyncing(false);
      },
      (error) => {
        console.error('Watchlist subscription error:', error);
        setSyncing(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Save to localStorage when items change (only when not syncing from cloud)
  useEffect(() => {
    if (!loading && !syncing) {
      saveToLocalStorage(items);
    }
  }, [items, loading, syncing]);

  const addItem = useCallback(
    async (item: Movie | TVShow, mediaType: MediaType) => {
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

      // Optimistic update
      setItems((prev) => {
        if (prev.some((i) => i.id === item.id && i.mediaType === mediaType)) {
          return prev;
        }
        return [newItem, ...prev];
      });

      // Sync to Firestore if authenticated
      if (user) {
        try {
          await addItemToFirestore(user.uid, newItem);
        } catch (e) {
          console.error('Failed to add item to cloud:', e);
        }
      }
    },
    [user]
  );

  const removeItem = useCallback(
    async (id: number, mediaType: MediaType) => {
      // Optimistic update
      setItems((prev) => prev.filter((i) => !(i.id === id && i.mediaType === mediaType)));

      // Sync to Firestore if authenticated
      if (user) {
        try {
          await removeItemFromFirestore(user.uid, id, mediaType);
        } catch (e) {
          console.error('Failed to remove item from cloud:', e);
        }
      }
    },
    [user]
  );

  const toggleWatched = useCallback(
    async (id: number, mediaType: MediaType) => {
      let updatedItem: WatchlistItemWithAvailability | null = null;

      // Optimistic update
      setItems((prev) =>
        prev.map((i) => {
          if (i.id === id && i.mediaType === mediaType) {
            updatedItem = { ...i, watched: !i.watched };
            return updatedItem;
          }
          return i;
        })
      );

      // Sync to Firestore if authenticated
      if (user && updatedItem) {
        try {
          await updateItemInFirestore(user.uid, updatedItem);
        } catch (e) {
          console.error('Failed to update item in cloud:', e);
        }
      }
    },
    [user]
  );

  const isInWatchlist = useCallback(
    (id: number, mediaType: MediaType) => {
      return items.some((i) => i.id === id && i.mediaType === mediaType);
    },
    [items]
  );

  // Check availability for items that don't have it yet
  const checkAvailability = useCallback(async () => {
    const itemsToCheck = items.filter((item) => item.availability === undefined);

    if (itemsToCheck.length === 0) {
      return;
    }

    setLoading(true);

    const updatedItems = await Promise.all(
      items.map(async (item) => {
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

          const updated = {
            ...item,
            availability: providers,
            isAvailable,
            lastChecked: new Date().toISOString(),
          };

          // Sync updated item to Firestore
          if (user) {
            try {
              await updateItemInFirestore(user.uid, updated);
            } catch (e) {
              console.error('Failed to update availability in cloud:', e);
            }
          }

          return updated;
        } catch (e) {
          console.error(`Failed to check availability for ${item.title}:`, e);
          return item;
        }
      })
    );

    setItems(updatedItems);
    setLoading(false);
  }, [items, user]);

  // Refresh availability for a single item
  const refreshItemAvailability = useCallback(
    async (id: number, mediaType: MediaType) => {
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

        let updatedItem: WatchlistItemWithAvailability | null = null;

        setItems((prev) =>
          prev.map((item) => {
            if (item.id === id && item.mediaType === mediaType) {
              updatedItem = {
                ...item,
                availability: providers,
                isAvailable,
                lastChecked: new Date().toISOString(),
              };
              return updatedItem;
            }
            return item;
          })
        );

        // Sync to Firestore
        if (user && updatedItem) {
          try {
            await updateItemInFirestore(user.uid, updatedItem);
          } catch (e) {
            console.error('Failed to update availability in cloud:', e);
          }
        }
      } catch (e) {
        console.error(`Failed to refresh availability for item ${id}:`, e);
      } finally {
        setRefreshingId(null);
      }
    },
    [user]
  );

  return {
    items,
    loading,
    syncing,
    refreshingId,
    addItem,
    removeItem,
    toggleWatched,
    isInWatchlist,
    checkAvailability,
    refreshItemAvailability,
  };
};
