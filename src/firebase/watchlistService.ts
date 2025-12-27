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
import type { WatchlistItemWithAvailability } from '../hooks/useWatchlist';

// Helper to create document ID from item
const getDocId = (id: number, mediaType: string): string => `${mediaType}_${id}`;

// Get reference to user's watchlist collection
const getWatchlistRef = (userId: string) =>
  collection(db, 'users', userId, 'watchlist');

// Add or update item in Firestore
export const addItemToFirestore = async (
  userId: string,
  item: WatchlistItemWithAvailability
): Promise<void> => {
  const docRef = doc(getWatchlistRef(userId), getDocId(item.id, item.mediaType));
  await setDoc(docRef, item);
};

// Remove item from Firestore
export const removeItemFromFirestore = async (
  userId: string,
  id: number,
  mediaType: string
): Promise<void> => {
  const docRef = doc(getWatchlistRef(userId), getDocId(id, mediaType));
  await deleteDoc(docRef);
};

// Update item in Firestore (same as add, uses setDoc with merge behavior)
export const updateItemInFirestore = async (
  userId: string,
  item: WatchlistItemWithAvailability
): Promise<void> => {
  const docRef = doc(getWatchlistRef(userId), getDocId(item.id, item.mediaType));
  await setDoc(docRef, item);
};

// Subscribe to real-time updates from Firestore
export const subscribeToWatchlist = (
  userId: string,
  onUpdate: (items: WatchlistItemWithAvailability[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(getWatchlistRef(userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: WatchlistItemWithAvailability[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as WatchlistItemWithAvailability);
      });
      // Sort by addedAt descending (newest first)
      items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
      onUpdate(items);
    },
    (error) => {
      console.error('Firestore subscription error:', error);
      onError?.(error);
    }
  );
};

// Merge local items with cloud items (for first login)
export const mergeWatchlists = (
  localItems: WatchlistItemWithAvailability[],
  cloudItems: WatchlistItemWithAvailability[]
): WatchlistItemWithAvailability[] => {
  const merged = new Map<string, WatchlistItemWithAvailability>();

  // Add cloud items first
  cloudItems.forEach((item) => {
    merged.set(getDocId(item.id, item.mediaType), item);
  });

  // Add local items if not already in cloud (or if local is newer)
  localItems.forEach((item) => {
    const key = getDocId(item.id, item.mediaType);
    const existing = merged.get(key);

    if (!existing) {
      // Item only exists locally, add it
      merged.set(key, item);
    } else if (new Date(item.addedAt) > new Date(existing.addedAt)) {
      // Local item is newer, prefer it (but keep cloud data for fields like watched)
      merged.set(key, {
        ...item,
        watched: existing.watched || item.watched, // Keep watched if either is true
      });
    }
  });

  // Convert to array and sort by addedAt descending
  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );
};

// Sync local items to Firestore (for first login merge)
export const syncLocalItemsToFirestore = async (
  userId: string,
  items: WatchlistItemWithAvailability[]
): Promise<void> => {
  const promises = items.map((item) => addItemToFirestore(userId, item));
  await Promise.all(promises);
};
