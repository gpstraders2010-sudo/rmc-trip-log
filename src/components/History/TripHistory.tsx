import React, { useState, useMemo } from 'react';
import { Trip, Plant, VENDOR_DETAILS } from '../../types';
import { cn } from '../../lib/utils';
import { Edit2, Trash2, Filter, Calendar as CalendarIcon, MapPin, ArrowRight, Table as TableIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TripHistoryProps {
  trips: Trip[];
  onEdit: (trip: Trip) => void;
  onDelete: (id: string) => void;
}

export default function TripHistory({ trips, onEdit, onDelete }: TripHistoryProps) {
  const [plantFilter, setPlantFilter] = useState<Plant | 'All'>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All'); // YYYY-MM format

  const monthsList = useMemo(() => {
    const months = new Set<string>();
    trips.forEach(trip => {
      const date = parseISO(trip.date);
      months.add(format(date, 'yyyy-MM'));
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [trips]);

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const matchesPlant = plantFilter === 'All' || trip.plant === plantFilter;
      const matchesMonth = monthFilter === 'All' || trip.date.startsWith(monthFilter);
      return matchesPlant && matchesMonth;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [trips, plantFilter, monthFilter]);

  const totalKM = filteredTrips.reduce((sum, trip) => sum + trip.totalKM, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Recent Trip History
          </h3>
          
          <div className="flex gap-2">
            <select
              value={plantFilter}
              onChange={(e) => setPlantFilter(e.target.value as any)}
              className="text-xs border border-slate-200 rounded px-2 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
            >
              <option value="All">All Plants</option>
              <option value="Plant 1">Plant 1</option>
              <option value="Plant 2">Plant 2</option>
            </select>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
            >
              <option value="All">All Months</option>
              {monthsList.map(month => (
                <option key={month} value={month}>
                  {format(parseISO(`${month}-01`), 'MMM yyyy')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr className="text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Site & Location</th>
                <th className="px-6 py-3 text-center">Purpose</th>
                <th className="px-6 py-3 text-center">KM Start/End</th>
                <th className="px-6 py-3 text-center">Total</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600 divide-y divide-slate-50">
              {filteredTrips.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-medium whitespace-nowrap">
                    {format(parseISO(trip.date), 'dd MMM')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{trip.siteName}</div>
                    <div className="text-xs opacity-70 truncate max-w-[200px]">{trip.location || '--'}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold whitespace-nowrap uppercase tracking-tighter">
                      {trip.purpose === 'Custom' ? trip.customPurpose : trip.purpose}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <div className="font-mono text-xs text-slate-500">
                        {trip.startingKM.toFixed(0)} <span className="opacity-30 mx-1">→</span> {trip.endingKM.toFixed(0)}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-slate-800 whitespace-nowrap">{trip.totalKM.toFixed(1)} KM</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => onEdit(trip)}
                        className="text-indigo-600 hover:underline font-semibold text-xs cursor-pointer"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => onDelete(trip.id)}
                        className="text-red-400 hover:underline font-semibold text-xs cursor-pointer"
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTrips.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">
                    No trip entries found in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex gap-8">
            <div className="text-center sm:text-left">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Total KM</p>
              <p className="text-2xl font-black text-indigo-600 leading-tight">{totalKM.toFixed(1)} KM</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Trip Count</p>
              <p className="text-2xl font-black text-slate-800 leading-tight">{filteredTrips.length}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {plantFilter !== 'All' && (
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Plant PO Match</p>
                  <p className="text-xs font-mono bg-white px-2 py-1 border border-slate-200 rounded mt-1 shadow-sm font-bold">
                    {VENDOR_DETAILS.plants[plantFilter as Plant].po}
                  </p>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
