'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Download, ChevronUp, ChevronDown,
  ChevronsUpDown, RefreshCw, AlertCircle, FileJson, Table2, Database
} from 'lucide-react';

const PAGE_SIZE = 100;

type LayerRow = {
  layer_id: number;
  layer_name: string;
  geometry_type: string;
  feature_count: number;
  property_keys: string[];
  bbox_minx: number | null;
  bbox_miny: number | null;
  bbox_maxx: number | null;
  bbox_maxy: number | null;
  zip_filename: string;
  imported_at: string;
  import_status: string;
};

type FeatureRow = {
  feature_id: number;
  feature_index: number;
  geometry_type: string;
  properties: Record<string, unknown>;
  layer_name: string;
};

export default function DataPage() {
  const [layers, setLayers] = useState<LayerRow[]>([]);
  const [selectedLayer, setSelectedLayer] = useState('');
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'table' | 'raw'>('table');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Load layers from database
  useEffect(() => {
    setListLoading(true);
    fetch('/api/argis?action=layers&source=db')
      .then(r => r.json())
      .then(d => {
        const rows: LayerRow[] = d.layers ?? [];
        setLayers(rows);
        if (rows.length > 0) setSelectedLayer(rows[0].layer_name);
      })
      .catch(e => setError(e.message))
      .finally(() => setListLoading(false));
  }, []);

  // Load features from database
  const loadFeatures = useCallback(async (layer: string, pg: number, srch: string) => {
    if (!layer) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        action: 'features',
        source: 'db',
        layer,
        page: String(pg),
        limit: String(PAGE_SIZE),
        ...(srch ? { search: srch } : {}),
      });
      const r = await fetch(`/api/argis?${params}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setFeatures(d.features ?? []);
      setTotal(d.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setFeatures([]);
  }, [selectedLayer]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    loadFeatures(selectedLayer, page, debouncedSearch);
  }, [selectedLayer, page, debouncedSearch, loadFeatures]);

  const currentLayer = layers.find(l => l.layer_name === selectedLayer);
  const columns: string[] = currentLayer?.property_keys ?? [];

  // Client-side sort (only on current page)
  const sorted = useMemo(() => {
    if (!sortKey) return features;
    return [...features].sort((a, b) => {
      const av = a.properties?.[sortKey] ?? '';
      const bv = b.properties?.[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [features, sortKey, sortDir]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  function downloadCSV() {
    if (!features.length || !columns.length) return;
    const rows = [
      columns.join(','),
      ...features.map(f =>
        columns.map(col => `"${String(f.properties?.[col] ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${selectedLayer}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function downloadGeoJSON() {
    if (!features.length) return;
    const geojson = {
      type: 'FeatureCollection',
      features: features.map(f => ({
        type: 'Feature',
        geometry: null,
        properties: f.properties,
      })),
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${selectedLayer}.geojson`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <h1 className="page-title">Data Tabel GeoJSON</h1>
        <p className="page-subtitle">Baca dan inspeksi fitur dari database Neon</p>
      </div>

      {/* Layer selector */}
      <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Database size={14} style={{ color: '#3b82f6' }} />
          <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>Layer:</label>
          {listLoading ? (
            <div style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Memuat dari database...
            </div>
          ) : layers.length === 0 ? (
            <span style={{ fontSize: 13, color: '#ef4444' }}>
              Belum ada data. Silakan upload ZIP di halaman Upload.
            </span>
          ) : (
            <select
              className="form-select"
              value={selectedLayer}
              onChange={e => setSelectedLayer(e.target.value)}
              style={{ maxWidth: 340, fontSize: 13, padding: '8px 12px' }}
            >
              {layers.map(l => (
                <option key={l.layer_name} value={l.layer_name}>
                  {l.layer_name} ({l.feature_count.toLocaleString()} fitur)
                </option>
              ))}
            </select>
          )}
          {features.length > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={downloadCSV} className="btn btn-secondary" style={{ fontSize: 12, padding: '8px 14px', gap: 6 }}>
                <Download size={13} /> CSV
              </button>
              <button onClick={downloadGeoJSON} className="btn btn-secondary" style={{ fontSize: 12, padding: '8px 14px', gap: 6 }}>
                <FileJson size={13} /> GeoJSON
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444' }}>
          <AlertCircle size={16} /><span style={{ fontSize: 13 }}>{error}</span>
        </div>
      )}

      {currentLayer && (
        <>
          {/* Layer info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Layer', value: currentLayer.layer_name },
              { label: 'Tipe Geometri', value: currentLayer.geometry_type },
              { label: 'Total Fitur', value: currentLayer.feature_count.toLocaleString() },
              { label: 'Jumlah Kolom', value: columns.length.toString() },
              { label: 'Sumber ZIP', value: currentLayer.zip_filename },
              { label: 'Status Import', value: currentLayer.import_status },
            ].map(item => (
              <div key={item.label} className="card" style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', wordBreak: 'break-all' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 12 }}>
            <button className={`tab ${activeTab === 'table' ? 'active' : ''}`} onClick={() => setActiveTab('table')}>
              <Table2 size={13} style={{ display: 'inline', marginRight: 6 }} />Tabel
            </button>
            <button className={`tab ${activeTab === 'raw' ? 'active' : ''}`} onClick={() => setActiveTab('raw')}>
              <FileJson size={13} style={{ display: 'inline', marginRight: 6 }} />Raw JSON
            </button>
          </div>

          {activeTab === 'table' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: 36, fontSize: 13 }}
                    placeholder="Cari di semua properti..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  {loading ? 'Memuat...' : `${total.toLocaleString()} total fitur`}
                </span>
              </div>

              <div className="chart-card" style={{ padding: 0, overflowX: 'auto', position: 'relative' }}>
                {loading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,14,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: 12 }}>
                    <RefreshCw size={24} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
                <table className="gangguan-table" style={{ minWidth: Math.max(columns.length * 130, 400) }}>
                  <thead>
                    <tr>
                      <th style={{ width: 48, textAlign: 'center' }}>#</th>
                      {columns.map(col => (
                        <th key={col} onClick={() => toggleSort(col)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {col}
                            {sortKey === col
                              ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                              : <ChevronsUpDown size={11} style={{ opacity: 0.4 }} />}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((feat, idx) => (
                      <tr key={feat.feature_id}>
                        <td style={{ textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        {columns.map(col => {
                          const val = feat.properties?.[col];
                          return (
                            <td key={col} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                              {val === null || val === undefined
                                ? <span style={{ color: '#64748b', fontStyle: 'italic' }}>null</span>
                                : String(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loading && sorted.length === 0 && (
                  <div style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                    Tidak ada data yang cocok.
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                  <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                    Sebelumnya
                  </button>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>Halaman {page} dari {totalPages}</span>
                  <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                    Berikutnya
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'raw' && (
            <div className="chart-card" style={{ padding: 0 }}>
              <pre style={{ fontSize: 11, color: '#94a3b8', padding: 20, overflowX: 'auto', overflowY: 'auto', maxHeight: 500, lineHeight: 1.6, fontFamily: 'monospace' }}>
                {JSON.stringify(sorted.slice(0, 20).map(f => f.properties), null, 2)}
              </pre>
              {total > 20 && <p style={{ fontSize: 11, color: '#64748b', padding: '0 20px 16px', fontStyle: 'italic' }}>Menampilkan 20 dari {total} fitur.</p>}
            </div>
          )}
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
