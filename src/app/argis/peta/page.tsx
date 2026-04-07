'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { LayerInfo } from '@/app/api/argis/route';
import { Layers, RefreshCw, AlertCircle, Info, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

const ArgisMap = dynamic(() => import('@/components/argis/ArgisMap').then(m => m.ArgisMap), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a' }}>
      <div style={{ color: '#64748b', textAlign: 'center' }}>
        <RefreshCw size={32} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
        <p>Memuat peta...</p>
      </div>
    </div>
  ),
});

const LAYER_COLORS = [
  '#3b82f6', '#22c55e', '#ef4444', '#eab308', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a855f7',
];

export default function PetaPage() {
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedLayerData, setLoadedLayerData] = useState<LayerInfo[]>([]);
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);
  const [loadingLayer, setLoadingLayer] = useState<string | null>(null);

  const fetchLayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/argis?action=list');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to load layers');
      }
      const data = await res.json();
      const layerList: LayerInfo[] = data.geojsonLayers ?? [];
      setLayers(layerList);
      // Auto-enable all layers
      setVisibleLayers(new Set(layerList.map((l: LayerInfo) => l.name)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLayers();
  }, [fetchLayers]);

  // Load layer data when toggled on
  const toggleLayer = useCallback(async (name: string) => {
    setVisibleLayers(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
        // Load data if not yet loaded
        if (!loadedLayerData.find(l => l.name === name)) {
          setLoadingLayer(name);
          fetch(`/api/argis?action=layer&layer=${encodeURIComponent(name)}`)
            .then(r => r.json())
            .then((d: LayerInfo) => {
              setLoadedLayerData(prev2 => {
                if (prev2.find(l => l.name === name)) return prev2;
                return [...prev2, d];
              });
            })
            .finally(() => setLoadingLayer(null));
        }
      }
      return next;
    });
  }, [loadedLayerData]);

  // Pre-load all layer data
  useEffect(() => {
    if (layers.length === 0) return;
    layers.forEach(layer => {
      if (!loadedLayerData.find(l => l.name === layer.name)) {
        setLoadingLayer(layer.name);
        fetch(`/api/argis?action=layer&layer=${encodeURIComponent(layer.name)}`)
          .then(r => r.json())
          .then((d: LayerInfo) => {
            setLoadedLayerData(prev => {
              if (prev.find(l => l.name === layer.name)) return prev;
              return [...prev, d];
            });
          })
          .finally(() => setLoadingLayer(null));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: 'calc(100vh - 80px)', marginTop: -16 }}>
      {/* Header */}
      <div style={{ padding: '16px 0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 22 }}>
            Peta Interaktif Argis
          </h1>
          <p className="page-subtitle">
            {layers.length} layer GeoJSON dari arg-20260406T131920Z-3-001.zip
          </p>
        </div>
        <button onClick={fetchLayers} className="btn btn-secondary" style={{ gap: 8, fontSize: 13 }}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Map + Controls */}
      <div style={{ flex: 1, display: 'flex', gap: 12, minHeight: 0 }}>
        {/* Layer Panel */}
        <div className="layer-panel" style={{ width: 240, flexShrink: 0, overflowY: 'auto', height: '100%' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={14} /> Layer ({layers.length})
          </h3>

          {loading && (
            <div style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
              <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
              Memuat layer...
            </div>
          )}

          {error && (
            <div style={{ color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {layers.map((layer, idx) => {
            const color = LAYER_COLORS[idx % LAYER_COLORS.length];
            const isVisible = visibleLayers.has(layer.name);
            const isExpanded = expandedInfo === layer.name;
            const isLoading = loadingLayer === layer.name;

            return (
              <div key={layer.name} style={{ borderBottom: '1px solid rgba(42,54,84,0.5)', paddingBottom: 8, marginBottom: 8 }}>
                <div className="layer-item" onClick={() => toggleLayer(layer.name)}>
                  <div className="layer-color" style={{ background: color }} />
                  <span style={{ flex: 1, fontSize: 12, lineHeight: 1.3 }}>{layer.name}</span>
                  {isLoading ? (
                    <RefreshCw size={12} style={{ color: '#64748b', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                  ) : (
                    <div className={`layer-toggle ${isVisible ? 'active' : ''}`} style={{ flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 22, marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: '#64748b' }}>
                    {layer.featureCount} fitur &bull; {layer.geometryType}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedInfo(isExpanded ? null : layer.name); }}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ paddingLeft: 22, marginTop: 6, fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
                    <div><strong style={{ color: '#64748b' }}>File:</strong> {layer.fileName}</div>
                    {layer.bbox && (
                      <div><strong style={{ color: '#64748b' }}>BBox:</strong> {layer.bbox.map(n => n.toFixed(4)).join(', ')}</div>
                    )}
                    {layer.properties.length > 0 && (
                      <div>
                        <strong style={{ color: '#64748b' }}>Kolom:</strong>{' '}
                        {layer.properties.slice(0, 5).join(', ')}
                        {layer.properties.length > 5 && ` +${layer.properties.length - 5} lagi`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!loading && layers.length === 0 && !error && (
            <div style={{ color: '#64748b', fontSize: 12, padding: '8px 0', lineHeight: 1.5 }}>
              <Info size={14} style={{ marginBottom: 4 }} />
              <div>Tidak ada layer GeoJSON ditemukan dalam ZIP.</div>
            </div>
          )}

          {/* All on/off */}
          {layers.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <button
                onClick={() => setVisibleLayers(new Set(layers.map(l => l.name)))}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: 11, padding: '6px 0', gap: 4 }}
              >
                <Eye size={11} /> Semua
              </button>
              <button
                onClick={() => setVisibleLayers(new Set())}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: 11, padding: '6px 0', gap: 4 }}
              >
                <EyeOff size={11} /> Sembunyikan
              </button>
            </div>
          )}
        </div>

        {/* Map */}
        <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {!loading && (
            <ArgisMap
              layers={loadedLayerData}
              visibleLayers={visibleLayers}
            />
          )}
          {loading && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111827' }}>
              <div style={{ color: '#64748b', textAlign: 'center' }}>
                <RefreshCw size={28} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: 13 }}>Memuat data ZIP...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
      `}</style>
    </div>
  );
}
