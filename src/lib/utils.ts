import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculation Helpers
 */
export const calculateTotalKM = (start: number, end: number) => {
  const diff = end - start;
  return diff > 0 ? parseFloat(diff.toFixed(1)) : 0;
};

