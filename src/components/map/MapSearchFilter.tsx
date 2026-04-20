'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';

interface SearchResult {
  type: 'desa' | 'gardu' | 'tiang' | 'penyulang-area';
  label: string;
  sublabel?: string;
  lngLat: [number, number];
  bbox?: [number, number, number, number]; // minLng, minLat, maxLng, maxLat
}

interface MapSearchProps {
  mapInstance: maplibregl.Map | null;
  gardus: any[];
  tiangJTM: any[];
  penyulangList: string[];
  onFilterPenyulang: (penyulang: string) => void;
  filterPenyulang: string;
  batasDesaGeoJSON: any;
}

const PENYULANG_COLORS: Record<string, string> = {
  MALI: '#2563eb',
  MORU: '#dc2626',
  BATUNIRWALA: '#16a34a',
  BARANUSA: '#d97706',
  KABIR: '#9333ea',
  MARITAING: '#0891b2',
  ILAWE: '#e11d48',
};

export default function MapSearchFilter({
  mapInstance,
  gardus,
  tiangJTM,
  penyulangList,
  onFilterPenyulang,
  filterPenyulang,
  batasDesaGeoJSON,
}: MapSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const highlightMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    const ql = q.toLowerCase();
    const found: SearchResult[] = [];

    // 1. Cari batas desa
    if (batasDesaGeoJSON?.features) {
      batasDesaGeoJSON.features.forEach((f: any) => {
        const nama = f.properties?.nama || '';
        if (nama.toLowerCase().includes(ql)) {
          // Calculate centroid
          const coords = f.geometry?.coordinates?.[0] || [];
          if (coords.length > 0) {
            const lngs = coords.map((c: number[]) => c[0]);
            const lats = coords.map((c: number[]) => c[1]);
            const cLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
            const cLat = (Math.min(...lats) + Math.max(...lats)) / 2;
            found.push({
              type: 'desa',
              label: nama,
              sublabel: f.properties?.status_listrik || 'Batas Desa',
              lngLat: [cLng, cLat],
              bbox: [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
            });
          }
        }
      });
    }

    // 2. Cari gardu
    gardus.forEach((g: any) => {
      const nama = g.namaGardu || g.name || g.nama || '';
      if (nama.toLowerCase().includes(ql) && g.lat && g.lng) {
        found.push({
          type: 'gardu',
          label: nama,
          sublabel: `Gardu · ${g.feeder || g.penyulang || '-'} · ${g.capacity_kva || '-'} kVA`,
          lngLat: [g.lng, g.lat],
        });
      }
    });

    // 3. Cari tiang (nama)
    tiangJTM.slice(0, 5000).forEach((t: any) => {
      const nama = t.nama_tiang || '';
      if (nama.toLowerCase().includes(ql) && t.latitude && t.longitude) {
        if (found.filter(r => r.type === 'tiang').length < 5) {
          found.push({
            type: 'tiang',
            label: nama,
            sublabel: `Tiang JTM · ${t.penyulang || '-'}`,
            lngLat: [t.longitude, t.latitude],
          });
        }
      }
    });

    setResults(found.slice(0, 20));
    setIsOpen(found.length > 0);
    setIsSearching(false);
  }, [gardus, tiangJTM, batasDesaGeoJSON]);

  const flyTo = useCallback((result: SearchResult) => {
    if (!mapInstance) return;

    // Remove old highlight
    if (highlightMarkerRef.current) {
      highlightMarkerRef.current.remove();
      highlightMarkerRef.current = null;
    }

    if (result.bbox) {
      mapInstance.fitBounds(
        [[result.bbox[0], result.bbox[1]], [result.bbox[2], result.bbox[3]]],
        { padding: 60, maxZoom: 14, duration: 900 }
      );
    } else {
      mapInstance.flyTo({
        center: result.lngLat,
        zoom: result.type === 'gardu' ? 17 : 16,
        duration: 900,
        essential: true,
      });

      // Add highlight marker
      const el = document.createElement('div');
      el.style.cssText = `
        width: 24px; height: 24px;
        background: ${result.type === 'gardu' ? '#f59e0b' : result.type === 'tiang' ? '#8b5cf6' : '#0ea5e9'};
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 0 4px ${result.type === 'gardu' ? '#f59e0b44' : '#0ea5e944'}, 0 4px 12px rgba(0,0,0,0.3);
        animation: pulse 1.5s ease-out infinite;
      `;

      // Add pulse animation
      if (!document.getElementById('map-search-pulse-style')) {
        const style = document.createElement('style');
        style.id = 'map-search-pulse-style';
        style.textContent = `
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(14,165,233,0.4), 0 4px 12px rgba(0,0,0,0.3); }
            70% { box-shadow: 0 0 0 12px rgba(14,165,233,0), 0 4px 12px rgba(0,0,0,0.3); }
            100% { box-shadow: 0 0 0 0 rgba(14,165,233,0), 0 4px 12px rgba(0,0,0,0.3); }
          }
        `;
        document.head.appendChild(style);
      }

      highlightMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(result.lngLat)
        .addTo(mapInstance);

      // Auto remove after 4s
      setTimeout(() => {
        if (highlightMarkerRef.current) {
          highlightMarkerRef.current.remove();
          highlightMarkerRef.current = null;
        }
      }, 4000);
    }

    setQuery(result.label);
    setIsOpen(false);
  }, [mapInstance]);

  const typeIcon = (type: SearchResult['type']) => {
    if (type === 'desa') return '🗺️';
    if (type === 'gardu') return '⚡';
    if (type === 'tiang') return '🔌';
    return '📍';
  };

  return (
    <div
      ref={searchRef}
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 320,
      }}
    >
      {/* Search Box */}
      <div style={{
        background: 'rgba(15,23,42,0.92)',
        backdropFilter: 'blur(12px)',
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        overflow: 'hidden',
      }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 10 }}>
          <span style={{ fontSize: 16, opacity: 0.7 }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari desa, gardu, tiang..."
            value={query}
            onChange={e => search(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f1f5f9',
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Penyulang */}
        <div style={{
          borderTop: '1px solid rgba(148,163,184,0.15)',
          padding: '8px 12px',
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, marginRight: 2 }}>PENYULANG:</span>
          <button
            onClick={() => onFilterPenyulang('all')}
            style={{
              padding: '3px 10px',
              borderRadius: 20,
              border: '1px solid',
              borderColor: filterPenyulang === 'all' ? '#3b82f6' : 'rgba(148,163,184,0.25)',
              background: filterPenyulang === 'all' ? '#3b82f6' : 'transparent',
              color: filterPenyulang === 'all' ? '#fff' : '#94a3b8',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            All
          </button>
          {penyulangList.map(p => {
            const color = PENYULANG_COLORS[p] || '#475569';
            const active = filterPenyulang === p;
            return (
              <button
                key={p}
                onClick={() => onFilterPenyulang(active ? 'all' : p)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 20,
                  border: `1px solid ${color}`,
                  background: active ? color : 'transparent',
                  color: active ? '#fff' : color,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div style={{
          background: 'rgba(15,23,42,0.96)',
          backdropFilter: 'blur(12px)',
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          maxHeight: 300,
          overflowY: 'auto',
        }}>
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => flyTo(r)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: i < results.length - 1 ? '1px solid rgba(148,163,184,0.1)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(148,163,184,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{typeIcon(r.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: '#f1f5f9',
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {r.label}
                </div>
                <div style={{ color: '#64748b', fontSize: 11, marginTop: 1 }}>
                  {r.sublabel}
                </div>
              </div>
              <span style={{ color: '#475569', fontSize: 11, flexShrink: 0 }}>→</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && query.length >= 2 && (
        <div style={{
          background: 'rgba(15,23,42,0.92)',
          backdropFilter: 'blur(12px)',
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.2)',
          padding: '12px 16px',
          color: '#64748b',
          fontSize: 13,
          fontFamily: 'Inter, sans-serif',
        }}>
          Tidak ditemukan hasil untuk &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
