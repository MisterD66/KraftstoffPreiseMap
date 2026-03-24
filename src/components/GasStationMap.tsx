import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

const createPriceIcon = (price: number, isHovered: boolean, color: string) => {
  return L.divIcon({
    className: 'custom-price-marker',
    html: `
      <div class="transition-all duration-200 ${isHovered ? 'scale-125 z-[1000]' : 'scale-100'}" style="z-index: ${isHovered ? 1000 : 1}">
        <div class="px-3 py-1.5 rounded-full text-xs font-bold font-mono shadow-lg border-2 whitespace-nowrap" 
             style="background-color: ${isHovered ? '#FFFFFF' : color}; 
                    color: ${isHovered ? color : '#FFFFFF'}; 
                    border-color: ${color}">
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
}

const RecenterMap = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

export const GasStationMap: React.FC<GasStationMapProps> = ({ stations, center, hoveredStationId }) => {
  const prices = stations.map(s => s.prices[0]?.amount).filter(p => typeof p === 'number' && p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

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
        {stations.map((station) => {
          const price = station.prices[0]?.amount || 0;
          const isHovered = hoveredStationId === station.id;
          const color = getPriceColor(price, minPrice, maxPrice);

          return (
            <Marker 
              key={station.id} 
              position={[station.location.latitude, station.location.longitude]}
              icon={createPriceIcon(price, isHovered, color)}
              zIndexOffset={isHovered ? 1000 : 0}
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
