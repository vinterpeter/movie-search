import { useState, useEffect, useCallback, useRef } from 'react';
import type { Movie, TVShow, FavoriteItem, MediaType } from '../types/movie';
import { useAuth } from '../auth';
import {
  subscribeToFavorites,
  setFavoriteInFirestore,
  removeFavoriteFromFirestore,
  mergeFavorites,
  syncLocalFavoritesToFirestore,
} from '../firebase/favoritesService';

const FAVORITES_KEY = 'movie-search-favorites';

// Type guard
const isMovie = (item: Movie | TVShow): item is Movie => {
  return 'title' in item;
};

interface UseFavoritesReturn {
  items: FavoriteItem[];
  loading: boolean;
  syncing: boolean;
  toggleLike: (item: Movie | TVShow, mediaType: MediaType) => void;
  toggleLove: (item: Movie | TVShow, mediaType: MediaType) => void;
  isLiked: (id: number, mediaType: MediaType) => boolean;
  isLoved: (id: number, mediaType: MediaType) => boolean;
  removeFavorite: (id: number, mediaType: MediaType) => void;
}

// Load from localStorage
const loadFromLocalStorage = (): FavoriteItem[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FAVORITES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as FavoriteItem[];
    } catch (e) {
      console.error('Failed to parse favorites:', e);
    }
  }
  return [];
};

// Save to localStorage
const saveToLocalStorage = (items: FavoriteItem[]) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
};

export const useFavorites = (): UseFavoritesReturn => {
  const { user } = useAuth();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
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

    const unsubscribe = subscribeToFavorites(
      user.uid,
      async (cloudItems) => {
        // On first sync after login, merge local items with cloud
        if (!hasMerged.current) {
          hasMerged.current = true;
          const localItems = loadFromLocalStorage();

          if (localItems.length > 0) {
            // Merge and sync
            const merged = mergeFavorites(localItems, cloudItems);
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
                await syncLocalFavoritesToFirestore(user.uid, localOnlyItems);
              } catch (e) {
                console.error('Failed to sync local favorites to cloud:', e);
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
        console.error('Favorites subscription error:', error);
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

  // Helper to get or create a favorite item
  const getOrCreateFavorite = useCallback(
    (item: Movie | TVShow, mediaType: MediaType): FavoriteItem => {
      const existing = items.find((i) => i.id === item.id && i.mediaType === mediaType);
      if (existing) {
        return existing;
      }

      const title = isMovie(item) ? item.title : item.name;
      const releaseDate = isMovie(item) ? item.release_date : item.first_air_date;

      return {
        id: item.id,
        mediaType,
        title,
        posterPath: item.poster_path,
        releaseDate,
        voteAverage: item.vote_average,
        addedAt: new Date().toISOString(),
        liked: false,
        loved: false,
      };
    },
    [items]
  );

  const toggleLike = useCallback(
    async (item: Movie | TVShow, mediaType: MediaType) => {
      const favorite = getOrCreateFavorite(item, mediaType);
      const newLiked = !favorite.liked;

      // If both liked and loved become false, remove the item
      if (!newLiked && !favorite.loved) {
        // Remove from list
        setItems((prev) => prev.filter((i) => !(i.id === item.id && i.mediaType === mediaType)));

        if (user) {
          try {
            await removeFavoriteFromFirestore(user.uid, item.id, mediaType);
          } catch (e) {
            console.error('Failed to remove favorite from cloud:', e);
          }
        }
        return;
      }

      const updatedItem: FavoriteItem = {
        ...favorite,
        liked: newLiked,
      };

      // Optimistic update
      setItems((prev) => {
        const exists = prev.some((i) => i.id === item.id && i.mediaType === mediaType);
        if (exists) {
          return prev.map((i) =>
            i.id === item.id && i.mediaType === mediaType ? updatedItem : i
          );
        }
        return [updatedItem, ...prev];
      });

      // Sync to Firestore if authenticated
      if (user) {
        try {
          await setFavoriteInFirestore(user.uid, updatedItem);
        } catch (e) {
          console.error('Failed to update favorite in cloud:', e);
        }
      }
    },
    [user, getOrCreateFavorite]
  );

  const toggleLove = useCallback(
    async (item: Movie | TVShow, mediaType: MediaType) => {
      const favorite = getOrCreateFavorite(item, mediaType);
      const newLoved = !favorite.loved;

      // If both liked and loved become false, remove the item
      if (!newLoved && !favorite.liked) {
        // Remove from list
        setItems((prev) => prev.filter((i) => !(i.id === item.id && i.mediaType === mediaType)));

        if (user) {
          try {
            await removeFavoriteFromFirestore(user.uid, item.id, mediaType);
          } catch (e) {
            console.error('Failed to remove favorite from cloud:', e);
          }
        }
        return;
      }

      const updatedItem: FavoriteItem = {
        ...favorite,
        loved: newLoved,
      };

      // Optimistic update
      setItems((prev) => {
        const exists = prev.some((i) => i.id === item.id && i.mediaType === mediaType);
        if (exists) {
          return prev.map((i) =>
            i.id === item.id && i.mediaType === mediaType ? updatedItem : i
          );
        }
        return [updatedItem, ...prev];
      });

      // Sync to Firestore if authenticated
      if (user) {
        try {
          await setFavoriteInFirestore(user.uid, updatedItem);
        } catch (e) {
          console.error('Failed to update favorite in cloud:', e);
        }
      }
    },
    [user, getOrCreateFavorite]
  );

  const removeFavorite = useCallback(
    async (id: number, mediaType: MediaType) => {
      // Optimistic update
      setItems((prev) => prev.filter((i) => !(i.id === id && i.mediaType === mediaType)));

      // Sync to Firestore if authenticated
      if (user) {
        try {
          await removeFavoriteFromFirestore(user.uid, id, mediaType);
        } catch (e) {
          console.error('Failed to remove favorite from cloud:', e);
        }
      }
    },
    [user]
  );

  const isLiked = useCallback(
    (id: number, mediaType: MediaType) => {
      const item = items.find((i) => i.id === id && i.mediaType === mediaType);
      return item?.liked ?? false;
    },
    [items]
  );

  const isLoved = useCallback(
    (id: number, mediaType: MediaType) => {
      const item = items.find((i) => i.id === id && i.mediaType === mediaType);
      return item?.loved ?? false;
    },
    [items]
  );

  return {
    items,
    loading,
    syncing,
    toggleLike,
    toggleLove,
    isLiked,
    isLoved,
    removeFavorite,
  };
};
