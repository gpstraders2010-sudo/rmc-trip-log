import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  onSnapshot, 
  orderBy,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { Trip } from '../types';

const COLLECTION_NAME = 'trips';

export const tripService = {
  subscribeToTrips: (userId: string, callback: (trips: Trip[]) => void): Unsubscribe => {
    const path = `users/${userId}/${COLLECTION_NAME}`;
    const q = query(
      collection(db, path),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const trips = snapshot.docs.map(doc => ({
          ...doc.data()
        } as Trip));
        callback(trips);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  saveTrip: async (userId: string, trip: Trip) => {
    const path = `users/${userId}/${COLLECTION_NAME}`;
    try {
      const tripRef = doc(db, path, trip.id);
      
      // We use a simple strategy: if the trip doesn't have a userId yet in our local state, 
      // or if we're explicitly creating, we can try to skip overwriting createdAt if it exists.
      // But for this app, we'll just check if it's a new ID.
      
      const tripData = {
        ...trip,
        userId,
        updatedAt: serverTimestamp(),
      };

      // Ensure we don't have undefined fields
      Object.keys(tripData).forEach(key => {
        if ((tripData as any)[key] === undefined) {
          delete (tripData as any)[key];
        }
      });

      // Use setDoc with merge: true to avoid deleting fields we might have added manually
      await setDoc(tripRef, {
        ...tripData,
        // Only set createdAt if we don't think it exists (simple heuristic for this app)
        // A better way would be a transaction or checking document existence
        createdAt: (trip as any).createdAt || serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  deleteTrip: async (userId: string, tripId: string) => {
    const path = `users/${userId}/${COLLECTION_NAME}`;
    try {
      await deleteDoc(doc(db, path, tripId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
