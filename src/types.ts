/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Plant = 'Plant 1' | 'Plant 2';

export type Purpose = 'Mould Collection' | 'Expo' | 'Lorry Set' | 'Custom';

export interface Trip {
  id: string;
  date: string;
  plant: Plant;
  siteName: string;
  location: string;
  purpose: Purpose;
  customPurpose?: string;
  startingKM: number;
  endingKM: number;
  totalKM: number;
  createdAt: string;
}

export const VENDOR_DETAILS = {
  code: 'UTS00486',
  plants: {
    'Plant 1': {
      po: '638/9902708604',
    },
    'Plant 2': {
      po: '658/9902706787',
    }
  }
};
