import React from 'react';
import { GasStation, SearchLog } from '../types';
import { formatPrice, cn } from '../utils';
import { 
  Fuel, 
  MapPin, 
  Clock, 
  ChevronRight,
  AlertCircle,
  Settings,
  Activity,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { GasStationMap } from './GasStationMap';

interface DashboardProps {
  stations: GasStation[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  userLocation: [number, number];
  searchLogs: SearchLog[];
  searchParams: { radius: number; steps: number };
  setSearchParams: React.Dispatch<React.SetStateAction<{ radius: number; steps: number }>>;
  hoveredStationId: number | null;
  setHoveredStationId: (id: number | null) => void;
  showSearchPoints: boolean;
  setShowSearchPoints: (show: boolean) => void;
  queriedPoints: { lat: number; lon: number; stationIds: number[] }[];
  hoveredQueryPointIdx: number | null;
  setHoveredQueryPointIdx: (idx: number | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  stations, 
  loading, 
  error,
  onRefresh,
  userLocation,
  searchLogs,
  searchParams,
  setSearchParams,
  hoveredStationId,
  setHoveredStationId,
  showSearchPoints,
  setShowSearchPoints,
  queriedPoints,
  hoveredQueryPointIdx,
  setHoveredQueryPointIdx
}) => {
  const sortedStations = [...stations].sort((a, b) => 
    (a.prices[0]?.amount || Infinity) - (b.prices[0]?.amount || Infinity)
  );

  const prices = stations.map(s => s.prices[0]?.amount).filter(p => typeof p === 'number' && p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  const getPriceColor = (price: number) => {
    if (prices.length === 0) return 'text-zinc-400';
    if (price === minPrice) return 'text-emerald-500';
    if (price === maxPrice) return 'text-rose-500';
    const range = maxPrice - minPrice;
    if (range <= 0) return 'text-zinc-400';
    const percent = (price - minPrice) / range;
    if (percent < 0.3) return 'text-emerald-500';
    if (percent > 0.7) return 'text-rose-500';
    return 'text-amber-500';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Fuel className="w-6 h-6 text-[#5A5A40]" />
            <span className="text-xs uppercase tracking-widest font-semibold opacity-50">Diesel Tracker Linz</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tight leading-none">
            Kraftstoff <br />
            <span className="not-italic">Preise</span>
          </h1>
        </div>
        
        <div className="flex flex-col items-end gap-6">
          <div className="text-right">
            <span className="text-xs uppercase tracking-widest font-semibold opacity-50 block mb-1">Günstigster Preis</span>
            <div className="flex items-center gap-3">
              <span className="text-4xl md:text-6xl font-mono font-medium tracking-tighter text-emerald-500">
                {formatPrice(minPrice)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/50 p-2 rounded-2xl border border-black/5">
            <div className="flex items-center gap-2 px-3">
              <span className="text-[10px] uppercase font-bold opacity-40">Radius</span>
              <input 
                type="range" min="0.01" max="0.1" step="0.01" 
                value={searchParams.radius}
                onChange={(e) => setSearchParams(p => ({ ...p, radius: parseFloat(e.target.value) }))}
                className="w-24 accent-[#5A5A40]"
              />
              <span className="text-[10px] font-mono font-bold w-8">{searchParams.radius.toFixed(2)}</span>
            </div>
            <div className="w-px h-4 bg-black/10" />
            <div className="flex items-center gap-2 px-3">
              <span className="text-[10px] uppercase font-bold opacity-40">Dichte</span>
              <input 
                type="range" min="1" max="10" step="1" 
                value={searchParams.steps}
                onChange={(e) => setSearchParams(p => ({ ...p, steps: parseInt(e.target.value) }))}
                className="w-24 accent-[#5A5A40]"
              />
              <span className="text-[10px] font-mono font-bold w-12">{searchParams.steps * 12} Pkt</span>
            </div>
            <div className="w-px h-4 bg-black/10" />
            <div className="flex items-center gap-2 px-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={showSearchPoints}
                    onChange={(e) => setShowSearchPoints(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-black/10 rounded-full peer-checked:bg-rose-500 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </div>
                <span className="text-[10px] uppercase font-bold opacity-40 group-hover:opacity-60 transition-opacity">Abfrage-Punkte</span>
              </label>
            </div>
            <button 
              onClick={onRefresh}
              disabled={loading}
              className="bg-[#151619] text-white p-2 rounded-xl hover:opacity-80 transition-opacity disabled:opacity-30"
            >
              <Search size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Map Section */}
        <section className="lg:col-span-12">
          <GasStationMap 
            stations={stations} 
            center={userLocation} 
            hoveredStationId={hoveredStationId}
            showSearchPoints={showSearchPoints}
            queriedPoints={queriedPoints}
            hoveredQueryPointIdx={hoveredQueryPointIdx}
            setHoveredQueryPointIdx={setHoveredQueryPointIdx}
          />
        </section>

        {/* Scrollable List Section */}
        <section className="lg:col-span-4 flex flex-col gap-6 h-[600px]">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-black/5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif italic">Alle Stationen</h2>
              <span className="text-[10px] font-mono opacity-40">{stations.length} gefunden</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {sortedStations.map((station, idx) => {
                const price = station.prices[0]?.amount || 0;
                const isHovered = hoveredStationId === station.id;
                
                return (
                  <div 
                    key={station.id} 
                    onMouseEnter={() => setHoveredStationId(station.id)}
                    onMouseLeave={() => setHoveredStationId(null)}
                    className={cn(
                      "group p-4 rounded-2xl border transition-all duration-200 cursor-pointer",
                      isHovered ? "bg-[#151619] border-[#151619] text-white shadow-lg scale-[1.02]" : "bg-white border-black/5 hover:border-black/20"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <span className={cn(
                          "text-[10px] font-mono mt-1",
                          isHovered ? "opacity-40" : "opacity-20"
                        )}>
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold leading-tight">
                              {station.name}
                            </h3>
                            {idx < 3 && (
                              <span className={cn(
                                "text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase",
                                idx === 0 ? "bg-[#FFD700] text-black" :
                                idx === 1 ? "bg-[#C0C0C0] text-black" :
                                "bg-[#CD7F32] text-black"
                              )}>
                                {idx === 0 ? 'Gold' : idx === 1 ? 'Silber' : 'Bronze'}
                              </span>
                            )}
                          </div>
                          <p className={cn(
                            "text-[10px] flex items-center gap-1",
                            isHovered ? "opacity-60" : "opacity-40"
                          )}>
                            <MapPin size={10} />
                            {station.address}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "text-lg font-mono font-bold leading-none mb-1",
                          isHovered ? "text-white" : getPriceColor(price)
                        )}>
                          {formatPrice(price)}
                        </div>
                        <div className="text-[8px] uppercase tracking-widest font-bold opacity-40">
                          Diesel
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Status Log Section */}
        <section className="lg:col-span-8 bg-white rounded-[32px] p-8 shadow-sm border border-black/5 flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-serif italic">Abfrage-Status</h2>
            <Activity size={20} className="opacity-40" />
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {searchLogs.map((log, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-mono bg-black/[0.02] p-4 rounded-2xl border border-black/5">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase opacity-40 mb-1">Zeit</span>
                    <span className="font-bold">{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase opacity-40 mb-1">Status</span>
                    <span className="font-bold text-emerald-600">ERFOLGREICH</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase opacity-40 mb-1">Punkte</span>
                    <span className="font-bold">{log.pointsQueried}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase opacity-40 mb-1">Gefunden</span>
                    <span className="font-bold">{log.uniqueFound} Stationen</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase opacity-40 mb-1">Dauer</span>
                    <span className="font-bold">{log.durationMs}ms</span>
                  </div>
                </div>
              </div>
            ))}
            {searchLogs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-20 italic">
                <Search size={48} className="mb-4" />
                <p>Noch keine Abfragen durchgeführt...</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {error && (
        <div className="max-w-7xl mx-auto mt-8 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-700">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <div className="text-xs">
            <p className="font-bold mb-1">Fehler beim Laden</p>
            <p className="opacity-80">{error}</p>
          </div>
        </div>
      )}

      <footer className="max-w-7xl mx-auto mt-24 pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between items-center gap-4 opacity-40 text-[10px] uppercase tracking-[0.2em] font-bold">
        <p>© 2026 Diesel Tracker Linz</p>
        <p>Datenquelle: e-control.at</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export {};
