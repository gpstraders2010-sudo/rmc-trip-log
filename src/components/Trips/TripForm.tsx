import React, { useState, useEffect } from 'react';
import { Trip, Plant, Purpose } from '../../types';
import { calculateTotalKM, cn } from '../../lib/utils';
import { Calendar, MapPin, Navigation, Save, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface TripFormProps {
  onSave: (trip: Trip) => void;
  editTrip?: Trip;
}

export default function TripForm({ onSave, editTrip }: TripFormProps) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [plant, setPlant] = useState<Plant>('Plant 1');
  const [siteName, setSiteName] = useState('');
  const [location, setLocation] = useState('');
  const [purpose, setPurpose] = useState<Purpose>('Mould Collection');
  const [customPurpose, setCustomPurpose] = useState('');
  const [startingKM, setStartingKM] = useState<string>('');
  const [endingKM, setEndingKM] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editTrip) {
      setDate(editTrip.date);
      setPlant(editTrip.plant);
      setSiteName(editTrip.siteName);
      setLocation(editTrip.location);
      setPurpose(editTrip.purpose);
      if (editTrip.purpose === 'Custom') {
        setCustomPurpose(editTrip.customPurpose || '');
      }
      setStartingKM(editTrip.startingKM.toString());
      setEndingKM(editTrip.endingKM.toString());
    }
  }, [editTrip]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const start = parseFloat(startingKM);
    const end = parseFloat(endingKM);

    if (isNaN(start) || isNaN(end)) {
      setError('Please enter valid KM values.');
      return;
    }

    if (end < start) {
      setError('Ending KM must be greater than or equal to Starting KM.');
      return;
    }

    if (!siteName.trim()) {
      setError('Site Name is required.');
      return;
    }

    const newTrip: Trip = {
      id: editTrip?.id || crypto.randomUUID(),
      date,
      plant,
      siteName,
      location,
      purpose,
      customPurpose: purpose === 'Custom' ? customPurpose : undefined,
      startingKM: start,
      endingKM: end,
      totalKM: calculateTotalKM(start, end),
      createdAt: editTrip?.createdAt || new Date().toISOString(),
    };

    onSave(newTrip);
    
    if (!editTrip) {
      // Clear form except date and plant for next entry
      setSiteName('');
      setLocation('');
      setPurpose('Mould Collection');
      setCustomPurpose('');
      setStartingKM(endingKM); // Assume next trip starts where previous ended
      setEndingKM('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
        {editTrip ? 'Update Log Entry' : 'New Log Entry'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Plant
            </label>
            <select
              value={plant}
              onChange={(e) => setPlant(e.target.value as Plant)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            >
              <option value="Plant 1">Plant 1</option>
              <option value="Plant 2">Plant 2</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
            Site Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Enter site name..."
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
              Purpose
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as Purpose)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            >
              <option value="Mould Collection">Mould Collection</option>
              <option value="Expo">Expo</option>
              <option value="Lorry Set">Lorry Set</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
              Location
            </label>
            <input
              type="text"
              placeholder="Area/City"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        {purpose === 'Custom' && (
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Custom Purpose
            </label>
            <input
              type="text"
              required
              placeholder="Specify purpose..."
              value={customPurpose}
              onChange={(e) => setCustomPurpose(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Start KM</label>
            <input
              type="number"
              step="any"
              required
              value={startingKM}
              onChange={(e) => setStartingKM(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1">End KM</label>
            <input
              type="number"
              step="any"
              required
              value={endingKM}
              onChange={(e) => setEndingKM(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="bg-indigo-600 rounded-lg flex flex-col items-center justify-center text-white shadow-lg shadow-indigo-100">
            <span className="text-[10px] opacity-80 font-bold uppercase tracking-tight">Total</span>
            <span className="text-lg font-black leading-none">
              {calculateTotalKM(parseFloat(startingKM) || 0, parseFloat(endingKM) || 0)}
            </span>
          </div>
        </div>

        {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

        <button
          type="submit"
          className="w-full py-3 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-black transition-colors shadow-lg shadow-slate-200 active:scale-[0.98] cursor-pointer mt-2"
        >
          {editTrip ? 'Update Trip Entry' : 'Save Trip Entry'}
        </button>
      </form>
    </div>
  );
}
