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
      const tripData = {
        ...trip,
        userId,
        updatedAt: serverTimestamp(),
      };
      
      // If it's a new trip, add createdAt
      const existing = await doc(db, path, trip.id);
      // Note: We use setDoc with merge for simplicity in this implementation
      await setDoc(tripRef, {
        ...tripData,
        createdAt: trip.id ? (trip as any).createdAt : serverTimestamp()
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
