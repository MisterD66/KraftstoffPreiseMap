import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { GasStation } from '../types';
import { formatPrice } from '../utils';

// Fix for default marker icons in Leaflet with Vite
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const getPriceColor = (price: number, min: number, max: number) => {
  if (price === min) return '#22C55E'; // Green
  if (price === max) return '#EF4444'; // Red
  const range = max - min;
  if (range === 0) return '#151619';
  const percent = (price - min) / range;
  if (percent < 0.3) return '#22C55E';
  if (percent > 0.7) return '#EF4444';
  return '#F59E0B'; // Amber
};

const createPriceIcon = (price: number, isHovered: boolean, color: string, rank?: number) => {
  let rankStyles = '';
  let rankLabel = '';
  
  if (rank === 1) {
    rankStyles = 'border-[#FFD700] ring-4 ring-[#FFD700]/30 shadow-[0_0_15px_rgba(255,215,0,0.5)]';
    rankLabel = '<div class="absolute -top-3 -left-2 bg-[#FFD700] text-black text-[8px] px-1 rounded font-black uppercase">GOLD</div>';
  } else if (rank === 2) {
    rankStyles = 'border-[#C0C0C0] ring-4 ring-[#C0C0C0]/30 shadow-[0_0_10px_rgba(192,192,192,0.5)]';
    rankLabel = '<div class="absolute -top-3 -left-2 bg-[#C0C0C0] text-black text-[8px] px-1 rounded font-black uppercase">SILBER</div>';
  } else if (rank === 3) {
    rankStyles = 'border-[#CD7F32] ring-4 ring-[#CD7F32]/30 shadow-[0_0_10px_rgba(205,127,50,0.5)]';
    rankLabel = '<div class="absolute -top-3 -left-2 bg-[#CD7F32] text-black text-[8px] px-1 rounded font-black uppercase">BRONZE</div>';
  }

  return L.divIcon({
    className: 'custom-price-marker',
    html: `
      <div class="transition-all duration-200 ${isHovered ? 'scale-125 z-[1000]' : 'scale-100'}" style="z-index: ${isHovered ? 1000 : 1}">
        ${rankLabel}
        <div class="px-3 py-1.5 rounded-full text-xs font-bold font-mono shadow-lg border-2 whitespace-nowrap ${rankStyles}" 
             style="background-color: ${isHovered ? '#FFFFFF' : color}; 
                    color: ${isHovered ? color : '#FFFFFF'}; 
                    border-color: ${rank ? '' : color}">
          ${formatPrice(price)}
        </div>
      </div>
    `,
    iconSize: [60, 30],
    iconAnchor: [30, 15]
  });
};

interface GasStationMapProps {
  stations: GasStation[];
  center: [number, number];
  hoveredStationId: number | null;
  showSearchPoints: boolean;
  queriedPoints: { lat: number; lon: number; stationIds: number[] }[];
  hoveredQueryPointIdx: number | null;
  setHoveredQueryPointIdx: (idx: number | null) => void;
}

const RecenterMap = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

export const GasStationMap: React.FC<GasStationMapProps> = ({ 
  stations, 
  center, 
  hoveredStationId,
  showSearchPoints,
  queriedPoints,
  hoveredQueryPointIdx,
  setHoveredQueryPointIdx
}) => {
  const prices = stations.map(s => s.prices[0]?.amount).filter(p => typeof p === 'number' && p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  // Find top 3 cheapest unique prices/stations
  const sortedByPrice = [...stations]
    .filter(s => s.prices[0]?.amount)
    .sort((a, b) => (a.prices[0]?.amount || 0) - (b.prices[0]?.amount || 0));
  
  const top3Ids = sortedByPrice.slice(0, 3).map(s => s.id);

  return (
    <div className="h-[500px] w-full rounded-[32px] overflow-hidden shadow-sm border border-black/5">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={center} />
        
        {showSearchPoints && queriedPoints.map((point, idx) => (
          <Marker 
            key={`query-${idx}`}
            position={[point.lat, point.lon]}
            eventHandlers={{
              mouseover: () => setHoveredQueryPointIdx(idx),
              mouseout: () => setHoveredQueryPointIdx(null),
            }}
            icon={L.divIcon({
              className: 'query-point',
              html: `<div class="w-2 h-2 bg-rose-500 rounded-full border border-white shadow-sm transition-transform duration-200 ${hoveredQueryPointIdx === idx ? 'scale-150' : 'scale-100'}"></div>`,
              iconSize: [8, 8],
              iconAnchor: [4, 4]
            })}
          />
        ))}

        {showSearchPoints && hoveredQueryPointIdx !== null && queriedPoints[hoveredQueryPointIdx] && (
          queriedPoints[hoveredQueryPointIdx].stationIds.map(stationId => {
            const station = stations.find(s => s.id === stationId);
            if (!station) return null;
            return (
              <Polyline 
                key={`line-${hoveredQueryPointIdx}-${stationId}`}
                positions={[
                  [queriedPoints[hoveredQueryPointIdx].lat, queriedPoints[hoveredQueryPointIdx].lon],
                  [station.latitude, station.longitude]
                ]}
                pathOptions={{ 
                  color: '#F43F5E', 
                  weight: 1, 
                  dashArray: '5, 5',
                  opacity: 0.6,
                  className: 'animate-pulse'
                }}
              />
            );
          })
        )}

        {stations.map((station) => {
          const price = station.prices[0]?.amount || 0;
          const isHovered = hoveredStationId === station.id;
          const color = getPriceColor(price, minPrice, maxPrice);
          
          const rankIdx = top3Ids.indexOf(station.id);
          const rank = rankIdx !== -1 ? rankIdx + 1 : undefined;

          return (
            <Marker 
              key={station.id} 
              position={[station.latitude, station.longitude]}
              icon={createPriceIcon(price, isHovered, color, rank)}
              zIndexOffset={rank ? (100 - rank) * 10 : (isHovered ? 1000 : 0)}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-sm mb-1">{station.name}</h3>
                  <p className="text-xs opacity-70 mb-2">{station.address}</p>
                  <div className="text-lg font-mono font-bold" style={{ color }}>
                    {formatPrice(price)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
