import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { GasStation, SearchLog } from './types';

export default function App() {
  const [stations, setStations] = useState<GasStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>([48.3069, 14.2858]); // Default to Linz
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
  const [searchParams, setSearchParams] = useState({ radius: 0.05, steps: 2 });
  const [hoveredStationId, setHoveredStationId] = useState<number | null>(null);
  const [showSearchPoints, setShowSearchPoints] = useState(false);
  const [queriedPoints, setQueriedPoints] = useState<{ lat: number; lon: number; stationIds: number[] }[]>([]);
  const [hoveredQueryPointIdx, setHoveredQueryPointIdx] = useState<number | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      });
    }
  }, []);

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    const startTime = Date.now();
    try {
      const { radius, steps } = searchParams;
      const centerLat = userLocation[0];
      const centerLon = userLocation[1];
      
      const points = [{ lat: centerLat, lon: centerLon }];
      
      // Generate points using Fermat's Spiral (Golden Spiral) for uniform distribution
      // 'steps' now controls the total density of the spiral
      const numPoints = steps * 12; 
      const goldenAngle = 137.508 * (Math.PI / 180);
      
      for (let i = 1; i <= numPoints; i++) {
        // Normalize radius so the 'radius' parameter defines the maximum extent
        const r = radius * Math.sqrt(i / numPoints);
        const theta = i * goldenAngle;
        
        // Convert polar to cartesian (approximate for lat/lon at this scale)
        const latOffset = r * Math.cos(theta);
        const lonOffset = r * Math.sin(theta) / Math.cos(centerLat * Math.PI / 180);
        
        points.push({ 
          lat: centerLat + latOffset, 
          lon: centerLon + lonOffset 
        });
      }

      const fetchPricesFromAPI = async (p: { lat: number, lon: number }) => {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('.run.app');
        
        if (isLocal) {
          // Use local server proxy for development (more reliable)
          try {
            const response = await fetch(`/api/diesel-prices?lat=${p.lat}&lon=${p.lon}`);
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            return await response.json();
          } catch (e) {
            console.error('Local fetch failed, falling back to public proxy...', e);
          }
        }

        // Fallback or Production (GitHub Pages)
        // Using AllOrigins JSON method which is often more reliable than direct proxies
        const targetUrl = `https://api.e-control.at/sprit/1.0/search/gas-stations/by-address?latitude=${p.lat}&longitude=${p.lon}&fuelType=DIE&includeClosed=false`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        
        try {
          const response = await fetch(proxyUrl);
          if (!response.ok) throw new Error(`Proxy status: ${response.status}`);
          const data = await response.json();
          return data.contents ? JSON.parse(data.contents) : [];
        } catch (e) {
          console.error(`Public proxy fetch failed for ${p.lat},${p.lon}:`, e);
          return [];
        }
      };

      // Execute in chunks to avoid overwhelming the proxy/API
      const results: any[] = [];
      const pointsWithStations: { lat: number; lon: number; stationIds: number[] }[] = [];
      const chunkSize = 5;
      for (let i = 0; i < points.length; i += chunkSize) {
        const chunk = points.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(chunk.map(async (p) => {
          const stationsAtPoint = await fetchPricesFromAPI(p);
          pointsWithStations.push({
            ...p,
            stationIds: stationsAtPoint.map((s: any) => s.id)
          });
          return stationsAtPoint;
        }));
        results.push(...chunkResults.flat());
        // Small delay between chunks
        if (i + chunkSize < points.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      setQueriedPoints(pointsWithStations);

      // Deduplicate by station ID and map to flat structure
      const uniqueStations = Array.from(
        new Map(results.map(s => [s.id, {
          ...s,
          latitude: s.location?.latitude || s.latitude,
          longitude: s.location?.longitude || s.longitude
        }])).values()
      ) as GasStation[];

      // Filter out 0.00 prices
      const filteredStations = uniqueStations.filter(s => 
        s.prices && s.prices.length > 0 && s.prices[0].amount > 0
      );

      setStations(filteredStations);
      
      const duration = Date.now() - startTime;
      const metadata: SearchLog = {
        pointsQueried: points.length,
        totalFound: results.length,
        uniqueFound: filteredStations.length,
        durationMs: duration,
        timestamp: new Date().toISOString()
      };
      
      setSearchLogs(prev => [metadata, ...prev].slice(0, 20));

    } catch (err: any) {
      console.error('Fetch error:', err);
      setError('Fehler beim Abrufen der Preise. Bitte versuche es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, [userLocation]);

  return (
    <Dashboard 
      stations={stations} 
      loading={loading} 
      error={error}
      onRefresh={fetchPrices}
      userLocation={userLocation}
      searchLogs={searchLogs}
      searchParams={searchParams}
      setSearchParams={setSearchParams}
      hoveredStationId={hoveredStationId}
      setHoveredStationId={setHoveredStationId}
      showSearchPoints={showSearchPoints}
      setShowSearchPoints={setShowSearchPoints}
      queriedPoints={queriedPoints}
      hoveredQueryPointIdx={hoveredQueryPointIdx}
      setHoveredQueryPointIdx={setHoveredQueryPointIdx}
    />
  );
}
