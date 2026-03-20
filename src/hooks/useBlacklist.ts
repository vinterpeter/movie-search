import { useState, useEffect, useCallback, useRef } from 'react';
import type { Movie, TVShow, BlacklistItem, MediaType } from '../types/movie';
import { useAuth } from '../auth';
import {
  subscribeToBlacklist,
  addToBlacklistInFirestore,
  removeFromBlacklistInFirestore,
  syncLocalBlacklistToFirestore,
} from '../firebase/blacklistService';

const BLACKLIST_KEY = 'movie-search-blacklist';

// Type guard
const isMovie = (item: Movie | TVShow): item is Movie => {
  return 'title' in item;
};

interface UseBlacklistReturn {
  items: BlacklistItem[];
  loading: boolean;
  syncing: boolean;
  addToBlacklist: (item: Movie | TVShow, mediaType: MediaType) => void;
  removeFromBlacklist: (id: number, mediaType: MediaType) => void;
  isBlacklisted: (id: number, mediaType: MediaType) => boolean;
}

// Load from localStorage
const loadFromLocalStorage = (): BlacklistItem[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(BLACKLIST_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as BlacklistItem[];
    } catch (e) {
      console.error('Failed to parse blacklist:', e);
    }
  }
  return [];
};

// Save to localStorage
const saveToLocalStorage = (items: BlacklistItem[]) => {
  localStorage.setItem(BLACKLIST_KEY, JSON.stringify(items));
};

// Merge local items with cloud items
const mergeBlacklist = (
  localItems: BlacklistItem[],
  cloudItems: BlacklistItem[]
): BlacklistItem[] => {
  const merged = new Map<string, BlacklistItem>();

  // Add cloud items first
  cloudItems.forEach((item) => {
    merged.set(`${item.mediaType}_${item.id}`, item);
  });

  // Add local items if not already in cloud
  localItems.forEach((item) => {
    const key = `${item.mediaType}_${item.id}`;
    if (!merged.has(key)) {
      merged.set(key, item);
    }
  });

  // Convert to array and sort by addedAt descending
  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );
};

export const useBlacklist = (): UseBlacklistReturn => {
  const { user } = useAuth();
  const [items, setItems] = useState<BlacklistItem[]>([]);
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

    const unsubscribe = subscribeToBlacklist(
      user.uid,
      async (cloudItems) => {
        // On first sync after login, merge local items with cloud
        if (!hasMerged.current) {
          hasMerged.current = true;
          const localItems = loadFromLocalStorage();

          if (localItems.length > 0) {
            // Merge and sync
            const merged = mergeBlacklist(localItems, cloudItems);
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
                await syncLocalBlacklistToFirestore(user.uid, localOnlyItems);
              } catch (e) {
                console.error('Failed to sync local blacklist to cloud:', e);
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
        console.error('Blacklist subscription error:', error);
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

  const addToBlacklist = useCallback(
    async (item: Movie | TVShow, mediaType: MediaType) => {
      const title = isMovie(item) ? item.title : item.name;

      const blacklistItem: BlacklistItem = {
        id: item.id,
        mediaType,
        title,
        posterPath: item.poster_path,
        addedAt: new Date().toISOString(),
      };

      // Optimistic update
      setItems((prev) => {
        const exists = prev.some((i) => i.id === item.id && i.mediaType === mediaType);
        if (exists) return prev;
        return [blacklistItem, ...prev];
      });

      // Sync to Firestore if authenticated
      if (user) {
        try {
          await addToBlacklistInFirestore(user.uid, blacklistItem);
        } catch (e) {
          console.error('Failed to add to blacklist in cloud:', e);
        }
      }
    },
    [user]
  );

  const removeFromBlacklist = useCallback(
    async (id: number, mediaType: MediaType) => {
      // Optimistic update
      setItems((prev) => prev.filter((i) => !(i.id === id && i.mediaType === mediaType)));

      // Sync to Firestore if authenticated
      if (user) {
        try {
          await removeFromBlacklistInFirestore(user.uid, id, mediaType);
        } catch (e) {
          console.error('Failed to remove from blacklist in cloud:', e);
        }
      }
    },
    [user]
  );

  const isBlacklisted = useCallback(
    (id: number, mediaType: MediaType) => {
      return items.some((i) => i.id === id && i.mediaType === mediaType);
    },
    [items]
  );

  return {
    items,
    loading,
    syncing,
    addToBlacklist,
    removeFromBlacklist,
    isBlacklisted,
  };
};
