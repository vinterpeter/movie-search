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
import type { BlacklistItem } from '../types/movie';

// Helper to create document ID from item
const getDocId = (id: number, mediaType: string): string => `${mediaType}_${id}`;

// Get reference to user's blacklist collection
const getBlacklistRef = (userId: string) =>
  collection(db, 'users', userId, 'blacklist');

// Add item to blacklist in Firestore
export const addToBlacklistInFirestore = async (
  userId: string,
  item: BlacklistItem
): Promise<void> => {
  const docRef = doc(getBlacklistRef(userId), getDocId(item.id, item.mediaType));
  await setDoc(docRef, item);
};

// Remove item from blacklist in Firestore
export const removeFromBlacklistInFirestore = async (
  userId: string,
  id: number,
  mediaType: string
): Promise<void> => {
  const docRef = doc(getBlacklistRef(userId), getDocId(id, mediaType));
  await deleteDoc(docRef);
};

// Subscribe to real-time updates from Firestore
export const subscribeToBlacklist = (
  userId: string,
  onUpdate: (items: BlacklistItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = query(getBlacklistRef(userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: BlacklistItem[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as BlacklistItem);
      });
      // Sort by addedAt descending (newest first)
      items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
      onUpdate(items);
    },
    (error) => {
      console.error('Firestore blacklist subscription error:', error);
      onError?.(error);
    }
  );
};

// Sync local items to Firestore (for first login merge)
export const syncLocalBlacklistToFirestore = async (
  userId: string,
  items: BlacklistItem[]
): Promise<void> => {
  const promises = items.map((item) => addToBlacklistInFirestore(userId, item));
  await Promise.all(promises);
};
