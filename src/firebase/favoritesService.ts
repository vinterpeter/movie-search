import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import type { FavoriteItem } from '../types/movie';

// Helper to create document ID from item
const getDocId = (id: number, mediaType: string): string => `${mediaType}_${id}`;

// Get reference to user's favorites collection
const getFavoritesRef = (userId: string) =>
  collection(db, 'users', userId, 'favorites');

// Add or update favorite in Firestore
export const setFavoriteInFirestore = async (
  userId: string,
  item: FavoriteItem
): Promise<void> => {
  const docRef = doc(getFavoritesRef(userId), getDocId(item.id, item.mediaType));
  await setDoc(docRef, item);
};

// Remove favorite from Firestore
export const removeFavoriteFromFirestore = async (
  userId: string,
  id: number,
  mediaType: string
): Promise<void> => {
  const docRef = doc(getFavoritesRef(userId), getDocId(id, mediaType));
  await deleteDoc(docRef);
};

// Subscribe to real-time updates from Firestore
export const subscribeToFavorites = (
  userId: string,
  onUpdate: (items: FavoriteItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(getFavoritesRef(userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FavoriteItem[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as FavoriteItem);
      });
      // Sort by addedAt descending (newest first)
      items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
      onUpdate(items);
    },
    (error) => {
      console.error('Firestore favorites subscription error:', error);
      onError?.(error);
    }
  );
};

// Merge local items with cloud items (for first login)
export const mergeFavorites = (
  localItems: FavoriteItem[],
  cloudItems: FavoriteItem[]
): FavoriteItem[] => {
  const merged = new Map<string, FavoriteItem>();

  // Add cloud items first
  cloudItems.forEach((item) => {
    merged.set(getDocId(item.id, item.mediaType), item);
  });

  // Add local items if not already in cloud (or merge if exists)
  localItems.forEach((item) => {
    const key = getDocId(item.id, item.mediaType);
    const existing = merged.get(key);

    if (!existing) {
      // Item only exists locally, add it
      merged.set(key, item);
    } else {
      // Merge: keep liked/loved if either is true
      merged.set(key, {
        ...existing,
        liked: existing.liked || item.liked,
        loved: existing.loved || item.loved,
      });
    }
  });

  // Convert to array and sort by addedAt descending
  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );
};

// Sync local items to Firestore (for first login merge)
export const syncLocalFavoritesToFirestore = async (
  userId: string,
  items: FavoriteItem[]
): Promise<void> => {
  const promises = items.map((item) => setFavoriteInFirestore(userId, item));
  await Promise.all(promises);
};
