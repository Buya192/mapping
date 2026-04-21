'use client';

import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface AssetItem {
  id: string;
  _table: string;
  _lat: number;
  _lng: number;
  _hasGPS: boolean;
  verified?: boolean;
  [key: string]: unknown;
}

interface VerifikasiMapProps {
  assets: AssetItem[];
  userPosition: { lat: number; lng: number } | null;
  followGps: boolean;
  onAssetClick: (asset: AssetItem) => void;
  onMapClick: (latlng: { lat: number; lng: number }) => void;
  tableColors: Record<string, string>;
}

// Marker SVG per type
function createMarkerEl(color: string, verified: boolean, isGardu: boolean): HTMLDivElement {
  const el = document.createElement('div');
  const size = isGardu ? 28 : 20;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.cursor = 'pointer';
  el.style.transition = 'transform 0.15s ease';

  if (isGardu) {
    // Square marker for gardu
    el.style.borderRadius = '4px';
    el.style.background = verified ? '#22c55e' : color;
    el.style.border = `2px solid ${verified ? '#16a34a' : 'rgba(255,255,255,0.6)'}`;
    el.style.boxShadow = `0 0 ${verified ? '8px rgba(34,197,94,0.5)' : '6px rgba(0,0,0,0.4)'}`;
  } else {
    // Circle marker for others
    el.style.borderRadius = '50%';
    el.style.background = verified ? '#22c55e' : color;
    el.style.border = `2px solid ${verified ? '#16a34a' : 'rgba(255,255,255,0.5)'}`;
    el.style.boxShadow = `0 0 ${verified ? '6px rgba(34,197,94,0.4)' : '4px rgba(0,0,0,0.3)'}`;
    if (!verified) {
      el.style.animation = 'pulse-marker 2s infinite';
    }
  }

  el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.3)'; });
  el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });

  return el;
}

function createUserMarker(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.width = '20px';
  el.style.height = '20px';
  el.style.borderRadius = '50%';
  el.style.background = '#3b82f6';
  el.style.border = '3px solid #fff';
  el.style.boxShadow = '0 0 12px rgba(59,130,246,0.6), 0 0 24px rgba(59,130,246,0.3)';
  el.style.animation = 'pulse-gps 1.5s infinite';
  return el;
}

export default function VerifikasiMap({
  assets, userPosition, followGps, onAssetClick, onMapClick, tableColors
}: VerifikasiMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap',
          },
          'satellite': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
          }
        },
        layers: [
          { id: 'satellite-layer', type: 'raster', source: 'satellite', paint: { 'raster-opacity': 0.7 } },
          { id: 'osm-layer', type: 'raster', source: 'osm', paint: { 'raster-opacity': 0.5 } },
        ],
      },
      center: [116.08, -1.24],
      zoom: 14,
    });

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    // Map click for new asset
    map.on('click', (e) => {
      // Only if not clicking a marker
      const features = map.queryRenderedFeatures(e.point);
      if (features.length === 0) {
        onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      }
    });

    mapRef.current = map;

    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-marker {
        0%, 100% { opacity: 0.85; }
        50% { opacity: 0.5; }
      }
      @keyframes pulse-gps {
        0% { box-shadow: 0 0 12px rgba(59,130,246,0.6), 0 0 0 0 rgba(59,130,246,0.4); }
        70% { box-shadow: 0 0 12px rgba(59,130,246,0.6), 0 0 0 16px rgba(59,130,246,0); }
        100% { box-shadow: 0 0 12px rgba(59,130,246,0.6), 0 0 0 0 rgba(59,130,246,0); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when assets change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (assets.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();

    assets.forEach(asset => {
      if (!asset._hasGPS || asset._lat === 0) return;

      const isGardu = asset._table === 'gardus';
      const color = tableColors[asset._table] || '#64748b';
      const el = createMarkerEl(color, !!asset.verified, isGardu);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onAssetClick(asset);
      });

      // Tooltip
      const name = String(asset.nama_tiang || asset.namaGardu || asset.name || asset.assetnum || asset.id);
      el.title = `${name}\n${asset.verified ? '✅ Verified' : '🟡 Belum verified'}`;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([asset._lng, asset._lat])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
      bounds.extend([asset._lng, asset._lat]);
    });

    // Fit bounds
    if (assets.length > 0) {
      try {
        mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 17, duration: 800 });
      } catch {
        // bounds might be empty
      }
    }
  }, [assets, tableColors, onAssetClick]);

  // Update user position
  useEffect(() => {
    if (!mapRef.current || !userPosition) return;

    if (!userMarkerRef.current) {
      const el = createUserMarker();
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userPosition.lng, userPosition.lat])
        .addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLngLat([userPosition.lng, userPosition.lat]);
    }

    if (followGps) {
      mapRef.current.easeTo({
        center: [userPosition.lng, userPosition.lat],
        duration: 500,
      });
    }
  }, [userPosition, followGps]);

  return (
    <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
  );
}
