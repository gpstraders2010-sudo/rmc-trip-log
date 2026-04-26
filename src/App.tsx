import React, { useState, useEffect } from 'react';
import { Trip } from './types';
import { cn } from './lib/utils';
import TripForm from './components/Trips/TripForm';
import TripHistory from './components/History/TripHistory';
import BillingReport from './components/Billing/BillingReport';
import Login from './components/Auth/Login';
import { auth, logout } from './lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { tripService } from './services/tripService';
import { Truck, History, FileStack, LayoutDashboard, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

type Tab = 'entry' | 'history' | 'billing';

export default function App() {
  const [user, loading, error] = useAuthState(auth);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('entry');
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();

  // Use Firestore subscription
  useEffect(() => {
    if (!user) {
      setTrips([]);
      return;
    }

    const unsubscribe = tripService.subscribeToTrips(user.uid, (loadedTrips) => {
      setTrips(loadedTrips);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSaveTrip = async (trip: Trip) => {
    if (!user) return;
    
    await tripService.saveTrip(user.uid, {
      ...trip,
      userId: user.uid
    });
    setEditingTrip(undefined);
  };

  const handleDeleteTrip = async (id: string) => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this trip log?')) {
      await tripService.deleteTrip(user.uid, id);
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setActiveTab('entry');
  };

  const handleExportData = () => {
    if (trips.length === 0) return;
    const exportData = trips.map(({ id, userId, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Trips");
    XLSX.writeFile(wb, `RMC_Full_Log_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const tabs = [
    { id: 'entry', label: 'Daily Logs', icon: Truck },
    { id: 'history', label: 'History', icon: History },
    { id: 'billing', label: 'Monthly Billing', icon: FileStack },
  ] as const;

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 bg-white flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100">
              R
            </div>
            <h1 className="text-lg font-bold tracking-tight uppercase">RMC Trip Log</h1>
          </div>
          
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  if (id !== 'entry') setEditingTrip(undefined);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all cursor-pointer border-r-3",
                  activeTab === id 
                    ? "bg-indigo-50/50 text-indigo-600 border-indigo-600" 
                    : "text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-5 h-5", activeTab === id ? "text-indigo-600" : "text-slate-400")} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5 text-indigo-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{user.displayName || 'Anonymous'}</p>
                <p className="text-[10px] text-slate-500 truncate font-medium">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-black text-rose-600 border border-rose-100 bg-rose-50 rounded-lg hover:bg-rose-100 transition-all cursor-pointer uppercase tracking-widest"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>

          <div className="bg-indigo-600 rounded-xl p-4 shadow-lg shadow-indigo-100">
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider mb-1 text-center">Vendor Code</p>
            <p className="text-sm font-black text-white text-center">UTS00486</p>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white px-6 md:px-8 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-slate-800">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <span className="hidden sm:inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded uppercase tracking-wider">
              System Live
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'history' && (
              <button 
                onClick={handleExportData}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-all cursor-pointer"
              >
                Export CSV
              </button>
            )}
            <button 
              onClick={() => setActiveTab('billing')}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all cursor-pointer"
            >
              Generate Bill
            </button>
          </div>
        </header>

        {/* Scrollbox */}
        <main className="flex-1 overflow-auto bg-slate-50 p-6 md:p-8 pb-24 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="max-w-6xl mx-auto h-full"
            >
              {activeTab === 'entry' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-5 lg:col-span-4">
                    <TripForm 
                      onSave={handleSaveTrip} 
                      editTrip={editingTrip} 
                    />
                  </div>
                  <div className="md:col-span-7 lg:col-span-8 hidden md:block">
                     <div className="bg-white/40 rounded-2xl border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                          <Truck className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-slate-600 font-bold mb-2">Ready for Logging</h3>
                        <p className="text-slate-400 text-sm max-w-xs">Enter your trip details on the left to add them to your daily log history. Data is synced in real-time.</p>
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <TripHistory 
                  trips={trips} 
                  onEdit={handleEditTrip} 
                  onDelete={handleDeleteTrip} 
                />
              )}

              {activeTab === 'billing' && (
                <BillingReport trips={trips} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Bar (Mobile) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-2 flex items-center justify-around z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                if (id !== 'entry') setEditingTrip(undefined);
              }}
              className={cn(
                "flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer",
                activeTab === id ? "text-indigo-600" : "text-slate-400"
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[9px] font-bold uppercase tracking-tighter">{label}</span>
            </button>
          ))}
          <button
              onClick={logout}
              className="flex flex-col items-center p-2 rounded-xl text-rose-500 transition-all cursor-pointer"
            >
              <LogOut className="w-5 h-5 mb-1" />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Exit</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

