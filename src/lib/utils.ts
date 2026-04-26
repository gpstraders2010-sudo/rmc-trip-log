import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Trip } from "../types";

/**
 * Utility to merge tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * LocalStorage Helpers
 */
const STORAGE_KEY = 'rmc_trip_logs';

export const storage = {
  getTrips: (): Trip[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveTrips: (trips: Trip[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  },
  addTrip: (trip: Trip) => {
    const trips = storage.getTrips();
    storage.saveTrips([trip, ...trips]);
  },
  updateTrip: (updatedTrip: Trip) => {
    const trips = storage.getTrips();
    storage.saveTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
  },
  deleteTrip: (id: string) => {
    const trips = storage.getTrips();
    storage.saveTrips(trips.filter(t => t.id !== id));
  }
};

/**
 * Calculation Helpers
 */
export const calculateTotalKM = (start: number, end: number) => {
  return Math.max(0, end - start);
};
